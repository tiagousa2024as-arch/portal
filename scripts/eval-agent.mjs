import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checarDuro, lerCasos } from "../lib/agent/avaliar.ts";
import { normalizar } from "../lib/agent/estado.ts";
import { rodarLastro } from "../lib/agent/rodar.ts";
import { claudeClient, claudeModel } from "../lib/claude.ts";
import { extrairMemoria } from "../lib/memoria/extrair.ts";

const raiz = dirname(fileURLToPath(import.meta.url));

function carregarEnv() {
  try {
    const txt = readFileSync(join(raiz, "../.env.local"), "utf8");
    for (const linha of txt.split(/\n/)) {
      const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]]) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* sem arquivo local */
  }
}

function motivoCurto(texto) {
  return String(texto || "")
    .replace(/\d[\d.]*(?:,\d+)?/g, "n")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function estadoFalso() {
  return normalizar(
    {
      cfg: {
        entrada: 8000,
        consorcio: 500,
        lanceMensal: 1000,
        lanceMeta: 15000,
        reservaMeta: 6000,
        taxa: 0.05,
        rendaLiquida: 5000,
        horasMes: 160,
        aptoMeta: 200000,
        carroMeta: 80000,
      },
      saldos: { reserva: 2500, lance: 4000, apto: 1000, carro: 500, arcaInvestir: 350, A: 2000, R: 2000, C: 2000, I: 2000 },
      caixinhasMov: [
        { caixinha: "reserva", tipo: "retirada", valor: 200, data: "2026-02-07", motivo: "remedio" },
        { caixinha: "arcaInvestir", tipo: "deposito", valor: 350, data: "2026-09-22", motivo: "" },
      ],
      checkins: { "2026-09-26": { gastos: 180, vitoria: "pedido" } },
    },
    "2026-10-02"
  );
}

const AVALIAR = {
  name: "avaliar",
  description: "Julga a resposta do Lastro segundo a rubrica.",
  input_schema: {
    type: "object",
    properties: {
      aprovado: { type: "boolean" },
      falha_dura: { type: "boolean" },
      motivo: { type: "string" },
    },
    required: ["aprovado", "falha_dura", "motivo"],
    additionalProperties: false,
  },
};

carregarEnv();

const client = claudeClient();
if (!client) {
  console.log("Sem ANTHROPIC_API_KEY. Nenhum caso foi chamado.");
  process.exit(1);
}

const casos = lerCasos(readFileSync(join(raiz, "../tests/agent-cases.md"), "utf8"));
const rubrica = readFileSync(join(raiz, "../lib/agent/behavior.md"), "utf8");
const estado = estadoFalso();
let duras = 0;
let atencao = 0;

console.log("Lastro — " + casos.length + " casos");

for (const caso of casos) {
  let texto = "";
  let ferramentas = [];
  let fontes = caso.entrada;
  let memoria = "";
  try {
    const rodada = await rodarLastro({ client, pergunta: caso.entrada, modo: caso.modo, estado });
    texto = rodada.texto;
    ferramentas = rodada.ferramentas;
    fontes = caso.entrada + "\n" + rodada.fontes;
    if (rodada.erro) {
      duras += 1;
      console.log("falha dura\t" + caso.titulo + "\terro ao responder");
      continue;
    }
    if (/extração de memória/i.test(caso.ferramenta)) {
      const extra = await extrairMemoria(client, caso.entrada, texto, []);
      memoria = extra.proposto;
    }
  } catch {
    duras += 1;
    console.log("falha dura\t" + caso.titulo + "\terro ao responder");
    continue;
  }

  const duro = checarDuro({ modo: caso.modo, texto, ferramentas, memoria, fontes });
  let nota = { aprovado: false, falha_dura: false, motivo: "avaliador não respondeu" };
  try {
    const msg = await client.messages.create({
      model: claudeModel(),
      max_tokens: 300,
      system: rubrica,
      tools: [AVALIAR],
      tool_choice: { type: "tool", name: "avaliar" },
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            titulo: caso.titulo,
            modo: caso.modo,
            entrada: caso.entrada,
            ferramenta_esperada: caso.ferramenta,
            saida_esperada: caso.saida,
            ferramentas,
            texto: texto.slice(0, 4000),
            fontes: fontes.slice(0, 6000),
            memoria: memoria.slice(0, 600),
          }),
        },
      ],
    });
    const uso = msg.content.find((b) => b.type === "tool_use" && b.name === "avaliar");
    if (uso && uso.type === "tool_use" && uso.input && typeof uso.input === "object") {
      const entrada = uso.input;
      nota = {
        aprovado: entrada.aprovado === true,
        falha_dura: entrada.falha_dura === true,
        motivo: motivoCurto(entrada.motivo),
      };
    }
  } catch {
    nota = { aprovado: false, falha_dura: true, motivo: "avaliador não respondeu" };
  }

  const falha = duro.falhou || nota.falha_dura;
  if (falha) {
    duras += 1;
    console.log("falha dura\t" + caso.titulo + "\t" + motivoCurto(duro.motivo || nota.motivo));
  } else if (!nota.aprovado) {
    atencao += 1;
    console.log("atenção\t" + caso.titulo + "\t" + (nota.motivo || "saiu do esperado"));
  } else {
    console.log("ok\t" + caso.titulo);
  }
}

console.log(casos.length - duras - atencao + " ok · " + duras + " falha dura · " + atencao + " atenção");
if (duras) process.exit(1);
