import type Anthropic from "@anthropic-ai/sdk";
import { claudeModel } from "../claude.ts";
import type { EstadoAgente } from "./estado.ts";
import { executarFerramenta, FERRAMENTAS, type Proposta } from "./ferramentas.ts";
import { sistemaTexto } from "./sistema.ts";
import { somarTokens } from "./uso.ts";

export type ResultadoLastro = {
  texto: string;
  ferramentas: string[];
  propostas: Proposta[];
  fontes: string;
  entrada: number;
  saida: number;
  erro: boolean;
};

export async function rodarLastro(opts: {
  client: Anthropic;
  pergunta: string;
  modo: "portal" | "noticias";
  estado: EstadoAgente;
  memoria?: string;
  signal?: AbortSignal;
  onText?: (pedaco: string) => void;
  onProposta?: (proposta: Proposta) => void;
}): Promise<ResultadoLastro> {
  const ferramentasNomes: string[] = [];
  const propostas: Proposta[] = [];
  const fontes: string[] = [];
  const acc = { entrada: 0, saida: 0 };
  let texto = "";
  const cache = new Map<string, ReturnType<typeof executarFerramenta>>();
  const mensagens: { role: "user" | "assistant"; content: unknown }[] = [{ role: "user", content: opts.pergunta }];
  const ferramentas =
    opts.modo === "noticias" ? [...FERRAMENTAS, { type: "web_search_20250305", name: "web_search", max_uses: 5 }] : FERRAMENTAS;

  function anotarBusca(content: { type: string; name?: string }[]) {
    for (const bloco of content) {
      if (bloco.name === "web_search" && (bloco.type === "server_tool_use" || bloco.type === "tool_use")) ferramentasNomes.push("web_search");
    }
  }

  try {
    for (let volta = 0; volta < 4; volta++) {
      if (opts.signal?.aborted) break;
      const stream = opts.client.messages.stream(
        {
          model: claudeModel(),
          max_tokens: opts.modo === "noticias" ? 1200 : 900,
          system: sistemaTexto(opts.modo) + (opts.memoria || ""),
          tools: ferramentas as never,
          messages: mensagens as never,
        },
        { signal: opts.signal }
      );
      stream.on("text", (pedaco) => {
        texto += pedaco;
        opts.onText?.(pedaco);
      });
      const final = await stream.finalMessage();
      somarTokens(final.usage, acc);
      anotarBusca(final.content as { type: string; name?: string }[]);
      if (final.stop_reason === "pause_turn") {
        mensagens.push({ role: "assistant", content: final.content });
        continue;
      }
      const usos = final.content.filter((b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use" && FERRAMENTAS.some((f) => f.name === b.name));
      if (!usos.length || final.stop_reason !== "tool_use") break;
      mensagens.push({ role: "assistant", content: final.content });
      const resultados = [];
      for (const uso of usos) {
        ferramentasNomes.push(uso.name);
        const chave = uso.name + JSON.stringify(uso.input || {});
        let saida = cache.get(chave);
        if (!saida || uso.name.startsWith("propose_")) {
          saida = executarFerramenta(uso.name, (uso.input || {}) as Record<string, unknown>, opts.estado);
          if (!uso.name.startsWith("propose_")) cache.set(chave, saida);
        }
        fontes.push(JSON.stringify(saida.paraModelo));
        if (saida.proposta) {
          propostas.push(saida.proposta);
          opts.onProposta?.(saida.proposta);
        }
        resultados.push({ type: "tool_result", tool_use_id: uso.id, content: JSON.stringify(saida.paraModelo) });
      }
      mensagens.push({ role: "user", content: resultados });
    }
    return {
      texto,
      ferramentas: ferramentasNomes,
      propostas,
      fontes: fontes.join("\n").slice(0, 8000),
      entrada: acc.entrada,
      saida: acc.saida,
      erro: false,
    };
  } catch {
    return {
      texto,
      ferramentas: ferramentasNomes,
      propostas,
      fontes: fontes.join("\n").slice(0, 8000),
      entrada: acc.entrada,
      saida: acc.saida,
      erro: !opts.signal?.aborted,
    };
  }
}
