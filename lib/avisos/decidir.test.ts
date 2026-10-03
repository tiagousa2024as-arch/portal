import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reais } from "../insights/plano.ts";
import { candidatos, escolher, dentroDoDia, type PrefsAviso } from "./decidir.ts";
import type { EstadoInsights } from "../insights/types.ts";

function dia(s: string): Date {
  const p = s.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

function prefs(over: Partial<PrefsAviso> = {}): PrefsAviso {
  return { sabado: false, arca: false, contas: false, nudge: false, revisao: false, ...over };
}

function base(over: Partial<EstadoInsights> = {}): EstadoInsights {
  return {
    cfg: { entrada: 9000, consorcio: 1075.68, lanceMensal: 3000, lanceMeta: 20000, reservaMeta: 0, pctReserva: 0, taxa: 0.05, ...(over.cfg || {}) },
    saldos: { lance: 1000, reserva: 500, arcaInvestir: 0, ...(over.saldos || {}) },
    acordos: over.acordos || [
      { nome: "Zema", valor: 614.81, inicio: "2026-11", n: 2 },
      { nome: "Recovery", valor: 84.67, inicio: "2026-10", n: 47 },
    ],
    aportes: over.aportes || {},
    checkins: over.checkins || {},
  };
}

describe("avisos", () => {
  it("sábado de aluguel e cascata saem do plano, sem cotação", () => {
    const aluguel = candidatos(base(), prefs({ sabado: true }), dia("2026-10-03"));
    assert.match(aluguel[0].corpo, /aluguel/);
    assert.match(aluguel[0].corpo, /Sem aporte/);
    const cascata = candidatos(base(), prefs({ sabado: true }), dia("2026-10-10"));
    assert.match(cascata[0].corpo, /cascata/);
    assert.doesNotMatch(cascata[0].corpo, /cotação|oscil/i);
  });

  it("segunda só avisa a ARCA se houver dinheiro, e a conta é a de amanhã", () => {
    assert.equal(candidatos(base(), prefs({ arca: true }), dia("2026-10-05")).length, 0);
    const com = candidatos(base({ saldos: { arcaInvestir: 80 } }), prefs({ arca: true }), dia("2026-10-05"));
    assert.match(com[0].corpo, new RegExp(reais(80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(com[0].corpo, /passagem/);
    const contas = candidatos(base(), prefs({ contas: true }), dia("2026-10-04"));
    assert.match(contas[0].corpo, /Aluguel/);
    assert.doesNotMatch(contas[0].corpo, /Zema/);
    const recovery = candidatos(base(), prefs({ contas: true }), dia("2026-10-24"));
    assert.match(recovery[0].corpo, /Recovery/);
  });

  it("o cutucão sai uma vez e a semana para em três", () => {
    const n = candidatos(base({ checkins: { "2026-09-19": { gastos: 1 } } }), prefs({ nudge: true }), dia("2026-10-07"));
    assert.equal(n[0].id, "nudge-desde-2026-09-19");
    const deNovo = escolher(n, [{ id: n[0].id, em: "2026-10-07" }], "2026-10-08");
    assert.equal(deNovo.length, 0);
    const muitos = candidatos(base({ saldos: { arcaInvestir: 10 }, checkins: { "2026-09-12": {} } }), prefs({ sabado: true, contas: true, arca: true, nudge: true, revisao: true }), dia("2026-10-05"));
    const tres = escolher(muitos, [], "2026-10-05");
    assert.equal(tres.length <= 3, true);
    const cheio = escolher(
      [{ id: "sabado-2026-10-10", tipo: "sabado", titulo: "Seu sábado", corpo: "Hoje." }],
      [
        { id: "a", em: "2026-10-05" },
        { id: "b", em: "2026-10-06" },
        { id: "c", em: "2026-10-07" },
      ],
      "2026-10-10"
    );
    assert.equal(cheio.length, 0);
    assert.equal(dentroDoDia(7), false);
    assert.equal(dentroDoDia(8), true);
    assert.equal(dentroDoDia(21), false);
  });

  it("a checagem trimestral usa o texto do insight e não fala de preço", () => {
    const r = candidatos(base(), prefs({ revisao: true }), dia("2026-10-01"));
    assert.equal(r[0].id, "revisao-tri-2026-10");
    assert.match(r[0].corpo, /oscilação/);
    assert.doesNotMatch(r[0].corpo, /cotação/);
  });
});
