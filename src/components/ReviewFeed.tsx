import StarRating from "./StarRating";
import PhotoStrip from "./PhotoStrip";

export interface FeedReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  lunchComposition: string;
  price: number | null;
  menuPhotos: string[];
  photos: string[];
  createdAt: string;
  restaurant: { id: string; name: string; address: string };
}

export default function ReviewFeed({ reviews }: { reviews: FeedReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        Пока нет опубликованных отзывов — станьте первым, кто расскажет о бизнес-ланче!
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium text-neutral-900">{r.restaurant.name}</span>
            <StarRating rating={r.rating} size="text-sm" />
          </div>
          <p className="mb-2 text-xs text-neutral-400">{r.restaurant.address}</p>
          <p className="mb-2 text-sm text-neutral-700">{r.text}</p>
          <p className="text-xs text-neutral-500">
            Ланч: {r.lunchComposition}
            {r.price != null ? ` · ${r.price} ₽` : ""}
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            {r.authorName} · {new Date(r.createdAt).toLocaleDateString("ru-RU")}
          </p>
          <PhotoStrip label="Меню ланча" urls={r.menuPhotos} />
          <PhotoStrip label="Фото" urls={r.photos} />
        </div>
      ))}
    </div>
  );
}
