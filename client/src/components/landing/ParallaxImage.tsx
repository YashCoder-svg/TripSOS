import { useRef } from 'react';
import { useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { m } from 'framer-motion';
import type { TravelPhoto as TravelPhotoType } from '../../services/imageService';
import { TravelPhoto } from './TravelPhoto';

export function ParallaxImage({ photo }: { photo: TravelPhotoType }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-22, 22]);
  return (
    <div className="parallax-frame" ref={ref}>
      <m.div className="parallax-inner" style={{ y: reduceMotion ? 0 : y }}>
        <TravelPhoto photo={photo} />
      </m.div>
    </div>
  );
}
