import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/state-store";
import { safePhotoName, writeLocalPhoto } from "@/lib/sonhos-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function enviarBucket(nome: string, bytes: Uint8Array) {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const blob = new Blob([buf], { type: "image/jpeg" });
  const storage = db().storage.from("sonhos");
  let up = await storage.upload(nome, blob, { contentType: "image/jpeg", upsert: true });
  if (up.error && /bucket/i.test(up.error.message)) {
    await db().storage.createBucket("sonhos", { public: false });
    up = await storage.upload(nome, blob, { contentType: "image/jpeg", upsert: true });
  }
  return up.error ? up.error.message : null;
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const arquivo = form?.get("file");
  const id = String(form?.get("id") ?? "");
  const nome = safePhotoName(id);
  if (!nome || !(arquivo instanceof File)) {
    return NextResponse.json({ error: "Envie uma foto do sonho." }, { status: 400 });
  }
  if (arquivo.size > 3_000_000) {
    return NextResponse.json({ error: "A foto ficou grande demais. Tente outra." }, { status: 413 });
  }
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return NextResponse.json({ error: "A foto precisa ser uma imagem JPEG." }, { status: 400 });
  }

  if (!supabaseConfigured()) {
    try {
      await writeLocalPhoto(nome, bytes);
      return NextResponse.json({ path: nome, storage: "file" });
    } catch {
      return NextResponse.json({ error: "Não consegui guardar a foto neste computador." }, { status: 500 });
    }
  }

  try {
    const erro = await enviarBucket(nome, bytes);
    if (erro) return NextResponse.json({ error: "Não consegui guardar a foto. Confira o bucket sonhos no Supabase." }, { status: 500 });
    return NextResponse.json({ path: nome, storage: "supabase" });
  } catch {
    return NextResponse.json({ error: "Não consegui guardar a foto agora." }, { status: 500 });
  }
}
