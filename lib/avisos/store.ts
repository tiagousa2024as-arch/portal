import { promises as fs } from "fs";
import path from "path";
import { supabaseConfigured } from "../state-store.ts";
import { db } from "../supabase.ts";
import type { Envio } from "./decidir.ts";

export type Inscricao = { endpoint: string; p256dh: string; auth: string };

const arquivo = path.join(process.cwd(), "data", "push-subscriptions.json");
const arquivoEnvios = path.join(process.cwd(), "data", "push-envios.json");

function tabelaAusente(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const m = String(error.message || "").toLowerCase();
  return error.code === "42P01" || error.code === "PGRST205" || m.includes("does not exist") || m.includes("schema cache") || m.includes("could not find the table");
}

async function lerJson<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { itens?: T[] };
    return Array.isArray(parsed.itens) ? parsed.itens : [];
  } catch {
    return [];
  }
}

async function gravarJson(file: string, itens: unknown[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify({ itens }), "utf8");
  await fs.rm(file, { force: true });
  await fs.rename(tmp, file);
}

function inscricao(row: Partial<Inscricao> | null): Inscricao | null {
  if (!row) return null;
  const endpoint = String(row.endpoint || "");
  const p256dh = String(row.p256dh || "");
  const auth = String(row.auth || "");
  if (!endpoint.startsWith("https://") || endpoint.length > 2000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 200) return null;
  return { endpoint, p256dh, auth };
}

export async function listarInscricoes(): Promise<{ ok: true; itens: Inscricao[] } | { ok: false; motivo: "tabela" | "erro" }> {
  if (!supabaseConfigured()) return { ok: true, itens: (await lerJson<Inscricao>(arquivo)).map((r) => inscricao(r)).filter((x): x is Inscricao => !!x) };
  const { data, error } = await db().from("push_subscriptions").select("endpoint, p256dh, auth");
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  return { ok: true, itens: (data || []).map((r) => inscricao(r)).filter((x): x is Inscricao => !!x) };
}

export async function salvarInscricao(bruto: Partial<Inscricao>): Promise<{ ok: true } | { ok: false; motivo: "tabela" | "erro" | "invalida" }> {
  const item = inscricao(bruto);
  if (!item) return { ok: false, motivo: "invalida" };
  if (!supabaseConfigured()) {
    const itens = (await lerJson<Inscricao>(arquivo)).filter((r) => r.endpoint !== item.endpoint);
    await gravarJson(arquivo, [...itens, item]);
    return { ok: true };
  }
  const { error } = await db().from("push_subscriptions").upsert({ endpoint: item.endpoint, p256dh: item.p256dh, auth: item.auth }, { onConflict: "endpoint" });
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  return { ok: true };
}

export async function apagarInscricao(endpoint: string): Promise<{ ok: true } | { ok: false; motivo: "tabela" | "erro" }> {
  if (!supabaseConfigured()) {
    const itens = (await lerJson<Inscricao>(arquivo)).filter((r) => r.endpoint !== endpoint);
    await gravarJson(arquivo, itens);
    return { ok: true };
  }
  const { error } = await db().from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  return { ok: true };
}

export async function listarEnvios(): Promise<{ ok: true; itens: Envio[] } | { ok: false; motivo: "tabela" | "erro" }> {
  const corte = new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10);
  if (!supabaseConfigured()) {
    const itens = (await lerJson<Envio>(arquivoEnvios)).filter((e) => e && e.em >= corte);
    return { ok: true, itens };
  }
  const { data, error } = await db().from("push_envios").select("id, em").gte("em", corte);
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  return { ok: true, itens: (data || []).map((r) => ({ id: String(r.id), em: String(r.em).slice(0, 10) })) };
}

export async function marcarEnvio(item: Envio): Promise<void> {
  if (!supabaseConfigured()) {
    const itens = (await lerJson<Envio>(arquivoEnvios)).filter((e) => e.id !== item.id);
    await gravarJson(arquivoEnvios, [...itens, item]);
    return;
  }
  await db().from("push_envios").upsert({ id: item.id, em: item.em }, { onConflict: "id" });
}
