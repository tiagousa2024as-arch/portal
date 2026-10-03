import { NextResponse } from "next/server";
import { usoDoMes } from "@/lib/agent/uso";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const mes = new URL(req.url).searchParams.get("mes") || "";
  const lido = await usoDoMes(mes);
  if (!lido.ok) return NextResponse.json({ ok: false, motivo: lido.motivo });
  return NextResponse.json({ ok: true, ...lido.resumo });
}
