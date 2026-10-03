import { gerarInsights } from "../insights/engine.ts";
import { LIMITES } from "../insights/config.ts";
import { addDays, diasEntre, num, planoDoSabado, proximoDiaDoMes, reais, ymd } from "../insights/plano.ts";
import type { EstadoInsights } from "../insights/types.ts";

export type TipoAviso = "sabado" | "arca" | "contas" | "nudge" | "revisao";

export type PrefsAviso = Record<TipoAviso, boolean>;

export type Aviso = { id: string; tipo: TipoAviso; titulo: string; corpo: string };

export type Envio = { id: string; em: string };

export const MAX_SEMANA = 3;
export const HORA_INICIO = 8;
export const HORA_FIM = 21;

const ORDEM: TipoAviso[] = ["sabado", "contas", "arca", "nudge", "revisao"];

const FRASE: Record<string, (v: string) => string> = {
  lance: (v) => v + " para o Lance",
  reserva: (v) => v + " para a Reserva",
  arca: (v) => v + " para a ARCA",
  consorcio: (v) => v + " para o consórcio",
  acordos: (v) => v + " para os acordos",
};

export function dentroDoDia(hora: number): boolean {
  return hora >= HORA_INICIO && hora < HORA_FIM;
}

export function partesLocais(agora: Date, tz: string): { ymd: string; hora: number; dia: Date } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(agora).map((x) => [x.type, x.value]));
  const y = Number(p.year);
  const m = Number(p.month);
  const d = Number(p.day);
  return { ymd: p.year + "-" + p.month + "-" + p.day, hora: Number(p.hour), dia: new Date(y, m - 1, d) };
}

function juntar(partes: string[]): string {
  if (partes.length <= 1) return partes[0] || "";
  return partes.slice(0, -1).join(", ") + " e " + partes[partes.length - 1];
}

function textoSabado(estado: EstadoInsights, hoje: Date): string | null {
  if (hoje.getDay() !== 6) return null;
  const plano = planoDoSabado(estado, hoje);
  if (plano.aluguel) return "Hoje o sábado é do aluguel. Sem aporte nas caixinhas.";
  const partes = Object.keys(FRASE)
    .map((k) => {
      const v = plano.alloc[k as keyof typeof plano.alloc];
      return v > 0.004 ? FRASE[k](reais(v)) : "";
    })
    .filter(Boolean);
  if (!partes.length) return "Hoje é sábado de cascata " + plano.idx + ". Nada a separar.";
  return "Hoje é sábado de cascata " + plano.idx + ": " + juntar(partes) + ".";
}

function textoContas(estado: EstadoInsights, hoje: Date): string | null {
  const amanha = addDays(hoje, 1);
  const textos: string[] = [];
  const bate = (data: Date) => diasEntre(hoje, data) === 1;
  const aluguel = proximoDiaDoMes(hoje, LIMITES.aluguelDia);
  if (bate(aluguel)) textos.push("Aluguel no dia " + LIMITES.aluguelDia);
  if (num(estado.cfg?.consorcio) > 0 && bate(proximoDiaDoMes(hoje, LIMITES.consorcioDia))) {
    textos.push("Consórcio " + reais(num(estado.cfg?.consorcio)) + " por volta do dia " + LIMITES.consorcioDia);
  }
  for (const a of estado.acordos || []) {
    const dia = LIMITES.acordosDia[(a.nome || "").trim().toLowerCase()];
    if (!dia || !a.inicio || !(num(a.n) > 0)) continue;
    const quando = proximoDiaDoMes(hoje, dia);
    if (!bate(quando)) continue;
    const mes = ymd(quando).slice(0, 7);
    const p = a.inicio.split("-");
    const m = mes.split("-");
    const k = (+m[0] - +p[0]) * 12 + (+m[1] - +p[1]);
    if (k < 0 || k >= num(a.n)) continue;
    textos.push((a.nome || "Acordo") + " " + reais(num(a.valor)) + " no dia " + dia);
  }
  if (!textos.length) return null;
  return "Amanhã: " + textos.join(". ") + ".";
}

function sabadoNaOuAntes(hoje: Date): Date {
  return addDays(hoje, -((hoje.getDay() + 1) % 7));
}

function textoNudge(estado: EstadoInsights, hoje: Date): { id: string; corpo: string } | null {
  const chaves = Object.keys(estado.checkins || {}).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  if (!chaves.length) return null;
  const ref = ymd(sabadoNaOuAntes(hoje));
  const ultima = chaves.filter((k) => k <= ref).pop();
  if (!ultima) return null;
  const dias = diasEntre(new Date(+ultima.slice(0, 4), +ultima.slice(5, 7) - 1, +ultima.slice(8, 10)), sabadoNaOuAntes(hoje));
  if (dias < 14) return null;
  return { id: "nudge-desde-" + ultima, corpo: "Dois sábados seguidos sem check-in. O próximo sábado ainda é seu." };
}

export function candidatos(estado: EstadoInsights, prefs: PrefsAviso, hoje: Date): Aviso[] {
  const data = ymd(hoje);
  const saida: Aviso[] = [];
  if (prefs.sabado) {
    const corpo = textoSabado(estado, hoje);
    if (corpo) saida.push({ id: "sabado-" + data, tipo: "sabado", titulo: "Seu sábado", corpo });
  }
  if (prefs.contas) {
    const corpo = textoContas(estado, hoje);
    if (corpo) saida.push({ id: "contas-" + ymd(addDays(hoje, 1)), tipo: "contas", titulo: "Conta de amanhã", corpo });
  }
  if (prefs.arca && hoje.getDay() === 1 && num(estado.saldos?.arcaInvestir) > 0) {
    saida.push({
      id: "arca-" + data,
      tipo: "arca",
      titulo: "ARCA – a investir",
      corpo: "ARCA – a investir está com " + reais(num(estado.saldos?.arcaInvestir)) + ". É passagem: comprar na segunda ou terça.",
    });
  }
  if (prefs.nudge) {
    const n = textoNudge(estado, hoje);
    if (n) saida.push({ id: n.id, tipo: "nudge", titulo: "O sábado", corpo: n.corpo });
  }
  if (prefs.revisao) {
    for (const item of gerarInsights(estado, hoje)) {
      if (item.type !== "revisao") continue;
      saida.push({ id: item.id, tipo: "revisao", titulo: item.title, corpo: item.detail });
    }
  }
  return saida;
}

export function inicioSemana(data: string): string {
  const p = data.split("-");
  const d = new Date(+p[0], +p[1] - 1, +p[2]);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return ymd(d);
}

export function escolher(lista: Aviso[], enviados: Envio[], hoje: string): Aviso[] {
  const semana = inicioSemana(hoje);
  const ja = new Set(enviados.map((e) => e.id));
  const vagas = MAX_SEMANA - enviados.filter((e) => inicioSemana(e.em) === semana).length;
  if (vagas <= 0) return [];
  return lista
    .filter((a) => !ja.has(a.id))
    .sort((a, b) => ORDEM.indexOf(a.tipo) - ORDEM.indexOf(b.tipo))
    .slice(0, vagas);
}
