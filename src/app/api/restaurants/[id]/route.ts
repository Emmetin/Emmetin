import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Детали заведения: адрес, актуальный состав ланча и все опубликованные отзывы.
// Открывается при клике на точку на карте.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: params.id, status: "APPROVED" },
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
        },
      },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Заведение не найдено" }, { status: 404 });
  }

  const avgRating =
    restaurant.reviews.length > 0
      ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length
      : null;

  return NextResponse.json({
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.addressResolved ?? restaurant.addressInput,
    lat: restaurant.lat,
    lng: restaurant.lng,
    avgRating,
    currentLunch: restaurant.reviews[0]
      ? {
          composition: restaurant.reviews[0].lunchComposition,
          price: restaurant.reviews[0].price,
          updatedAt: restaurant.reviews[0].createdAt,
        }
      : null,
    reviews: restaurant.reviews,
  });
}
