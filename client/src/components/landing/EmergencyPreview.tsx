import { useState } from 'react';
import { ArrowUpRight, LifeBuoy, MapPin, Phone, Share2, Wrench } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { m } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';

const scenarios = {
  'Vehicle breakdown': [
    {
      icon: Wrench,
      title: 'Search for nearby mechanics',
      note: 'No search is running in this preview',
    },
    { icon: MapPin, title: 'Look for towing or fuel', note: 'Availability depends on your area' },
    { icon: Share2, title: 'Choose whether to share location', note: 'Only after you choose to' },
  ],
  'I’m lost': [
    {
      icon: MapPin,
      title: 'Find your current location',
      note: 'Location isn’t accessed in this preview',
    },
    {
      icon: ArrowUpRight,
      title: 'Choose a place to head toward',
      note: 'No destination is selected',
    },
    { icon: Share2, title: 'Send your location to someone', note: 'Only after you choose to' },
  ],
  'Need medical help': [
    {
      icon: MapPin,
      title: 'Search for nearby medical care',
      note: 'No search is running in this preview',
    },
    { icon: Phone, title: 'Find local emergency guidance', note: 'Use official local information' },
    { icon: Share2, title: 'Choose whether to share location', note: 'Only after you choose to' },
  ],
};
const choices = Object.keys(scenarios) as Array<keyof typeof scenarios>;

export function EmergencyPreview() {
  const [active, setActive] = useState(choices[0]!);
  const reduceMotion = useReducedMotion();
  return (
    <div className="emergency-preview-grid">
      <ScrollReveal className="emergency-copy">
        <span className="eyebrow eyebrow--light">
          <span className="eyebrow-dot" /> WHEN PLANS CHANGE
        </span>
        <h2>
          When the plan changes, <em>TripSOS changes with you.</em>
        </h2>
        <p>
          A calmer first step: choose what’s happening, see the next useful actions, and decide what
          to share.
        </p>
        <div className="emergency-assurance">
          <LifeBuoy size={18} />
          <span>In immediate danger? Contact local emergency services.</span>
        </div>
      </ScrollReveal>
      <ScrollReveal className="emergency-device" delay={0.12}>
        <div className="emergency-window">
          <div className="emergency-window__bar">
            <span className="emergency-live">
              <i /> DEMONSTRATION · NOT CONNECTED
            </span>
            <span>TRIPSOS / HELP</span>
          </div>
          <div className="emergency-window__body">
            <div className="emergency-title">
              <div>
                <span className="eyebrow">WHAT’S HAPPENING?</span>
                <h3>Let’s find a next step.</h3>
              </div>
              <span className="emergency-shield">
                <LifeBuoy size={20} />
              </span>
            </div>
            <div
              className="emergency-choices"
              role="group"
              aria-label="Choose a demonstration scenario"
            >
              {choices.map((choice) => (
                <button
                  className={active === choice ? 'is-selected' : ''}
                  key={choice}
                  onClick={() => setActive(choice)}
                  type="button"
                  aria-pressed={active === choice}
                >
                  {choice}
                </button>
              ))}
            </div>
            <m.div
              className="help-results"
              key={active}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
            >
              <div className="help-results__heading">
                <span className="eyebrow">SUGGESTED NEXT STEPS</span>
                <span className="demo-pill">DEMO</span>
              </div>
              {scenarios[active].map(({ icon: Icon, title, note }) => (
                <div className="help-action-row" key={title}>
                  <span className="help-action-icon">
                    <Icon size={17} />
                  </span>
                  <span>
                    <b>{title}</b>
                    <small>{note}</small>
                  </span>
                  <ArrowUpRight size={15} />
                </div>
              ))}
              <div className="help-contact">
                <span className="help-contact__icon">
                  <Phone size={15} />
                </span>
                <span>
                  <b>Trusted contact</b>
                  <small>Set one up in your profile</small>
                </span>
                <ArrowUpRight size={15} />
              </div>
            </m.div>
          </div>
          <div className="emergency-window__foot">
            <span>Visual prototype only</span>
            <span>Location not accessed · no messages sent</span>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
