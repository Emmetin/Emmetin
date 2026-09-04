"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface AddressSuggestion {
  address: string;
  lat: number;
  lng: number;
  precision: string;
  isMoscow: boolean;
}

interface ExistingRestaurant {
  id: string;
  name: string;
  address: string;
}

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none ${n <= value ? "text-amber-500" : "text-neutral-300"}`}
          aria-label={`${n} из 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function SubmitForm() {
  const searchParams = useSearchParams();
  const presetRestaurantId = searchParams.get("restaurantId");

  const [existingRestaurant, setExistingRestaurant] = useState<ExistingRestaurant | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(presetRestaurantId));

  // Поля формы нового заведения
  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressConfirmed, setAddressConfirmed] = useState<AddressSuggestion | null>(null);
  const [geocoderConfigured, setGeocoderConfigured] = useState<boolean | null>(null);

  // Похожие заведения по названию (чтобы не плодить дубликаты)
  const [similar, setSimilar] = useState<ExistingRestaurant[]>([]);

  // Общие поля отзыва
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [lunchComposition, setLunchComposition] = useState("");
  const [price, setPrice] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<null | { needsAttention: boolean }>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const addressDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!presetRestaurantId) return;
    let cancelled = false;
    fetch(`/api/restaurants/${presetRestaurantId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Заведение не найдено");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setExistingRestaurant({ id: data.id, name: data.name, address: data.address });
        }
      })
      .catch(() => {
        if (!cancelled) setExistingRestaurant(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [presetRestaurantId]);

  function handleAddressChange(value: string) {
    setAddress(value);
    setAddressConfirmed(null);
    if (addressDebounce.current) clearTimeout(addressDebounce.current);
    if (value.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    addressDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setGeocoderConfigured(data.geocoderConfigured ?? false);
        setAddressSuggestions(data.suggestions ?? []);
      } catch {
        setAddressSuggestions([]);
      }
    }, 400);
  }

  function handleNameChange(value: string) {
    setRestaurantName(value);
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    if (value.trim().length < 2) {
      setSimilar([]);
      return;
    }
    nameDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/restaurants/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSimilar(data.results ?? []);
      } catch {
        setSimilar([]);
      }
    }, 400);
  }

  const isExistingMode = Boolean(presetRestaurantId);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!authorName.trim() || !text.trim() || !lunchComposition.trim()) return false;
    if (isExistingMode) return Boolean(existingRestaurant);
    return restaurantName.trim().length >= 2 && address.trim().length >= 5;
  }, [submitting, authorName, text, lunchComposition, isExistingMode, existingRestaurant, restaurantName, address]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);

    const payload: Record<string, unknown> = {
      authorName,
      rating,
      text,
      lunchComposition,
      price: price === "" ? null : Number(price),
    };

    if (isExistingMode && existingRestaurant) {
      payload.restaurantId = existingRestaurant.id;
    } else {
      payload.restaurantName = restaurantName;
      payload.address = addressConfirmed?.address ?? address;
    }

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          const map: Record<string, string> = {};
          for (const err of data.errors) map[err.field] = err.message;
          setErrors(map);
        } else {
          setGlobalError(data.error ?? "Не удалось отправить отзыв");
        }
        return;
      }

      setSuccess({ needsAttention: Boolean(data.needsAttention) });
    } catch {
      setGlobalError("Ошибка сети — попробуйте ещё раз");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-brand-100 bg-brand-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-brand-700">Спасибо! Отзыв отправлен</h2>
        <p className="text-sm text-neutral-700">
          {success.needsAttention
            ? "Мы не смогли автоматически определить точку на карте по указанному адресу — администратор проверит его вручную, после чего заведение появится на карте."
            : "Ваш отзыв уйдёт на модерацию и появится на карте и в ленте после проверки."}
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand-700 underline">
          Вернуться на карту
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isExistingMode ? (
        <div className="rounded-lg bg-neutral-50 p-3">
          <div className="text-xs uppercase text-neutral-400">Заведение</div>
          {loadingExisting ? (
            <p className="text-sm text-neutral-500">Загрузка…</p>
          ) : existingRestaurant ? (
            <>
              <div className="font-medium text-neutral-900">{existingRestaurant.name}</div>
              <div className="text-sm text-neutral-500">{existingRestaurant.address}</div>
            </>
          ) : (
            <p className="text-sm text-red-600">Заведение не найдено. Заполните форму нового места ниже.</p>
          )}
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Название заведения</label>
            <input
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              value={restaurantName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Например, Кафе «Пушкинъ»"
            />
            {errors.restaurantName && <p className="mt-1 text-xs text-red-600">{errors.restaurantName}</p>}
            {similar.length > 0 && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                Возможно, это заведение уже есть на сайте:
                <ul className="mt-1 space-y-1">
                  {similar.map((s) => (
                    <li key={s.id}>
                      <Link href={`/submit?restaurantId=${s.id}`} className="underline">
                        {s.name} — {s.address}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-neutral-700">Адрес (Москва)</label>
            <input
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Москва, улица, дом"
            />
            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
            {geocoderConfigured === false && (
              <p className="mt-1 text-xs text-neutral-400">
                Автоподбор адреса по карте не настроен — адрес проверит администратор вручную.
              </p>
            )}
            {addressConfirmed && (
              <p className="mt-1 text-xs text-brand-700">✓ Адрес найден на карте: {addressConfirmed.address}</p>
            )}
            {addressSuggestions.length > 0 && !addressConfirmed && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
                {addressSuggestions.map((s, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setAddress(s.address);
                        setAddressConfirmed(s);
                        setAddressSuggestions([]);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    >
                      {s.address}
                      {!s.isMoscow && <span className="ml-1 text-xs text-amber-600">(вне Москвы?)</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Ваше имя</label>
        <input
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
        {errors.authorName && <p className="mt-1 text-xs text-red-600">{errors.authorName}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Оценка</label>
        <RatingInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Отзыв</label>
        <textarea
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {errors.text && <p className="mt-1 text-xs text-red-600">{errors.text}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Состав бизнес-ланча (на сегодня)
        </label>
        <input
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          value={lunchComposition}
          onChange={(e) => setLunchComposition(e.target.value)}
          placeholder="Суп, горячее, напиток"
        />
        {errors.lunchComposition && <p className="mt-1 text-xs text-red-600">{errors.lunchComposition}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Цена, ₽ (необязательно)</label>
        <input
          type="number"
          min={0}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
      </div>

      {globalError && <p className="text-sm text-red-600">{globalError}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {submitting ? "Отправляем…" : "Отправить на модерацию"}
      </button>
    </form>
  );
}
