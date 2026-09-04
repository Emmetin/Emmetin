import { NextRequest, NextResponse } from "next/server";

// Middleware выполняется в Edge Runtime, где недоступен Node.js crypto,
// поэтому здесь только быстрая проверка наличия cookie для редиректа на логин.
// Полная криптографическая проверка подписи сессии выполняется в Node.js
// runtime — в самих admin-страницах и в защищённых API-роутах (см. src/lib/auth.ts).
const ADMIN_COOKIE_NAME = "admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
