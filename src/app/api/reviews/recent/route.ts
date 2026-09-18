import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Лента последних опубликованных отзывов для главной страницы.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20) || 20, 50);

  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED", restaurant: { status: "APPROVED" } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      authorName: true,
      rating: true,
      text: true,
      lunchComposition: true,
      price: true,
      menuPhotos: true,
      photos: true,
      createdAt: true,
      restaurant: { select: { id: true, name: true, addressResolved: true, addressInput: true } },
    },
  });

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text,
      lunchComposition: r.lunchComposition,
      price: r.price,
      menuPhotos: r.menuPhotos,
      photos: r.photos,
      createdAt: r.createdAt,
      restaurant: {
        id: r.restaurant.id,
        name: r.restaurant.name,
        address: r.restaurant.addressResolved ?? r.restaurant.addressInput,
      },
    })),
  });
}
