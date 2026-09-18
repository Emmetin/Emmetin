export default function PhotoStrip({ label, urls }: { label: string; urls: string[] }) {
  if (urls.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="mb-1 text-xs font-medium text-neutral-500">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {urls.map((url) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="h-16 w-16 rounded-lg border border-neutral-200 object-cover"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
