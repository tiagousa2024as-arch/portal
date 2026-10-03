import { executarFerramenta } from "../agent/ferramentas.ts";
import type { EstadoAgente } from "../agent/estado.ts";
import { num, reais } from "../insights/plano.ts";

export type Classificacao = {
  acao?: string;
  caixinha?: string;
  valor?: unknown;
  motivo?: string;
  ativo?: string;
  quantidade?: unknown;
  preco?: unknown;
  negocio?: string;
  alvo?: string;
};

export type PropostaComando = {
  tipo: "movimento" | "compra" | "retorno";
  titulo: string;
  detalhe: string;
  movimento?: { caixinha: string; tipo: "deposito" | "retirada"; valor: number; motivo: string };
  compra?: { ticker: string; quantidade: number; preco: number };
  retorno?: { negocio: string; valor: number; data: string };
};

export type ResultadoComando =
  | { tipo: "resposta"; texto: string }
  | { tipo: "proposta"; proposta: PropostaComando }
  | { tipo: "erro"; texto: string };

const CAIXAS: Record<string, string> = {
  reserva: "reserva",
  emergencia: "reserva",
  "reserva de emergencia": "reserva",
  lance: "lance",
  "lance cb650r": "lance",
  moto: "lance",
  apto: "apto",
  apartamento: "apto",
  carro: "carro",
  "carro dos sonhos": "carro",
  arca: "arcaInvestir",
  arcainvestir: "arcaInvestir",
  "arca a investir": "arcaInvestir",
};

const NOMES: Record<string, string> = {
  reserva: "Reserva de Emergência",
  lance: "Lance CB650R",
  apto: "Apartamento",
  carro: "Carro dos sonhos",
  arcaInvestir: "ARCA – a investir",
};

const ALVOS: Record<string, string> = {
  lance: "lance",
  reserva: "reserva",
  apto: "apto",
  apartamento: "apto",
  carro: "carro",
  arca: "arcaInvestir",
  arcainvestir: "arcaInvestir",
  patrimonio: "patrimonio",
  patrimônio: "patrimonio",
};

function dinheiro(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v ?? "").trim();
  if (!s) return 0;
  if (s.includes(",")) return num(s);
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return num(s.replace(/\./g, ""));
  return num(s);
}

