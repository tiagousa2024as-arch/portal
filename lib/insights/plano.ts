// Espelho só de leitura das contas de sábado do portal.js.
// Não é o lugar de mudar a cascata. Se semana() mudar, este arquivo muda junto.
import type { Aporte, EstadoInsights } from "./types.ts";

export function num(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v ?? "").trim();
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function ymd(d: Date): string {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

export function parse(s: string): Date {
  const p = s.split("-");
  return new Date(+p[0], +p[1] - 1, +(p[2] || 1));
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function diasEntre(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 864e5);
}

export function reais(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.round((v || 0) * 100) / 100);
}

export function mesLongo(d: Date): string {
  return d.toLocaleDateString("pt-BR", { month: "long" });
}

export function satOnOrAfter(d: Date): Date {
  return addDays(d, (6 - d.getDay() + 7) % 7);
}

function diasAte5(d: Date): number {
  if (d.getDate() < 5) return 5 - d.getDate();
  const n = new Date(d.getFullYear(), d.getMonth() + 1, 5);
  return Math.round((n.getTime() - d.getTime()) / 864e5);
}

function isRent(d: Date): boolean {
  const x = diasAte5(d);
  return x >= 1 && x <= 7;
}

export type Ciclo = { rent: Date; idx: number; sats: Date[]; mes: string };

export function cycleOf(d: Date): Ciclo {
  let r = d;
  let i = 0;
  while (!isRent(r) && i < 8) {
    r = addDays(r, -7);
    i++;
  }
  const sats: Date[] = [];
  let s = addDays(r, 7);
  while (!isRent(s) && sats.length < 6) {
    sats.push(s);
    s = addDays(s, 7);
  }
  const first = sats[0] || addDays(r, 7);
  return { rent: r, idx: i, sats, mes: first.getFullYear() + "-" + pad(first.getMonth() + 1) };
}

function acordosNo(estado: EstadoInsights, mes: string): number {
  let t = 0;
  for (const a of estado.acordos || []) {
    if (!a.inicio || !(num(a.n) > 0)) continue;
    const p = a.inicio.split("-");
    const m = mes.split("-");
    const k = (+m[0] - +p[0]) * 12 + (+m[1] - +p[1]);
    if (k >= 0 && k < num(a.n)) t += num(a.valor);
  }
  return Math.round(t * 100) / 100;
}

type Metas = { consorcio: number; acordos: number; lance: number; reserva: number; arca: number; cheia: boolean };

function metas(estado: EstadoInsights, cyc: Ciclo): Metas {
  const C = estado.cfg || {};
  const entrada = num(C.entrada);
  const consorcio = num(C.consorcio);
  const lanceMeta = num(C.lanceMeta);
  const reservaMeta = num(C.reservaMeta);
  const pct = num(C.pctReserva);
  const lanceMensal = num(C.lanceMensal);
  let exL = 0;
  let exR = 0;
  for (const s of cyc.sats) {
    const a = estado.aportes?.[ymd(s)];
    if (a) {
      exL += num(a.lance);
      exR += num(a.reserva);
    }
  }
  const lanceAntes = num(estado.saldos?.lance) - exL;
  const resAntes = num(estado.saldos?.reserva) - exR;
  const ac = acordosNo(estado, cyc.mes);
  const lance = lanceAntes >= lanceMeta ? 0 : Math.min(lanceMensal, Math.max(0, lanceMeta - lanceAntes));
  const cheia = reservaMeta > 0 && resAntes >= reservaMeta;
  const base = entrada - consorcio - lance;
  const res = cheia
    ? 0
    : Math.max(0, Math.min(base * pct - ac / 2, reservaMeta > 0 ? reservaMeta - resAntes : 1e15, entrada - consorcio - ac - lance));
  const arca = Math.max(0, entrada - consorcio - ac - lance - res);
  return { consorcio, acordos: ac, lance, reserva: res, arca, cheia };
}

const ORDER = ["consorcio", "acordos", "lance", "reserva", "arca"] as const;

