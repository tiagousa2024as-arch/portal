// Cotação via GET /api/v2/stocks/quote?symbols=
// Dicionário: regularMarketPrice é o preço atual, unidade BRL, sem fórmula.
// regularMarketTime e requestedAt são datas ISO. marketCap pode vir null.

const QUOTE_URL = "https://brapi.dev/api/v2/stocks/quote";

export type StockQuoteSnapshot = {
  shortName?: string | null;
  longName?: string | null;
  currency?: string | null;
  regularMarketPrice?: number | null;
  regularMarketChange?: number | null;
  regularMarketChangePercent?: number | null;
  regularMarketTime?: string | null;
  marketCap?: number | null;
  regularMarketVolume?: number | null;
  regularMarketPreviousClose?: number | null;
  regularMarketOpen?: number | null;
  regularMarketDayHigh?: number | null;
  regularMarketDayLow?: number | null;
  fiftyTwoWeekLow?: number | null;
  fiftyTwoWeekHigh?: number | null;
  logourl?: string | null;
};

export type StockQuoteSeries = {
  requestedSymbol: string;
  symbol: string;
  changed: boolean;
  data: StockQuoteSnapshot;
};

export type StockQuoteResponse = {
  results: StockQuoteSeries[];
  requestedAt: string;
  took: number;
};

export class BrapiError extends Error {
  status: number;
  code: string | null;
  retryAfter: number | null;

  constructor(status: number, message: string, code: string | null = null, retryAfter: number | null = null) {
    super(message);
    this.name = "BrapiError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type Options = {
  symbols: string[];
  apiKey?: string | null;
  fetchImpl?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
};

function chave(): string {
  return process.env.BRAPI_API_KEY || process.env.BRAPI_TOKEN || "";
}

function tickers(lista: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const item of lista) {
    const t = item.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(t) || vistos.has(t)) continue;
    vistos.add(t);
    saida.push(t);
  }
  return saida.slice(0, 20);
}

function segundosRetry(header: string | null, agora: number): number | null {
  if (!header) return null;
  const n = Number(header);
  if (Number.isFinite(n) && n >= 0) return n;
  const data = Date.parse(header);
  if (Number.isNaN(data)) return null;
  return Math.max(0, Math.ceil((data - agora) / 1000));
}

function corpoErro(body: unknown): { message: string; code: string | null } {
  if (!body || typeof body !== "object") return { message: "A brapi não respondeu.", code: null };
  const o = body as { message?: unknown; code?: unknown };
  return {
    message: typeof o.message === "string" && o.message ? o.message : "A brapi não respondeu.",
    code: typeof o.code === "string" ? o.code : null,
  };
}

function ehCotacao(body: unknown): body is StockQuoteResponse {
  if (!body || typeof body !== "object") return false;
  const o = body as StockQuoteResponse;
  return Array.isArray(o.results) && typeof o.requestedAt === "string" && typeof o.took === "number";
}

const dormir = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function consultarCotacoes(opcoes: Options): Promise<StockQuoteResponse> {
  const symbols = tickers(opcoes.symbols);
  if (!symbols.length) {
    throw new BrapiError(400, "Informe ao menos um ticker.", "BAD_REQUEST");
  }
  const fetchImpl = opcoes.fetchImpl ?? fetch;
  const sleep = opcoes.sleep ?? dormir;
  const apiKey = opcoes.apiKey === undefined ? chave() : opcoes.apiKey || "";
  const url = `${QUOTE_URL}?symbols=${encodeURIComponent(symbols.join(","))}`;
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  let tentativa = 0;
  while (true) {
    const resposta = await fetchImpl(url, { headers, cache: "no-store" });
    if (resposta.status === 429 && tentativa === 0) {
      const espera = segundosRetry(resposta.headers.get("retry-after"), Date.now());
      tentativa = 1;
      if (espera != null) await sleep(espera * 1000);
      continue;
    }
    if (!resposta.ok) {
      let body: unknown = null;
      try {
        body = await resposta.json();
      } catch {
        body = null;
      }
      const erro = corpoErro(body);
      const retryAfter = resposta.status === 429 ? segundosRetry(resposta.headers.get("retry-after"), Date.now()) : null;
      throw new BrapiError(resposta.status, erro.message, erro.code, retryAfter);
    }
    const body: unknown = await resposta.json();
    if (!ehCotacao(body)) {
      throw new BrapiError(500, "Resposta de cotação incompleta.", "BAD_RESPONSE");
    }
    return body;
  }
}
