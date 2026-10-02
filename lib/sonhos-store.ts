import { promises as fs } from "fs";
import path from "path";

const dir = path.join(process.cwd(), "data", "sonhos");

export function safePhotoName(id: string) {
  const clean = String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (!clean) return null;
  return `${clean}.jpg`;
}

export async function writeLocalPhoto(name: string, buf: Uint8Array) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
}

export async function readLocalPhoto(name: string) {
  try {
    return await fs.readFile(path.join(dir, name));
  } catch {
    return null;
  }
}
