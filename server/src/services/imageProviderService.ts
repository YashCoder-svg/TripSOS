import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../types/errors.js';

const photoSlots = {
  hero: 'mountain road travel',
  road: 'road trip mountain',
  friends: 'friends walking travel',
  closing: 'mountain lake travel',
} as const;

type Slot = keyof typeof photoSlots;
type UnsplashRandomPhoto = {
  alt_description: string | null;
  description: string | null;
  urls: { regular: string };
  user: { name: string; links: { html: string } };
};
type Photo = { url: string; alt: string; photographer: string; photographerUrl: string };

const photoCache = new Map<Slot, { photo: Photo; expiresAt: number }>();
const inFlight = new Map<Slot, Promise<Photo>>();
const PHOTO_CACHE_TTL = 12 * 60 * 60 * 1000;

function withAttribution(url: string): string {
  const attributed = new URL(url);
  attributed.searchParams.set('utm_source', 'tripsos');
  attributed.searchParams.set('utm_medium', 'referral');
  return attributed.toString();
}

export function getPhotoForSlot(slot: Slot): Promise<Photo> {
  if (!env.UNSPLASH_ACCESS_KEY) {
    return Promise.reject(
      new AppError(503, 'IMAGE_PROVIDER_UNAVAILABLE', 'Photography provider is not configured'),
    );
  }
  const cached = photoCache.get(slot);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.photo);
  const current = inFlight.get(slot);
  if (current) return current;
  const request = loadPhoto(slot)
    .then((photo) => {
      photoCache.set(slot, { photo, expiresAt: Date.now() + PHOTO_CACHE_TTL });
      return photo;
    })
    .finally(() => inFlight.delete(slot));
  inFlight.set(slot, request);
  return request;
}

async function loadPhoto(slot: Slot): Promise<Photo> {
  const endpoint = new URL('https://api.unsplash.com/photos/random');
  endpoint.searchParams.set('query', photoSlots[slot]);
  endpoint.searchParams.set('orientation', 'landscape');

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) {
      logger.warn({ statusCode: response.status, slot }, 'Unsplash image request failed');
      throw new AppError(
        503,
        'IMAGE_PROVIDER_UNAVAILABLE',
        'Photography is temporarily unavailable',
      );
    }

    const photo = (await response.json()) as UnsplashRandomPhoto;
    if (!photo.urls?.regular || !photo.user?.links?.html || !photo.user.name) {
      throw new AppError(
        502,
        'IMAGE_PROVIDER_INVALID_RESPONSE',
        'Photography is temporarily unavailable',
      );
    }
    const imageUrl = new URL(photo.urls.regular);
    const photographerUrl = new URL(photo.user.links.html);
    if (
      imageUrl.protocol !== 'https:' ||
      imageUrl.hostname !== 'images.unsplash.com' ||
      photographerUrl.protocol !== 'https:' ||
      photographerUrl.hostname !== 'unsplash.com'
    ) {
      throw new AppError(
        502,
        'IMAGE_PROVIDER_INVALID_RESPONSE',
        'Photography is temporarily unavailable',
      );
    }
    return {
      url: imageUrl.toString(),
      alt: photo.alt_description || photo.description || 'Travel photography from Unsplash',
      photographer: photo.user.name,
      photographerUrl: withAttribution(photographerUrl.toString()),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.warn(
      { slot, errorName: error instanceof Error ? error.name : 'UnknownError' },
      'Unsplash image request failed',
    );
    throw new AppError(503, 'IMAGE_PROVIDER_UNAVAILABLE', 'Photography is temporarily unavailable');
  }
}

export function isPhotoSlot(value: string): value is Slot {
  return Object.hasOwn(photoSlots, value);
}
