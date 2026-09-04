import { prisma } from "@/lib/db";
import HomeMap from "@/components/HomeMap";
import ReviewFeed from "@/components/ReviewFeed";

export const dynamic = "force-dynamic";

async function getPoints() {
  const restaurants = await prisma.restaurant.findMany({
    where: { status: "APPROVED", lat: { not: null }, lng: { not: null } },
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
        select: { lunchComposition: true, price: true },
      },
      _count: { select: { reviews: { where: { status: "APPROVED" } } } },
    },
  });

  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.addressResolved ?? r.addressInput,
    lat: r.lat as number,
    lng: r.lng as number,
    reviewsCount: r._count.reviews,
    latestLunch: r.reviews[0]
      ? { composition: r.reviews[0].lunchComposition, price: r.reviews[0].price }
      : null,
  }));
}

async function getRecentReviews() {
  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED", restaurant: { status: "APPROVED" } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      authorName: true,
      rating: true,
      text: true,
      lunchComposition: true,
      price: true,
      createdAt: true,
      restaurant: { select: { id: true, name: true, addressResolved: true, addressInput: true } },
    },
  });

  return reviews.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    text: r.text,
    lunchComposition: r.lunchComposition,
    price: r.price,
    createdAt: r.createdAt.toISOString(),
    restaurant: {
      id: r.restaurant.id,
      name: r.restaurant.name,
      address: r.restaurant.addressResolved ?? r.restaurant.addressInput,
    },
  }));
}

export default async function HomePage() {
  const [points, recentReviews] = await Promise.all([getPoints(), getRecentReviews()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
          Бизнес-ланчи Москвы на карте
        </h1>
        <p className="text-sm text-neutral-500">
          Все точки прошли модерацию. Нажмите на метку, чтобы увидеть актуальный состав ланча и
          отзывы.
        </p>
      </div>

      <HomeMap points={points} />

      <div className="mt-12">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900">Свежие отзывы</h2>
        <ReviewFeed reviews={recentReviews} />
      </div>
    </div>
  );
}
