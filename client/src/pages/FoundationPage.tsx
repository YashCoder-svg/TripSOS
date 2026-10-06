import {
  ArrowDownRight,
  Compass,
  MapPin,
  ShieldCheck,
  Siren,
  TrainFront,
  Wallet,
  WifiOff,
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
  '/login': {
    title: 'Welcome back, traveler.',
    description: 'Account access is planned for a later TripSOS phase.',
  },
  '/register': {
    title: 'Make room for the journey.',
    description: 'Account creation is planned for a later TripSOS phase.',
  },
  '/dashboard': {
    title: 'Your journey, at a glance.',
    description: 'Your trip hub is being prepared for a later phase.',
  },
  '/trips': {
    title: 'Every trip starts somewhere.',
    description: 'Trip creation is planned for a later phase.',
  },
  '/explore': {
    title: 'Find your way around.',
    description: 'Local discovery will connect to real place data in a later phase.',
  },
  '/emergency': {
    title: 'Help should be easy to reach.',
    description:
      'Emergency tools are not active yet. If you are in immediate danger, contact local emergency services.',
  },
  '/profile': {
    title: 'Your travel profile.',
    description: 'Profile and trusted-contact settings are planned for a later phase.',
  },
  '/settings': {
    title: 'Make TripSOS yours.',
    description: 'Preferences and account settings are planned for a later phase.',
  },
};

export function FoundationPage() {
  const { pathname } = useLocation();
  const content = pageContent[pathname] ?? pageContent['/dashboard']!;
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
          title="This part of the journey is still ahead."
          description="TripSOS is being built in thoughtful steps. The planning, discovery, and safety tools shown on the home page are product previews."
          action={
            <Link className="text-link" to="/">
              Back to the TripSOS overview <ArrowDownRight size={16} />
            </Link>
          }
        />
      </Card>
    </PageContainer>
  );
}

const challenges = [
  {
    icon: MapPin,
    title: 'Getting turned around',
    detail: 'A new neighborhood, a missed turn, no familiar landmarks.',
  },
  {
    icon: Wrench,
    title: 'Something breaks',
    detail: 'The ride stops. You need a sensible next step.',
  },
  {
    icon: Siren,
    title: 'An urgent situation',
    detail: 'It helps to know what information to reach for.',
  },
  {
    icon: TrainFront,
    title: 'Plans move on',
    detail: 'A late connection can reshape the whole day.',
  },
  {
    icon: Wallet,
    title: 'Costs add up',
    detail: 'Shared plans work better when everyone can follow along.',
  },
  {
    icon: WifiOff,
    title: 'Signal disappears',
    detail: 'The details you saved should still feel close.',
  },
];

const productSteps = [
  { no: '01', title: 'Plan', detail: 'Give the trip a shape that still leaves room.' },
  { no: '02', title: 'Discover', detail: 'Find useful services around the places you go.' },
  { no: '03', title: 'Navigate', detail: 'Keep the people, places, and plan in one view.' },
  { no: '04', title: 'Stay safe', detail: 'Reach a clear next step when plans change.' },
  { no: '05', title: 'Share', detail: 'Bring your travel companions into the same plan.' },
  { no: '06', title: 'Manage', detail: 'Keep shared details easy to follow.' },
];

const howItWorks = [
  {
    number: '01',
    title: 'Choose your destination',
    detail: 'Start with the place you have in mind.',
  },
  {
    number: '02',
    title: 'Build your trip',
    detail: 'Shape the outline around your people and pace.',
  },
  {
    number: '03',
    title: 'Explore what’s around you',
    detail: 'Find useful local places when you need them.',
  },
  {
    number: '04',
    title: 'Get help when you need it',
    detail: 'Know where to start when a plan changes.',
  },
];

