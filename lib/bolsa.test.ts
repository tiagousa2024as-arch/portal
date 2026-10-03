import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BolsaError, listarTickers } from "./bolsa.ts";

function resposta(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const lista = {
  results: [
    {
      symbol: "PETR4",
      name: "PETROLEO BRASILEIRO S.A. PETROBRAS",
      longName: "Petroleo Brasileiro SA Pfd",
      subType: "stock",
      isActive: true,
      quote: { lastPrice: 51.17 },
    },
    {
      symbol: "MXRF11",
      name: "MXRF11",
      longName: "Maxi Renda Fundo de Investimento Imobiliario Cotas",
      subType: "fii",
      isActive: true,
      quote: { lastPrice: 9.09 },
    },
    { symbol: "VELHO3", name: "Velho", subType: "stock", isActive: false, quote: { lastPrice: 1 } },
    { symbol: "^BVSP", name: "IBOVESPA", subType: "index", isActive: true },
  ],
  pagination: { page: 1, totalItems: 4, hasNextPage: false },
};

describe("listarTickers", () => {
  it("classifica ação e FII e ignora inativo e índice", async () => {
    let url = "";
    const out = await listarTickers({
      search: " petr ",
      apiKey: "teste",
      fetchImpl: async (input) => {
        url = String(input);
        return resposta(200, lista);
      },
    });
    assert.match(url, /search=petr/);
    assert.equal(url.includes("subType"), false);
    assert.deepEqual(
      out.itens.map((i) => i.t),
      ["PETR4", "MXRF11"]
    );
    assert.equal(out.itens[0].classe, "rv");
    assert.equal(out.itens[0].tipo, "acao");
    assert.equal(out.itens[0].preco, 51.17);
    assert.equal(out.itens[1].tipo, "fii");
    assert.match(out.itens[1].nome, /Maxi Renda/);
  });

  it("filtra pelo tipo e não manda busca curta", async () => {
    let url = "";
    await listarTickers({
      tipo: "etf",
      search: "a",
      apiKey: null,
      fetchImpl: async (input) => {
        url = String(input);
        return resposta(200, { results: [], pagination: { page: 1, totalItems: 257, hasNextPage: true } });
      },
    });
    assert.match(url, /subType=etf/);
    assert.equal(url.includes("search="), false);
  });

  it("recusa busca de uma letra sem tipo", async () => {
    await assert.rejects(
      () => listarTickers({ search: "p", apiKey: null, fetchImpl: async () => resposta(200, lista) }),
      (erro: unknown) => erro instanceof BolsaError && erro.status === 400
    );
  });
});
