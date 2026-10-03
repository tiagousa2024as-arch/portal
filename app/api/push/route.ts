import { NextResponse } from "next/server";
import { apagarInscricao, salvarInscricao } from "@/lib/avisos/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const chave = process.env.VAPID_PUBLIC_KEY || "";
  return NextResponse.json({ chave: chave || null });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const salvo = await salvarInscricao({ endpoint: body?.endpoint, p256dh: body?.p256dh, auth: body?.auth });
  return NextResponse.json(salvo, { status: salvo.ok ? 200 : 400 });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const salvo = await apagarInscricao(endpoint);
  return NextResponse.json(salvo, { status: salvo.ok ? 200 : 400 });
}
