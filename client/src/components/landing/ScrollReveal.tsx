import { useReducedMotion } from 'framer-motion';
import { m } from 'framer-motion';
import type { HTMLAttributes, ReactNode } from 'react';
import { fadeUp } from '../../animations/variants';

type Props = HTMLAttributes<HTMLDivElement> & { children: ReactNode; delay?: number };

export function ScrollReveal({ children, delay = 0, className }: Props) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.01 } } }
    : fadeUp;
  return (
    <m.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18 }}
      transition={reduceMotion ? { duration: 0.01, delay: 0 } : { delay }}
    >
      {children}
    </m.div>
  );
}
