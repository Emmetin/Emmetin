"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StarRating from "./StarRating";
import PhotoStrip from "./PhotoStrip";

interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  lunchComposition: string;
  price: number | null;
  menuPhotos: string[];
  photos: string[];
  createdAt: string;
}

interface RestaurantDetail {
  id: string;
  name: string;
  address: string;
  avgRating: number | null;
  currentLunch: { composition: string; price: number | null; updatedAt: string } | null;
  reviews: ReviewItem[];
}

export default function RestaurantPanel({
  restaurantId,
  onClose,
}: {
  restaurantId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/restaurants/${restaurantId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить заведение");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            {data?.name ?? (loading ? "Загрузка…" : "Заведение")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-neutral-400">Загружаем данные о заведении…</p>}

        {data && (
          <>
            <p className="mb-3 text-sm text-neutral-500">{data.address}</p>

            {data.avgRating != null && (
              <div className="mb-4 flex items-center gap-2">
                <StarRating rating={data.avgRating} />
                <span className="text-sm text-neutral-500">
                  {data.avgRating.toFixed(1)} · {data.reviews.length} отзывов
                </span>
              </div>
            )}

            {data.currentLunch && (
              <div className="mb-5 rounded-xl bg-brand-50 p-4">
                <div className="mb-1 text-sm font-medium text-brand-700">
                  Актуальный состав бизнес-ланча
                </div>
                <div className="text-sm text-neutral-700">{data.currentLunch.composition}</div>
                {data.currentLunch.price != null && (
                  <div className="mt-1 text-sm font-medium text-neutral-900">
                    {data.currentLunch.price} ₽
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <Link
                href={`/submit?restaurantId=${data.id}`}
                className="inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Оставить отзыв об этом месте
              </Link>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-neutral-900">Отзывы</h3>
            <div className="space-y-3">
              {data.reviews.length === 0 && (
                <p className="text-sm text-neutral-400">Пока нет опубликованных отзывов.</p>
              )}
              {data.reviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-800">{r.authorName}</span>
                    <StarRating rating={r.rating} size="text-sm" />
                  </div>
                  <p className="mb-1 text-sm text-neutral-700">{r.text}</p>
                  <p className="text-xs text-neutral-500">
                    Ланч: {r.lunchComposition}
                    {r.price != null ? ` · ${r.price} ₽` : ""}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                  <PhotoStrip label="Меню ланча" urls={r.menuPhotos} />
                  <PhotoStrip label="Фото" urls={r.photos} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
