import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizar } from "../agent/estado.ts";
import { reais } from "../insights/plano.ts";
import { validarComando } from "./validar.ts";
import type { EstadoAgente } from "../agent/estado.ts";

function estado(over: Partial<EstadoAgente> = {}): EstadoAgente {
  return normalizar(
    {
      cfg: { entrada: 9000, consorcio: 0, lanceMensal: 3000, lanceMeta: 20000, reservaMeta: 5000, pctReserva: 0, taxa: 0.05, ...(over.cfg || {}) },
      saldos: { reserva: 500, lance: 1000, apto: 0, carro: 0, arcaInvestir: 0, ...(over.saldos || {}) },
      negocios: over.negocios || ["Lojas online", "OPERO"],
      ativos: over.ativos || [{ t: "BOVA11", l: "A", qtd: 0 }],
      caixinhasMov: over.caixinhasMov || [],
      aportes: over.aportes || {},
    },
    over.hoje || "2026-10-04"
  );
}

describe("comandos", () => {
  it("guarda 300 na reserva como depósito, sem gravar", () => {
    const e = estado();
    const r = validarComando({ acao: "deposito", caixinha: "reserva", valor: 300 }, e);
    assert.equal(r.tipo, "proposta");
    if (r.tipo !== "proposta") return;
    assert.equal(r.proposta.movimento?.caixinha, "reserva");
    assert.equal(r.proposta.movimento?.tipo, "deposito");
    assert.equal(r.proposta.movimento?.valor, 300);
    assert.match(r.proposta.detalhe, /Reserva de Emergência/);
    assert.equal(e.saldos.reserva, 500);
  });

  it("tira 200 do lance com motivo e o atraso em dias", () => {
    const r = validarComando({ acao: "retirada", caixinha: "lance", valor: 200, motivo: "mecânico" }, estado());
    assert.equal(r.tipo, "proposta");
    if (r.tipo !== "proposta") return;
    assert.equal(r.proposta.movimento?.tipo, "retirada");
    assert.match(r.proposta.detalhe, /mecânico/);
    assert.match(r.proposta.detalhe, /dia/);
  });

  it("recusa retirada sem motivo e acima do saldo", () => {
    assert.equal(validarComando({ acao: "retirada", caixinha: "lance", valor: 50 }, estado()).tipo, "erro");
    const alta = validarComando({ acao: "retirada", caixinha: "reserva", valor: 900, motivo: "médico" }, estado());
    assert.equal(alta.tipo, "erro");
    if (alta.tipo === "erro") assert.match(alta.texto, /saldo/);
  });

  it("registra 3 cotas de BOVA11 a 128 e soma o total", () => {
    const r = validarComando({ acao: "compra", ativo: "bova11", quantidade: 3, preco: 128 }, estado());
    assert.equal(r.tipo, "proposta");
    if (r.tipo !== "proposta") return;
    assert.equal(r.proposta.compra?.ticker, "BOVA11");
    assert.equal(r.proposta.compra?.quantidade, 3);
    assert.ok(r.proposta.detalhe.includes(reais(384)));
  });

  it("não compra um código que não está no Mercado", () => {
    const r = validarComando({ acao: "compra", ativo: "PETR4", quantidade: 1, preco: 30 }, estado());
    assert.equal(r.tipo, "erro");
    if (r.tipo === "erro") assert.match(r.texto, /Mercado/);
  });

  it("entende 1.200 da loja como retorno do negócio certo", () => {
    const r = validarComando({ acao: "retorno", negocio: "loja", valor: "1.200" }, estado());
    assert.equal(r.tipo, "proposta");
    if (r.tipo !== "proposta") return;
    assert.equal(r.proposta.retorno?.negocio, "Lojas online");
    assert.equal(r.proposta.retorno?.valor, 1200);
    assert.ok(r.proposta.detalhe.includes(reais(1200)));
  });

  it("responde quanto falta pro lance com a conta do portal", () => {
    const r = validarComando({ acao: "pergunta", alvo: "lance" }, estado());
    assert.equal(r.tipo, "resposta");
    if (r.tipo !== "resposta") return;
    assert.ok(r.texto.includes(reais(19000)));
    assert.ok(r.texto.includes(reais(1000)));
    assert.ok(r.texto.includes(reais(20000)));
  });
});