export function LandingPage() {
  return (
    <main className="landing-page">
      <Hero />

      <section className="section section-problem" id="the-problem">
        <div className="section-shell">
          <SectionHeading
            eyebrow="THE UNPLANNED PARTS"
            title={
              <>
                Travel is exciting.
                <br />
                <em>Being unprepared isn’t.</em>
              </>
            }
            description="The memorable parts aren’t always the planned ones. The hard parts shouldn’t have to feel so lonely."
          />
          <div className="problem-grid">
            <ScrollReveal className="problem-photo-wrap">
              <div className="problem-photo-shell">
                <TravelPhoto photo={travelPhotos.road} className="problem-photo" />
                <span className="problem-photo__label">A DIFFERENT KIND OF TRAVEL TOOL</span>
              </div>
              <div className="problem-aside">
                <span>THE OPEN ROAD</span>
                <span>
                  Rarely goes exactly to plan <ArrowDownRight size={15} />
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
            <span>LESS SCRAMBLING.</span>
            <span>MORE BEING THERE.</span>
            <span>THAT’S THE IDEA.</span>
          </div>
        </div>
      </section>

      <section className="section section-ecosystem" id="explore">
        <div className="section-shell">
          <div className="ecosystem-intro">
            <SectionHeading
              eyebrow="ONE TRIP. ONE PLACE."
              title={
                <>
                  Everything you need
                  <br />
                  when you’re <em>somewhere new.</em>
                </>
              }
              description="TripSOS brings the pieces of a trip together, so the details don’t have to live in six different places."
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
              See how it fits together <ArrowDownRight size={16} />
            </a>
          </div>
          <TripPreview />
        </div>
        <div className="ecosystem-note">
          <span>
            <span className="demo-dot" /> PRODUCT PREVIEW · DEMONSTRATION DATA
          </span>
          <span>Maps, forecast, and trip tools aren’t live yet.</span>
        </div>
      </section>

      <section className="section section-safety" id="safety">
        <div className="section-shell">
          <EmergencyPreview />
        </div>
      </section>

      <section className="section section-groups" id="groups">
        <div className="section-shell">
          <div className="group-heading">
            <SectionHeading
              eyebrow="BETTER TRIPS ARE SHARED"
              title={
                <>
                  Bring your people.
                  <br />
                  <em>Keep the good parts close.</em>
                </>
              }
              description="One shared trip space for the plan, the places, and the little decisions that make a journey yours."
            />
            <div className="group-heading__aside">
              <span className="group-rule" />
              <p>Good company makes the miles. Sharing the plan makes it easier to enjoy them.</p>
            </div>
          </div>
          <GroupTravelPreview />
          <div className="group-footnote">
            <span>SHARED ITINERARY · PLACES · GROUP NOTES</span>
            <span>ALL DEMONSTRATIVE · NO ACCOUNTS OR SHARING ACTIVE</span>
          </div>
        </div>
      </section>

      <section className="section section-offline" id="offline">
        <div className="section-shell">
          <OfflinePreview />
        </div>
      </section>

      <section className="section section-steps" id="how-it-works">
        <div className="section-shell">
          <div className="steps-heading">
            <SectionHeading
              eyebrow="A LITTLE MORE READY"
              title={
                <>
                  From “let’s go”
                  <br />
                  to <em>“we’ve got this.”</em>
                </>
              }
              description="A simpler rhythm for the journey ahead."
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
            <CTAButton to="/trips">Start planning</CTAButton>
          </div>
        </div>
      </section>

      <section className="section section-final-cta">
        <div className="final-image">
          <ParallaxImage photo={travelPhotos.closing} />
        </div>
        <div className="final-shade" />
        <ScrollReveal className="final-copy">
          <span className="eyebrow eyebrow--light">
            <span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE
          </span>
          <h2>
            Go further.
            <br />
            <em>Stay prepared.</em>
          </h2>
          <p>Bring a little more confidence along for the ride.</p>
          <CTAButton to="/trips" tone="light">
            Start planning
          </CTAButton>
        </ScrollReveal>
        <span className="final-credit">
          Photo via{' '}
          <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
            Unsplash
          </a>
        </span>
      </section>
      <Footer />
    </main>
  );
}
