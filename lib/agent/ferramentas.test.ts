import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizar } from "./estado.ts";
import { executarFerramenta } from "./ferramentas.ts";
import { consumirPergunta, resetLimite } from "./limite.ts";
import { reais } from "../insights/plano.ts";
import type { EstadoAgente } from "./estado.ts";

function estado(over: Partial<EstadoAgente> = {}): EstadoAgente {
  return normalizar(
    {
      cfg: { entrada: 3000, consorcio: 0, lanceMensal: 1000, lanceMeta: 20000, reservaMeta: 0, pctReserva: 0, taxa: 0.05, idade: 33, aptoMeta: 1000000, carroMeta: 600000, rendaLiquida: 5000, horasMes: 160, ...(over.cfg || {}) },
      acordos: over.acordos || [],
      saldos: { reserva: 500, lance: 1000, apto: 0, carro: 0, arcaInvestir: 0, A: 0, R: 0, C: 0, I: 0, ...(over.saldos || {}) },
      aportes: over.aportes || {},
      checkins: over.checkins || {},
      caixinhasMov: over.caixinhasMov || [],
      bandaFora: over.bandaFora || {},
      outrasContas: over.outrasContas || [],
      negocios: over.negocios || ["Loja"],
      movs: over.movs || [],
      ativos: over.ativos || [],
      conferencia: over.conferencia || null,
    },
    over.hoje || "2026-10-02"
  );
}

describe("leitura", () => {
  it("get_caixinhas lista as cinco caixinhas com o saldo calculado", () => {
    const saida = executarFerramenta("get_caixinhas", {}, estado());
    const lista = (saida.paraModelo as { caixinhas: { nome: string; saldo_texto: string }[] }).caixinhas;
    assert.deepEqual(
      lista.map((c) => c.nome),
      ["Reserva de Emergência", "Lance CB650R", "Apartamento", "Carro dos sonhos", "ARCA – a investir"]
    );
    assert.equal(lista[0].saldo_texto, reais(500));
    assert.equal(saida.proposta, undefined);
  });

  it("get_overview no sábado de aluguel não inventa aporte", () => {
    const visao = executarFerramenta("get_overview", {}, estado({ hoje: "2026-10-02" })).paraModelo as { sabado_de_aluguel: boolean; proximo_sabado: string };
    assert.equal(visao.proximo_sabado, "2026-10-03");
    assert.equal(visao.sabado_de_aluguel, true);
  });

  it("get_movements soma só a Reserva no ano e ignora cascata de outra caixinha", () => {
    const e = estado({
      hoje: "2026-10-02",
      caixinhasMov: [
        { caixinha: "reserva", tipo: "retirada", valor: 80, data: "2026-03-01", origem: "manual", motivo: "médico" },
        { caixinha: "reserva", tipo: "retirada", valor: 20, data: "2026-08-01", origem: "manual" },
        { caixinha: "lance", tipo: "retirada", valor: 999, data: "2026-08-01", origem: "manual" },
        { caixinha: "reserva", tipo: "retirada", valor: 50, data: "2025-12-01", origem: "manual" },
      ],
    });
    const mov = executarFerramenta("get_movements", { caixinha: "reserva", period: "ano" }, e).paraModelo as { soma_retiradas: number };
    assert.equal(mov.soma_retiradas, 100);
  });

  it("get_insights devolve o sábado sem passar pela conta do modelo", () => {
    const ins = executarFerramenta("get_insights", {}, estado()).paraModelo as { insights: { id: string }[] };
    assert.ok(ins.insights.some((i) => i.id.startsWith("sabado-")));
  });

  it("get_business separa investido e retorno", () => {
    const e = estado({
      movs: [
        { neg: "Loja", tipo: "inv", valor: 200, data: "2026-09-01" },
        { neg: "Loja", tipo: "ret", valor: 50, data: "2026-09-20" },
      ],
    });
    const neg = executarFerramenta("get_business", {}, e).paraModelo as { saldo: number; negocios: { retorno_30_dias: number }[] };
    assert.equal(neg.saldo, -150);
    assert.equal(neg.negocios[0].retorno_30_dias, 50);
  });

  it("calculate_purchase_impact usa renda e sobra, e não grava", () => {
    const e = estado();
    const antes = JSON.stringify(e);
    const compra = executarFerramenta("calculate_purchase_impact", { value: 160 }, e).paraModelo as { horas: number; atraso_em_dias: number };
    assert.equal(compra.horas, 5.1);
    assert.ok(compra.atraso_em_dias > 0);
    assert.equal(JSON.stringify(e), antes);
  });

  it("simulate_scenario devolve anos calculados", () => {
    const cena = executarFerramenta(
      "simulate_scenario",
      { extra_income: 0, monthly_contribution: 3000, real_rate: 0.05 },
      estado()
    ).paraModelo as { primeiro_milhao: { ano_hoje: number | null; ano_cenario: number | null }; aviso: string };
    assert.equal(typeof cena.primeiro_milhao.ano_hoje, "number");
    assert.equal(typeof cena.primeiro_milhao.ano_cenario, "number");
    assert.match(cena.aviso, /não promessa/);
  });
});

