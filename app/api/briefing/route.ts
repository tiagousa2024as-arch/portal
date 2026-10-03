import { NextResponse } from "next/server";
import { buscarBriefings } from "@/lib/briefing/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const data = new URL(req.url).searchParams.get("data") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return NextResponse.json({ ok: false }, { status: 400 });
  const lista = await buscarBriefings(data);
  if (!lista.ok) return NextResponse.json({ ok: false, motivo: lista.motivo, sabado: null, mes: null });
  return NextResponse.json({
    ok: true,
    sabado: lista.itens.find((b) => b.tipo === "sabado") || null,
    mes: lista.itens.find((b) => b.tipo === "mes") || null,
  });
}
