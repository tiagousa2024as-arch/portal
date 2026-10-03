import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blocoMemoria, limparItens, temDadoSensivel } from "./validar.ts";

describe("memória", () => {
  it("aceita contexto do celular e corta em três", () => {
    const r = limparItens([
      { kind: "contexto", text: "Esperando 7 dias para decidir o celular." },
      { kind: "preferencia", text: "Prefere respostas curtas." },
      { kind: "decisao", text: "Decidiu não vender para rebalancear agora." },
      { kind: "contexto", text: "Quarto item fica de fora." },
    ]);
    assert.equal(r.itens.length, 3);
    assert.equal(r.itens[0].text, "Esperando 7 dias para decidir o celular.");
    assert.equal(temDadoSensivel(r.itens[0].text), false);
  });

  it("recusa senha, e-mail, CPF e número longo", () => {
    const r = limparItens([
      { kind: "contexto", text: "A senha do app é aberta." },
      { kind: "contexto", text: "E-mail tiago@exemplo.com" },
      { kind: "contexto", text: "CPF 123.456.789-09" },
      { kind: "contexto", text: "Conta 12345678901" },
    ]);
    assert.equal(r.itens.length, 0);
    assert.equal(r.motivo, "sensivel");
  });

  it("não repete o que já está guardado", () => {
    const r = limparItens([{ kind: "preferencia", text: "Prefere respostas curtas." }], ["prefere respostas curtas."]);
    assert.equal(r.itens.length, 0);
    assert.equal(r.motivo, "vazio");
  });

  it("o bloco do Lastro só leva o que passou no filtro", () => {
    const bloco = blocoMemoria([
      { kind: "preferencia", text: "Prefere respostas curtas." },
      { kind: "contexto", text: "CPF 123.456.789-09" },
    ]);
    assert.match(bloco, /preferência/);
    assert.match(bloco, /respostas curtas/);
    assert.doesNotMatch(bloco, /CPF/);
    const muitos = blocoMemoria([
      { kind: "contexto", text: "Um." },
      { kind: "contexto", text: "Dois." },
      { kind: "contexto", text: "Três." },
      { kind: "contexto", text: "Quatro." },
    ]);
    assert.match(muitos, /Quatro/);
  });
});
