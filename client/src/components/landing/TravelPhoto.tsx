import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { m } from 'framer-motion';
import { imageReveal } from '../../animations/variants';
import { getTravelPhoto, type TravelPhoto as TravelPhotoType } from '../../services/imageService';

type Props = { photo: TravelPhotoType; eager?: boolean; className?: string };

function responsiveUrl(source: string, width: number): string {
  try {
    const url = new URL(source);
    if (url.hostname !== 'images.unsplash.com') return source;
    url.searchParams.set('w', String(width));
    url.searchParams.set('auto', 'format');
    url.searchParams.set('q', '75');
    return url.toString();
  } catch {
    return source;
  }
}

function responsiveSources(source: string): string {
  return [640, 960, 1440, 2200]
    .map((width) => `${responsiveUrl(source, width)} ${width}w`)
    .join(', ');
}

export function TravelPhoto({ photo, eager = false, className = '' }: Props) {
  const [resolvedPhoto, setResolvedPhoto] = useState(photo);
  const [source, setSource] = useState(photo.src);
  const [loaded, setLoaded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    void getTravelPhoto(photo).then((result) => {
      if (active && result) {
        setResolvedPhoto(result);
        setSource(result.src);
      }
    });
    return () => {
      active = false;
    };
  }, [photo]);

  return (
    <figure
      className={`travel-photo ${loaded ? 'is-loaded' : ''} ${unavailable ? 'photo-unavailable' : ''} ${className}`}
    >
      <m.img
        variants={imageReveal}
        initial={eager || reduceMotion ? false : 'hidden'}
        whileInView={eager || reduceMotion ? undefined : 'visible'}
        viewport={{ once: true }}
        src={source}
        srcSet={responsiveSources(source)}
        sizes={
          photo.id === 'road' || photo.id === 'friends' ? '(min-width: 760px) 55vw, 100vw' : '100vw'
        }
        alt={resolvedPhoto.alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (source !== photo.fallbackUrl) {
            setResolvedPhoto(photo);
            setSource(photo.fallbackUrl);
          } else {
            setResolvedPhoto(photo);
            setUnavailable(true);
            setLoaded(true);
          }
        }}
      />
      <figcaption>
        {resolvedPhoto.fromApi ? (
          <>
            Photo by{' '}
            <a href={resolvedPhoto.creditUrl} target="_blank" rel="noreferrer">
              {resolvedPhoto.creditName}
            </a>{' '}
            on{' '}
            <a
              href="https://unsplash.com/?utm_source=tripsos&utm_medium=referral"
              target="_blank"
              rel="noreferrer"
            >
              Unsplash
            </a>
          </>
        ) : (
          <>
            Photo via{' '}
            <a href={resolvedPhoto.creditUrl} target="_blank" rel="noreferrer">
              Unsplash
            </a>
          </>
        )}
      </figcaption>
    </figure>
  );
}
