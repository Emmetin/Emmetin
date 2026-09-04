// Работа с Яндекс.Геокодером (HTTP Geocoder API) для проверки и нормализации адресов.
// Документация: https://yandex.ru/dev/geocode/doc/ru/

// Примерный bbox большой Москвы (с областью), используется чтобы приоритизировать
// результаты геокодирования в московском регионе.
const MOSCOW_BBOX = "36.4,55.14~38.4,56.05";

export type GeocodePrecision =
  | "exact"
  | "number"
  | "near"
  | "range"
  | "street"
  | "other"
  | "unknown";

export interface GeocodeResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  precision: GeocodePrecision;
  isMoscow: boolean;
}

interface YandexGeocodeResponse {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{
        GeoObject: {
          Point: { pos: string };
          metaDataProperty: {
            GeocoderMetaData: {
              precision?: string;
              text?: string;
              AddressDetails?: {
                Country?: {
                  AdministrativeArea?: {
                    AdministrativeAreaName?: string;
                    Locality?: { LocalityName?: string };
                    SubAdministrativeArea?: {
                      Locality?: { LocalityName?: string };
                    };
                  };
                };
              };
            };
          };
        };
      }>;
    };
  };
}

function isPrecision(value: string | undefined): GeocodePrecision {
  const known: GeocodePrecision[] = [
    "exact",
    "number",
    "near",
    "range",
    "street",
    "other",
  ];
  return known.includes(value as GeocodePrecision)
    ? (value as GeocodePrecision)
    : "unknown";
}

function extractMoscowFlag(text: string): boolean {
  return /москва/i.test(text);
}

/**
 * Обращается к Яндекс.Геокодеру и возвращает до `results` вариантов адреса.
 * Возвращает пустой массив, если ключ API не настроен или запрос не удался —
 * в этом случае адрес должен уйти на ручную проверку администратором.
 */
export async function geocodeAddress(
  query: string,
  results = 1
): Promise<GeocodeResult[]> {
  const apiKey = process.env.YANDEX_GEOCODER_API_KEY;
  if (!apiKey || !query.trim()) {
    return [];
  }

  const url = new URL("https://geocode-maps.yandex.ru/1.x/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("geocode", query);
  url.searchParams.set("results", String(results));
  url.searchParams.set("bbox", MOSCOW_BBOX);
  url.searchParams.set("rspn", "0"); // не отсекаем жёстко — только приоритизируем

  const res = await fetch(url.toString(), {
    // Геокодирование адресов не должно кэшироваться слишком долго
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as YandexGeocodeResponse;
  const members = data.response?.GeoObjectCollection?.featureMember ?? [];

  return members
    .map((member): GeocodeResult | null => {
      const geoObject = member.GeoObject;
      const pos = geoObject?.Point?.pos;
      if (!pos) return null;
      const [lngStr, latStr] = pos.split(" ");
      const lng = Number(lngStr);
      const lat = Number(latStr);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

      const meta = geoObject.metaDataProperty.GeocoderMetaData;
      const formattedAddress = meta.text ?? query;

      return {
        formattedAddress,
        lat,
        lng,
        precision: isPrecision(meta.precision),
        isMoscow: extractMoscowFlag(formattedAddress),
      };
    })
    .filter((r): r is GeocodeResult => r !== null);
}

/**
 * Считаем адрес "надёжно определённым", если геокодер попал точно в дом/номер
 * и результат относится к Москве. Иначе объект нужно отправлять в очередь
 * "требует внимания" для ручной проверки администратором.
 */
export function isReliableGeocode(result: GeocodeResult): boolean {
  return (
    result.isMoscow &&
    (result.precision === "exact" || result.precision === "number")
  );
}
