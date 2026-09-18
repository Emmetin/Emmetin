"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export default function PhotoUploader({
  label,
  max,
  urls,
  onChange,
  disabled,
}: {
  label: string;
  max: number;
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = max - urls.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const files = Array.from(fileList).slice(0, remaining);

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Можно загружать только изображения (JPEG, PNG, WEBP, HEIC)");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Файл слишком большой (максимум 10 МБ)");
        continue;
      }
      setUploading(true);
      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        onChange([...urls, blob.url]);
      } catch {
        setError("Не удалось загрузить фото — попробуйте ещё раз");
      } finally {
        setUploading(false);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function removePhoto(url: string) {
    onChange(urls.filter((u) => u !== url));
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">
        {label} <span className="text-neutral-400">({urls.length}/{max})</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              disabled={disabled}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
              aria-label="Удалить фото"
            >
              ✕
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-brand-400 hover:text-brand-500 disabled:opacity-50"
          >
            <span className="text-xl leading-none">+</span>
            <span className="text-[10px]">{uploading ? "Загрузка…" : "Добавить"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
