import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ADMIN_COOKIE_MAX_AGE_SECONDS, ADMIN_COOKIE_NAME, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const login = body?.login as string | undefined;
  const password = body?.password as string | undefined;

  const adminLogin = process.env.ADMIN_LOGIN;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminLogin || !adminHash) {
    return NextResponse.json(
      { error: "Учётные данные администратора не настроены на сервере" },
      { status: 500 }
    );
  }

  if (!login || !password || login !== adminLogin) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, adminHash);
  if (!valid) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const token = createSessionToken(login);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
