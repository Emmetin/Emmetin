import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

// Очередь модерации администратора:
// - needsAttention: заведения, где не удалось надёжно определить адрес/координаты
// - pendingRestaurants: новые заведения, ожидающие первичной публикации
// - pendingReviews: отзывы к уже опубликованным заведениям, ожидающие модерации
export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const [needsAttention, pendingRestaurants, pendingReviews] = await Promise.all([
    prisma.restaurant.findMany({
      where: { status: "NEEDS_ATTENTION" },
      orderBy: { createdAt: "asc" },
      include: { reviews: { orderBy: { createdAt: "asc" }, take: 1 } },
    }),
    prisma.restaurant.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { reviews: { orderBy: { createdAt: "asc" }, take: 1 } },
    }),
    prisma.review.findMany({
      where: { status: "PENDING", restaurant: { status: "APPROVED" } },
      orderBy: { createdAt: "asc" },
      include: { restaurant: { select: { id: true, name: true, addressResolved: true, addressInput: true } } },
    }),
  ]);

  return NextResponse.json({ needsAttention, pendingRestaurants, pendingReviews });
}
