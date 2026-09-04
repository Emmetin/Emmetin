import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Поиск уже одобренных заведений по названию — используется на странице
// добавления отзыва, чтобы не плодить дубликаты ресторанов.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.restaurant.findMany({
    where: {
      status: "APPROVED",
      name: { contains: q },
    },
    select: { id: true, name: true, addressResolved: true, addressInput: true },
    take: 10,
  });

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.addressResolved ?? r.addressInput,
    })),
  });
}
