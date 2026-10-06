import { ArrowUpRight, Compass, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageContainer } from '../components/ui/PageContainer';

const pageContent: Record<string, { title: string; description: string }> = {
  '/login': {
    title: 'Welcome back, traveler.',
    description:
      'Your trips and trusted details will be ready here once account access is implemented.',
  },
  '/register': {
    title: 'Make room for the journey.',
    description: 'Account creation is part of a later TripSOS phase.',
  },
  '/dashboard': {
    title: 'Your journey, at a glance.',
    description: 'Your trip hub is being prepared. Create a trip when trip planning is available.',
  },
  '/trips': {
    title: 'Every trip starts somewhere.',
    description: 'Your trips will live here. Trip creation is planned for a later phase.',
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
    description: 'Profile and trusted-contact settings will be available in a later phase.',
  },
  '/settings': {
    title: 'Make TripSOS yours.',
    description: 'Preferences and account settings will arrive in a later phase.',
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
          title="The foundation is in place."
          description="TripSOS is being built in thoughtful steps. This space will grow into a practical companion for the road ahead."
          action={
            <Link className="text-link" to="/explore">
              See what’s taking shape <ArrowUpRight size={16} />
            </Link>
          }
        />
      </Card>
    </PageContainer>
  );
}

export function LandingPage() {
  return (
    <PageContainer className="landing">
      <section className="hero-copy">
        <span className="eyebrow">
          <span className="eyebrow-dot" /> YOUR NEXT CHAPTER, BETTER PREPARED
        </span>
        <h1>
          Travel prepared.
          <br />
          <em>Wherever life takes you.</em>
        </h1>
        <p>
          Plan your journey, find your bearings, and keep a little more confidence in your pocket.
        </p>
        <div className="hero-actions">
          <Link className="button button--primary" to="/trips">
            Start planning <ArrowUpRight size={17} />
          </Link>
          <Link className="button button--quiet" to="/explore">
            Explore TripSOS
          </Link>
        </div>
        <div className="hero-note">
          <ShieldCheck size={16} />
          <span>Thoughtful tools for the unexpected</span>
        </div>
      </section>
      <Card className="journey-card">
        <div className="journey-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="ridge ridge-back" />
          <div className="ridge ridge-front" />
          <div className="route-dash" />
          <span className="map-pin">
            <Compass size={20} />
          </span>
        </div>
        <div className="journey-caption">
          <div>
            <span className="eyebrow">A BETTER WAY TO GO</span>
            <h2>Ready when the road turns.</h2>
          </div>
          <Link to="/emergency" aria-label="Emergency information">
            <ArrowUpRight />
          </Link>
        </div>
        <div className="journey-meta">
          <span>
            PLAN <b>→</b> GO <b>→</b> FEEL READY
          </span>
          <span>01 / 04</span>
        </div>
      </Card>
      <div className="landing-foot">
        <span>Made for the miles between here and there.</span>
        <span>TripSOS · Early foundation</span>
      </div>
    </PageContainer>
  );
}
