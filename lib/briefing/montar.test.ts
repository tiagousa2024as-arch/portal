import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reais } from "../insights/plano.ts";
import { ehSabado, encaixarRelatorio, frasesSeguras, linhasMes, linhasSabado, primeiroSabadoDoMes } from "./montar.ts";
import type { EstadoBriefing } from "./montar.ts";

function dia(s: string): Date {
  const p = s.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

function base(over: Partial<EstadoBriefing> = {}): EstadoBriefing {
  return {
    cfg: { entrada: 9000, consorcio: 0, lanceMensal: 3000, lanceMeta: 20000, reservaMeta: 0, pctReserva: 0, taxa: 0.05, ...(over.cfg || {}) },
    saldos: { lance: 1000, reserva: 500, ...(over.saldos || {}) },
    aportes: over.aportes || {},
    checkins: over.checkins || {},
    feitos: over.feitos || {},
    acordos: [],
  };
}

describe("briefing", () => {
  it("sábado 3 de outubro de 2026 é o primeiro do mês e o plano é o do aluguel", () => {
    const hoje = dia("2026-10-03");
    assert.equal(ehSabado(hoje), true);
    assert.equal(primeiroSabadoDoMes(hoje), true);
    assert.equal(ehSabado(dia("2026-10-02")), false);
    assert.equal(primeiroSabadoDoMes(dia("2026-10-10")), false);
    const linhas = linhasSabado(base(), hoje);
    assert.match(linhas[0], /Hoje/);
    assert.match(linhas[0], /aluguel/);
  });

  it("o relatório soma o mês anterior, as pedras e o ritmo", () => {
    const r = linhasMes(
      base({
        aportes: {
          "2026-09-12": { lance: 100, reserva: 50, arca: 0 },
          "2026-10-10": { lance: 999 },
        },
        checkins: { "2026-09-05": { gastos: 1 }, "2026-09-12": { gastos: 1 }, "2026-10-03": { gastos: 1 } },
        feitos: { r1: "2026-09-12", lance: "2026-08-01" },
      }),
      dia("2026-10-03")
    );
    assert.equal(r.mes, "2026-09");
    assert.match(r.linhas[0], new RegExp(reais(100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(r.linhas[0], /Reserva/);
    assert.doesNotMatch(r.linhas.join(" "), /999/);
    assert.match(r.linhas[1], /2 pedras/);
    assert.match(r.linhas[2], /R\$ 1\.000 na Reserva/);
    assert.doesNotMatch(r.linhas[2], /Lance completo/);
    assert.match(r.linhas[3], /Abaixo do plano/);
    assert.match(r.linhas[3], new RegExp(reais(3000).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  it("não duplica o relatório na linha do tempo e descarta número inventado", () => {
    const item = { id: "mes-2026-09", data: "2026-10-03", titulo: "Relatório de setembro", texto: "Um mês.", foto: "" };
    const primeira = encaixarRelatorio([{ id: "t1", data: "2026-01-01", titulo: "Outro", texto: "", foto: "" }], item);
    const segunda = encaixarRelatorio(primeira, { ...item, texto: "Atualizado." });
    assert.equal(segunda?.length, 2);
    assert.equal((segunda?.[1] as { texto: string }).texto, "Atualizado.");
    assert.equal(encaixarRelatorio(null, item), null);
    assert.equal(frasesSeguras("O sábado do aluguel segue. Sem aporte.", ["Hoje o pagamento vai para o aluguel."]), "O sábado do aluguel segue. Sem aporte.");
    assert.equal(frasesSeguras("Faltam R$ 999,00.", ["Hoje o pagamento vai para o aluguel."]), "");
  });
});
