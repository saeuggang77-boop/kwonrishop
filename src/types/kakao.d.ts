/* eslint-disable @typescript-eslint/no-explicit-any */
interface KakaoMaps {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => any;
  Map: new (container: HTMLElement, options: any) => any;
  Marker: new (options: any) => any;
  InfoWindow: new (options: any) => any;
  LatLngBounds: new () => any;
  event: {
    addListener: (target: any, type: string, handler: () => void) => void;
  };
  services: {
    Geocoder: new () => {
      addressSearch: (
        address: string,
        callback: (result: Array<{ x: string; y: string }>, status: string) => void
      ) => void;
    };
    Status: {
      OK: string;
      ZERO_RESULT: string;
      ERROR: string;
    };
  };
}

declare global {
  interface Window {
    kakao?: {
      maps?: KakaoMaps;
    };
  }
}

export {};
