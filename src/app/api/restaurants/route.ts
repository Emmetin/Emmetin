import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Список одобренных заведений с координатами — для отображения точек на карте.
export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      status: "APPROVED",
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true,
      name: true,
      addressResolved: true,
      addressInput: true,
      lat: true,
      lng: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { lunchComposition: true, price: true, createdAt: true, rating: true },
      },
      _count: {
        select: { reviews: { where: { status: "APPROVED" } } },
      },
    },
  });

  const points = restaurants.map((r) => {
    return {
      id: r.id,
      name: r.name,
      address: r.addressResolved ?? r.addressInput,
      lat: r.lat,
      lng: r.lng,
      reviewsCount: r._count.reviews,
      latestLunch: r.reviews[0]
        ? {
            composition: r.reviews[0].lunchComposition,
            price: r.reviews[0].price,
            updatedAt: r.reviews[0].createdAt,
          }
        : null,
    };
  });

  return NextResponse.json({ points });
}
