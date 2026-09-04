export interface SubmissionInput {
  restaurantName: string;
  address: string;
  authorName: string;
  rating: number;
  text: string;
  lunchComposition: string;
  price?: number | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateSubmission(input: Partial<SubmissionInput>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.restaurantName || input.restaurantName.trim().length < 2) {
    errors.push({ field: "restaurantName", message: "Укажите название заведения (минимум 2 символа)" });
  }
  if (!input.address || input.address.trim().length < 5) {
    errors.push({ field: "address", message: "Укажите полный адрес в Москве" });
  }
  if (!input.authorName || input.authorName.trim().length < 2) {
    errors.push({ field: "authorName", message: "Укажите ваше имя" });
  }
  if (!input.rating || input.rating < 1 || input.rating > 5) {
    errors.push({ field: "rating", message: "Оценка должна быть от 1 до 5" });
  }
  if (!input.text || input.text.trim().length < 10) {
    errors.push({ field: "text", message: "Отзыв слишком короткий (минимум 10 символов)" });
  }
  if (!input.lunchComposition || input.lunchComposition.trim().length < 3) {
    errors.push({ field: "lunchComposition", message: "Опишите состав бизнес-ланча" });
  }
  if (input.price != null && (input.price < 0 || input.price > 100000)) {
    errors.push({ field: "price", message: "Некорректная цена" });
  }

  return errors;
}

export interface ReviewOnlyInput {
  restaurantId: string;
  authorName: string;
  rating: number;
  text: string;
  lunchComposition: string;
  price?: number | null;
}

export function validateReviewOnly(input: Partial<ReviewOnlyInput>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!input.restaurantId) {
    errors.push({ field: "restaurantId", message: "Не выбрано заведение" });
  }
  if (!input.authorName || input.authorName.trim().length < 2) {
    errors.push({ field: "authorName", message: "Укажите ваше имя" });
  }
  if (!input.rating || input.rating < 1 || input.rating > 5) {
    errors.push({ field: "rating", message: "Оценка должна быть от 1 до 5" });
  }
  if (!input.text || input.text.trim().length < 10) {
    errors.push({ field: "text", message: "Отзыв слишком короткий (минимум 10 символов)" });
  }
  if (!input.lunchComposition || input.lunchComposition.trim().length < 3) {
    errors.push({ field: "lunchComposition", message: "Опишите состав бизнес-ланча" });
  }
  return errors;
}