function waterfall(total: number, t: Metas): Record<(typeof ORDER)[number], number> {
  const out = { consorcio: 0, acordos: 0, lance: 0, reserva: 0, arca: 0 };
  let left = total;
  for (const k of ORDER) {
    const v = Math.min(left, t[k]);
    out[k] = v;
    left -= v;
  }
  if (left > 0) {
    if (t.cheia) out.arca += left;
    else out.reserva += left;
  }
  return out;
}

export type PlanoSabado = {
  data: Date;
  aluguel: boolean;
  idx: number;
  alloc: Record<(typeof ORDER)[number], number>;
};

export function planoDoSabado(estado: EstadoInsights, d: Date): PlanoSabado {
  const cyc = cycleOf(d);
  if (cyc.idx === 0) {
    return { data: d, aluguel: true, idx: 0, alloc: { consorcio: 0, acordos: 0, lance: 0, reserva: 0, arca: 0 } };
  }
  const t = metas(estado, cyc);
  const key = ymd(d);
  let before = 0;
  let mine = num(estado.cfg?.entrada) / 3;
  for (const s of cyc.sats) {
    const k = ymd(s);
    const a: Aporte | undefined = estado.aportes?.[k];
    if (k === key) {
      if (a && a.recebido != null) mine = num(a.recebido);
      break;
    }
    before += a ? num(a.recebido) : 0;
  }
  const w1 = waterfall(before, t);
  const w2 = waterfall(before + mine, t);
  const alloc = { consorcio: 0, acordos: 0, lance: 0, reserva: 0, arca: 0 };
  for (const k of ORDER) alloc[k] = Math.max(0, w2[k] - w1[k]);
  return { data: d, aluguel: false, idx: cyc.idx, alloc };
}

export function proximoDiaDoMes(hoje: Date, dia: number): Date {
  let d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
  if (diasEntre(hoje, d) < 0) d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
  return d;
}

export function addMonths(ano: number, mes: number, n: number): Date {
  return new Date(ano, mes - 1 + n, 1);
}

export function diasArcaParada(estado: EstadoInsights, hoje: Date): number | null {
  if (!(num(estado.saldos?.arcaInvestir) > 0)) return 0;
  const movs = (estado.caixinhasMov || [])
    .filter((m) => m && m.caixinha === "arcaInvestir" && m.data)
    .slice()
    .sort((a, b) => (a.data! < b.data! ? -1 : 1));
  let desde: string | null = null;
  let bal = 0;
  if (movs.length) {
    for (const m of movs) {
      if (m.tipo === "deposito") {
        if (bal <= 0.004) desde = m.data!;
        bal += num(m.valor);
      } else {
        bal -= num(m.valor);
        if (bal <= 0.004) {
          bal = 0;
          desde = null;
        }
      }
    }
  }
  if (!desde) {
    const ks = Object.keys(estado.aportes || {})
      .filter((k) => estado.aportes?.[k] && num(estado.aportes[k]?.arca) > 0)
      .sort();
    if (ks.length) desde = ks[ks.length - 1];
  }
  if (!desde) return null;
  return Math.max(0, diasEntre(parse(desde), hoje));
}

export function rm(taxa: number): number {
  return Math.pow(1 + taxa, 1 / 12) - 1;
}

export function metaMensalLance(estado: EstadoInsights, d: Date): number {
  const cyc = cycleOf(d);
  if (cyc.idx === 0) {
    const seguinte = cyc.sats[0];
    if (!seguinte) return 0;
    return metaMensalLance(estado, seguinte);
  }
  const C = estado.cfg || {};
  let exL = 0;
  for (const s of cyc.sats) {
    const a = estado.aportes?.[ymd(s)];
    if (a) exL += num(a.lance);
  }
  const lanceAntes = num(estado.saldos?.lance) - exL;
  const lanceMeta = num(C.lanceMeta);
  const lanceMensal = num(C.lanceMensal);
  if (lanceAntes >= lanceMeta) return 0;
  return Math.min(lanceMensal, Math.max(0, lanceMeta - lanceAntes));
}

export function nperAnos(pmt: number, pv: number, meta: number, taxa: number): number | null {
  const r = rm(taxa);
  if (!(r > 0)) return null;
  if (pv >= meta) return 0;
  if (!(pmt > 0)) return null;
  return Math.log((meta * r + pmt) / (pv * r + pmt)) / Math.log(1 + r) / 12;
}
