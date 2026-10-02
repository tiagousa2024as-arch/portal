import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/state-store";
import { readLocalPhoto } from "@/lib/sonhos-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NOME = /^[a-zA-Z0-9_-]{1,80}\.jpg$/;

function jpeg(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new NextResponse(new Blob([copy], { type: "image/jpeg" }), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function GET(req: Request) {
  const nome = new URL(req.url).searchParams.get("path") || "";
  if (!NOME.test(nome)) return NextResponse.json({ error: "caminho inválido" }, { status: 400 });

  if (!supabaseConfigured()) {
    const local = await readLocalPhoto(nome);
    if (!local) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
    return jpeg(local);
  }

  try {
    const { data, error } = await db().storage.from("sonhos").download(nome);
    if (error || !data) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
    return jpeg(new Uint8Array(await data.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }
}
