import { promises as fs } from "fs";
import path from "path";
import { supabaseConfigured } from "../state-store.ts";
import { db } from "../supabase.ts";

export type Briefing = {
  data: string;
  tipo: "sabado" | "mes";
  titulo: string;
  linhas: string[];
  frases: string;
  na_linha: boolean;
};

const arquivo = path.join(process.cwd(), "data", "briefings.json");

function tabelaAusente(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const m = String(error.message || "").toLowerCase();
  return error.code === "42P01" || error.code === "PGRST205" || m.includes("does not exist") || m.includes("schema cache") || m.includes("could not find the table");
}

function linha(row: Partial<Briefing> | null): Briefing | null {
  if (!row || (row.tipo !== "sabado" && row.tipo !== "mes")) return null;
  const data = String(row.data || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  return {
    data,
    tipo: row.tipo,
    titulo: String(row.titulo || "").slice(0, 120),
    linhas: Array.isArray(row.linhas) ? row.linhas.map((l) => String(l)).slice(0, 8) : [],
    frases: String(row.frases || "").slice(0, 600),
    na_linha: !!row.na_linha,
  };
}

async function lerLocal(): Promise<Briefing[]> {
  try {
    const raw = await fs.readFile(arquivo, "utf8");
    const parsed = JSON.parse(raw) as { itens?: unknown };
    if (!Array.isArray(parsed.itens)) return [];
    return parsed.itens.map((row) => linha(row as Briefing)).filter((b): b is Briefing => !!b);
  } catch {
    return [];
  }
}

async function gravarLocal(itens: Briefing[]) {
  await fs.mkdir(path.dirname(arquivo), { recursive: true });
  const tmp = arquivo + ".tmp";
  await fs.writeFile(tmp, JSON.stringify({ itens }), "utf8");
  await fs.rm(arquivo, { force: true });
  await fs.rename(tmp, arquivo);
}

export async function buscarBriefings(data: string): Promise<{ ok: true; itens: Briefing[] } | { ok: false; motivo: "tabela" | "erro" }> {
  if (!supabaseConfigured()) {
    const itens = (await lerLocal()).filter((b) => b.data === data);
    return { ok: true, itens };
  }
  const { data: rows, error } = await db().from("briefings").select("data, tipo, titulo, linhas, frases, na_linha").eq("data", data);
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  return { ok: true, itens: (rows || []).map((row) => linha(row)).filter((b): b is Briefing => !!b) };
}

export async function salvarBriefing(item: Briefing): Promise<{ ok: true } | { ok: false; motivo: "tabela" | "erro" }> {
  const limpo = linha(item);
  if (!limpo) return { ok: false, motivo: "erro" };
  if (!supabaseConfigured()) {
    const itens = await lerLocal();
    const resto = itens.filter((b) => !(b.data === limpo.data && b.tipo === limpo.tipo));
    await gravarLocal([...resto, limpo]);
    return { ok: true };
  }
  const { error } = await db().from("briefings").upsert(limpo, { onConflict: "data,tipo" });
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  return { ok: true };
}
