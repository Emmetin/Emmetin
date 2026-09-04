// SQLite не поддерживает нативные enum в Prisma — статусы хранятся строками.
// Эти константы используются вместо enum по всему коду.

export const RestaurantStatus = {
  PENDING: "PENDING",
  NEEDS_ATTENTION: "NEEDS_ATTENTION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const ReviewStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
