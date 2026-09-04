import { Suspense } from "react";
import SubmitForm from "./SubmitForm";

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Оставить отзыв</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Заполните форму — после проверки адреса и модерации отзыв появится на карте.
      </p>
      <Suspense fallback={<p className="text-sm text-neutral-400">Загрузка…</p>}>
        <SubmitForm />
      </Suspense>
    </div>
  );
}
