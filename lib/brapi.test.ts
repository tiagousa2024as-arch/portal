import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BrapiError, consultarCotacoes } from "./brapi.ts";

function resposta(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

const cotacao = {
  results: [
    {
      requestedSymbol: "PETR4",
      symbol: "PETR4",
      changed: false,
      data: {
        shortName: "PETROBRAS PN",
        regularMarketPrice: 41.18,
        regularMarketChangePercent: -1.39,
        regularMarketTime: "2026-06-14T05:15:42.000Z",
        marketCap: null,
      },
    },
  ],
  requestedAt: "2026-06-14T05:03:16.000Z",
  took: 286,
};

describe("consultarCotacoes", () => {
  it("preserva null, horário do pregão e requestedAt", async () => {
    let url = "";
    const out = await consultarCotacoes({
      symbols: ["petr4", "VALE3"],
      apiKey: "teste",
      fetchImpl: async (input) => {
        url = String(input);
        return resposta(200, cotacao);
      },
    });
    assert.equal(url, "https://brapi.dev/api/v2/stocks/quote?symbols=PETR4%2CVALE3");
    assert.equal(out.requestedAt, "2026-06-14T05:03:16.000Z");
    assert.equal(out.results[0].data.regularMarketTime, "2026-06-14T05:15:42.000Z");
    assert.equal(out.results[0].data.marketCap, null);
    assert.equal(out.results[0].data.regularMarketPrice, 41.18);
  });

  it("trata 401 sem inventar cotação", async () => {
    await assert.rejects(
      () =>
        consultarCotacoes({
          symbols: ["PETR4"],
          apiKey: "ruim",
          fetchImpl: async () => resposta(401, { error: true, message: "Token de autenticação inválido ou ausente", code: "UNAUTHORIZED" }),
        }),
      (erro: unknown) => {
        assert.ok(erro instanceof BrapiError);
        assert.equal(erro.status, 401);
        assert.equal(erro.code, "UNAUTHORIZED");
        return true;
      }
    );
  });

  it("espera o Retry-After e tenta uma vez", async () => {
    const chamadas: string[] = [];
    const esperas: number[] = [];
    const out = await consultarCotacoes({
      symbols: ["ITUB4"],
      apiKey: null,
      sleep: async (ms) => {
        esperas.push(ms);
      },
      fetchImpl: async () => {
        chamadas.push("foi");
        if (chamadas.length === 1) {
          return resposta(429, { error: true, message: "Limite de requisições excedido.", code: "RATE_LIMIT_EXCEEDED" }, { "retry-after": "2" });
        }
        return resposta(200, cotacao);
      },
    });
    assert.deepEqual(esperas, [2000]);
    assert.equal(chamadas.length, 2);
    assert.equal(out.took, 286);
  });
});
