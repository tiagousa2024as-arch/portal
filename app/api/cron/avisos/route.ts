import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/briefing/cron";
import { db, STATE_ID } from "@/lib/supabase";
import { readLocalState, supabaseConfigured } from "@/lib/state-store";
import { candidatos, escolher, dentroDoDia, partesLocais, type PrefsAviso } from "@/lib/avisos/decidir";
import { apagarInscricao, listarEnvios, listarInscricoes, marcarEnvio } from "@/lib/avisos/store";
import type { EstadoInsights } from "@/lib/insights/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VAZIO: PrefsAviso = { sabado: false, arca: false, contas: false, nudge: false, revisao: false };

type WebPush = {
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  sendNotification(sub: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string): Promise<unknown>;
};

async function lerEstado(): Promise<Record<string, unknown> | null> {
  if (!supabaseConfigured()) {
    const state = await readLocalState();
    return state && typeof state === "object" ? (state as Record<string, unknown>) : null;
  }
  const { data, error } = await db().from("portal_state").select("data").eq("id", STATE_ID).maybeSingle();
  if (error || !data?.data || typeof data.data !== "object") return null;
  return data.data as Record<string, unknown>;
}

function prefsDe(estado: Record<string, unknown>): PrefsAviso {
  const bruto = estado.avisos;
  const prefs = { ...VAZIO };
  if (!bruto || typeof bruto !== "object") return prefs;
  for (const k of Object.keys(prefs) as (keyof PrefsAviso)[]) {
    if (typeof (bruto as PrefsAviso)[k] === "boolean") prefs[k] = (bruto as PrefsAviso)[k];
  }
  return prefs;
}

export async function GET(req: Request) {
  if (!cronAutorizado(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const publica = process.env.VAPID_PUBLIC_KEY || "";
  const privada = process.env.VAPID_PRIVATE_KEY || "";
  const assunto = process.env.VAPID_SUBJECT || "";
  if (!publica || !privada || !assunto) return NextResponse.json({ ok: true, pulado: "vapid" });

  const tz = process.env.AVISOS_TZ || "America/New_York";
  const local = partesLocais(new Date(), tz);
  if (!dentroDoDia(local.hora)) return NextResponse.json({ ok: true, pulado: "noite" });

  const estado = await lerEstado();
  if (!estado) return NextResponse.json({ ok: false, motivo: "estado" }, { status: 500 });
  const inscritos = await listarInscricoes();
  const envios = await listarEnvios();
  if (!inscritos.ok || !envios.ok) return NextResponse.json({ ok: false, motivo: "tabela" });
  if (!inscritos.itens.length) return NextResponse.json({ ok: true, enviados: 0 });

  const lista = escolher(candidatos(estado as EstadoInsights, prefsDe(estado), local.dia), envios.itens, local.ymd);
  if (!lista.length) return NextResponse.json({ ok: true, enviados: 0 });

  const webpush = (await import("web-push")).default as WebPush;
  webpush.setVapidDetails(assunto, publica, privada);
  let enviados = 0;
  for (const aviso of lista) {
    const payload = JSON.stringify({ title: aviso.titulo, body: aviso.corpo, tag: aviso.id, url: "/" });
    let algum = false;
    for (const sub of inscritos.itens) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        algum = true;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await apagarInscricao(sub.endpoint);
      }
    }
    if (algum) {
      await marcarEnvio({ id: aviso.id, em: local.ymd });
      enviados += 1;
    }
  }
  return NextResponse.json({ ok: true, enviados });
}
