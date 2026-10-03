import { NextResponse } from "next/server";
import { claudeClient, claudeModel } from "@/lib/claude";
import { normalizar } from "@/lib/agent/estado";
import { consumirPergunta } from "@/lib/agent/limite";
import { registrarUso, somarTokens } from "@/lib/agent/uso";
import { validarComando, type Classificacao, type ResultadoComando } from "@/lib/comando/validar";

export const dynamic = "force-dynamic";

const cache = new Map<string, { at: number; classe: Classificacao }>();
const TTL = 30 * 60 * 1000;
const MAX = 32;

const FERRAMENTA = {
  name: "interpretar",
  description: "Classifica a frase do Tiago. Não calcule sobra, prazo nem total.",
  input_schema: {
    type: "object",
    properties: {
      acao: { type: "string", enum: ["deposito", "retirada", "compra", "retorno", "pergunta", "nenhuma"] },
      caixinha: { type: "string", enum: ["reserva", "lance", "apto", "carro", "arcaInvestir"] },
      valor: { type: "number" },
      motivo: { type: "string" },
      ativo: { type: "string" },
      quantidade: { type: "number" },
      preco: { type: "number" },
      negocio: { type: "string" },
      alvo: { type: "string", enum: ["lance", "reserva", "apto", "carro", "arcaInvestir", "patrimonio"] },
    },
    required: ["acao"],
    additionalProperties: false,
  },
};

function semChave(): ResultadoComando {
  return { tipo: "erro", texto: "A chave ANTHROPIC_API_KEY ainda não está no servidor. O restante do portal funciona." };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const texto = typeof body?.texto === "string" ? body.texto.trim().slice(0, 400) : "";
  const hoje = typeof body?.hoje === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.hoje) ? body.hoje : "";
  if (!texto || !hoje) return NextResponse.json({ tipo: "erro", texto: "Diga o que aconteceu." }, { status: 400 });
  const estado = normalizar(body?.estado, hoje);
  const negocios = estado.negocios;
  const ativos = estado.ativos.map((a) => a.t).filter(Boolean);
  const chave = texto.toLowerCase() + "|" + negocios.join(",") + "|" + ativos.join(",");
  const guardado = cache.get(chave);
  let classe: Classificacao | null = guardado && Date.now() - guardado.at < TTL ? guardado.classe : null;

  if (!classe) {
    const cota = consumirPergunta();
    if (!cota.ok) return NextResponse.json({ tipo: "erro", texto: "O Lastro já respondeu o bastante por hoje. Amanhã ele volta." });
    const client = claudeClient();
    if (!client) return NextResponse.json(semChave());
    try {
      const msg = await client.messages.create({
        model: claudeModel(),
        max_tokens: 400,
        system:
          "Você só classifica a frase do Tiago na ferramenta interpretar. Números em português: 1.200 é 1200 e 1,50 é 1.5. Não invente cotação. Não diga que algo foi salvo. Caixinhas: reserva, lance, apto, carro, arcaInvestir. Retorno de negócio é acao retorno. Compra de cota é acao compra, com o código da lista. Quanto falta é acao pergunta.",
        tools: [FERRAMENTA as never],
        tool_choice: { type: "tool", name: "interpretar" },
        messages: [{ role: "user", content: JSON.stringify({ texto, negocios, ativos }) }],
      });
      const uso = msg.content.find((b) => b.type === "tool_use" && b.name === "interpretar");
      if (!uso || uso.type !== "tool_use" || !uso.input || typeof uso.input !== "object") {
        const acc = { entrada: 0, saida: 0 };
        somarTokens(msg.usage, acc);
        void registrarUso({ dia: hoje, origem: "comando", ferramentas: [], erro: true, entrada: acc.entrada, saida: acc.saida });
        return NextResponse.json({ tipo: "erro", texto: "Não entendi. Tente: guardei 300 na reserva." });
      }
      classe = uso.input as Classificacao;
      const acc = { entrada: 0, saida: 0 };
      somarTokens(msg.usage, acc);
      void registrarUso({ dia: hoje, origem: "comando", ferramentas: ["interpretar"], erro: false, entrada: acc.entrada, saida: acc.saida });
      if (cache.size >= MAX) {
        const primeiro = cache.keys().next().value;
        if (primeiro) cache.delete(primeiro);
      }
      cache.set(chave, { at: Date.now(), classe });
    } catch {
      void registrarUso({ dia: hoje, origem: "comando", ferramentas: [], erro: true, entrada: 0, saida: 0 });
      return NextResponse.json({ tipo: "erro", texto: "Não deu para entender agora." });
    }
  }

  return NextResponse.json(validarComando(classe, estado));
}
