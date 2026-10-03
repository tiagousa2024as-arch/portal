import assert from "node:assert/strict";
import test from "node:test";
import { limparRegistro, resumirMes, somarTokens, type RegistroUso } from "./uso.ts";

test("resumo do mês soma tokens e ignora outro mês", () => {
  const linhas: RegistroUso[] = [
    { dia: "2026-10-02", origem: "portal", ferramentas: ["get_caixinhas", "get_caixinhas"], erro: false, entrada: 100, saida: 40 },
    { dia: "2026-10-03", origem: "comando", ferramentas: ["interpretar"], erro: true, entrada: 10, saida: 5 },
    { dia: "2026-09-30", origem: "portal", ferramentas: ["get_arca"], erro: false, entrada: 999, saida: 999 },
  ];
  const resumo = resumirMes(linhas, "2026-10");
  assert.equal(resumo.respostas, 2);
  assert.equal(resumo.erros, 1);
  assert.equal(resumo.entrada, 110);
  assert.equal(resumo.saida, 45);
  assert.deepEqual(resumo.ferramentas, [
    { nome: "get_caixinhas", vezes: 2 },
    { nome: "interpretar", vezes: 1 },
  ]);
});

test("registro descarta texto e ferramenta desconhecida", () => {
  const limpo = limparRegistro({
    dia: "2026-10-02",
    origem: "portal",
    ferramentas: ["get_caixinhas", "tiago@exemplo.com", "meu saldo é 10 mil"],
    erro: false,
    entrada: 12.4,
    saida: -3,
    pergunta: "quanto tenho",
  });
  assert.deepEqual(limpo, {
    dia: "2026-10-02",
    origem: "portal",
    ferramentas: ["get_caixinhas"],
    erro: false,
    entrada: 12,
    saida: 0,
  });
  assert.equal(limparRegistro({ dia: "hoje", origem: "portal", ferramentas: [] }), null);
});

test("soma tokens de entrada, cache e saída", () => {
  const acc = { entrada: 0, saida: 0 };
  somarTokens({ input_tokens: 10, output_tokens: 4, cache_read_input_tokens: 3 }, acc);
  assert.deepEqual(acc, { entrada: 13, saida: 4 });
});
