"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewLite {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  lunchComposition: string;
  price: number | null;
  createdAt: string;
}

interface RestaurantWithReview {
  id: string;
  name: string;
  addressInput: string;
  addressResolved: string | null;
  moderationNote: string | null;
  status: string;
  reviews: ReviewLite[];
}

interface PendingReview extends ReviewLite {
  restaurant: { id: string; name: string; addressResolved: string | null; addressInput: string };
}

interface Props {
  initialNeedsAttention: RestaurantWithReview[];
  initialPendingRestaurants: RestaurantWithReview[];
  initialPendingReviews: PendingReview[];
}

export default function AdminDashboard({
  initialNeedsAttention,
  initialPendingRestaurants,
  initialPendingReviews,
}: Props) {
  const router = useRouter();
  const [needsAttention, setNeedsAttention] = useState(initialNeedsAttention);
  const [pendingRestaurants, setPendingRestaurants] = useState(initialPendingRestaurants);
  const [pendingReviews, setPendingReviews] = useState(initialPendingReviews);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addressDrafts, setAddressDrafts] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function callRestaurantAction(id: string, action: string, extra?: Record<string, unknown>) {
    setBusyId(id);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Ошибка");
        return null;
      }
      return data;
    } finally {
      setBusyId(null);
    }
  }

  async function callReviewAction(id: string, action: string) {
    setBusyId(id);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Ошибка");
        return null;
      }
      return data;
    } finally {
      setBusyId(null);
    }
  }

  async function approveRestaurant(id: string, fromList: "needsAttention" | "pending") {
    const result = await callRestaurantAction(id, "approve");
    if (!result) return;
    if (fromList === "needsAttention") setNeedsAttention((l) => l.filter((r) => r.id !== id));
    else setPendingRestaurants((l) => l.filter((r) => r.id !== id));
  }

  async function rejectRestaurant(id: string, fromList: "needsAttention" | "pending") {
    const result = await callRestaurantAction(id, "reject");
    if (!result) return;
    if (fromList === "needsAttention") setNeedsAttention((l) => l.filter((r) => r.id !== id));
    else setPendingRestaurants((l) => l.filter((r) => r.id !== id));
  }

  async function updateAddress(id: string, fallbackAddress: string) {
    const address = addressDrafts[id] ?? fallbackAddress;
    if (!address || address.trim().length < 5) {
      setErrorMsg("Введите корректный адрес");
      return;
    }
    const result = await callRestaurantAction(id, "update-address", { address });
    if (!result) return;
    const updated = result.restaurant as RestaurantWithReview;
    if (updated.status === "PENDING") {
      // адрес подтверждён — переносим в очередь "ожидают публикации"
      setNeedsAttention((l) => l.filter((r) => r.id !== id));
      setPendingRestaurants((l) => {
        const existing = l.find((r) => r.id === id);
        const merged = existing ? { ...existing, ...updated } : { ...updated, reviews: [] };
        return [...l.filter((r) => r.id !== id), merged];
      });
    } else {
      setNeedsAttention((l) => l.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    }
  }

  async function approveReview(id: string) {
    const result = await callReviewAction(id, "approve");
    if (!result) return;
    setPendingReviews((l) => l.filter((r) => r.id !== id));
  }

  async function rejectReview(id: string) {
    const result = await callReviewAction(id, "reject");
    if (!result) return;
    setPendingReviews((l) => l.filter((r) => r.id !== id));
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Панель модерации</h1>
        <button onClick={logout} className="text-sm text-neutral-500 underline hover:text-neutral-800">
          Выйти
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Требует внимания <span className="text-neutral-400">({needsAttention.length})</span>
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Адрес не удалось однозначно определить по карте — уточните адрес и подтвердите координаты
          перед публикацией.
        </p>
        <div className="space-y-4">
          {needsAttention.length === 0 && (
            <p className="text-sm text-neutral-400">Пусто — все адреса определены корректно.</p>
          )}
          {needsAttention.map((r) => (
            <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-1 font-medium text-neutral-900">{r.name}</div>
              <div className="mb-2 text-sm text-neutral-600">Введённый адрес: {r.addressInput}</div>
              {r.moderationNote && (
                <div className="mb-3 text-sm text-amber-700">⚠ {r.moderationNote}</div>
              )}
              {r.reviews[0] && (
                <div className="mb-3 rounded-lg bg-white p-3 text-sm text-neutral-700">
                  <div className="mb-1">
                    {r.reviews[0].authorName} · оценка {r.reviews[0].rating}/5
                  </div>
                  <div>{r.reviews[0].text}</div>
                  <div className="mt-1 text-neutral-500">Ланч: {r.reviews[0].lunchComposition}</div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="flex-1 min-w-[220px] rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="Уточнённый адрес, Москва, ..."
                  value={addressDrafts[r.id] ?? r.addressInput}
                  onChange={(e) => setAddressDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                />
                <button
                  disabled={busyId === r.id}
                  onClick={() => updateAddress(r.id, r.addressInput)}
                  className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
                >
                  Проверить адрес
                </button>
                <button
                  disabled={busyId === r.id}
                  onClick={() => rejectRestaurant(r.id, "needsAttention")}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Новые заведения <span className="text-neutral-400">({pendingRestaurants.length})</span>
        </h2>
        <div className="space-y-4">
          {pendingRestaurants.length === 0 && (
            <p className="text-sm text-neutral-400">Пусто.</p>
          )}
          {pendingRestaurants.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="mb-1 font-medium text-neutral-900">{r.name}</div>
              <div className="mb-2 text-sm text-neutral-600">{r.addressResolved ?? r.addressInput}</div>
              {r.reviews[0] && (
                <div className="mb-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
                  <div className="mb-1">
                    {r.reviews[0].authorName} · оценка {r.reviews[0].rating}/5
                  </div>
                  <div>{r.reviews[0].text}</div>
                  <div className="mt-1 text-neutral-500">Ланч: {r.reviews[0].lunchComposition}</div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  disabled={busyId === r.id}
                  onClick={() => approveRestaurant(r.id, "pending")}
                  className="rounded-lg bg-brand-500 px-3 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  Опубликовать
                </button>
                <button
                  disabled={busyId === r.id}
                  onClick={() => rejectRestaurant(r.id, "pending")}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Новые отзывы <span className="text-neutral-400">({pendingReviews.length})</span>
        </h2>
        <div className="space-y-4">
          {pendingReviews.length === 0 && <p className="text-sm text-neutral-400">Пусто.</p>}
          {pendingReviews.map((rv) => (
            <div key={rv.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="mb-1 font-medium text-neutral-900">{rv.restaurant.name}</div>
              <div className="mb-2 text-sm text-neutral-500">
                {rv.restaurant.addressResolved ?? rv.restaurant.addressInput}
              </div>
              <div className="mb-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
                <div className="mb-1">
                  {rv.authorName} · оценка {rv.rating}/5
                </div>
                <div>{rv.text}</div>
                <div className="mt-1 text-neutral-500">Ланч: {rv.lunchComposition}</div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busyId === rv.id}
                  onClick={() => approveReview(rv.id)}
                  className="rounded-lg bg-brand-500 px-3 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  Опубликовать
                </button>
                <button
                  disabled={busyId === rv.id}
                  onClick={() => rejectReview(rv.id)}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
