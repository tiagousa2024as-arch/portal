import { num } from "../insights/plano.ts";

export type MovCaixa = {
  caixinha?: string;
  tipo?: string;
  valor?: number;
  data?: string;
  motivo?: string;
  origem?: string;
};

export type EstadoAgente = {
  hoje: string;
  cfg: {
    entrada?: number;
    cambio?: number;
    consorcio?: number;
    lanceMensal?: number;
    lanceMeta?: number;
    reservaMeta?: number;
    pctReserva?: number;
    taxa?: number;
    idade?: number;
    metaMilhao?: number;
    aptoMeta?: number;
    carroMeta?: number;
    rendaLiquida?: number;
    horasMes?: number;
  };
  acordos: { nome?: string; valor?: number; inicio?: string; n?: number }[];
  saldos: Record<string, number>;
  aportes: Record<string, { recebido?: number; lance?: number; reserva?: number; arca?: number; consorcio?: number; acordos?: number }>;
  checkins: Record<string, Record<string, string | number | undefined>>;
  caixinhasMov: MovCaixa[];
  bandaFora: Record<string, string | undefined>;
  outrasContas: { nome?: string; saldo?: number }[];
  negocios: string[];
  movs: { neg?: string; tipo?: string; valor?: number; data?: string }[];
  ativos: { t?: string; l?: string; qtd?: number }[];
  conferencia: { data?: string } | null;
};

function texto(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

function dia(v: unknown): string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

export function normalizar(bruto: unknown, hoje: string): EstadoAgente {
  const o = bruto && typeof bruto === "object" ? (bruto as Record<string, unknown>) : {};
  const cfgBruto = o.cfg && typeof o.cfg === "object" ? (o.cfg as Record<string, unknown>) : {};
  const cfg = {
    entrada: num(cfgBruto.entrada),
    cambio: num(cfgBruto.cambio),
    consorcio: num(cfgBruto.consorcio),
    lanceMensal: num(cfgBruto.lanceMensal),
    lanceMeta: num(cfgBruto.lanceMeta),
    reservaMeta: num(cfgBruto.reservaMeta),
    pctReserva: num(cfgBruto.pctReserva),
    taxa: num(cfgBruto.taxa) || 0.05,
    idade: num(cfgBruto.idade) || 33,
    metaMilhao: num(cfgBruto.metaMilhao) || 1000000,
    aptoMeta: num(cfgBruto.aptoMeta),
    carroMeta: num(cfgBruto.carroMeta),
    rendaLiquida: num(cfgBruto.rendaLiquida),
    horasMes: num(cfgBruto.horasMes),
  };
  const saldosBruto = o.saldos && typeof o.saldos === "object" ? (o.saldos as Record<string, unknown>) : {};
  const saldos: Record<string, number> = {};
  for (const k of ["reserva", "lance", "apto", "carro", "arcaInvestir", "A", "R", "C", "I", "dividendos"]) {
    saldos[k] = num(saldosBruto[k]);
  }
  const acordos = Array.isArray(o.acordos)
    ? o.acordos.slice(0, 12).map((a) => {
        const x = a && typeof a === "object" ? (a as Record<string, unknown>) : {};
        return { nome: texto(x.nome, 40), valor: num(x.valor), inicio: texto(x.inicio, 7), n: num(x.n) };
      })
    : [];
  const aportesBruto = o.aportes && typeof o.aportes === "object" ? (o.aportes as Record<string, unknown>) : {};
  const aportes: EstadoAgente["aportes"] = {};
  for (const k of Object.keys(aportesBruto).slice(0, 80)) {
    if (!dia(k)) continue;
    const a = aportesBruto[k] && typeof aportesBruto[k] === "object" ? (aportesBruto[k] as Record<string, unknown>) : {};
    aportes[k] = {
      recebido: num(a.recebido),
      lance: num(a.lance),
      reserva: num(a.reserva),
      arca: num(a.arca),
      consorcio: num(a.consorcio),
      acordos: num(a.acordos),
    };
  }
  const checkinsBruto = o.checkins && typeof o.checkins === "object" ? (o.checkins as Record<string, unknown>) : {};
  const checkins: EstadoAgente["checkins"] = {};
  for (const k of Object.keys(checkinsBruto).slice(0, 120)) {
    if (!dia(k)) continue;
    const c = checkinsBruto[k] && typeof checkinsBruto[k] === "object" ? (checkinsBruto[k] as Record<string, unknown>) : {};
    checkins[k] = {
      gastos: c.gastos == null || c.gastos === "" ? "" : num(c.gastos),
      extra: c.extra == null || c.extra === "" ? "" : num(c.extra),
      mexeu: c.mexeu === "sim" ? "sim" : "não",
      motivo: texto(c.motivo, 160),
      negocios: texto(c.negocios, 400),
      vitoria: texto(c.vitoria, 240),
      escorreguei: texto(c.escorreguei, 240),
      foraNormal: texto(c.foraNormal, 160),
      extraOrigem: texto(c.extraOrigem, 80),
    };
  }
  const caixinhasMov = Array.isArray(o.caixinhasMov)
    ? o.caixinhasMov.slice(-400).map((m) => {
        const x = m && typeof m === "object" ? (m as Record<string, unknown>) : {};
        return {
          caixinha: texto(x.caixinha, 20),
          tipo: x.tipo === "retirada" ? "retirada" : x.tipo === "deposito" ? "deposito" : "",
          valor: num(x.valor),
          data: dia(x.data),
          motivo: texto(x.motivo, 120),
          origem: texto(x.origem, 20),
        };
      })
    : [];
  const bandaBruta = o.bandaFora && typeof o.bandaFora === "object" ? (o.bandaFora as Record<string, unknown>) : {};
  const bandaFora: Record<string, string | undefined> = {};
  for (const k of ["A", "R", "C", "I"]) {
    const d = dia(bandaBruta[k]);
    if (d) bandaFora[k] = d;
  }
  const outrasContas = Array.isArray(o.outrasContas)
    ? o.outrasContas.slice(0, 12).map((c) => {
        const x = c && typeof c === "object" ? (c as Record<string, unknown>) : {};
        return { nome: texto(x.nome, 40), saldo: num(x.saldo) };
      })
    : [];
  const negocios = Array.isArray(o.negocios) ? o.negocios.slice(0, 12).map((n) => texto(n, 60)).filter(Boolean) : [];
  const movs = Array.isArray(o.movs)
    ? o.movs.slice(-200).map((m) => {
        const x = m && typeof m === "object" ? (m as Record<string, unknown>) : {};
        return { neg: texto(x.neg, 60), tipo: x.tipo === "ret" ? "ret" : "inv", valor: num(x.valor), data: dia(x.data) };
      })
    : [];
  const ativos = Array.isArray(o.ativos)
    ? o.ativos.slice(0, 40).map((a) => {
        const x = a && typeof a === "object" ? (a as Record<string, unknown>) : {};
        return { t: texto(x.t, 20), l: texto(x.l, 4), qtd: num(x.qtd) };
      })
    : [];
  const conf = o.conferencia && typeof o.conferencia === "object" ? (o.conferencia as Record<string, unknown>) : null;
  return {
    hoje,
    cfg,
    acordos,
    saldos,
    aportes,
    checkins,
    caixinhasMov,
    bandaFora,
    outrasContas,
    negocios,
    movs,
    ativos,
    conferencia: conf && dia(conf.data) ? { data: dia(conf.data) } : null,
  };
}
