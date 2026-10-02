// Sessão simples para um único usuário: cookie assinado com HMAC-SHA256.
// Usa Web Crypto, então funciona no middleware (Edge) e nas rotas (Node).
export const COOKIE = "portal_session";
const MAX_AGE_DAYS = 30;

function enc(s: string) {
  return new TextEncoder().encode(s);
}
function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hmac(data: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET ausente ou curto demais");
  const key = await crypto.subtle.importKey("raw", enc(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc(data)));
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function createToken() {
  const exp = Date.now() + MAX_AGE_DAYS * 864e5;
  const payload = `tiago.${exp}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyToken(token?: string | null) {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const exp = Number(payload.split(".")[1]);
  if (!exp || exp < Date.now()) return false;
  try {
    return safeEqual(sig, await hmac(payload));
  } catch {
    return false;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_DAYS * 86400,
};
