import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) {
    return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.review.update({
      where: { id: review.id },
      data: { status: "APPROVED", moderationNote: null },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await prisma.review.update({
      where: { id: review.id },
      data: { status: "REJECTED", moderationNote: body?.note ?? "Отклонено администратором" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
