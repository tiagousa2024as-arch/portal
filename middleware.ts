import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifyToken } from "@/lib/session";

// Tudo exige login, menos a página de login, a rota de login e os arquivos públicos do app.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const open =
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/portal.css" ||
    pathname === "/portal.js" ||
    pathname === "/motion.js" ||
    pathname.startsWith("/icon");
  if (open) return NextResponse.next();

  const ok = await verifyToken(req.cookies.get(COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
