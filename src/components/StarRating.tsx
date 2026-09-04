export default function StarRating({ rating, size = "text-base" }: { rating: number; size?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={`${size} text-amber-500`} aria-label={`Оценка ${rating} из 5`}>
      {"★".repeat(rounded)}
      <span className="text-neutral-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}
