import { useState } from 'react';
import { ArrowUpRight, HeartPulse, LifeBuoy, MapPin, Phone, Share2, ShieldAlert, Wrench } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ScrollReveal } from './ScrollReveal';

const scenarios = {
  'Vehicle breakdown': [
    {
      icon: Wrench,
      title: 'Scan nearest verified mechanics',
      note: 'Auto-detects closest garages via OpenStreetMap',
    },
    {
      icon: MapPin,
      title: 'Locate 24/7 towing & fuel stations',
      note: 'Turn-by-turn navigation with offline coordinates',
    },
    {
      icon: Share2,
      title: 'Live encrypted tracker for contacts',
      note: 'Real-time WebSocket link with SOS distress banner',
    },
  ],
  'Lost or stranded': [
    {
      icon: MapPin,
      title: 'Lock high-precision GPS coordinates',
      note: 'Reverse geocodes exact landmark and street address',
    },
    {
      icon: ArrowUpRight,
      title: 'Find nearest 24/7 police station',
      note: 'Provides direct distance and route directions',
    },
    {
      icon: Share2,
      title: 'One-click SOS location broadcast',
      note: 'Dispatches emergency SMS & WhatsApp alert',
    },
  ],
  'Medical emergency': [
    {
      icon: HeartPulse,
      title: 'Nearest emergency room & pharmacy',
      note: 'Filters 24-hour ER facilities and open dispensaries',
    },
    {
      icon: Phone,
      title: 'Direct official emergency dispatch (112 / 911)',
      note: 'Tap-to-call national emergency response services',
    },
    {
      icon: LifeBuoy,
      title: 'Offline first-aid safety protocol',
      note: 'Immediate step-by-step CPR & trauma procedures',
    },
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
          <span className="eyebrow-dot" /> CORE SAFETY SYSTEM
        </span>
        <h2>
          When the plan changes, <em>TripSOS takes immediate action.</em>
        </h2>
        <p>
          No panic. Select what’s happening and TripSOS generates an immediate action plan:
          nearby emergency facilities, one-tap location broadcasting, and real-time support.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <Link
            to="/emergency"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm tracking-wide shadow-lg transition transform hover:-translate-y-0.5"
          >
            <ShieldAlert size={18} />
            <span>Launch Live Emergency SOS</span>
          </Link>
        </div>

        <div className="emergency-assurance mt-4">
          <LifeBuoy size={18} />
          <span>If you are in immediate danger, contact official local emergency services (112 / 911).</span>
        </div>
      </ScrollReveal>

      <ScrollReveal className="emergency-device" delay={0.12}>
        <div className="emergency-window">
          <div className="emergency-window__bar">
            <span className="emergency-live">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-1" /> ACTIVE PROTOCOL · READY
            </span>
            <span>TRIPSOS / EMERGENCY SOS</span>
          </div>

          <div className="emergency-window__body">
            <div className="emergency-title">
              <div>
                <span className="eyebrow text-rose-500">WHAT’S HAPPENING?</span>
                <h3>Instant problem response playbook.</h3>
              </div>
              <span className="emergency-shield text-rose-500">
                <ShieldAlert size={22} />
              </span>
            </div>

            <div
              className="emergency-choices"
              role="group"
              aria-label="Choose an emergency scenario"
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
                <span className="eyebrow">AUTOMATED ACTION STEPS</span>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  VERIFIED PLAYBOOK
                </span>
              </div>

              {scenarios[active].map(({ icon: Icon, title, note }) => (
                <div className="help-action-row" key={title}>
                  <span className="help-action-icon text-rose-500">
                    <Icon size={17} />
                  </span>
                  <span>
                    <b>{title}</b>
                    <small>{note}</small>
                  </span>
                  <ArrowUpRight size={15} />
                </div>
              ))}

              <Link to="/emergency" className="help-contact hover:bg-rose-500/10 transition">
                <span className="help-contact__icon bg-rose-600 text-white">
                  <Phone size={15} />
                </span>
                <span>
                  <b>10 Emergency Categories Ready</b>
                  <small>Medical, Breakdown, Lost Phone, Cards, Police & more</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            </m.div>
          </div>

          <div className="emergency-window__foot">
            <span>TripSOS Instant Response Engine</span>
            <span>Real-time GPS tracking & verified local numbers</span>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
