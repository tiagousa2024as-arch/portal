import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Busca cotações na brapi.dev, um ticker por vez (compatível com o plano gratuito).
export async function GET(req: Request) {
  const token = process.env.BRAPI_TOKEN;
  if (!token) return NextResponse.json({ error: "BRAPI_TOKEN ausente", quotes: {} }, { status: 500 });

  const tickers = (new URL(req.url).searchParams.get("tickers") || "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter((t) => /^[A-Z]{4}\d{1,2}$/.test(t))
    .slice(0, 20);

  const quotes: Record<string, { price: number; changePercent: number | null }> = {};
  await Promise.all(
    tickers.map(async (t) => {
      try {
        const r = await fetch(`https://brapi.dev/api/quote/${t}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!r.ok) return;
        const j = await r.json();
        const q = j?.results?.[0];
        if (q && typeof q.regularMarketPrice === "number") {
          quotes[t] = { price: q.regularMarketPrice, changePercent: q.regularMarketChangePercent ?? null };
        }
      } catch {
        /* ignora o ticker que falhar */
      }
    })
  );
  return NextResponse.json({ quotes });
}
