// Catálogo da B3 via GET /api/v2/tickers.
// Ações, units, FIIs, ETFs, BDRs, FIAGRO, FI-Infra, FIP e FIDC.
// A lista da brapi não inclui opções, futuros nem Tesouro.

const LIST_URL = "https://brapi.dev/api/v2/tickers";

export type TipoBolsa = {
  sub: string;
  classe: string;
  tipo: string;
  nome: string;
};

export const TIPOS_BOLSA: TipoBolsa[] = [
  { sub: "stock", classe: "rv", tipo: "acao", nome: "Ações" },
  { sub: "unit", classe: "rv", tipo: "unit", nome: "Units" },
  { sub: "fii", classe: "rv", tipo: "fii", nome: "Fundos imobiliários" },
  { sub: "etf", classe: "rv", tipo: "etf", nome: "ETFs" },
  { sub: "bdr", classe: "rv", tipo: "bdr", nome: "BDRs" },
  { sub: "fi-agro", classe: "rv", tipo: "fiagro", nome: "FIAGRO" },
  { sub: "fi-infra", classe: "rv", tipo: "fi-infra", nome: "FI-Infra" },
  { sub: "fip", classe: "fundos", tipo: "fip", nome: "FIP" },
  { sub: "fidc", classe: "fundos", tipo: "fidc", nome: "FIDC" },
];

export type ItemBolsa = {
  t: string;
  nome: string;
  classe: string;
  tipo: string;
  tipoNome: string;
  preco: number | null;
};

export type ListaBolsa = {
  itens: ItemBolsa[];
  page: number;
  total: number;
  hasNext: boolean;
};

export class BolsaError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BolsaError";
    this.status = status;
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type RawTicker = {
  symbol?: unknown;
  name?: unknown;
  longName?: unknown;
  subType?: unknown;
  isActive?: unknown;
  quote?: { lastPrice?: unknown } | null;
};

function chave(): string {
  return process.env.BRAPI_API_KEY || process.env.BRAPI_TOKEN || "";
}

export function normalizarBusca(q: string): string {
  return q.trim().replace(/\s+/g, " ").slice(0, 40);
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function nomeDe(symbol: string, name: string, longName: string): string {
  if (longName && (name.toUpperCase() === symbol || name.length <= symbol.length)) return longName;
  return name || longName || symbol;
}

function itemDe(raw: RawTicker): ItemBolsa | null {
  const symbol = texto(raw.symbol).toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(symbol)) return null;
  if (raw.isActive === false) return null;
  const sub = TIPOS_BOLSA.find((t) => t.sub === texto(raw.subType));
  if (!sub) return null;
  const preco = raw.quote && typeof raw.quote.lastPrice === "number" ? raw.quote.lastPrice : null;
  return {
    t: symbol,
    nome: nomeDe(symbol, texto(raw.name), texto(raw.longName)),
    classe: sub.classe,
    tipo: sub.tipo,
    tipoNome: sub.nome,
    preco,
  };
}

type Options = {
  search?: string;
  tipo?: string;
  page?: number;
  apiKey?: string | null;
  fetchImpl?: FetchLike;
};

export async function listarTickers(opcoes: Options): Promise<ListaBolsa> {
  const search = normalizarBusca(opcoes.search || "");
  const tipoId = (opcoes.tipo || "").trim();
  const meta = tipoId ? TIPOS_BOLSA.find((t) => t.tipo === tipoId) : null;
  if (tipoId && !meta) throw new BolsaError(400, "Tipo desconhecido.");
  if (search.length > 0 && search.length < 2 && !meta) throw new BolsaError(400, "Digite pelo menos 2 letras.");
  if (search.length < 2 && !meta) throw new BolsaError(400, "Informe a busca ou o tipo.");
  const busca = search.length >= 2 ? search : "";
  const page = opcoes.page && opcoes.page > 0 ? Math.min(500, Math.floor(opcoes.page)) : 1;
  const params = new URLSearchParams({
    limit: "30",
    page: String(page),
    sortBy: "symbol",
    sortOrder: "asc",
  });
  if (meta) params.set("subType", meta.sub);
  if (busca) params.set("search", busca);
  const fetchImpl = opcoes.fetchImpl ?? fetch;
  const apiKey = opcoes.apiKey === undefined ? chave() : opcoes.apiKey || "";
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const resposta = await fetchImpl(`${LIST_URL}?${params}`, { headers, cache: "no-store" });
  if (!resposta.ok) throw new BolsaError(resposta.status === 429 ? 429 : 502, "Não foi possível consultar a bolsa.");
  const body: unknown = await resposta.json();
  const o = body && typeof body === "object" ? (body as { results?: unknown; pagination?: { totalItems?: unknown; hasNextPage?: unknown; page?: unknown } }) : {};
  const results = Array.isArray(o.results) ? o.results : [];
  const itens = results.map((r) => itemDe(r as RawTicker)).filter((x): x is ItemBolsa => x != null);
  const total = typeof o.pagination?.totalItems === "number" ? o.pagination.totalItems : itens.length;
  const hasNext = o.pagination?.hasNextPage === true;
  const pageOut = typeof o.pagination?.page === "number" ? o.pagination.page : page;
  return { itens, page: pageOut, total, hasNext };
}
