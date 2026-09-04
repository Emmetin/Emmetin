import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";

// Прокси к Яндекс.Геокодеру для автодополнения адреса в форме отправки отзыва.
// Ключ API хранится на сервере и не светится в браузере.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  if (!process.env.YANDEX_GEOCODER_API_KEY) {
    return NextResponse.json({ suggestions: [], geocoderConfigured: false });
  }

  const results = await geocodeAddress(q, 5);

  return NextResponse.json({
    geocoderConfigured: true,
    suggestions: results.map((r) => ({
      address: r.formattedAddress,
      lat: r.lat,
      lng: r.lng,
      precision: r.precision,
      isMoscow: r.isMoscow,
    })),
  });
}
