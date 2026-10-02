import { promises as fs } from "fs";
import path from "path";

const file = path.join(process.cwd(), "data", "portal-state.json");

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function readLocalState(): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { data?: unknown };
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export async function writeLocalState(data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  const body = JSON.stringify({ data, updated_at: new Date().toISOString() });
  await fs.writeFile(tmp, body, "utf8");
  await fs.rm(file, { force: true });
  await fs.rename(tmp, file);
}
