import { NextResponse } from "next/server";
import { BolsaError, listarTickers } from "@/lib/bolsa";

export const dynamic = "force-dynamic";

const cache = new Map<string, { at: number; body: unknown }>();
const TTL = 10 * 60 * 1000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const tipo = url.searchParams.get("tipo") || "";
  const page = Number(url.searchParams.get("page") || "1");
  const chave = `${q.trim().toLowerCase()}|${tipo}|${page}`;
  const guardado = cache.get(chave);
  if (guardado && Date.now() - guardado.at < TTL) return NextResponse.json(guardado.body);
  try {
    const lista = await listarTickers({ search: q, tipo, page });
    cache.set(chave, { at: Date.now(), body: lista });
    return NextResponse.json(lista);
  } catch (erro) {
    if (erro instanceof BolsaError) {
      const status = erro.status === 400 || erro.status === 429 ? erro.status : 502;
      return NextResponse.json({ error: erro.message, itens: [] }, { status });
    }
    return NextResponse.json({ error: "Não foi possível consultar a bolsa.", itens: [] }, { status: 502 });
  }
}
