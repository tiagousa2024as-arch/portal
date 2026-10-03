import { NextResponse } from "next/server";
import { BrapiError, consultarCotacoes } from "@/lib/brapi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tickers = (new URL(req.url).searchParams.get("tickers") || "").split(",");
  try {
    const cotacao = await consultarCotacoes({ symbols: tickers });
    const quotes: Record<string, { price: number | null; changePercent: number | null; regularMarketTime: string | null; requestedAt: string }> = {};
    for (const item of cotacao.results) {
      const preco = item.data?.regularMarketPrice;
      quotes[item.symbol] = {
        price: typeof preco === "number" ? preco : null,
        changePercent: item.data?.regularMarketChangePercent ?? null,
        regularMarketTime: item.data?.regularMarketTime ?? null,
        requestedAt: cotacao.requestedAt,
      };
    }
    return NextResponse.json({ quotes, requestedAt: cotacao.requestedAt, took: cotacao.took });
  } catch (erro) {
    if (erro instanceof BrapiError) {
      const status = erro.status === 401 || erro.status === 404 || erro.status === 429 ? erro.status : 502;
      return NextResponse.json(
        { error: erro.message, code: erro.code, retryAfter: erro.retryAfter, quotes: {} },
        { status, headers: erro.retryAfter != null ? { "Retry-After": String(erro.retryAfter) } : undefined }
      );
    }
    return NextResponse.json({ error: "Não foi possível consultar a brapi.", quotes: {} }, { status: 502 });
  }
}
