export type TravelPhoto = {
  id: string;
  query: string;
  alt: string;
  fallbackUrl: string;
  src: string;
  creditName: string;
  creditUrl: string;
  fromApi?: boolean;
};

const unsplashImage = (photoId: string, width: number) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=75`;

export const travelPhotos = {
  hero: {
    id: 'hero',
    query: 'mountain road travel',
    alt: 'A winding road through a broad mountain valley in late afternoon light',
    fallbackUrl: unsplashImage('photo-1464822759023-fed622ff2c3b', 2200),
    src: unsplashImage('photo-1464822759023-fed622ff2c3b', 2200),
    creditName: 'Unsplash photographers',
    creditUrl: 'https://unsplash.com/license',
  },
  road: {
    id: 'road',
    query: 'road trip mountain',
    alt: 'An open road inviting travelers into a mountain landscape',
    fallbackUrl: unsplashImage('photo-1469854523086-cc02fe5d8800', 1200),
    src: unsplashImage('photo-1469854523086-cc02fe5d8800', 1200),
    creditName: 'Unsplash photographers',
    creditUrl: 'https://unsplash.com/license',
  },
  friends: {
    id: 'friends',
    query: 'friends walking travel',
    alt: 'Travelers exploring a new place together',
    fallbackUrl: unsplashImage('photo-1529156069898-49953e39b3ac', 1100),
    src: unsplashImage('photo-1529156069898-49953e39b3ac', 1100),
    creditName: 'Unsplash photographers',
    creditUrl: 'https://unsplash.com/license',
  },
  closing: {
    id: 'closing',
    query: 'mountain lake travel',
    alt: 'A calm mountain lake at the end of a day of travel',
    fallbackUrl: unsplashImage('photo-1470770841072-f978cf4d019e', 1500),
    src: unsplashImage('photo-1470770841072-f978cf4d019e', 1500),
    creditName: 'Unsplash photographers',
    creditUrl: 'https://unsplash.com/license',
  },
} satisfies Record<string, TravelPhoto>;

type ImageResponse = {
  success: boolean;
  data: {
    photo: null | {
      url: string;
      alt: string;
      photographer: string;
      photographerUrl: string;
    };
  };
};

const photoRequests = new Map<string, Promise<TravelPhoto | null>>();

/** Uses the server proxy so the Unsplash secret key never enters the client bundle. */
export function getTravelPhoto(photo: TravelPhoto): Promise<TravelPhoto | null> {
  const existingRequest = photoRequests.get(photo.id);
  if (existingRequest) return existingRequest;

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
  const request = fetch(`${apiBase}/images/random?slot=${encodeURIComponent(photo.id)}`)
    .then(async (response): Promise<TravelPhoto | null> => {
      if (!response.ok) return null;
      const result = (await response.json()) as ImageResponse;
      if (!result.success || !result.data?.photo?.url || !result.data.photo.photographerUrl)
        return null;
      return {
        ...photo,
        src: result.data.photo.url,
        alt: result.data.photo.alt || photo.alt,
        creditName: result.data.photo.photographer,
        creditUrl: result.data.photo.photographerUrl,
        fromApi: true,
      };
    })
    .catch(() => null);

  photoRequests.set(photo.id, request);
  return request;
}
