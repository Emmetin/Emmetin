import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { geocodeAddress, isReliableGeocode } from "@/lib/geocode";
import { validateReviewOnly, validateSubmission } from "@/lib/validation";

// Приём формы с сайта: либо новое заведение + первый отзыв, либо (если передан
// restaurantId) отзыв на уже одобренное заведение. Всё уходит на модерацию.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const price =
    body.price === "" || body.price == null ? null : Number(body.price);

  // Сценарий 1: отзыв на уже существующее (одобренное) заведение.
  if (body.restaurantId) {
    const errors = validateReviewOnly({
      restaurantId: body.restaurantId,
      authorName: body.authorName,
      rating: Number(body.rating),
      text: body.text,
      lunchComposition: body.lunchComposition,
      price,
    });
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: body.restaurantId, status: "APPROVED" },
    });
    if (!restaurant) {
      return NextResponse.json(
        { errors: [{ field: "restaurantId", message: "Заведение не найдено" }] },
        { status: 404 }
      );
    }

    const review = await prisma.review.create({
      data: {
        restaurantId: restaurant.id,
        authorName: String(body.authorName).trim(),
        rating: Number(body.rating),
        text: String(body.text).trim(),
        lunchComposition: String(body.lunchComposition).trim(),
        price,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, reviewId: review.id, mode: "review-only" });
  }

  // Сценарий 2: новое заведение + первый отзыв.
  const errors = validateSubmission({
    restaurantName: body.restaurantName,
    address: body.address,
    authorName: body.authorName,
    rating: Number(body.rating),
    text: body.text,
    lunchComposition: body.lunchComposition,
    price,
  });
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const address = String(body.address).trim();
  const geocoded = await geocodeAddress(address, 1);
  const best = geocoded[0];

  const reliable = best ? isReliableGeocode(best) : false;

  const restaurant = await prisma.restaurant.create({
    data: {
      name: String(body.restaurantName).trim(),
      addressInput: address,
      addressResolved: best?.formattedAddress ?? null,
      lat: reliable ? best!.lat : null,
      lng: reliable ? best!.lng : null,
      geoPrecision: best?.precision ?? null,
      status: reliable ? "PENDING" : "NEEDS_ATTENTION",
      moderationNote: !best
        ? "Не удалось определить координаты по адресу (геокодер недоступен или ключ не настроен) — проверьте адрес вручную."
        : !reliable
        ? `Геокодер вернул недостаточно точный результат (precision: ${best.precision}${
            best.isMoscow ? "" : ", вне Москвы"
          }) — уточните адрес.`
        : null,
      reviews: {
        create: {
          authorName: String(body.authorName).trim(),
          rating: Number(body.rating),
          text: String(body.text).trim(),
          lunchComposition: String(body.lunchComposition).trim(),
          price,
          status: "PENDING",
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    restaurantId: restaurant.id,
    mode: "new-restaurant",
    needsAttention: !reliable,
  });
}
