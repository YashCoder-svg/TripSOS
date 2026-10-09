import {
  ArrowDownRight,
  Calculator,
  Compass,
  CreditCard,
  Fuel,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Siren,
  Smartphone,
  Split,
  TrainFront,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageContainer } from '../components/ui/PageContainer';
import { CTAButton } from '../components/landing/CTAButton';
import { EmergencyPreview } from '../components/landing/EmergencyPreview';
import { Footer } from '../components/landing/Footer';
import { GroupTravelPreview } from '../components/landing/GroupTravelPreview';
import { Hero } from '../components/landing/Hero';
import { OfflinePreview } from '../components/landing/OfflinePreview';
import { ParallaxImage } from '../components/landing/ParallaxImage';
import { ScrollReveal } from '../components/landing/ScrollReveal';
import { SectionHeading } from '../components/landing/SectionHeading';
import { TripPreview } from '../components/landing/TripPreview';
import { travelPhotos } from '../services/imageService';
import { TravelPhoto } from '../components/landing/TravelPhoto';

const pageContent: Record<string, { title: string; description: string }> = {
  '/trips': {
    title: 'Your Travel Command Center.',
    description: 'Create, collaborate, and manage all your trips with real-time sync.',
  },
  '/explore': {
    title: 'Live Destination Discovery.',
    description: 'Explore verified OpenStreetMap amenities, medical services, and local attractions.',
  },
};

export function FoundationPage() {
  const { pathname } = useLocation();
  const content = pageContent[pathname] ?? pageContent['/explore']!;
  return (
    <PageContainer>
      <div className="page-heading">
        <span className="eyebrow">
          <ShieldCheck size={14} /> TRAVEL WITH A PLAN
        </span>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
      </div>
      <Card className="welcome-card">
        <div className="welcome-icon">
          <Compass size={24} />
        </div>
        <EmptyState
          title="TripSOS Active Workspace"
          description="Plan journeys, discover verified local services, coordinate group expenses, and access immediate emergency guidance."
          action={
            <Link className="text-link" to="/trips">
              Go to My Trips <ArrowDownRight size={16} />
            </Link>
          }
        />
      </Card>
    </PageContainer>
  );
}

const challenges = [
  {
    icon: Siren,
    title: 'Medical emergencies & sudden illness',
    detail: 'Urgent need for 24-hour trauma rooms, verified English-speaking clinics, or ambulances.',
  },
  {
    icon: Wrench,
    title: 'Vehicle breakdown & flat tires',
    detail: 'Stranded on a mountain highway needing verified mechanics, towing, or fuel.',
  },
  {
    icon: Smartphone,
    title: 'Lost phone, dead battery or no signal',
    detail: 'Unable to reach digital boarding passes, hotel confirmations, or emergency numbers.',
  },
  {
    icon: Wallet,
    title: 'Lost wallet, frozen cards & debt disputes',
    detail: 'No local cash, ATM failures, and convoluted group splits with awkward calculations.',
  },
  {
    icon: TrainFront,
    title: 'Missed transport & cancelled connections',
    detail: 'Last-minute schedule chaos requiring fast alternative routes and nearby lodging.',
  },
  {
    icon: MapPin,
    title: 'Getting lost in unfamiliar neighborhoods',
    detail: 'Wandering late at night without knowing safe zones, police locations, or transit hubs.',
  },
];

const productSteps = [
  { no: '01', title: 'Plan & Budget', detail: 'Structure dates, travel style, and shared group limits.' },
  { no: '02', title: 'Smart Discovery', detail: 'Real OpenStreetMap amenities: food, fuel, repair, and medical.' },
  { no: '03', title: 'Group Sync', detail: 'Single trip code invite, Socket.io chat, and shared bookmarks.' },
  { no: '04', title: 'Debt Minimization', detail: 'Automatic expense settlement graph eliminating unnecessary transfers.' },
  { no: '05', title: 'Emergency SOS', detail: 'Instant 10-category safety playbooks with real-time location beacons.' },
  { no: '06', title: 'Offline Pack', detail: 'Zero-signal PWA access to emergency contacts, CPR guides, and hotel info.' },
];

const discoveryCategories = [
  {
    icon: HeartPulse,
    name: 'Emergency Hospitals',
    query: 'hospital',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    description: 'Locate 24/7 emergency rooms & pediatric clinics with distance calculation.',
  },
  {
    icon: UtensilsCrossed,
    name: 'Local & Vegetarian Dining',
    query: 'vegetarian',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    description: 'Find top-rated local eateries, dietary-specific kitchens, and bakeries.',
  },
  {
    icon: Wrench,
    name: 'Automotive & Bike Repair',
    query: 'mechanic',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    description: 'Connect with verified roadside mechanics, tire shops, and towing services.',
  },
  {
    icon: Fuel,
    name: 'Fuel & EV Charging Stations',
    query: 'fuel',
    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    description: 'Discover petrol pumps, diesel supply, and EV chargers along your travel route.',
  },
  {
    icon: CreditCard,
    name: 'ATMs & Currency Exchange',
    query: 'atm',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    description: 'Locate working cash dispensers and verified currency exchange counters.',
  },
  {
    icon: ShieldCheck,
    name: 'Police Stations & Helpdesks',
    query: 'police',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    description: 'Find local law enforcement precincts and tourist safety assistance desks.',
  },
];