describe("propostas", () => {
  it("propose_movement devolve o cartão e não mexe no saldo", () => {
    const e = estado();
    const saida = executarFerramenta("propose_movement", { caixinha: "reserva", tipo: "deposito", valor: 300, motivo: "sobra" }, e);
    assert.equal(e.saldos.reserva, 500);
    assert.equal(saida.proposta?.tipo, "movimento");
    assert.equal(saida.proposta?.movimento?.valor, 300);
    assert.match(saida.proposta?.detalhe || "", /300/);
    assert.equal((saida.paraModelo as { aguardando_confirmacao: boolean }).aguardando_confirmacao, true);
  });

  it("recusa retirada maior que o saldo e retirada sem motivo", () => {
    const e = estado();
    const alta = executarFerramenta("propose_movement", { caixinha: "reserva", tipo: "retirada", valor: 800, motivo: "médico" }, e);
    assert.equal(alta.proposta, undefined);
    assert.match(JSON.stringify(alta.paraModelo), /passa do saldo/);
    const sem = executarFerramenta("propose_movement", { caixinha: "lance", tipo: "retirada", valor: 10 }, e);
    assert.equal(sem.proposta, undefined);
  });

  it("propose_checkin marca o sábado da semana e não grava", () => {
    const e = estado({ hoje: "2026-10-02" });
    const saida = executarFerramenta("propose_checkin", { fields: { gastos: 120, vitoria: "Fechei a semana" } }, e);
    assert.equal(saida.proposta?.checkin?.sabado, "2026-09-26");
    assert.equal(saida.proposta?.checkin?.campos.gastos, 120);
    assert.equal(Object.keys(e.checkins).length, 0);
  });

  it("propose_goal_change mostra o valor anterior e o novo", () => {
    const e = estado({ cfg: { reservaMeta: 1000 } });
    const saida = executarFerramenta("propose_goal_change", { goal: "reservaMeta", value: 2500 }, e);
    assert.equal(e.cfg.reservaMeta, 1000);
    assert.equal(saida.proposta?.meta?.anterior, 1000);
    assert.equal(saida.proposta?.meta?.valor, 2500);
    assert.match(saida.proposta?.detalhe || "", new RegExp(reais(1000).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  it("normalizar descarta texto longo e foto", () => {
    const e = normalizar({ checkins: { "2026-10-03": { vitoria: "x".repeat(500), foto: "segredo" } }, sonhos: [{ foto: "nao" }] }, "2026-10-03");
    assert.equal(String(e.checkins["2026-10-03"].vitoria).length, 240);
    assert.equal("foto" in e.checkins["2026-10-03"], false);
    assert.equal("sonhos" in e, false);
  });
});

describe("limite diário", () => {
  it("barra a pergunta seguinte quando o teto enche", () => {
    const antes = process.env.AI_DAILY_LIMIT;
    process.env.AI_DAILY_LIMIT = "2";
    resetLimite();
    assert.equal(consumirPergunta(new Date("2026-10-02T12:00:00Z")).ok, true);
    assert.equal(consumirPergunta(new Date("2026-10-02T13:00:00Z")).ok, true);
    assert.equal(consumirPergunta(new Date("2026-10-02T14:00:00Z")).ok, false);
    if (antes == null) delete process.env.AI_DAILY_LIMIT;
    else process.env.AI_DAILY_LIMIT = antes;
    resetLimite();
  });
});
