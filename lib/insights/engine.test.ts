import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gerarInsights, priorizar } from "./engine.ts";
import { reais } from "./plano.ts";
import type { EstadoInsights, Insight } from "./types.ts";

function dia(s: string): Date {
  const p = s.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

function base(over: Partial<EstadoInsights> = {}): EstadoInsights {
  return {
    cfg: {
      entrada: 3000,
      consorcio: 0,
      lanceMensal: 0,
      lanceMeta: 20000,
      reservaMeta: 0,
      pctReserva: 0,
      taxa: 0.05,
      aptoMeta: 80000,
      ...(over.cfg || {}),
    },
    acordos: over.acordos || [],
    saldos: over.saldos || {},
    aportes: over.aportes || {},
    checkins: over.checkins || {},
    caixinhasMov: over.caixinhasMov || [],
    bandaFora: over.bandaFora,
    patrimonio: over.patrimonio,
  };
}

function achar(lista: Insight[], type: string): Insight | undefined {
  return lista.find((i) => i.type === type);
}

describe("sábado", () => {
  it("sexta 2026-10-02 aponta o sábado do aluguel", () => {
    const item = achar(gerarInsights(base(), dia("2026-10-02")), "sabado");
    assert.ok(item);
    assert.equal(item.em, "2026-10-03");
    assert.equal(item.severity, "info");
    assert.match(item.title, /aluguel/i);
    assert.match(item.detail, /dia 5/);
    assert.equal(item.action?.destino, "sabado");
  });

  it("no próprio sábado diz hoje, não o próximo", () => {
    const item = achar(gerarInsights(base(), dia("2026-10-03")), "sabado");
    assert.ok(item);
    assert.match(item.detail, /^Hoje /);
  });

  it("domingo 2026-10-04 aponta a cascata 1 com R$ 1.000 na ARCA", () => {
    const item = achar(gerarInsights(base(), dia("2026-10-04")), "sabado");
    assert.ok(item);
    assert.equal(item.em, "2026-10-10");
    assert.match(item.title, /Cascata 1/);
    assert.ok(item.detail.includes(reais(1000)));
    assert.match(item.detail, /ARCA/);
  });
});

describe("contas", () => {
  it("junta as contas dos próximos 7 dias num único aviso", () => {
    const estado = base({
      cfg: { consorcio: 400 },
      acordos: [
        { nome: "Zema", valor: 614.81, inicio: "2026-11", n: 2 },
        { nome: "Ipanema", valor: 53.08, inicio: "2026-10", n: 18 },
      ],
    });
    const lista = gerarInsights(estado, dia("2026-11-01"));
    const contas = lista.filter((i) => i.type === "contas");
    assert.equal(contas.length, 1);
    assert.equal(contas[0].id, "contas-7d");
    assert.equal(contas[0].severity, "atencao");
    assert.ok(contas[0].detail.includes(reais(614.81)));
    assert.match(contas[0].detail, /Aluguel/);
    assert.equal(contas[0].detail.includes("Ipanema"), false);
  });

  it("sobe para importante se a conta é amanhã", () => {
    const item = achar(gerarInsights(base({ cfg: { consorcio: 400 } }), dia("2026-10-17")), "contas");
    assert.ok(item);
    assert.equal(item.severity, "importante");
    assert.match(item.detail, /Consórcio/);
  });
});

describe("acordo acabando", () => {
  it("diz o mês em que o Zema termina e para onde o dinheiro vai", () => {
    const estado = base({
      acordos: [{ nome: "Zema", valor: 614.81, inicio: "2026-11", n: 2 }],
    });
    const item = achar(gerarInsights(estado, dia("2026-11-15")), "acordo-fim");
    assert.ok(item);
    assert.match(item.detail, /termina em dezembro/);
    assert.match(item.detail, /A partir de janeiro de 2027/);
    assert.ok(item.detail.includes(reais(614.81)));
    assert.match(item.detail, /Reserva/);
  });

  it("manda para a ARCA quando a reserva já está cheia", () => {
    const estado = base({
      cfg: { reservaMeta: 1000 },
      saldos: { reserva: 1000 },
      acordos: [{ nome: "Zema", valor: 614.81, inicio: "2026-11", n: 2 }],
    });
    const item = achar(gerarInsights(estado, dia("2026-11-15")), "acordo-fim");
    assert.ok(item);
    assert.match(item.detail, /ARCA/);
  });
});

describe("ARCA parada", () => {
  it("avisa depois de 3 dias e fica importante depois de 7", () => {
    const parado = base({
      saldos: { arcaInvestir: 500 },
      caixinhasMov: [{ caixinha: "arcaInvestir", tipo: "deposito", valor: 500, data: "2026-10-01", origem: "cascata" }],
    });
    const cedo = achar(gerarInsights(parado, dia("2026-10-04")), "arca-parada");
    assert.equal(cedo, undefined);
    const atencao = achar(gerarInsights(parado, dia("2026-10-05")), "arca-parada");
    assert.ok(atencao);
    assert.equal(atencao.severity, "atencao");
    assert.equal(atencao.action?.destino, "arca");
    const grave = achar(gerarInsights(parado, dia("2026-10-10")), "arca-parada");
    assert.ok(grave);
    assert.equal(grave.severity, "importante");
  });
});

describe("faixa da ARCA", () => {
  it("não olha a faixa com carteira abaixo de 4.000", () => {
    const estado = base({ saldos: { A: 100, R: 300, C: 300, I: 300 } });
    assert.equal(achar(gerarInsights(estado, dia("2026-10-04")), "banda"), undefined);
  });

  it("marca letra fora de 15%–35%", () => {
    const estado = base({ saldos: { A: 1000, R: 3000, C: 3000, I: 3000 } });
    const item = achar(gerarInsights(estado, dia("2026-10-04")), "banda");
    assert.ok(item);
    assert.equal(item.id, "banda-A");
    assert.equal(item.severity, "atencao");
  });

  it("fala em vender só depois de cerca de 6 meses", () => {
    const estado = base({
      saldos: { A: 1000, R: 3000, C: 3000, I: 3000 },
      bandaFora: { A: "2026-04-01" },
    });
    const item = achar(gerarInsights(estado, dia("2026-10-04")), "banda");
    assert.ok(item);
    assert.equal(item.severity, "importante");
    assert.match(item.detail, /vender/i);
  });

  it("avisa quando a letra deriva para a borda, ainda dentro da faixa", () => {
    const estado = base({ saldos: { A: 1600, R: 2800, C: 2800, I: 2800 } });
    const item = achar(gerarInsights(estado, dia("2026-10-04")), "banda");
    assert.ok(item);
    assert.equal(item.id, "deriva-A");
    assert.equal(item.severity, "info");
    assert.match(item.detail, /16%/);
  });
});

describe("gastos", () => {
  it("avisa quando a semana passa de 40% da média das anteriores", () => {
    const checkins: EstadoInsights["checkins"] = {};
    for (let i = 1; i <= 4; i++) checkins["2026-09-0" + i] = { gastos: 100 };
    checkins["2026-09-12"] = { gastos: 150 };
    const item = achar(gerarInsights(base({ checkins }), dia("2026-09-12")), "gastos");
    assert.ok(item);
    assert.equal(item.severity, "atencao");
    assert.ok(item.detail.includes(reais(150)));
    assert.equal(item.action?.destino, "checkin");
  });

  it("não avisa com menos de 4 semanas anteriores", () => {
    const checkins = { "2026-09-01": { gastos: 100 }, "2026-09-08": { gastos: 200 } };
    assert.equal(achar(gerarInsights(base({ checkins }), dia("2026-09-08")), "gastos"), undefined);
  });
});

describe("retiradas", () => {
  it("conta só retirada manual e só acima de uma em 30 dias", () => {
    const uma = base({
      caixinhasMov: [
        { caixinha: "reserva", tipo: "retirada", valor: 100, data: "2026-10-01", origem: "manual" },
        { caixinha: "reserva", tipo: "retirada", valor: 50, data: "2026-10-02", origem: "cascata" },
      ],
    });
    assert.equal(achar(gerarInsights(uma, dia("2026-10-04")), "retiradas"), undefined);
    const duas = base({
      caixinhasMov: [
        { caixinha: "lance", tipo: "retirada", valor: 100, data: "2026-09-20", origem: "manual" },
        { caixinha: "lance", tipo: "retirada", valor: 80, data: "2026-10-02", origem: "manual" },
      ],
    });
    const item = achar(gerarInsights(duas, dia("2026-10-04")), "retiradas");
    assert.ok(item);
    assert.equal(item.severity, "atencao");
    assert.match(item.detail, /Lance/);
    assert.equal(item.action?.destino, "caixinhas");
  });
});

describe("ritmo", () => {
  it("não fala de ritmo sem histórico de aporte", () => {
    const estado = base({ cfg: { lanceMensal: 2000 }, saldos: { lance: 10000 } });
    assert.equal(achar(gerarInsights(estado, dia("2026-04-15")), "ritmo"), undefined);
  });

  it("mostra o mês real quando o lance atrasa", () => {
    const estado = base({
      cfg: { lanceMensal: 2000, taxa: 0.05 },
      saldos: { lance: 10000 },
      aportes: { "2026-04-04": { lance: 100, recebido: 1000 } },
    });
    const item = achar(gerarInsights(estado, dia("2026-04-15")), "ritmo");
    assert.ok(item);
    assert.equal(item.severity, "atencao");
    assert.match(item.detail, /^No ritmo real, o lance fica pronto em /);
    assert.match(item.detail, /, não em /);
    assert.equal(item.action?.destino, "futuro");
  });

  it("não avisa quando o ritmo real não está atrás", () => {
    const estado = base({
      cfg: { lanceMensal: 500 },
      saldos: { lance: 10000 },
      aportes: { "2026-04-04": { lance: 2000, recebido: 2000 } },
    });
    assert.equal(achar(gerarInsights(estado, dia("2026-04-15")), "ritmo"), undefined);
  });
});

describe("meta da reserva", () => {
  it("sugere a meta e não grava", () => {
    const checkins: EstadoInsights["checkins"] = {
      "2026-09-05": { gastos: 100 },
      "2026-09-12": { gastos: 100 },
      "2026-09-19": { gastos: 100 },
      "2026-09-26": { gastos: 100 },
    };
    const item = achar(gerarInsights(base({ checkins }), dia("2026-09-26")), "reserva-meta");
    assert.ok(item);
    assert.equal(item.action?.confirmar?.chave, "reservaMeta");
    assert.equal(item.action?.confirmar?.valor, Math.round(100 * 4.33 * 6));
    assert.equal(item.action?.destino, undefined);
  });

  it("não sugere se a meta já existe", () => {
    const checkins: EstadoInsights["checkins"] = {
      "2026-09-05": { gastos: 100 },
      "2026-09-12": { gastos: 100 },
      "2026-09-19": { gastos: 100 },
      "2026-09-26": { gastos: 100 },
    };
    const estado = base({ cfg: { reservaMeta: 3000 }, checkins });
    assert.equal(achar(gerarInsights(estado, dia("2026-09-26")), "reserva-meta"), undefined);
  });
});

describe("marcos e fase", () => {
  it("avisa o lance a menos de 10%", () => {
    const estado = base({ saldos: { lance: 19000 }, patrimonio: 19000 });
    const item = achar(gerarInsights(estado, dia("2026-10-04")), "marco");
    assert.ok(item);
    assert.equal(item.id, "marco-lance-meta");
    assert.ok(item.detail.includes(reais(1000)));
  });

  it("avisa a Fase 2 quando lance e reserva estão perto", () => {
    const estado = base({
      cfg: { reservaMeta: 10000 },
      saldos: { lance: 19000, reserva: 9500 },
      patrimonio: 28500,
    });
    const item = achar(gerarInsights(estado, dia("2026-10-04")), "fase");
    assert.ok(item);
    assert.equal(item.id, "fase-2");
  });

  it("avisa a Fase 3 quando o apartamento está perto", () => {
    const estado = base({ saldos: { apto: 72000 }, patrimonio: 72000 });
    const item = achar(gerarInsights(estado, dia("2026-10-04")), "fase");
    assert.ok(item);
    assert.equal(item.id, "fase-3");
  });
});

describe("revisões", () => {
  it("lembra a checagem trimestral em abril", () => {
    const item = gerarInsights(base(), dia("2026-04-01")).find((i) => i.id === "revisao-tri-2026-04");
    assert.ok(item);
    assert.equal(item.severity, "info");
  });

  it("lembra a revisão anual em março", () => {
    const item = gerarInsights(base(), dia("2026-03-01")).find((i) => i.id === "revisao-ano-2026");
    assert.ok(item);
    assert.match(item.detail, /IR/);
  });

  it("abre a janela de janeiro ainda em dezembro", () => {
    const item = gerarInsights(base(), dia("2026-12-20")).find((i) => i.id === "revisao-tri-2027-01");
    assert.ok(item);
  });
});

describe("priorizar", () => {
  it("ordena por gravidade, data e id, e corta em 3", () => {
    const lista: Insight[] = [
      { id: "b", type: "x", severity: "info", title: "b", detail: "b", em: "2026-01-01" },
      { id: "a", type: "x", severity: "importante", title: "a", detail: "a", em: "2026-02-01" },
      { id: "c", type: "x", severity: "atencao", title: "c", detail: "c", em: "2026-01-02" },
      { id: "d", type: "x", severity: "info", title: "d", detail: "d", em: "2026-01-01" },
    ];
    const top = priorizar(lista, 3);
    assert.deepEqual(
      top.map((i) => i.id),
      ["a", "c", "b"]
    );
  });
});
