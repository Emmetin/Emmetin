"use client";

import { useEffect, useRef } from "react";

export interface MapPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  reviewsCount: number;
  latestLunch: { composition: string; price: number | null } | null;
}

const MOSCOW_CENTER: [number, number] = [55.751244, 37.618423];

let scriptLoadingPromise: Promise<void> | null = null;

function loadYandexMapsScript(apiKey: string): Promise<void> {
  if (window.ymaps) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(
      apiKey
    )}&lang=ru_RU`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить Яндекс.Карты"));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export default function YandexMap({
  points,
  onSelect,
}: {
  points: MapPoint[];
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMapsMapInstance | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false;

    loadYandexMapsScript(apiKey)
      .then(() => {
        if (cancelled || !window.ymaps || !containerRef.current) return;
        window.ymaps.ready(() => {
          if (cancelled || !window.ymaps || !containerRef.current) return;
          const map = new window.ymaps.Map(containerRef.current, {
            center: MOSCOW_CENTER,
            zoom: 11,
            controls: ["zoomControl", "geolocationControl"],
          });
          mapRef.current = map;
          renderPoints(map, points, onSelect);
        });
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    if (mapRef.current) {
      renderPoints(mapRef.current, points, onSelect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  if (!apiKey) {
    return (
      <div className="flex h-[420px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center text-sm text-neutral-500">
        <p className="mb-2 font-medium text-neutral-700">Карта не настроена</p>
        <p>
          Задайте переменную окружения <code className="rounded bg-neutral-200 px-1">NEXT_PUBLIC_YANDEX_MAPS_API_KEY</code>{" "}
          — ключ JS API Яндекс.Карт, чтобы включить интерактивную карту.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-[420px] w-full rounded-xl border border-neutral-200" />;
}

function renderPoints(
  map: YMapsMapInstance,
  points: MapPoint[],
  onSelect: (id: string) => void
) {
  if (!window.ymaps) return;
  map.geoObjects.removeAll();

  const clusterer = new window.ymaps.Clusterer({
    preset: "islands#orangeClusterIcons",
    groupByCoordinates: false,
  });

  const placemarks = points.map((point) => {
    const balloonLunch = point.latestLunch
      ? `<div style="margin-top:4px;color:#57534e">Ланч: ${escapeHtml(point.latestLunch.composition)}${
          point.latestLunch.price ? ` · ${point.latestLunch.price} ₽` : ""
        }</div>`
      : "";

    const placemark = new window.ymaps!.Placemark(
      [point.lat, point.lng],
      {
        balloonContentHeader: escapeHtml(point.name),
        balloonContentBody: `<div>${escapeHtml(point.address)}</div>${balloonLunch}<div style="margin-top:4px;color:#a8a29e">Отзывов: ${point.reviewsCount}</div>`,
        hintContent: point.name,
      },
      { preset: "islands#orangeDotIcon" }
    );
    placemark.events.add("click", () => onSelect(point.id));
    return placemark;
  });

  clusterer.add(placemarks);
  map.geoObjects.add(clusterer);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