function limpo(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function caixaDe(bruto: string | undefined): string {
  const k = limpo(bruto || "");
  return CAIXAS[k] || "";
}

function acharNegocio(estado: EstadoAgente, bruto: string | undefined): { nome?: string; erro?: string } {
  const q = limpo(bruto || "");
  if (!q) return { erro: "Diga de qual negócio veio o dinheiro." };
  const nomes = estado.negocios.filter(Boolean);
  const exato = nomes.filter((n) => limpo(n) === q);
  if (exato.length === 1) return { nome: exato[0] };
  const parte = nomes.filter((n) => limpo(n).includes(q) || q.includes(limpo(n)));
  if (parte.length === 1) return { nome: parte[0] };
  if (!nomes.length) return { erro: "Não há negócio cadastrado." };
  if (parte.length > 1) return { erro: "Tem mais de um negócio parecido: " + parte.join(", ") + "." };
  return { erro: "Não achei esse negócio. Os cadastrados são: " + nomes.join(", ") + "." };
}

function acharAtivo(estado: EstadoAgente, bruto: string | undefined): string {
  const q = String(bruto || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!q) return "";
  const tickers = estado.ativos.map((a) => String(a.t || "").toUpperCase()).filter(Boolean);
  if (tickers.includes(q)) return q;
  return "";
}

function falta(nome: string, saldo: number, meta: number): string {
  if (!(meta > 0)) return "A meta de " + nome + " ainda não está definida. Hoje há " + reais(saldo) + ".";
  if (saldo >= meta) return nome + " já chegou na meta: " + reais(saldo) + " de " + reais(meta) + ".";
  return "Faltam " + reais(meta - saldo) + " para " + nome + ". Hoje há " + reais(saldo) + " de " + reais(meta) + ".";
}

function responder(estado: EstadoAgente, alvoBruto: string | undefined): ResultadoComando {
  const alvo = ALVOS[limpo(alvoBruto || "")] || "";
  if (!alvo) return { tipo: "erro", texto: "Para uma conta aberta, use o Assistente. Aqui eu respondo quanto falta para o lance, a reserva, o apartamento, o carro ou a ARCA." };
  if (alvo === "patrimonio") {
    const s = estado.saldos;
    const outras = estado.outrasContas.reduce((t, c) => t + num(c.saldo), 0);
    const total = num(s.reserva) + num(s.lance) + num(s.apto) + num(s.carro) + num(s.arcaInvestir) + num(s.A) + num(s.R) + num(s.C) + num(s.I) + outras;
    return { tipo: "resposta", texto: "O patrimônio está em " + reais(total) + "." };
  }
  if (alvo === "arcaInvestir") {
    return { tipo: "resposta", texto: "ARCA – a investir está com " + reais(num(estado.saldos.arcaInvestir)) + ". É passagem e deve zerar toda semana." };
  }
  const metaChave = alvo === "reserva" ? "reservaMeta" : alvo === "lance" ? "lanceMeta" : alvo === "apto" ? "aptoMeta" : "carroMeta";
  return { tipo: "resposta", texto: falta(NOMES[alvo], num(estado.saldos[alvo]), num(estado.cfg[metaChave])) };
}

export function validarComando(classe: Classificacao, estado: EstadoAgente): ResultadoComando {
  const acao = limpo(classe.acao || "");
  if (acao === "pergunta") return responder(estado, classe.alvo);
  if (acao === "nenhuma" || !acao) {
    return { tipo: "erro", texto: "Não entendi. Tente: guardei 300 na reserva, ou quanto falta pro lance?" };
  }
  if (acao === "deposito" || acao === "retirada") {
    const caixinha = caixaDe(classe.caixinha);
    const valor = dinheiro(classe.valor);
    const motivo = String(classe.motivo || "").trim().slice(0, 120);
    if (!caixinha) return { tipo: "erro", texto: "Diga a caixinha: reserva, lance, apartamento, carro ou ARCA." };
    const saida = executarFerramenta("propose_movement", { caixinha, tipo: acao, valor, motivo }, estado);
    if (!saida.proposta) {
      const erro = saida.paraModelo && typeof saida.paraModelo === "object" && "erro" in saida.paraModelo ? String((saida.paraModelo as { erro: string }).erro) : "Não deu para preparar o movimento.";
      return { tipo: "erro", texto: erro };
    }
    const p = saida.proposta;
    if (p.tipo !== "movimento" || !p.movimento) {
      return { tipo: "erro", texto: "Não deu para preparar o movimento." };
    }
    return { tipo: "proposta", proposta: { tipo: "movimento", titulo: p.titulo, detalhe: p.detalhe, movimento: p.movimento } };
  }
  if (acao === "compra") {
    const ticker = acharAtivo(estado, classe.ativo);
    const quantidade = dinheiro(classe.quantidade);
    const preco = dinheiro(classe.preco);
    if (!ticker) return { tipo: "erro", texto: "Esse código não está no Mercado. Inclua o ativo lá antes de registrar a compra." };
    if (!(quantidade > 0) || !(preco > 0) || quantidade > 1000000 || preco > 1000000) {
      return { tipo: "erro", texto: "Diga a quantidade e o preço pago." };
    }
    const total = Math.round(quantidade * preco * 100) / 100;
    const detalhe = "Compra de " + String(quantidade).replace(".", ",") + " " + (quantidade === 1 ? "cota" : "cotas") + " de " + ticker + " a " + reais(preco) + ". Total " + reais(total) + ". O saldo da letra da ARCA não muda aqui.";
    return {
      tipo: "proposta",
      proposta: { tipo: "compra", titulo: "Compra de " + ticker, detalhe, compra: { ticker, quantidade, preco: Math.round(preco * 100) / 100 } },
    };
  }
  if (acao === "retorno") {
    const achado = acharNegocio(estado, classe.negocio);
    if (!achado.nome) return { tipo: "erro", texto: achado.erro || "Não achei o negócio." };
    const valor = dinheiro(classe.valor);
    if (!(valor > 0) || valor > 10000000) return { tipo: "erro", texto: "Diga quanto entrou." };
    const detalhe = "Retorno de " + reais(valor) + " em " + achado.nome + ", no dia " + estado.hoje + ".";
    return {
      tipo: "proposta",
      proposta: { tipo: "retorno", titulo: "Retorno de " + achado.nome, detalhe, retorno: { negocio: achado.nome, valor: Math.round(valor * 100) / 100, data: estado.hoje } },
    };
  }
  return { tipo: "erro", texto: "Não entendi. Tente: guardei 300 na reserva, ou quanto falta pro lance?" };
}
