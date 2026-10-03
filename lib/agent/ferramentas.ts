import { LIMITES } from "../insights/config.ts";
import { gerarInsights, priorizar } from "../insights/engine.ts";
import {
  addDays,
  cycleOf,
  diasArcaParada,
  diasEntre,
  nperAnos,
  num,
  parse,
  planoDoSabado,
  reais,
  satOnOrAfter,
  ymd,
} from "../insights/plano.ts";
import type { EstadoAgente } from "./estado.ts";

const CAIXAS: Record<string, string> = {
  reserva: "Reserva de Emergência",
  lance: "Lance CB650R",
  apto: "Apartamento",
  carro: "Carro dos sonhos",
  arcaInvestir: "ARCA – a investir",
};

const METAS: Record<string, string> = {
  reservaMeta: "Reserva de Emergência",
  lanceMeta: "Lance CB650R",
  aptoMeta: "Apartamento",
  carroMeta: "Carro dos sonhos",
  lanceMensal: "aporte mensal do Lance",
};

const FIIS = ["HGLG11", "XPML11", "KNRI11", "KNCR11"];

export type Proposta = {
  tipo: "movimento" | "checkin" | "meta";
  titulo: string;
  detalhe: string;
  movimento?: { caixinha: string; tipo: "deposito" | "retirada"; valor: number; motivo: string };
  checkin?: { sabado: string; campos: Record<string, string | number> };
  meta?: { chave: string; valor: number; anterior: number };
};

export type SaidaFerramenta = { paraModelo: unknown; proposta?: Proposta };

function arred(v: number): number {
  return Math.round((v || 0) * 100) / 100;
}

function hojeDe(estado: EstadoAgente): Date {
  return parse(estado.hoje);
}

function satOnOrBefore(d: Date): Date {
  return addDays(d, -((d.getDay() + 1) % 7));
}

function acordosNo(estado: EstadoAgente, mes: string): number {
  let t = 0;
  for (const a of estado.acordos) {
    if (!a.inicio || !(num(a.n) > 0)) continue;
    const p = a.inicio.split("-");
    const m = mes.split("-");
    const k = (+m[0] - +p[0]) * 12 + (+m[1] - +p[1]);
    if (k >= 0 && k < num(a.n)) t += num(a.valor);
  }
  return arred(t);
}

function patrimonio(estado: EstadoAgente): number {
  const s = estado.saldos;
  const outras = estado.outrasContas.reduce((t, c) => t + num(c.saldo), 0);
  return arred(num(s.reserva) + num(s.lance) + num(s.apto) + num(s.carro) + num(s.arcaInvestir) + num(s.A) + num(s.R) + num(s.C) + num(s.I) + outras);
}

function fase(estado: EstadoAgente): { nome: string; detalhe: string } {
  const s = estado.saldos;
  const c = estado.cfg;
  const lanceOk = num(s.lance) >= num(c.lanceMeta) && num(c.lanceMeta) > 0;
  const resOk = num(c.reservaMeta) > 0 && num(s.reserva) >= num(c.reservaMeta);
  if (num(c.aptoMeta) > 0 && num(s.apto) >= num(c.aptoMeta)) return { nome: "Fase 3: Liberdade", detalhe: "Apartamento conquistado. ARCA é o motor." };
  if (lanceOk && resOk) return { nome: "Fase 2: Crescimento", detalhe: "Hora de abastecer a caixinha Apartamento." };
  return { nome: "Fase 1: Construção", detalhe: lanceOk ? "Lance completo. Enchendo a reserva." : "Construindo o lance e a reserva." };
}

