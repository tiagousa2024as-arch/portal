import { promises as fs } from "fs";
import path from "path";
import { supabaseConfigured } from "../state-store.ts";
import { db } from "../supabase.ts";
import { limparItens, type ItemMemoria, type KindMemoria } from "./validar.ts";

export type Memoria = ItemMemoria & { id: string; created_at: string };

const arquivo = path.join(process.cwd(), "data", "agent-memory.json");
const LIMITE = 80;

export type ListaMemoria = { ok: true; itens: Memoria[] } | { ok: false; motivo: "tabela" | "erro"; itens: [] };

function tabelaAusente(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const m = String(error.message || "").toLowerCase();
  return error.code === "42P01" || error.code === "PGRST205" || m.includes("does not exist") || m.includes("schema cache") || m.includes("could not find the table");
}

function linha(row: { id?: unknown; created_at?: unknown; kind?: unknown; text?: unknown }): Memoria | null {
  const kind = String(row.kind || "") as KindMemoria;
  if (kind !== "decisao" && kind !== "preferencia" && kind !== "contexto") return null;
  const text = String(row.text || "").replace(/\s+/g, " ").trim().slice(0, 180);
  const id = String(row.id || "");
  if (!text || !id) return null;
  const created_at = String(row.created_at || new Date().toISOString());
  return { id, created_at, kind, text };
}

async function lerLocal(): Promise<Memoria[]> {
  try {
    const raw = await fs.readFile(arquivo, "utf8");
    const parsed = JSON.parse(raw) as { itens?: unknown };
    if (!Array.isArray(parsed.itens)) return [];
    return parsed.itens.map((row) => linha(row as Memoria)).filter((m): m is Memoria => !!m);
  } catch {
    return [];
  }
}

async function gravarLocal(itens: Memoria[]) {
  await fs.mkdir(path.dirname(arquivo), { recursive: true });
  const tmp = arquivo + ".tmp";
  await fs.writeFile(tmp, JSON.stringify({ itens }), "utf8");
  await fs.rm(arquivo, { force: true });
  await fs.rename(tmp, arquivo);
}

export async function listarMemoria(): Promise<ListaMemoria> {
  if (!supabaseConfigured()) {
    const itens = (await lerLocal()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, LIMITE);
    return { ok: true, itens };
  }
  const { data, error } = await db().from("agent_memory").select("id, created_at, kind, text").order("created_at", { ascending: false }).limit(LIMITE);
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro", itens: [] };
  const itens = (data || []).map((row) => linha(row)).filter((m): m is Memoria => !!m);
  return { ok: true, itens };
}

export async function criarMemoria(brutos: unknown): Promise<{ ok: true; itens: Memoria[] } | { ok: false; motivo: "tabela" | "erro" | "sensivel" | "vazio" }> {
  const atual = await listarMemoria();
  if (!atual.ok) return atual;
  const limpo = limparItens(brutos, atual.itens.map((m) => m.text));
  if (!limpo.itens.length) return { ok: false, motivo: limpo.motivo || "vazio" };
  const agora = new Date().toISOString();
  const novas: Memoria[] = limpo.itens.map((item) => ({
    id: crypto.randomUUID(),
    created_at: agora,
    kind: item.kind,
    text: item.text,
  }));
  if (!supabaseConfigured()) {
    await gravarLocal([...novas, ...atual.itens].slice(0, LIMITE));
    return { ok: true, itens: novas };
  }
  const { error } = await db()
    .from("agent_memory")
    .insert(novas.map((m) => ({ id: m.id, created_at: m.created_at, kind: m.kind, text: m.text })));
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  return { ok: true, itens: novas };
}

export async function editarMemoria(id: string, bruto: unknown): Promise<{ ok: true; item: Memoria } | { ok: false; motivo: "tabela" | "erro" | "sensivel" | "vazio" }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, motivo: "vazio" };
  const limpo = limparItens([bruto]);
  if (!limpo.itens.length) return { ok: false, motivo: limpo.motivo || "vazio" };
  const item = limpo.itens[0];
  if (!supabaseConfigured()) {
    const itens = await lerLocal();
    const i = itens.findIndex((m) => m.id === id);
    if (i < 0) return { ok: false, motivo: "vazio" };
    itens[i] = { ...itens[i], kind: item.kind, text: item.text };
    await gravarLocal(itens);
    return { ok: true, item: itens[i] };
  }
  const { data, error } = await db().from("agent_memory").update({ kind: item.kind, text: item.text }).eq("id", id).select("id, created_at, kind, text").maybeSingle();
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  const salvo = data ? linha(data) : null;
  if (!salvo) return { ok: false, motivo: "vazio" };
  return { ok: true, item: salvo };
}

export async function apagarMemoria(id: string): Promise<{ ok: true } | { ok: false; motivo: "tabela" | "erro" | "vazio" }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, motivo: "vazio" };
  if (!supabaseConfigured()) {
    const itens = await lerLocal();
    await gravarLocal(itens.filter((m) => m.id !== id));
    return { ok: true };
  }
  const { error } = await db().from("agent_memory").delete().eq("id", id);
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  return { ok: true };
}
