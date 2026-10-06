import { useReducedMotion } from 'framer-motion';
import { m } from 'framer-motion';
import { ArrowDown, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fadeIn, fadeUp, staggerChildren } from '../../animations/variants';
import { travelPhotos } from '../../services/imageService';
import { TravelPhoto } from './TravelPhoto';

export function Hero() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__image">
        <TravelPhoto photo={travelPhotos.hero} eager />
      </div>
      <div className="hero__shade" />
      <m.div
        className="hero__content"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        <m.span className="hero__eyebrow" variants={reduceMotion ? fadeIn : fadeUp}>
          <span className="hero__eyebrow-line" /> YOUR TRAVEL COMPANION
        </m.span>
        <m.h1 id="hero-title" variants={reduceMotion ? fadeIn : fadeUp}>
          Travel prepared.
          <br />
          <em>Wherever life takes you.</em>
        </m.h1>
        <m.p variants={reduceMotion ? fadeIn : fadeUp}>
          Plan your journey, discover what matters nearby, and know what to do when things don’t go
          as planned.
        </m.p>
        <m.div className="hero__actions" variants={reduceMotion ? fadeIn : fadeUp}>
          <Link className="hero-button hero-button--accent" to="/trips">
            Plan my trip <ArrowUpRight size={17} />
          </Link>
          <a className="hero-button hero-button--outline" href="#explore">
            Explore TripSOS
          </a>
        </m.div>
        <m.div className="hero__trust" variants={reduceMotion ? fadeIn : fadeUp}>
          <ShieldCheck size={15} />
          <span>Prepared for the moments between plans</span>
        </m.div>
      </m.div>
      <a className="scroll-cue" href="#the-problem">
        <span>SCROLL TO EXPLORE</span>
        <ArrowDown size={15} />
      </a>
    </section>
  );
}
