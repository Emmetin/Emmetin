"use client";

import { useState } from "react";
import YandexMap, { MapPoint } from "./YandexMap";
import RestaurantPanel from "./RestaurantPanel";

export default function HomeMap({ points }: { points: MapPoint[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <YandexMap points={points} onSelect={setSelectedId} />
      {points.length === 0 && (
        <p className="mt-3 text-sm text-neutral-400">
          На карте пока нет опубликованных мест — добавьте первый отзыв о бизнес-ланче.
        </p>
      )}
      {selectedId && (
        <RestaurantPanel restaurantId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
