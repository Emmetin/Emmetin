import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Бизнес-ланчи Москвы",
  description:
    "Карта проверенных бизнес-ланчей Москвы с отзывами и актуальным составом меню.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-neutral-900 antialiased">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-neutral-900">
              🍽️ Бизнес-ланчи Москвы
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-neutral-600 hover:text-neutral-900">
                Карта
              </Link>
              <Link
                href="/submit"
                className="rounded-lg bg-brand-500 px-3 py-1.5 font-medium text-white hover:bg-brand-600"
              >
                Оставить отзыв
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-16 border-t border-neutral-200 py-8 text-center text-xs text-neutral-400">
          Все места публикуются после модерации. Данные о бизнес-ланчах основаны на отзывах
          пользователей и могут устаревать.
        </footer>
      </body>
    </html>
  );
}
