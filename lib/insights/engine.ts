import { LETRAS, LIMITES } from "./config.ts";
import {
  addDays,
  addMonths,
  diasArcaParada,
  diasEntre,
  mesLongo,
  metaMensalLance,
  nperAnos,
  num,
  parse,
  planoDoSabado,
  proximoDiaDoMes,
  reais,
  satOnOrAfter,
  ymd,
} from "./plano.ts";
import type { EstadoInsights, Insight, Severidade } from "./types.ts";

const ORDEM: Record<Severidade, number> = { importante: 0, atencao: 1, info: 2 };

const NOMES: Record<string, string> = {
  reserva: "Reserva",
  lance: "Lance",
  apto: "Apartamento",
};

export function priorizar(lista: Insight[], n = LIMITES.top): Insight[] {
  return lista
    .slice()
    .sort((a, b) => {
      const s = ORDEM[a.severity] - ORDEM[b.severity];
      if (s) return s;
      if (a.em < b.em) return -1;
      if (a.em > b.em) return 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .slice(0, n);
}

function insight(parcial: Omit<Insight, "em"> & { em?: string }, hoje: Date): Insight {
  return { ...parcial, em: parcial.em || ymd(hoje) };
}

function sabado(estado: EstadoInsights, hoje: Date): Insight {
  const prox = satOnOrAfter(hoje);
  const plano = planoDoSabado(estado, prox);
  const quando = ymd(prox) === ymd(hoje) ? "Hoje" : "No próximo sábado";
  if (plano.aluguel) {
    return insight(
      {
        id: "sabado-" + ymd(prox),
        type: "sabado",
        severity: "info",
        title: "Sábado do aluguel",
        detail: quando + " o pagamento vai para o aluguel, que vence dia " + LIMITES.aluguelDia + ". Sem aporte nas caixinhas.",
        em: ymd(prox),
        action: { rotulo: "Ver o sábado", destino: "sabado" },
      },
      hoje
    );
  }
  const partes: string[] = [];
  const rotulos: Record<string, string> = {
    consorcio: "Consórcio",
    acordos: "Acordos",
    lance: "Lance",
    reserva: "Reserva",
    arca: "ARCA",
  };
  for (const k of Object.keys(rotulos)) {
    const v = plano.alloc[k as keyof typeof plano.alloc];
    if (v > 0.004) partes.push(reais(v) + " para " + rotulos[k]);
  }
  const lista = partes.length ? partes.join(", ") + "." : "Nada a separar neste sábado.";
  return insight(
    {
      id: "sabado-" + ymd(prox),
      type: "sabado",
      severity: "info",
      title: "Cascata " + plano.idx,
      detail: quando + ", cascata " + plano.idx + ": " + lista,
      em: ymd(prox),
      action: { rotulo: "Ver o sábado", destino: "sabado" },
    },
    hoje
  );
}

function contas(estado: EstadoInsights, hoje: Date): Insight | null {
  const itens: { em: string; texto: string; perto: boolean }[] = [];
  const colocar = (data: Date, texto: string) => {
    const d = diasEntre(hoje, data);
    if (d < 0 || d > LIMITES.contasJanelaDias) return;
    itens.push({ em: ymd(data), texto, perto: d <= 1 });
  };
  colocar(proximoDiaDoMes(hoje, LIMITES.aluguelDia), "Aluguel no dia " + LIMITES.aluguelDia);
  if (num(estado.cfg?.consorcio) > 0) {
    colocar(
      proximoDiaDoMes(hoje, LIMITES.consorcioDia),
      "Consórcio " + reais(num(estado.cfg?.consorcio)) + " por volta do dia " + LIMITES.consorcioDia
    );
  }
  for (const a of estado.acordos || []) {
    const dia = LIMITES.acordosDia[(a.nome || "").trim().toLowerCase()];
    if (!dia || !a.inicio || !(num(a.n) > 0)) continue;
    const quando = proximoDiaDoMes(hoje, dia);
    const mes = ymd(quando).slice(0, 7);
    const p = a.inicio.split("-");
    const m = mes.split("-");
    const k = (+m[0] - +p[0]) * 12 + (+m[1] - +p[1]);
    if (k < 0 || k >= num(a.n)) continue;
    colocar(quando, (a.nome || "Acordo") + " " + reais(num(a.valor)) + " no dia " + dia);
  }
  if (!itens.length) return null;
  itens.sort((a, b) => (a.em < b.em ? -1 : 1));
  return insight(
    {
      id: "contas-7d",
      type: "contas",
      severity: itens.some((i) => i.perto) ? "importante" : "atencao",
      title: "Contas nos próximos 7 dias",
      detail: itens.map((i) => i.texto).join(". ") + ".",
      em: itens[0].em,
      action: { rotulo: "Ver o sábado", destino: "sabado" },
    },
    hoje
  );
}

function acordosAcabando(estado: EstadoInsights, hoje: Date): Insight[] {
  const saida: Insight[] = [];
  const reservaMeta = num(estado.cfg?.reservaMeta);
  const cheia = reservaMeta > 0 && num(estado.saldos?.reserva) >= reservaMeta;
  const destino = cheia ? "a ARCA" : "a Reserva";
  for (const a of estado.acordos || []) {
    if (!a.inicio || !(num(a.n) > 0) || !(num(a.valor) > 0)) continue;
    const p = a.inicio.split("-");
    const fim = addMonths(+p[0], +p[1], num(a.n) - 1);
    const depois = addMonths(fim.getFullYear(), fim.getMonth() + 1, 1);
    const agora = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const meses = (fim.getFullYear() - agora.getFullYear()) * 12 + (fim.getMonth() - agora.getMonth());
    if (meses < 0 || meses > 1) continue;
    const nome = a.nome || "Acordo";
    saida.push(
      insight(
        {
          id: "acordo-fim-" + nome.toLowerCase(),
          type: "acordo-fim",
          severity: "info",
          title: "O acordo " + nome + " está acabando",
          detail:
            "O acordo " +
            nome +
            " termina em " +
            mesLongo(fim) +
            ". A partir de " +
            mesLongo(depois) +
            (depois.getFullYear() !== hoje.getFullYear() ? " de " + depois.getFullYear() : "") +
            ", " +
            reais(num(a.valor)) +
            " por mês passam a ir para " +
            destino +
            ".",
          em: ymd(fim),
          action: { rotulo: "Ver acordos", destino: "ajustes" },
        },
        hoje
      )
    );
  }
  return saida;
}

function arcaParada(estado: EstadoInsights, hoje: Date): Insight | null {
  const dias = diasArcaParada(estado, hoje);
  if (dias == null || !(dias > LIMITES.arcaParadaDias)) return null;
  return insight(
    {
      id: "arca-parada",
      type: "arca-parada",
      severity: dias > 7 ? "importante" : "atencao",
      title: "ARCA – a investir ainda tem dinheiro",
      detail:
        "ARCA – a investir está com " +
        reais(num(estado.saldos?.arcaInvestir)) +
        " há " +
        dias +
        " dias. É passagem: compre no próximo dia útil.",
      action: { rotulo: "Abrir a ARCA", destino: "arca" },
    },
    hoje
  );
}

function banda(estado: EstadoInsights, hoje: Date): Insight | null {
  const s = estado.saldos || {};
  const tot = num(s.A) + num(s.R) + num(s.C) + num(s.I);
  if (tot < LIMITES.bandaCarteiraMin) return null;
  let pior: Insight | null = null;
  for (const k of ["A", "R", "C", "I"]) {
    const pc = (num(s[k]) / tot) * 100;
    const nome = LETRAS[k];
    const desde = estado.bandaFora?.[k];
    if (pc < LIMITES.bandaMin || pc > LIMITES.bandaMax) {
      const dias = desde ? Math.max(0, diasEntre(parse(desde), hoje)) : 0;
      const vender = dias >= LIMITES.bandaMesesParaVender;
      const item = insight(
        {
          id: "banda-" + k,
          type: "banda",
          severity: vender ? "importante" : "atencao",
          title: nome + " fora de " + LIMITES.bandaMin + "%–" + LIMITES.bandaMax + "%",
          detail: vender
            ? nome + " está fora da faixa há " + dias + " dias. Já faz cerca de 6 meses: pode considerar vender o excesso."
            : nome +
              " está em " +
              Math.round(pc) +
              "%, fora de " +
              LIMITES.bandaMin +
              "% a " +
              LIMITES.bandaMax +
              "%. O aporte corrige primeiro.",
          em: desde || ymd(hoje),
          action: { rotulo: "Abrir a ARCA", destino: "arca" },
        },
        hoje
      );
      if (!pior || ORDEM[item.severity] < ORDEM[pior.severity]) pior = item;
      continue;
    }
    const pertoBaixo = pc <= LIMITES.bandaMin + LIMITES.derivaPontos;
    const pertoAlto = pc >= LIMITES.bandaMax - LIMITES.derivaPontos;
    if (!pertoBaixo && !pertoAlto) continue;
    const borda = pertoBaixo ? LIMITES.bandaMin : LIMITES.bandaMax;
    const item = insight(
      {
        id: "deriva-" + k,
        type: "banda",
        severity: "info",
        title: nome + " perto do limite",
        detail: nome + " está em " + Math.round(pc) + "%, perto de " + borda + "%. O próximo aporte ainda corrige.",
        action: { rotulo: "Abrir a ARCA", destino: "arca" },
      },
      hoje
    );
    if (!pior) pior = item;
  }
  return pior;
}

function gastos(estado: EstadoInsights, hoje: Date): Insight | null {
  const chaves = Object.keys(estado.checkins || {})
    .filter((k) => num(estado.checkins?.[k]?.gastos) > 0)
    .sort();
  if (chaves.length < LIMITES.gastosSemanasMinimas + 1) return null;
  const atual = num(estado.checkins?.[chaves[chaves.length - 1]]?.gastos);
  const anteriores = chaves.slice(0, -1).slice(-LIMITES.gastosSemanasMedia);
  if (anteriores.length < LIMITES.gastosSemanasMinimas) return null;
  const media = anteriores.reduce((s, k) => s + num(estado.checkins?.[k]?.gastos), 0) / anteriores.length;
  if (!(media > 0) || atual < media * (1 + LIMITES.gastosAcima)) return null;
  const pct = Math.round((atual / media - 1) * 100);
  return insight(
    {
      id: "gastos-" + chaves[chaves.length - 1],
      type: "gastos",
      severity: "atencao",
      title: "Gastos acima do seu ritmo",
      detail:
        "Os gastos desta semana foram " +
        reais(atual) +
        ", " +
        pct +
        "% acima da sua média de " +
        anteriores.length +
        " semanas (" +
        reais(media) +
        ").",
      em: chaves[chaves.length - 1],
      action: { rotulo: "Abrir o check-in", destino: "checkin" },
    },
    hoje
  );
}

function retiradas(estado: EstadoInsights, hoje: Date): Insight | null {
  const corte = ymd(addDays(hoje, -LIMITES.retiradasJanelaDias));
  const contas = LIMITES.retiradasCaixinhas.map((id) => {
    const n = (estado.caixinhasMov || []).filter(
      (m) => m.caixinha === id && m.tipo === "retirada" && m.origem === "manual" && (m.data || "") >= corte
    ).length;
    return { id, n };
  }).filter((c) => c.n > LIMITES.retiradasAcimaDe);
  if (!contas.length) return null;
  const pior = contas.sort((a, b) => b.n - a.n)[0];
  return insight(
    {
      id: "retiradas-" + pior.id,
      type: "retiradas",
      severity: "atencao",
      title: "Mais de uma retirada da " + NOMES[pior.id],
      detail:
        NOMES[pior.id] +
        " teve " +
        pior.n +
        " retiradas manuais em " +
        LIMITES.retiradasJanelaDias +
        " dias. A cascata do sábado não entra nessa conta.",
      action: { rotulo: "Abrir caixinhas", destino: "caixinhas" },
    },
    hoje
  );
}

function nomeMes(hoje: Date, anos: number | null): string | null {
  if (anos == null || !Number.isFinite(anos)) return null;
  const d = addDays(hoje, Math.round(anos * 365.25));
  const mes = mesLongo(d);
  return d.getFullYear() === hoje.getFullYear() ? mes : mes + " de " + d.getFullYear();
}

function ritmo(estado: EstadoInsights, hoje: Date): Insight | null {
  const meta = num(estado.cfg?.lanceMeta);
  const saldo = num(estado.saldos?.lance);
  if (!(meta > saldo)) return null;
  const mensalPlano = metaMensalLance(estado, satOnOrAfter(hoje));
  if (!(mensalPlano > 0)) return null;
  const corte = ymd(addDays(hoje, -LIMITES.paceDias));
  let real = 0;
  const aportes = estado.aportes || {};
  if (!Object.keys(aportes).length) return null;
  for (const k of Object.keys(aportes)) {
    if (k < corte || k > ymd(hoje)) continue;
    real += num(aportes[k]?.lance);
  }
  const mensalReal = (real * 52) / 12 / 4;
  const taxaBruta = estado.cfg?.taxa;
  const taxa = taxaBruta == null ? 0.05 : num(taxaBruta);
  const planoAnos = nperAnos(mensalPlano, saldo, meta, taxa);
  const realAnos = nperAnos(mensalReal, saldo, meta, taxa);
  const quandoPlano = nomeMes(hoje, planoAnos);
  const quandoReal = realAnos == null ? null : nomeMes(hoje, realAnos);
  if (!quandoPlano) return null;
  if (quandoReal && quandoReal === quandoPlano) return null;
  if (realAnos != null && planoAnos != null && realAnos <= planoAnos) return null;
  const fraseReal = quandoReal ? "em " + quandoReal : "sem data, porque o aporte real parou";
  return insight(
    {
      id: "ritmo-lance",
      type: "ritmo",
      severity: "atencao",
      title: "O lance está atrás do plano",
      detail: "No ritmo real, o lance fica pronto " + fraseReal + ", não em " + quandoPlano + ".",
      action: { rotulo: "Ver o futuro", destino: "futuro" },
    },
    hoje
  );
}

function custoDeVida(estado: EstadoInsights, hoje: Date): Insight | null {
  if (num(estado.cfg?.reservaMeta) > 0) return null;
  const chaves = Object.keys(estado.checkins || {})
    .filter((k) => num(estado.checkins?.[k]?.gastos) > 0)
    .sort();
  if (chaves.length < LIMITES.reservaCheckinsMinimos) return null;
  const media = chaves.reduce((s, k) => s + num(estado.checkins?.[k]?.gastos), 0) / chaves.length;
  const sug = Math.round(media * LIMITES.semanasNoMes * LIMITES.reservaMeses);
  if (!(sug > 0)) return null;
  return insight(
    {
      id: "reserva-meta",
      type: "reserva-meta",
      severity: "info",
      title: "Dá para definir a meta da reserva",
      detail:
        "Com " +
        chaves.length +
        " semanas de gastos, o custo de vida de " +
        LIMITES.reservaMeses +
        " meses fica em cerca de " +
        reais(sug) +
        ". Nada muda até você confirmar.",
      action: { rotulo: "Definir a meta da reserva", confirmar: { chave: "reservaMeta", valor: sug } },
    },
    hoje
  );
}

function perto(valor: number, meta: number): boolean {
  return meta > 0 && valor >= meta * (1 - LIMITES.marcoPerto) && valor < meta;
}

function marcos(estado: EstadoInsights, hoje: Date): Insight | null {
  const s = estado.saldos || {};
  const lanceMeta = num(estado.cfg?.lanceMeta);
  const reservaMeta = num(estado.cfg?.reservaMeta);
  const aptoMeta = num(estado.cfg?.aptoMeta);
  const arca = num(s.A) + num(s.R) + num(s.C) + num(s.I);
  const patrimonio =
    estado.patrimonio != null
      ? num(estado.patrimonio)
      : num(s.reserva) + num(s.lance) + num(s.apto) + num(s.carro) + num(s.arcaInvestir) + arca;
  const fase3 = aptoMeta > 0 && num(s.apto) >= aptoMeta;
  const fase2 = lanceMeta > 0 && num(s.lance) >= lanceMeta && reservaMeta > 0 && num(s.reserva) >= reservaMeta;
  if (!fase3 && perto(num(s.apto), aptoMeta)) {
    return insight(
      {
        id: "fase-3",
        type: "fase",
        severity: "info",
        title: "A Fase 3 está perto",
        detail: "O apartamento está a menos de 10% da meta. Quando chegar, a liberdade começa.",
        action: { rotulo: "Ver o futuro", destino: "futuro" },
      },
      hoje
    );
  }
  const lancePerto = lanceMeta > 0 && num(s.lance) >= lanceMeta * (1 - LIMITES.marcoPerto);
  const reservaPerto = reservaMeta > 0 && num(s.reserva) >= reservaMeta * (1 - LIMITES.marcoPerto);
  if (!fase2 && !fase3 && lancePerto && reservaPerto) {
    return insight(
      {
        id: "fase-2",
        type: "fase",
        severity: "info",
        title: "A Fase 2 está perto",
        detail: "O lance e a reserva estão a menos de 10% da meta. Quando os dois encherem, começa o crescimento.",
        action: { rotulo: "Ver o futuro", destino: "futuro" },
      },
      hoje
    );
  }
  const alvos: { id: string; nome: string; valor: number; meta: number }[] = [
    { id: "reserva-1000", nome: "R$ 1.000 na Reserva", valor: num(s.reserva), meta: 1000 },
    { id: "reserva-5000", nome: "R$ 5.000 na Reserva", valor: num(s.reserva), meta: 5000 },
    { id: "lance-10000", nome: "R$ 10.000 no Lance", valor: num(s.lance), meta: 10000 },
    { id: "lance-meta", nome: "Lance completo", valor: num(s.lance), meta: lanceMeta },
    { id: "arca-10000", nome: "R$ 10.000 na ARCA", valor: arca, meta: 10000 },
    { id: "arca-50000", nome: "R$ 50.000 na ARCA", valor: arca, meta: 50000 },
    { id: "apto-10000", nome: "R$ 10.000 no Apartamento", valor: num(s.apto), meta: 10000 },
    { id: "apto-meta", nome: "Apartamento", valor: num(s.apto), meta: aptoMeta },
    { id: "patrimonio-100000", nome: "R$ 100.000 de patrimônio", valor: patrimonio, meta: 100000 },
  ];
  if (reservaMeta > 0) alvos.push({ id: "reserva-meta-marco", nome: "Reserva cheia", valor: num(s.reserva), meta: reservaMeta });
  let melhor: { id: string; nome: string; falta: number } | null = null;
  for (const a of alvos) {
    if (!perto(a.valor, a.meta)) continue;
    const falta = a.meta - a.valor;
    if (!melhor || falta < melhor.falta) melhor = { id: a.id, nome: a.nome, falta };
  }
  if (!melhor) return null;
  return insight(
    {
      id: "marco-" + melhor.id,
      type: "marco",
      severity: "info",
      title: melhor.nome + " está perto",
      detail: "Faltam " + reais(melhor.falta) + " para " + melhor.nome + ". Menos de 10% do caminho.",
      action: { rotulo: "Ver o futuro", destino: "futuro" },
    },
    hoje
  );
}

function naJanela(hoje: Date, ano: number, mes: number): boolean {
  const dia1 = new Date(ano, mes - 1, 1);
  const inicio = addDays(dia1, -LIMITES.revisaoDiasAntes);
  const fim = new Date(ano, mes - 1, LIMITES.revisaoDiasDepois);
  return hoje >= inicio && hoje <= fim;
}

function revisoes(hoje: Date): Insight[] {
  const saida: Insight[] = [];
  const anos = [hoje.getFullYear(), hoje.getFullYear() + 1];
  for (const ano of anos) {
    for (const mes of LIMITES.revisaoTrimestral) {
      if (!naJanela(hoje, ano, mes)) continue;
      saida.push(
        insight(
          {
            id: "revisao-tri-" + ano + "-" + String(mes).padStart(2, "0"),
            type: "revisao",
            severity: "info",
            title: "Checagem trimestral",
            detail: "Janeiro, abril, julho e outubro pedem uma olhada curta no plano. Sem vender por oscilação.",
            em: ymd(new Date(ano, mes - 1, 1)),
            action: { rotulo: "Ver o futuro", destino: "futuro" },
          },
          hoje
        )
      );
    }
    if (naJanela(hoje, ano, LIMITES.revisaoAnualMes)) {
      saida.push(
        insight(
          {
            id: "revisao-ano-" + ano,
            type: "revisao",
            severity: "info",
            title: "Revisão anual",
            detail: "Março é a revisão do ano, junto com o IR. Metas e ativos, sem pressa.",
            em: ymd(new Date(ano, LIMITES.revisaoAnualMes - 1, 1)),
            action: { rotulo: "Ver o futuro", destino: "futuro" },
          },
          hoje
        )
      );
    }
  }
  return saida;
}

export function gerarInsights(estado: EstadoInsights, hoje: Date): Insight[] {
  const lista: Insight[] = [sabado(estado, hoje)];
  const c = contas(estado, hoje);
  if (c) lista.push(c);
  lista.push(...acordosAcabando(estado, hoje));
  const a = arcaParada(estado, hoje);
  if (a) lista.push(a);
  const b = banda(estado, hoje);
  if (b) lista.push(b);
  const g = gastos(estado, hoje);
  if (g) lista.push(g);
  const r = retiradas(estado, hoje);
  if (r) lista.push(r);
  const ri = ritmo(estado, hoje);
  if (ri) lista.push(ri);
  const cv = custoDeVida(estado, hoje);
  if (cv) lista.push(cv);
  const m = marcos(estado, hoje);
  if (m) lista.push(m);
  lista.push(...revisoes(hoje));
  return priorizar(lista, lista.length);
}
