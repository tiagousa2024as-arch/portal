import { NextResponse } from "next/server";
import { db, STATE_ID } from "@/lib/supabase";
import { readLocalState, supabaseConfigured, writeLocalState } from "@/lib/state-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function validState(body: unknown): body is Record<string, unknown> {
  return !!body && typeof body === "object" && "cfg" in body && "saldos" in body;
}

export async function GET() {
  if (!supabaseConfigured()) {
    try {
      const state = await readLocalState();
      return NextResponse.json({ state, storage: "file" });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }
  try {
    const { data, error } = await db().from("portal_state").select("data").eq("id", STATE_ID).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ state: data?.data ?? null, storage: "supabase" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!validState(body)) {
    return NextResponse.json({ error: "estado inválido" }, { status: 400 });
  }
  const size = JSON.stringify(body).length;
  if (size > 1_000_000) return NextResponse.json({ error: "estado grande demais" }, { status: 413 });

  if (!supabaseConfigured()) {
    try {
      await writeLocalState(body);
      return NextResponse.json({ ok: true, storage: "file" });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }
  try {
    const { error } = await db()
      .from("portal_state")
      .upsert({ id: STATE_ID, data: body, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, storage: "supabase" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
