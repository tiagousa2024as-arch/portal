import { NextResponse } from "next/server";
import { apagarMemoria, criarMemoria, editarMemoria, listarMemoria } from "@/lib/memoria/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const lista = await listarMemoria();
  return NextResponse.json(lista);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const salvo = await criarMemoria(body?.itens);
  return NextResponse.json(salvo, { status: salvo.ok ? 200 : 400 });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  const salvo = await editarMemoria(id, { kind: body?.kind, text: body?.text });
  return NextResponse.json(salvo, { status: salvo.ok ? 200 : 400 });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  const salvo = await apagarMemoria(id);
  return NextResponse.json(salvo, { status: salvo.ok ? 200 : 400 });
}
