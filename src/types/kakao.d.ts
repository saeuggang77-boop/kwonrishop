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
}

declare global {
  interface Window {
    kakao?: {
      maps?: KakaoMaps;
    };
  }
}

export {};
