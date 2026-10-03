import { gerarInsights } from "../insights/engine.ts";
import { mesLongo, num, reais, ymd } from "../insights/plano.ts";
import type { EstadoInsights } from "../insights/types.ts";

export type EstadoBriefing = EstadoInsights & {
  feitos?: Record<string, string | undefined>;
};

const MARCOS: Record<string, string> = {
  r1: "R$ 1.000 na Reserva",
  r5: "R$ 5.000 na Reserva",
  reserva: "Reserva cheia",
  l10: "R$ 10.000 no Lance",
  lance: "Lance completo",
  div: "1º dividendo",
  a10: "R$ 10.000 na ARCA",
  a50: "R$ 50.000 na ARCA",
  ap10: "R$ 10.000 no Apartamento",
  p100: "R$ 100.000 de patrimônio",
  fase2: "Fase 2: Crescimento",
  fase3: "Fase 3: Liberdade",
  arcaCompra: "Primeira compra da ARCA",
  sangue: "Sangue frio",
  leitor: "Leitor de Primeira Geração",
};

const CAIXAS: { chave: "lance" | "reserva" | "arca" | "consorcio" | "acordos"; nome: string }[] = [
  { chave: "lance", nome: "Lance" },
  { chave: "reserva", nome: "Reserva" },
  { chave: "arca", nome: "ARCA" },
  { chave: "consorcio", nome: "Consórcio" },
  { chave: "acordos", nome: "Acordos" },
];

export function ehSabado(hoje: Date): boolean {
  return hoje.getDay() === 6;
}

export function primeiroSabadoDoMes(hoje: Date): boolean {
  return ehSabado(hoje) && hoje.getDate() <= 7;
}

export function hojeUtc(agora = new Date()): Date {
  return new Date(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());
}

export function linhasSabado(estado: EstadoInsights, hoje: Date): string[] {
  const sabado = gerarInsights(estado, hoje).find((i) => i.type === "sabado");
  return [sabado?.detail || "Não há plano para este sábado."];
}

function mesAnterior(hoje: Date): { chave: string; nome: string } {
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  return { chave: ymd(d).slice(0, 7), nome: mesLongo(d) };
}

export function linhasMes(estado: EstadoBriefing, hoje: Date): { mes: string; titulo: string; linhas: string[] } {
  const { chave, nome } = mesAnterior(hoje);
  const somas = { lance: 0, reserva: 0, arca: 0, consorcio: 0, acordos: 0 };
  for (const [data, aporte] of Object.entries(estado.aportes || {})) {
    if (!data.startsWith(chave) || !aporte) continue;
    somas.lance += num(aporte.lance);
    somas.reserva += num(aporte.reserva);
    somas.arca += num(aporte.arca);
    somas.consorcio += num(aporte.consorcio);
    somas.acordos += num(aporte.acordos);
  }
  const linhas: string[] = [];
  const partes = CAIXAS.filter((c) => somas[c.chave] > 0.004).map((c) => reais(somas[c.chave]) + " no " + c.nome);
  linhas.push(partes.length ? "Aportes de " + nome + ": " + partes.join(", ") + "." : "Nenhum aporte registrado em " + nome + ".");
  const pedras = Object.keys(estado.checkins || {}).filter((k) => k.startsWith(chave)).length;
  linhas.push(pedras === 1 ? "1 pedra no muro em " + nome + "." : pedras + " pedras no muro em " + nome + ".");
  const marcos = Object.entries(estado.feitos || {})
    .filter(([, data]) => typeof data === "string" && data.startsWith(chave))
    .map(([id]) => MARCOS[id] || (id.startsWith("livro:") ? "Livro concluído" : ""))
    .filter(Boolean);
  linhas.push(marcos.length ? "Marcos: " + marcos.join(", ") + "." : "Nenhum marco novo em " + nome + ".");
  const plano = num(estado.cfg?.lanceMensal);
  if (plano > 0) {
    const ritmo = somas.lance + 0.004 >= plano ? "No ritmo do plano." : "Abaixo do plano.";
    linhas.push("O lance recebeu " + reais(somas.lance) + ". O plano do mês é " + reais(plano) + ". " + ritmo);
  } else {
    linhas.push("O plano mensal do lance está em zero.");
  }
  return { mes: chave, titulo: "Relatório de " + nome, linhas };
}

export type ItemLinha = { id: string; data: string; titulo: string; texto: string; foto: string };

export function encaixarRelatorio(timeline: unknown, item: ItemLinha): unknown[] | null {
  if (!Array.isArray(timeline)) return null;
  const resto = timeline.filter((e) => !e || typeof e !== "object" || (e as { id?: string }).id !== item.id);
  return [...resto, item];
}

export function frasesSeguras(frases: string, linhas: string[]): string {
  const texto = String(frases || "").replace(/\s+/g, " ").trim().slice(0, 600);
  if (!texto) return "";
  const fonte = linhas.join(" ");
  const permitidos = new Set<string>();
  for (const m of fonte.matchAll(/\d[\d.]*(,\d+)?/g)) permitidos.add(m[0]);
  const usados = texto.match(/\d[\d.]*(,\d+)?/g) || [];
  for (const n of usados) if (!permitidos.has(n)) return "";
  return texto;
}
