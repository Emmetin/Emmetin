// Минимальные типы для глобального объекта Яндекс.Карт (JS API 2.1),
// достаточные для нашего использования — без установки полновесного @types/yandex-maps.
export {};

declare global {
  interface Window {
    ymaps?: {
      ready: (callback: () => void) => void;
      Map: new (
        element: HTMLElement,
        state: { center: [number, number]; zoom: number; controls?: string[] }
      ) => YMapsMapInstance;
      Placemark: new (
        coords: [number, number],
        properties?: Record<string, unknown>,
        options?: Record<string, unknown>
      ) => YMapsPlacemarkInstance;
      Clusterer: new (options?: Record<string, unknown>) => YMapsClustererInstance;
    };
  }

  interface YMapsMapInstance {
    geoObjects: {
      add: (obj: YMapsPlacemarkInstance | YMapsClustererInstance) => void;
      removeAll: () => void;
    };
    destroy: () => void;
    setBounds?: (bounds: [[number, number], [number, number]], options?: Record<string, unknown>) => void;
  }

  interface YMapsPlacemarkInstance {
    events: {
      add: (event: string, handler: () => void) => void;
    };
  }

  interface YMapsClustererInstance {
    add: (objects: YMapsPlacemarkInstance[]) => void;
    removeAll: () => void;
  }
}