function habito(estado: EstadoAgente) {
  const ds = Object.keys(estado.checkins).sort();
  if (!ds.length) return { sequencia_atual: 0, melhor_sequencia: 0, checkins: 0 };
  let best = 1;
  let cur = 1;
  for (let i = 1; i < ds.length; i++) {
    const g = diasEntre(parse(ds[i - 1]), parse(ds[i]));
    cur = g === 7 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  const last = parse(ds[ds.length - 1]);
  const ref = satOnOrBefore(hojeDe(estado));
  const atual = diasEntre(last, ref) > 7 ? 0 : cur;
  return { sequencia_atual: atual, melhor_sequencia: best, checkins: ds.length };
}

function livre(estado: EstadoAgente): number {
  const mes = estado.hoje.slice(0, 7);
  return arred(Math.max(0, num(estado.cfg.entrada) - num(estado.cfg.consorcio) - acordosNo(estado, mes)));
}

function rm(taxa: number): number {
  return Math.pow(1 + taxa, 1 / 12) - 1;
}

function fv(pmt: number, months: number, pv: number, taxa: number): number | null {
  const r = rm(taxa);
  if (!(r > 0)) return null;
  return arred(pv * Math.pow(1 + r, months) + (pmt * (Math.pow(1 + r, months) - 1)) / r);
}

function fiiDoMes(mes: string): string {
  const p = mes.split("-");
  const k = ((+p[0] - 2026) * 12 + (+p[1] - 10)) % 4;
  return FIIS[(k + 4) % 4];
}

function arcaAlloc(estado: EstadoAgente): number[] {
  const s = estado.saldos;
  const amt = num(s.arcaInvestir);
  const letras = ["A", "R", "C", "I"];
  const tot = num(s.A) + num(s.R) + num(s.C) + num(s.I) + amt;
  const tgt = tot / 4;
  const def = letras.map((k) => Math.max(0, tgt - num(s[k])));
  const sd = def.reduce((a, b) => a + b, 0);
  return letras.map((_, i) => arred(sd <= 0 ? amt / 4 : (amt * def[i]) / sd));
}

function ritmoSemanal(estado: EstadoAgente, id: string): number {
  const hoje = hojeDe(estado);
  if (id === "lance" || id === "reserva" || id === "arcaInvestir") {
    const chave = id === "arcaInvestir" ? "arca" : id;
    let d = satOnOrAfter(hoje);
    for (let i = 0; i < 6; i++) {
      const cyc = cycleOf(d);
      if (cyc.idx !== 0 && cyc.sats.length) {
        let soma = 0;
        for (const s of cyc.sats) {
          const plano = planoDoSabado(estado, s);
          soma += plano.alloc[chave as "lance" | "reserva" | "arca"] || 0;
        }
        const v = soma / cyc.sats.length;
        if (v > 0) return v;
      }
      d = addDays(d, 7);
    }
    return 0;
  }
  const corte = ymd(addDays(hoje, -28));
  let soma = 0;
  for (const m of estado.caixinhasMov) {
    if (m.caixinha === id && m.tipo === "deposito" && (m.data || "") >= corte) soma += num(m.valor);
  }
  return soma / 4;
}

function impactoDias(estado: EstadoAgente, id: string, valor: number): number | null {
  const ritmo = ritmoSemanal(estado, id);
  if (!(ritmo > 0)) return null;
  return Math.max(1, Math.round((valor / ritmo) * 7));
}

function getOverview(estado: EstadoAgente): unknown {
  const hoje = hojeDe(estado);
  const prox = satOnOrAfter(hoje);
  const plano = planoDoSabado(estado, prox);
  const f = fase(estado);
  return {
    hoje: estado.hoje,
    fase: f.nome,
    fase_detalhe: f.detalhe,
    patrimonio: patrimonio(estado),
    patrimonio_texto: reais(patrimonio(estado)),
    sobra_do_mes: livre(estado),
    sobra_do_mes_texto: reais(livre(estado)),
    habito: habito(estado),
    proximo_sabado: ymd(prox),
    sabado_de_aluguel: plano.aluguel,
    cascata: plano.aluguel ? null : plano.idx,
    valores_do_sabado: plano.aluguel
      ? "O pagamento vai para o aluguel. Sem aporte nas caixinhas."
      : {
          consorcio: arred(plano.alloc.consorcio),
          acordos: arred(plano.alloc.acordos),
          lance: arred(plano.alloc.lance),
          reserva: arred(plano.alloc.reserva),
          arca: arred(plano.alloc.arca),
        },
    conferencia: estado.conferencia?.data || null,
  };
}

function getCaixinhas(estado: EstadoAgente): unknown {
  const metas: Record<string, number> = {
    reserva: num(estado.cfg.reservaMeta),
    lance: num(estado.cfg.lanceMeta),
    apto: num(estado.cfg.aptoMeta),
    carro: num(estado.cfg.carroMeta),
    arcaInvestir: 0,
  };
  const hoje = hojeDe(estado);
  return {
    caixinhas: Object.keys(CAIXAS).map((id) => ({
      id,
      nome: CAIXAS[id],
      saldo: arred(num(estado.saldos[id])),
      saldo_texto: reais(num(estado.saldos[id])),
      meta: id === "arcaInvestir" ? null : metas[id] > 0 ? metas[id] : null,
      dias_parada: id === "arcaInvestir" ? diasArcaParada(estado, hoje) : null,
    })),
    regra: "ARCA – a investir é passagem e deve zerar toda semana.",
  };
}

function corteDe(period: string, hoje: Date): string | null {
  if (period === "tudo") return null;
  if (period === "ano") return hoje.getFullYear() + "-01-01";
  const dias = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  return ymd(addDays(hoje, -dias));
}

function getMovements(estado: EstadoAgente, entrada: Record<string, unknown>): unknown {
  const id = typeof entrada.caixinha === "string" ? entrada.caixinha : "";
  if (id && !CAIXAS[id]) return { erro: "Caixinha desconhecida." };
  const period = ["7d", "30d", "90d", "ano", "tudo"].includes(String(entrada.period)) ? String(entrada.period) : "30d";
  const corte = corteDe(period, hojeDe(estado));
  const lista = estado.caixinhasMov
    .filter((m) => m.data && (!id || m.caixinha === id) && (!corte || m.data >= corte) && m.data <= estado.hoje)
    .slice()
    .sort((a, b) => ((a.data || "") < (b.data || "") ? 1 : -1));
  let depositos = 0;
  let retiradas = 0;
  for (const m of lista) {
    if (m.tipo === "deposito") depositos += num(m.valor);
    if (m.tipo === "retirada") retiradas += num(m.valor);
  }
  return {
    caixinha: id ? CAIXAS[id] : "todas",
    periodo: period,
    quantidade: lista.length,
    soma_depositos: arred(depositos),
    soma_depositos_texto: reais(depositos),
    soma_retiradas: arred(retiradas),
    soma_retiradas_texto: reais(retiradas),
    movimentos: lista.slice(0, 30).map((m) => ({
      caixinha: CAIXAS[m.caixinha || ""] || m.caixinha,
      tipo: m.tipo,
      valor: arred(num(m.valor)),
      valor_texto: reais(num(m.valor)),
      data: m.data,
      motivo: m.motivo || "",
      origem: m.origem || "",
    })),
  };
}

function getArca(estado: EstadoAgente): unknown {
  const s = estado.saldos;
  const tot = num(s.A) + num(s.R) + num(s.C) + num(s.I);
  const al = arcaAlloc(estado);
  const letras = [
    { id: "A", nome: "Ações BR", papel: "BOVA11" },
    { id: "R", nome: "Fundos imobiliários", papel: fiiDoMes(estado.hoje.slice(0, 7)) },
    { id: "C", nome: "Caixa", papel: "Tesouro IPCA+ 2035" },
    { id: "I", nome: "Internacional", papel: "IVVB11" },
  ];
  const hoje = hojeDe(estado);
  return {
    a_investir: arred(num(s.arcaInvestir)),
    a_investir_texto: reais(num(s.arcaInvestir)),
    dias_parada: diasArcaParada(estado, hoje),
    total_investido: arred(tot),
    total_investido_texto: reais(tot),
    faixa: tot < LIMITES.bandaCarteiraMin ? "Carteira abaixo de R$ 4.000. A regra dos 6 meses ainda não vale." : "Dentro ou fora de 15%–35%.",
    letras: letras.map((L, i) => {
      const pc = tot > 0 ? (num(s[L.id]) / tot) * 100 : 0;
      const desde = estado.bandaFora[L.id];
      const dias = desde ? Math.max(0, diasEntre(parse(desde), hoje)) : 0;
      const fora = tot >= LIMITES.bandaCarteiraMin && (pc < LIMITES.bandaMin || pc > LIMITES.bandaMax);
      return {
        letra: L.id,
        nome: L.nome,
        papel_do_aporte: L.papel,
        saldo: arred(num(s[L.id])),
        percentual: tot > 0 ? Math.round(pc * 10) / 10 : null,
        comprar_agora: al[i],
        comprar_agora_texto: reais(al[i]),
        fora_da_faixa: fora,
        dias_fora: fora ? dias : 0,
        pode_vender: !!(fora && dias >= LIMITES.bandaMesesParaVender),
      };
    }),
    dividendos_recebidos: arred(num(s.dividendos)),
    posicoes: estado.ativos.filter((a) => num(a.qtd) > 0).map((a) => ({ codigo: a.t, letra: a.l || "fora da ARCA", cotas: num(a.qtd) })),
  };
}

function getCheckins(estado: EstadoAgente, entrada: Record<string, unknown>): unknown {
  const n = Math.min(12, Math.max(1, Math.round(num(entrada.n) || 4)));
  const chaves = Object.keys(estado.checkins).sort().slice(-n).reverse();
  return {
    quantidade: chaves.length,
    checkins: chaves.map((k) => ({ sabado: k, ...estado.checkins[k] })),
  };
}

function getBusiness(estado: EstadoAgente): unknown {
  const corte = ymd(addDays(hojeDe(estado), -30));
  const nomes = estado.negocios.length ? estado.negocios : Array.from(new Set(estado.movs.map((m) => m.neg || "").filter(Boolean)));
  const itens = nomes.map((nome) => {
    let inv = 0;
    let ret = 0;
    let ret30 = 0;
    let teve30 = false;
    for (const m of estado.movs) {
      if (m.neg !== nome) continue;
      if (m.tipo === "inv") inv += num(m.valor);
      else ret += num(m.valor);
      if ((m.data || "") >= corte) {
        teve30 = true;
        if (m.tipo === "ret") ret30 += num(m.valor);
      }
    }
    return {
      nome,
      investido: arred(inv),
      investido_texto: reais(inv),
      retorno: arred(ret),
      retorno_texto: reais(ret),
      saldo: arred(ret - inv),
      saldo_texto: reais(ret - inv),
      retorno_30_dias: arred(teve30 ? ret30 : ret),
      usou_janela_de_30_dias: teve30,
    };
  });
  const tot = itens.reduce((a, b) => ({ inv: a.inv + b.investido, ret: a.ret + b.retorno }), { inv: 0, ret: 0 });
  return {
    investido: arred(tot.inv),
    retorno: arred(tot.ret),
    saldo: arred(tot.ret - tot.inv),
    negocios: itens,
    degraus: "R$ 1.000, R$ 5.000, R$ 10.000 e R$ 20.000 por mês. Um ou dois negócios de cada vez.",
  };
}

function getInsights(estado: EstadoAgente): unknown {
  const lista = priorizar(gerarInsights(estado, hojeDe(estado)), 5);
  return {
    insights: lista.map((i) => ({ id: i.id, gravidade: i.severity, titulo: i.title, detalhe: i.detail })),
  };
}

function anoDe(hoje: Date, anos: number | null): number | null {
  if (anos == null || !Number.isFinite(anos)) return null;
  return new Date(hoje.getFullYear(), hoje.getMonth() + Math.round(Math.max(0, anos) * 12), 1).getFullYear();
}

function simulate(estado: EstadoAgente, entrada: Record<string, unknown>): unknown {
  if (entrada.extra_income == null || entrada.monthly_contribution == null || entrada.real_rate == null) {
    return { erro: "Faltam extra_income, monthly_contribution e real_rate." };
  }
  const extra = num(entrada.extra_income);
  let aporte = num(entrada.monthly_contribution);
  let taxa = num(entrada.real_rate);
  if (taxa > 1) taxa = taxa / 100;
  if (extra < 0 || aporte < 0 || !(taxa > 0) || taxa > 0.2) return { erro: "Cenário fora do intervalo. Taxa real entre 0 e 20% ao ano." };
  const hoje = hojeDe(estado);
  const pHoje = livre(estado);
  const pCena = arred(aporte + extra);
  const taxaHoje = num(estado.cfg.taxa) || 0.05;
  const patr = patrimonio(estado);
  const idade = num(estado.cfg.idade) || 33;
  function bloco(nome: string, saldo: number, meta: number) {
    const a = nperAnos(pHoje, saldo, meta, taxaHoje);
    const b = nperAnos(pCena, saldo, meta, taxa);
    return {
      nome,
      ano_hoje: anoDe(hoje, a),
      ano_cenario: anoDe(hoje, b),
      idade_hoje: a == null ? null : Math.round(idade + Math.max(0, a)),
      idade_cenario: b == null ? null : Math.round(idade + Math.max(0, b)),
    };
  }
  function rico(meses: number) {
    return { hoje: fv(pHoje, meses, patr, taxaHoje), cenario: fv(pCena, meses, patr, taxa) };
  }
  return {
    sobra_hoje: pHoje,
    sobra_hoje_texto: reais(pHoje),
    aporte_do_cenario: pCena,
    aporte_do_cenario_texto: reais(pCena),
    taxa_hoje: taxaHoje,
    taxa_cenario: taxa,
    primeiro_milhao: bloco("Primeiro milhão", patr, num(estado.cfg.metaMilhao) || 1000000),
    apartamento: bloco("Apartamento", num(estado.saldos.apto), num(estado.cfg.aptoMeta)),
    carro: bloco("Carro dos sonhos", num(estado.saldos.carro), num(estado.cfg.carroMeta)),
    patrimonio_10_anos: rico(120),
    patrimonio_20_anos: rico(240),
    aviso: "Direção, não promessa.",
  };
}

function metaDoDesejo(estado: EstadoAgente): string {
  const f = fase(estado).nome;
  if (f.startsWith("Fase 2")) return "o apartamento";
  if (f.startsWith("Fase 3")) return "o primeiro milhão";
  if (num(estado.saldos.lance) < num(estado.cfg.lanceMeta)) return "o lance";
  return "a reserva";
}

function purchase(estado: EstadoAgente, entrada: Record<string, unknown>): unknown {
  const valor = num(entrada.value);
  if (!(valor > 0)) return { erro: "Informe o valor da compra." };
  const renda = num(estado.cfg.rendaLiquida);
  const horasMes = num(estado.cfg.horasMes);
  const sobra = livre(estado);
  const taxa = num(estado.cfg.taxa) || 0.05;
  const atraso = sobra > 0 ? arred((valor * 30) / sobra) : null;
  const em10 = fv(0, 120, valor, taxa);
  if (!(renda > 0) || !(horasMes > 0)) {
    return {
      valor: arred(valor),
      valor_texto: reais(valor),
      horas: null,
      dias_de_trabalho: null,
      atraso_em_dias: atraso,
      meta_atrasada: metaDoDesejo(estado),
      valor_em_10_anos: em10,
      aviso: "Renda líquida ou horas do mês ainda não estão no portal. Sem isso não dá para traduzir em horas de trabalho.",
    };
  }
  const horas = valor / (renda / horasMes);
  return {
    valor: arred(valor),
    valor_texto: reais(valor),
    horas: Math.round(horas * 10) / 10,
    dias_de_trabalho: Math.round((horas / (horasMes / 30)) * 10) / 10,
    atraso_em_dias: atraso,
    meta_atrasada: metaDoDesejo(estado),
    valor_em_10_anos: em10,
    valor_em_10_anos_texto: em10 == null ? null : reais(em10),
  };
}

function proposeMovement(estado: EstadoAgente, entrada: Record<string, unknown>): SaidaFerramenta {
  const caixinha = String(entrada.caixinha || "");
  const tipo = entrada.tipo === "retirada" ? "retirada" : entrada.tipo === "deposito" ? "deposito" : "";
  const valor = arred(num(entrada.valor));
  const motivo = String(entrada.motivo || "").trim().slice(0, 120);
  if (!CAIXAS[caixinha] || !tipo || !(valor > 0) || valor > 1000000) {
    return { paraModelo: { erro: "Movimento inválido. Use uma caixinha do portal, depósito ou retirada, e um valor acima de zero." } };
  }
  if (tipo === "retirada" && caixinha !== "arcaInvestir" && !motivo) {
    return { paraModelo: { erro: "Retirada precisa de motivo." } };
  }
  if (tipo === "retirada" && valor > num(estado.saldos[caixinha]) + 0.001) {
    return { paraModelo: { erro: "O valor passa do saldo de " + reais(num(estado.saldos[caixinha])) + "." } };
  }
  const dias = tipo === "retirada" ? impactoDias(estado, caixinha, valor) : null;
  const acao = tipo === "deposito" ? "Depósito" : "Retirada";
  let detalhe = acao + " de " + reais(valor) + " em " + CAIXAS[caixinha] + ".";
  if (motivo) detalhe += " Motivo: " + motivo + ".";
  if (tipo === "retirada") {
    detalhe += dias == null ? " Não dá para estimar o atraso: ainda não há um ritmo semanal." : " No ritmo desta semana, isso atrasa a meta em " + dias + " " + (dias === 1 ? "dia" : "dias") + ".";
  }
  const proposta: Proposta = {
    tipo: "movimento",
    titulo: acao + " na " + CAIXAS[caixinha],
    detalhe,
    movimento: { caixinha, tipo, valor, motivo },
  };
  return { paraModelo: { aguardando_confirmacao: true, resumo: detalhe }, proposta };
}

const CAMPOS_CHECKIN = ["gastos", "extra", "mexeu", "motivo", "negocios", "vitoria", "escorreguei", "foraNormal", "extraOrigem"] as const;

function proposeCheckin(estado: EstadoAgente, entrada: Record<string, unknown>): SaidaFerramenta {
  const bruto = entrada.fields && typeof entrada.fields === "object" ? (entrada.fields as Record<string, unknown>) : entrada;
  const campos: Record<string, string | number> = {};
  for (const k of CAMPOS_CHECKIN) {
    if (bruto[k] == null || bruto[k] === "") continue;
    if (k === "gastos" || k === "extra") campos[k] = arred(num(bruto[k]));
    else if (k === "mexeu") campos[k] = bruto[k] === "sim" ? "sim" : "não";
    else campos[k] = String(bruto[k]).trim().slice(0, 400);
  }
  if (!Object.keys(campos).length) return { paraModelo: { erro: "O check-in veio vazio." } };
  const sabado = ymd(satOnOrBefore(hojeDe(estado)));
  const partes = Object.keys(campos).map((k) => k + ": " + (k === "gastos" || k === "extra" ? reais(num(campos[k])) : campos[k]));
  const detalhe = "Check-in de " + sabado + ". " + partes.join(". ") + ".";
  const proposta: Proposta = { tipo: "checkin", titulo: "Check-in do sábado", detalhe, checkin: { sabado, campos } };
  return { paraModelo: { aguardando_confirmacao: true, resumo: detalhe }, proposta };
}

function proposeGoal(estado: EstadoAgente, entrada: Record<string, unknown>): SaidaFerramenta {
  const chave = String(entrada.goal || "");
  const valor = arred(num(entrada.value));
  if (!METAS[chave] || !(valor > 0) || valor > 100000000) {
    return { paraModelo: { erro: "Meta desconhecida ou valor inválido." } };
  }
  const anterior = num(estado.cfg[chave as keyof EstadoAgente["cfg"]]);
  const detalhe = "A meta de " + METAS[chave] + " passa de " + reais(anterior) + " para " + reais(valor) + ".";
  const proposta: Proposta = { tipo: "meta", titulo: "Mudar a meta", detalhe, meta: { chave, valor, anterior } };
  return { paraModelo: { aguardando_confirmacao: true, resumo: detalhe }, proposta };
}

export function executarFerramenta(nome: string, entrada: Record<string, unknown>, estado: EstadoAgente): SaidaFerramenta {
  const args = entrada || {};
  if (nome === "get_overview") return { paraModelo: getOverview(estado) };
  if (nome === "get_caixinhas") return { paraModelo: getCaixinhas(estado) };
  if (nome === "get_movements") return { paraModelo: getMovements(estado, args) };
  if (nome === "get_arca") return { paraModelo: getArca(estado) };
  if (nome === "get_checkins") return { paraModelo: getCheckins(estado, args) };
  if (nome === "get_business") return { paraModelo: getBusiness(estado) };
  if (nome === "get_insights") return { paraModelo: getInsights(estado) };
  if (nome === "simulate_scenario") return { paraModelo: simulate(estado, args) };
  if (nome === "calculate_purchase_impact") return { paraModelo: purchase(estado, args) };
  if (nome === "propose_movement") return proposeMovement(estado, args);
  if (nome === "propose_checkin") return proposeCheckin(estado, args);
  if (nome === "propose_goal_change") return proposeGoal(estado, args);
  return { paraModelo: { erro: "Ferramenta desconhecida." } };
}

const vazio = { type: "object", properties: {}, additionalProperties: false };

export const FERRAMENTAS = [
  { name: "get_overview", description: "Fase, patrimônio, hábito e o plano exato do próximo sábado. Números já calculados.", input_schema: vazio },
  { name: "get_caixinhas", description: "Saldo e meta de cada caixinha, e há quantos dias a ARCA – a investir está parada.", input_schema: vazio },
  {
    name: "get_movements",
    description: "Movimentos de caixinha já somados no período. Não recalcule a soma.",
    input_schema: {
      type: "object",
      properties: {
        caixinha: { type: "string", enum: ["reserva", "lance", "apto", "carro", "arcaInvestir"] },
        period: { type: "string", enum: ["7d", "30d", "90d", "ano", "tudo"] },
      },
      additionalProperties: false,
    },
  },
  { name: "get_arca", description: "Letras da ARCA, percentuais, o que comprar agora e se alguma letra pode ser vendida.", input_schema: vazio },
  {
    name: "get_checkins",
    description: "Últimos check-ins. n é quantos, no máximo 12.",
    input_schema: { type: "object", properties: { n: { type: "integer" } }, additionalProperties: false },
  },
  { name: "get_business", description: "Investido, retorno e saldo de cada negócio, já calculados.", input_schema: vazio },
  { name: "get_insights", description: "O que importa agora, já ordenado. Explique, não recalcule.", input_schema: vazio },
  {
    name: "simulate_scenario",
    description: "Projeção do cenário. extra_income e monthly_contribution em reais por mês. real_rate é a taxa real ao ano, por exemplo 0.05.",
    input_schema: {
      type: "object",
      properties: {
        extra_income: { type: "number" },
        monthly_contribution: { type: "number" },
        real_rate: { type: "number" },
      },
      required: ["extra_income", "monthly_contribution", "real_rate"],
      additionalProperties: false,
    },
  },
  {
    name: "calculate_purchase_impact",
    description: "Horas de trabalho, atraso da meta e valor em 10 anos de uma compra. value em reais.",
    input_schema: { type: "object", properties: { value: { type: "number" } }, required: ["value"], additionalProperties: false },
  },
  {
    name: "propose_movement",
    description: "Prepara um depósito ou retirada. Não grava. O Tiago confirma na tela.",
    input_schema: {
      type: "object",
      properties: {
        caixinha: { type: "string", enum: ["reserva", "lance", "apto", "carro", "arcaInvestir"] },
        tipo: { type: "string", enum: ["deposito", "retirada"] },
        valor: { type: "number" },
        motivo: { type: "string" },
      },
      required: ["caixinha", "tipo", "valor"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_checkin",
    description: "Prepara o check-in do sábado atual. Não grava. Passe os campos em fields.",
    input_schema: {
      type: "object",
      properties: {
        fields: {
          type: "object",
          properties: {
            gastos: { type: "number" },
            extra: { type: "number" },
            mexeu: { type: "string" },
            motivo: { type: "string" },
            negocios: { type: "string" },
            vitoria: { type: "string" },
            escorreguei: { type: "string" },
            foraNormal: { type: "string" },
            extraOrigem: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      required: ["fields"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_goal_change",
    description: "Prepara a troca de uma meta. Não grava. goal: reservaMeta, lanceMeta, aptoMeta, carroMeta ou lanceMensal.",
    input_schema: {
      type: "object",
      properties: {
        goal: { type: "string", enum: ["reservaMeta", "lanceMeta", "aptoMeta", "carroMeta", "lanceMensal"] },
        value: { type: "number" },
      },
      required: ["goal", "value"],
      additionalProperties: false,
    },
  },
];