const howItWorks = [
  {
    number: '01',
    title: 'Enter Destination & Dates',
    detail: 'Pick your travel destination, duration, budget, and travel style.',
  },
  {
    number: '02',
    title: 'Share Trip Code (TRP-XXXX)',
    detail: 'Invite your friends with a 1-click code for instant itinerary and expense collaboration.',
  },
  {
    number: '03',
    title: 'Navigate & Discover Live',
    detail: 'Use verified OpenStreetMap and live Open-Meteo forecasts on an interactive map.',
  },
  {
    number: '04',
    title: 'One-Tap Emergency SOS',
    detail: 'Activate high-priority assistance mode anytime things go wrong, online or offline.',
  },
];

export function LandingPage() {
  return (
    <main className="landing-page">
      {/* 1. Cinematic Hero */}
      <Hero />

      {/* 2. "Travel is unpredictable." */}
      <section className="section section-problem" id="the-problem">
        <div className="section-shell">
          <SectionHeading
            eyebrow="REAL-WORLD TRAVEL CHALLENGES"
            title={
              <>
                Travel is unpredictable.
                <br />
                <em>Being unprepared doesn’t have to be.</em>
              </>
            }
            description="From vehicle breakdowns in unfamiliar mountain passes to misplaced wallets in busy foreign markets, TripSOS is built for the moments between the highlights."
          />
          <div className="problem-grid">
            <ScrollReveal className="problem-photo-wrap">
              <div className="problem-photo-shell">
                <TravelPhoto photo={travelPhotos.road} className="problem-photo" />
                <span className="problem-photo__label">ENGINEERED FOR REAL SITUATIONS</span>
              </div>
              <div className="problem-aside">
                <span>THE OPEN ROAD</span>
                <span>
                  Never leaves safety to chance <ArrowDownRight size={15} />
                </span>
              </div>
            </ScrollReveal>
            <div className="challenge-list">
              {challenges.map(({ icon: Icon, title, detail }, index) => (
                <ScrollReveal className="challenge-row" key={title} delay={index * 0.025}>
                  <span className="challenge-number">0{index + 1}</span>
                  <span className="challenge-icon">
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                  <span className="challenge-copy">
                    <b>{title}</b>
                    <small>{detail}</small>
                  </span>
                  <ArrowDownRight className="challenge-arrow" size={16} />
                </ScrollReveal>
              ))}
            </div>
          </div>
          <div className="problem-bottom">
            <span>PLAN TOGETHER.</span>
            <span>TRAVEL PREPARED.</span>
            <span>HANDLE EMERGENCIES.</span>
          </div>
        </div>
      </section>

      {/* 3. "One trip. One place." - Ecosystem */}
      <section className="section section-ecosystem" id="explore">
        <div className="section-shell">
          <div className="ecosystem-intro">
            <SectionHeading
              eyebrow="ONE TRIP. ONE PLACE."
              title={
                <>
                  The complete ecosystem
                  <br />
                  when you’re <em>somewhere new.</em>
                </>
              }
              description="TripSOS brings planning, navigation, live group chat, debt-minimized expenses, and emergency dispatch into a single unified platform."
            />
            <div className="ecosystem-list">
              {productSteps.map((step) => (
                <div className="ecosystem-step" key={step.no}>
                  <span>{step.no}</span>
                  <div>
                    <b>{step.title}</b>
                    <small>{step.detail}</small>
                  </div>
                </div>
              ))}
            </div>
            <a className="text-link text-link--light" href="#how-it-works">
              See the complete workflow <ArrowDownRight size={16} />
            </a>
          </div>

          {/* 4. Interactive Trip Preview */}
          <TripPreview />
        </div>
        <div className="ecosystem-note">
          <span>
            <span className="demo-dot bg-emerald-500" /> LIVE TRIPSOS PLATFORM · REAL-TIME ECOSYSTEM
          </span>
          <span>OpenStreetMap discovery, Open-Meteo live forecasts, and instant trip coordination.</span>
        </div>
      </section>

      {/* 5. Emergency Mode Preview - Core Differentiator */}
      <section className="section section-safety" id="safety">
        <div className="section-shell">
          <EmergencyPreview />
        </div>
      </section>

      {/* 6. Smart Destination Discovery */}
      <section className="section section-discovery py-16 bg-slate-900/40 border-y border-slate-800/60">
        <div className="section-shell">
          <SectionHeading
            eyebrow="VERIFIED LOCAL SERVICES"
            title={
              <>
                Smart local discovery
                <br />
                <em>powered by real OpenStreetMap data.</em>
              </>
            }
            description="Search hospitals, vegetarian dining, fuel, 24/7 mechanics, and ATMs anywhere on your route. Zero fabricated venues."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {discoveryCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/explore?category=${cat.query}`}
                  className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-4 ${cat.color}`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-5">
                    <span>Explore on map</span>
                    <ArrowDownRight size={14} className="transform -rotate-45" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Group Travel */}
      <section className="section section-groups" id="groups">
        <div className="section-shell">
          <div className="group-heading">
            <SectionHeading
              eyebrow="BETTER TRIPS ARE SHARED"
              title={
                <>
                  Bring your friends.
                  <br />
                  <em>Share every mile effortlessly.</em>
                </>
              }
              description="One shared space with custom trip codes (TRP-XXXX), live Socket.io messaging, pinned announcements, and consensual location tracking."
            />
            <div className="group-heading__aside">
              <span className="group-rule" />
              <p>Good company makes the journey. TripSOS keeps the details synced in real time.</p>
            </div>
          </div>
          <GroupTravelPreview />
          <div className="group-footnote">
            <span>REAL-TIME SOCKET.IO · TRIP CODE INVITES · EXPENSE SETTLEMENTS</span>
            <span>CONNECTED TRIPS · INSTANT COORDINATION ACTIVE</span>
          </div>
        </div>
      </section>

      {/* 8. Expense Management & Settlement Engine */}
      <section className="section section-expenses py-16 bg-slate-950/30">
        <div className="section-shell">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="eyebrow flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Calculator size={14} /> DEBT MINIMIZATION ENGINE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2 mb-4">
                Fair group expenses.
                <br />
                <span className="italic font-serif font-normal text-emerald-600 dark:text-emerald-400">Zero awkward math.</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Split hotel rooms, shared car rentals, fuel, and group dining without confusion.
                Support for <strong>Equal split</strong>, <strong>Percentage split</strong>, and <strong>Custom exact amounts</strong>.
                Our settlement algorithm runs greedy net-debt minimization to settle accounts in the fewest possible payments.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Split size={18} className="text-emerald-500" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>Flexible splitting:</strong> Equal, Custom exact, or Percentage with 100% sum verification.
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Wallet size={18} className="text-sky-500" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>Smart Settlement:</strong> Calculates exact balance transfers to eliminate cyclical debts.
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Settlement Demo Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ledger Overview</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Manali Road Trip Expenses</h4>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                  ₹24,000 Settled
                </span>
              </div>
              <div className="py-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>🚗 Highway Toll & Fuel</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Rahul paid ₹4,000</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>🏨 Riverside Mountain Resort</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Aman paid ₹16,000</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span>🍲 Solang Valley Cafe Dinner</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Priya paid ₹4,000</span>
                </div>
              </div>
              <div className="mt-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                  Simplified Settlement Recommendation:
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  Rahul and Priya each transfer ₹4,000 to Aman. <strong>2 simple transfers</strong> settle the entire group tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Offline Emergency Pack */}
      <section className="section section-offline" id="offline">
        <div className="section-shell">
          <OfflinePreview />
        </div>
      </section>

      {/* How it works workflow */}
      <section className="section section-steps" id="how-it-works">
        <div className="section-shell">
          <div className="steps-heading">
            <SectionHeading
              eyebrow="STREAMLINED EXPERIENCE"
              title={
                <>
                  From “let’s go”
                  <br />
                  to <em>“we’re completely safe.”</em>
                </>
              }
              description="A clear, intuitive flow from day one of planning to day five of high-altitude trekking."
              align="center"
            />
          </div>
          <div className="steps-track">
            {howItWorks.map((step, index) => (
              <ScrollReveal className="how-step" key={step.number} delay={index * 0.08}>
                <span className="how-step__number">{step.number}</span>
                <span className="how-step__stem" />
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </ScrollReveal>
            ))}
          </div>
          <div className="steps-cta">
            <CTAButton to="/trips">Plan your trip now</CTAButton>
          </div>
        </div>
      </section>

      {/* 10. Final CTA */}
      <section className="section section-final-cta">
        <div className="final-image">
          <ParallaxImage photo={travelPhotos.closing} />
        </div>
        <div className="final-shade" />
        <ScrollReveal className="final-copy">
          <span className="eyebrow eyebrow--light">
            <span className="eyebrow-dot" /> YOUR NEXT ADVENTURE STARTS HERE
          </span>
          <h2>
            Travel prepared.
            <br />
            <em>Wherever life takes you.</em>
          </h2>
          <p>Bring calm confidence, real-time companionship, and immediate safety support along for every journey.</p>
          <CTAButton to="/trips" tone="light">
            Start planning with TripSOS
          </CTAButton>
        </ScrollReveal>
        <span className="final-credit">
          Verified photography via{' '}
          <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
            Unsplash
          </a>
        </span>
      </section>

      <Footer />
    </main>
  );
}
