import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { geocodeAddress, isReliableGeocode } from "@/lib/geocode";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  const restaurant = await prisma.restaurant.findUnique({ where: { id: params.id } });
  if (!restaurant) {
    return NextResponse.json({ error: "Заведение не найдено" }, { status: 404 });
  }

  if (action === "approve") {
    if (restaurant.lat == null || restaurant.lng == null) {
      return NextResponse.json(
        { error: "Нельзя опубликовать заведение без подтверждённых координат — сначала уточните адрес" },
        { status: 422 }
      );
    }
    await prisma.$transaction([
      prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { status: "APPROVED", moderationNote: null },
      }),
      prisma.review.updateMany({
        where: { restaurantId: restaurant.id, status: "PENDING" },
        data: { status: "APPROVED" },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await prisma.$transaction([
      prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { status: "REJECTED", moderationNote: body?.note ?? "Отклонено администратором" },
      }),
      prisma.review.updateMany({
        where: { restaurantId: restaurant.id, status: "PENDING" },
        data: { status: "REJECTED" },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "update-address") {
    const newAddress = String(body?.address ?? "").trim();
    if (newAddress.length < 5) {
      return NextResponse.json({ error: "Укажите корректный адрес" }, { status: 422 });
    }

    const results = await geocodeAddress(newAddress, 1);
    const best = results[0];
    const reliable = best ? isReliableGeocode(best) : false;

    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        addressInput: newAddress,
        addressResolved: best?.formattedAddress ?? null,
        lat: reliable ? best!.lat : null,
        lng: reliable ? best!.lng : null,
        geoPrecision: best?.precision ?? null,
        status: reliable ? "PENDING" : "NEEDS_ATTENTION",
        moderationNote: !best
          ? "Не удалось определить координаты по адресу — проверьте адрес вручную."
          : !reliable
          ? `Геокодер вернул недостаточно точный результат (precision: ${best.precision}${
              best.isMoscow ? "" : ", вне Москвы"
            }) — уточните адрес.`
          : null,
      },
    });

    return NextResponse.json({ ok: true, restaurant: updated });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
