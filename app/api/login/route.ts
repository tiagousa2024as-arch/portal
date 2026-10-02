import { NextResponse } from "next/server";
import { COOKIE, cookieOptions, createToken } from "@/lib/session";

export async function POST(req: Request) {
  const form = await req.formData();
  const senha = String(form.get("senha") ?? "");
  const certa = process.env.PORTAL_PASSWORD ?? "";
  // Pequeno atraso para dificultar tentativa e erro.
  await new Promise((r) => setTimeout(r, 400));
  if (!certa || senha !== certa) {
    return NextResponse.redirect(new URL("/login?erro=1", req.url), 303);
  }
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set(COOKIE, await createToken(), cookieOptions);
  return res;
}
