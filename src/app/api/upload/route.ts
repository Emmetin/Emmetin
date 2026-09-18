import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Выдаёт браузеру одноразовый токен на загрузку файла напрямую в Vercel Blob,
// минуя тело нашего API-роута (у serverless-функций Vercel лимит на размер
// запроса, а фото с телефона легко его превышают).
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 МБ на файл
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Ничего дополнительно делать не нужно — URL уходит клиенту напрямую
        // и попадёт в базу вместе с остальными полями отзыва при отправке формы.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка загрузки файла" },
      { status: 400 }
    );
  }
}
