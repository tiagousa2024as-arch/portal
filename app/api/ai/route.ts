import { claudeClient, claudeModel } from "@/lib/claude";
import { normalizar } from "@/lib/agent/estado";
import { type Proposta } from "@/lib/agent/ferramentas";
import { consumirPergunta } from "@/lib/agent/limite";
import { rodarLastro } from "@/lib/agent/rodar";
import { registrarUso, somarTokens } from "@/lib/agent/uso";
import { listarMemoria } from "@/lib/memoria/store";
import { blocoMemoria } from "@/lib/memoria/validar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MARCA = "@@PROPOSTA@@";
const FIM = "@@FIM@@";

function texto(encoder: TextEncoder, controller: ReadableStreamDefaultController, pedaco: string) {
  controller.enqueue(encoder.encode(pedaco));
}

function emitirProposta(encoder: TextEncoder, controller: ReadableStreamDefaultController, proposta: Proposta) {
  texto(encoder, controller, "\n" + MARCA + encodeURIComponent(JSON.stringify(proposta)) + FIM);
}

function diaLog(hoje: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(hoje) ? hoje : new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const legado = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  const pergunta = typeof body?.pergunta === "string" ? body.pergunta.trim() : "";
  const modo = body?.modo === "noticias" || body?.web === true ? "noticias" : "portal";
  if (!pergunta && !legado) return new Response("Pergunta inválida", { status: 400 });
  if ((pergunta || legado).length > 200_000) return new Response("Pergunta inválida", { status: 400 });

  const client = claudeClient();
  const encoder = new TextEncoder();
  const cabecalhos = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };
  if (!client) {
    return new Response(
      "A chave ANTHROPIC_API_KEY ainda não está no servidor. O restante do portal funciona. Quando a chave estiver no .env.local, o assistente responde aqui.",
      { headers: cabecalhos }
    );
  }

  const cota = consumirPergunta();
  if (!cota.ok) {
    return new Response("O Lastro já respondeu o bastante por hoje. Amanhã ele volta.", { headers: cabecalhos });
  }

  if (!pergunta) {
    return legadoSemFerramentas(client, legado, modo === "noticias", encoder, cabecalhos, req.signal);
  }

  const hoje = typeof body?.hoje === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.hoje) ? body.hoje : "";
  if (!hoje) return new Response("Data inválida", { status: 400 });
  const estado = normalizar(body?.estado, hoje);
  let memoria = "";
  try {
    const lista = await listarMemoria();
    if (lista.ok) memoria = blocoMemoria(lista.itens.slice(0, 40));
  } catch {
    memoria = "";
  }

  const bodyStream = new ReadableStream({
    async start(controller) {
      const resultado = await rodarLastro({
        client,
        pergunta,
        modo,
        estado,
        memoria,
        signal: req.signal,
        onText: (pedaco) => texto(encoder, controller, pedaco),
        onProposta: (proposta) => emitirProposta(encoder, controller, proposta),
      });
      if (resultado.erro && !req.signal.aborted) {
        texto(encoder, controller, "\n\nNão foi possível responder agora. Confira a chave da API nas variáveis de ambiente.");
      }
      if (!req.signal.aborted) {
        void registrarUso({
          dia: diaLog(hoje),
          origem: modo === "noticias" ? "noticias" : "portal",
          ferramentas: resultado.ferramentas,
          erro: resultado.erro,
          entrada: resultado.entrada,
          saida: resultado.saida,
        });
      }
      controller.close();
    },
  });

  return new Response(bodyStream, { headers: cabecalhos });
}

function legadoSemFerramentas(
  client: NonNullable<ReturnType<typeof claudeClient>>,
  prompt: string,
  web: boolean,
  encoder: TextEncoder,
  cabecalhos: Record<string, string>,
  signal: AbortSignal
) {
  const stream = client.messages.stream(
    {
      model: claudeModel(),
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
      ...(web ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }] as never } : {}),
    },
    { signal }
  );
  const body = new ReadableStream({
    async start(controller) {
      let erro = false;
      const acc = { entrada: 0, saida: 0 };
      const ferramentas: string[] = [];
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        somarTokens(final.usage, acc);
        for (const bloco of final.content as { type?: string; name?: string }[]) {
          if (bloco.name === "web_search") ferramentas.push("web_search");
        }
      } catch {
        erro = !signal.aborted;
        if (erro) controller.enqueue(encoder.encode("\n\nNão foi possível responder agora. Confira a chave da API nas variáveis de ambiente."));
      } finally {
        if (!signal.aborted) {
          void registrarUso({
            dia: new Date().toISOString().slice(0, 10),
            origem: web ? "noticias" : "portal",
            ferramentas,
            erro,
            entrada: acc.entrada,
            saida: acc.saida,
          });
        }
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });
  return new Response(body, { headers: cabecalhos });
}
