import { promises as fs } from "fs";
import path from "path";
import { supabaseConfigured } from "../state-store.ts";
import { db } from "../supabase.ts";

export const ORIGENS = ["portal", "noticias", "comando", "memoria", "sabado", "checkin"] as const;
export type OrigemUso = (typeof ORIGENS)[number];

const FERRAMENTAS = new Set([
  "get_overview",
  "get_caixinhas",
  "get_movements",
  "get_arca",
  "get_checkins",
  "get_business",
  "get_insights",
  "simulate_scenario",
  "calculate_purchase_impact",
  "propose_movement",
  "propose_checkin",
  "propose_goal_change",
  "web_search",
  "interpretar",
  "propor_memoria",
]);

export type RegistroUso = {
  dia: string;
  origem: OrigemUso;
  ferramentas: string[];
  erro: boolean;
  entrada: number;
  saida: number;
};

export type ResumoUso = {
  respostas: number;
  erros: number;
  entrada: number;
  saida: number;
  ferramentas: { nome: string; vezes: number }[];
};

const arquivo = path.join(process.cwd(), "data", "ai-logs.json");
const MAX = 400;

export function somarTokens(usage: unknown, acc: { entrada: number; saida: number }) {
  if (!usage || typeof usage !== "object") return;
  const u = usage as Record<string, unknown>;
  const n = (k: string) => (typeof u[k] === "number" && Number.isFinite(u[k] as number) && (u[k] as number) > 0 ? Math.round(u[k] as number) : 0);
  acc.entrada += n("input_tokens") + n("cache_read_input_tokens") + n("cache_creation_input_tokens");
  acc.saida += n("output_tokens");
}

export function limparRegistro(bruto: unknown): RegistroUso | null {
  if (!bruto || typeof bruto !== "object") return null;
  const row = bruto as Record<string, unknown>;
  const dia = typeof row.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.dia) ? row.dia : "";
  const origem = ORIGENS.includes(row.origem as OrigemUso) ? (row.origem as OrigemUso) : null;
  if (!dia || !origem) return null;
  const nomes = Array.isArray(row.ferramentas) ? row.ferramentas : [];
  const ferramentas = nomes.filter((n): n is string => typeof n === "string" && FERRAMENTAS.has(n)).slice(0, 12);
  const teto = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.min(2_000_000, Math.round(v)) : 0);
  return { dia, origem, ferramentas, erro: row.erro === true, entrada: teto(row.entrada), saida: teto(row.saida) };
}

export function resumirMes(linhas: RegistroUso[], mes: string): ResumoUso {
  const doMes = /^\d{4}-\d{2}$/.test(mes) ? linhas.filter((l) => l.dia.startsWith(mes + "-")) : [];
  const contagem = new Map<string, number>();
  let erros = 0;
  let entrada = 0;
  let saida = 0;
  for (const linha of doMes) {
    if (linha.erro) erros += 1;
    entrada += linha.entrada;
    saida += linha.saida;
    for (const nome of linha.ferramentas) contagem.set(nome, (contagem.get(nome) || 0) + 1);
  }
  const ferramentas = [...contagem.entries()]
    .map(([nome, vezes]) => ({ nome, vezes }))
    .sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome));
  return { respostas: doMes.length, erros, entrada, saida, ferramentas };
}

function proximoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(ano, m, 1)).toISOString().slice(0, 10);
}

function tabelaAusente(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const m = String(error.message || "").toLowerCase();
  return error.code === "42P01" || error.code === "PGRST205" || m.includes("does not exist") || m.includes("schema cache") || m.includes("could not find the table");
}

async function lerLocal(): Promise<RegistroUso[]> {
  try {
    const raw = await fs.readFile(arquivo, "utf8");
    const parsed = JSON.parse(raw) as { itens?: unknown };
    if (!Array.isArray(parsed.itens)) return [];
    return parsed.itens.map(limparRegistro).filter((r): r is RegistroUso => !!r);
  } catch {
    return [];
  }
}

async function gravarLocal(itens: RegistroUso[]) {
  await fs.mkdir(path.dirname(arquivo), { recursive: true });
  const tmp = arquivo + ".tmp";
  await fs.writeFile(tmp, JSON.stringify({ itens }), "utf8");
  await fs.rm(arquivo, { force: true });
  await fs.rename(tmp, arquivo);
}

export async function registrarUso(bruto: unknown): Promise<void> {
  try {
    const registro = limparRegistro(bruto);
    if (!registro) return;
    if (!supabaseConfigured()) {
      const atual = await lerLocal();
      await gravarLocal([...atual, registro].slice(-MAX));
      return;
    }
    const { error } = await db().from("ai_logs").insert({
      dia: registro.dia,
      origem: registro.origem,
      ferramentas: registro.ferramentas.join(","),
      erro: registro.erro,
      entrada: registro.entrada,
      saida: registro.saida,
    });
    if (error) return;
  } catch {
    return;
  }
}

export async function usoDoMes(mes: string): Promise<{ ok: true; resumo: ResumoUso } | { ok: false; motivo: "tabela" | "erro" | "mes" }> {
  if (!/^\d{4}-\d{2}$/.test(mes)) return { ok: false, motivo: "mes" };
  if (!supabaseConfigured()) return { ok: true, resumo: resumirMes(await lerLocal(), mes) };
  const { data, error } = await db()
    .from("ai_logs")
    .select("dia, origem, ferramentas, erro, entrada, saida")
    .gte("dia", mes + "-01")
    .lt("dia", proximoMes(mes))
    .limit(MAX);
  if (error) return { ok: false, motivo: tabelaAusente(error) ? "tabela" : "erro" };
  const linhas = (data || [])
    .map((row) =>
      limparRegistro({
        dia: row.dia,
        origem: row.origem,
        ferramentas: String(row.ferramentas || "")
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
        erro: row.erro === true,
        entrada: row.entrada,
        saida: row.saida,
      })
    )
    .filter((r): r is RegistroUso => !!r);
  return { ok: true, resumo: resumirMes(linhas, mes) };
}
