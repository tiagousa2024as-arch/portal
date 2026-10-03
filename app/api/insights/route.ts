import { NextResponse } from "next/server";
import { gerarInsights, priorizar } from "@/lib/insights/engine";
import type { EstadoInsights } from "@/lib/insights/types";

export const dynamic = "force-dynamic";

const cache = new Map<string, { at: number; body: { insights: unknown } }>();
const TTL = 60 * 1000;
const MAX = 32;

function diaValido(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function POST(req: Request) {
  let body: { hoje?: unknown; estado?: EstadoInsights };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido.", insights: [] }, { status: 400 });
  }
  if (!diaValido(body?.hoje) || !body.estado || typeof body.estado !== "object") {
    return NextResponse.json({ error: "Pedido inválido.", insights: [] }, { status: 400 });
  }
  const chave = JSON.stringify({ hoje: body.hoje, estado: body.estado });
  const guardado = cache.get(chave);
  if (guardado && Date.now() - guardado.at < TTL) return NextResponse.json(guardado.body);
  const p = body.hoje.split("-");
  const hoje = new Date(+p[0], +p[1] - 1, +p[2]);
  const saida = { insights: priorizar(gerarInsights(body.estado, hoje)) };
  if (cache.size >= MAX) {
    const primeiro = cache.keys().next().value;
    if (primeiro) cache.delete(primeiro);
  }
  cache.set(chave, { at: Date.now(), body: saida });
  return NextResponse.json(saida);
}
