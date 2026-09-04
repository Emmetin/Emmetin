import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.restaurant.count();
  if (existing > 0) {
    console.log("База уже содержит данные, пропускаю сид.");
    return;
  }

  await prisma.restaurant.create({
    data: {
      name: "Кафе «Пушкинъ»",
      addressInput: "Москва, Тверской бульвар, 26А",
      addressResolved: "Россия, Москва, Тверской бульвар, 26А",
      lat: 55.765274,
      lng: 37.596011,
      geoPrecision: "exact",
      status: "APPROVED",
      reviews: {
        create: [
          {
            authorName: "Анна",
            rating: 5,
            text: "Отличный бизнес-ланч, быстро обслужили, порции большие.",
            lunchComposition: "Крем-суп из тыквы, котлета по-киевски, морс",
            price: 890,
            status: "APPROVED",
          },
          {
            authorName: "Дмитрий",
            rating: 4,
            text: "Вкусно, но в обед очередь — лучше бронировать столик заранее.",
            lunchComposition: "Салат Цезарь, паста карбонара, чай",
            price: 890,
            status: "APPROVED",
          },
        ],
      },
    },
  });

  await prisma.restaurant.create({
    data: {
      name: "Му-Му на Тверской",
      addressInput: "Москва, Тверская улица, 10",
      addressResolved: "Россия, Москва, Тверская улица, 10",
      lat: 55.762453,
      lng: 37.609515,
      geoPrecision: "exact",
      status: "APPROVED",
      reviews: {
        create: [
          {
            authorName: "Ольга",
            rating: 4,
            text: "Демократичные цены, состав ланча меняется каждый день.",
            lunchComposition: "Борщ, гречка с котлетой, компот",
            price: 450,
            status: "APPROVED",
          },
        ],
      },
    },
  });

  await prisma.restaurant.create({
    data: {
      name: "Novikov Family (пример на модерации)",
      addressInput: "Москва, где-то возле Кремля",
      status: "NEEDS_ATTENTION",
      moderationNote:
        "Геокодер не смог однозначно определить точку по введённому адресу — уточните адрес.",
      reviews: {
        create: [
          {
            authorName: "Игорь",
            rating: 3,
            text: "Заведение видел своими глазами, но точный адрес не указал.",
            lunchComposition: "Суп дня, бизнес-сет, компот",
            price: 700,
            status: "PENDING",
          },
        ],
      },
    },
  });

  console.log("Сид базы данных выполнен.");
  console.log(
    "Не забудьте задать ADMIN_LOGIN / ADMIN_PASSWORD_HASH в .env. Пример хеша для пароля 'admin':",
    bcrypt.hashSync("admin", 10)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
