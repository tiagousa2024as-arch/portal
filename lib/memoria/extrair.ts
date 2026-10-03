import type Anthropic from "@anthropic-ai/sdk";
import { claudeModel } from "../claude.ts";
import { somarTokens } from "../agent/uso.ts";
import { limparItens, type ItemMemoria } from "./validar.ts";

const FERRAMENTA = {
  name: "propor_memoria",
  description: "Propõe até 3 lembretes curtos. Não grava.",
  input_schema: {
    type: "object",
    properties: {
      itens: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["decisao", "preferencia", "contexto"] },
            text: { type: "string" },
          },
          required: ["kind", "text"],
          additionalProperties: false,
        },
      },
    },
    required: ["itens"],
    additionalProperties: false,
  },
};

export type Extracao = {
  itens: ItemMemoria[];
  proposto: string;
  entrada: number;
  saida: number;
  erro: boolean;
};

export async function extrairMemoria(client: Anthropic, pergunta: string, resposta: string, ja: string[]): Promise<Extracao> {
  const acc = { entrada: 0, saida: 0 };
  try {
    const msg = await client.messages.create({
      model: claudeModel(),
      max_tokens: 400,
      system:
        "Você propõe até 3 lembretes curtos para o Tiago aprovar depois. Não diga que salvou. Tipos: decisao (algo que ele decidiu), preferencia (como prefere que o Lastro fale), contexto (situação em andamento, como esperar 7 dias para decidir o celular). Recuse CPF, RG, senha, conta, cartão, endereço, telefone, e-mail, saúde, documento e nome de outra pessoa: se a conversa só tiver isso, devolva itens vazio. Não copie saldo, cotação nem projeção. Não invente. Não repita um texto que já está na lista. Cada texto em uma frase, no máximo 140 caracteres.",
      tools: [FERRAMENTA as never],
      tool_choice: { type: "tool", name: "propor_memoria" },
      messages: [{ role: "user", content: JSON.stringify({ pergunta, resposta, ja }) }],
    });
    somarTokens(msg.usage, acc);
    const uso = msg.content.find((b) => b.type === "tool_use" && b.name === "propor_memoria");
    const entrada = uso && uso.type === "tool_use" && uso.input && typeof uso.input === "object" ? (uso.input as { itens?: unknown }).itens : [];
    const lista = Array.isArray(entrada) ? entrada : [];
    const proposto = lista
      .map((item) => (item && typeof item === "object" ? String((item as { text?: unknown }).text || "") : ""))
      .join(" ")
      .slice(0, 600);
    return { itens: limparItens(entrada, ja).itens, proposto, entrada: acc.entrada, saida: acc.saida, erro: false };
  } catch {
    return { itens: [], proposto: "", entrada: acc.entrada, saida: acc.saida, erro: true };
  }
}
