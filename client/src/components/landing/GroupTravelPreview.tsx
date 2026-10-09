import { CalendarDays, Check, MapPin, MessageCircle, Plus, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TravelPhoto } from './TravelPhoto';
import { travelPhotos } from '../../services/imageService';
import { ScrollReveal } from './ScrollReveal';

export function GroupTravelPreview() {
  return (
    <div className="group-composition">
      <ScrollReveal className="group-photo-wrap">
        <TravelPhoto photo={travelPhotos.friends} className="group-photo" />
        <div className="photo-caption">
          <span>GO TOGETHER</span>
          <span>Verified photography via Unsplash</span>
        </div>
        <div className="group-photo-stamp">
          <Users size={18} />
          <span>
            GOOD COMPANY
            <br />
            <b>MAKES THE MILES</b>
          </span>
        </div>
      </ScrollReveal>

      <ScrollReveal className="group-board-wrap" delay={0.12}>
        <div className="group-board">
          <div className="group-board__top">
            <div>
              <span className="eyebrow flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Zap size={13} /> REAL-TIME GROUP WORKSPACE
              </span>
              <h3>Manali Adventure Crew</h3>
            </div>
            <Link
              to="/trips"
              className="group-add"
              aria-label="Join or invite a traveler"
            >
              <Plus size={16} />
            </Link>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 my-2">
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Trip Invitation Code
              </span>
              <span className="font-mono font-bold text-base text-emerald-800 dark:text-emerald-300">
                TRP-82K7
              </span>
            </div>
            <Link
              to="/trips"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              Join Trip
            </Link>
          </div>

          <div className="group-people">
            <span className="avatar avatar--one">R</span>
            <span className="avatar avatar--two">A</span>
            <span className="avatar avatar--three">P</span>
            <span className="avatar avatar--add">+2</span>
            <span className="people-caption">5 active group members</span>
          </div>

          <div className="group-plan-row">
            <span className="group-plan-icon">
              <CalendarDays size={17} />
            </span>
            <span>
              <b>Live Shared Itinerary</b>
              <small>Real-time collaborative scheduling</small>
            </span>
            <Check size={15} />
          </div>

          <div className="group-plan-row">
            <span className="group-plan-icon group-plan-icon--clay">
              <MapPin size={17} />
            </span>
            <span>
              <b>Synced Saved Places</b>
              <small>Points of interest bookmarked by all members</small>
            </span>
            <Check size={15} />
          </div>

          <div className="group-plan-row">
            <span className="group-plan-icon group-plan-icon--blue">
              <MessageCircle size={17} />
            </span>
            <span>
              <b>Socket.io Live Chat & Announcements</b>
              <small>Instant group messaging & pinned travel notices</small>
            </span>
            <Check size={15} />
          </div>

          <div className="sharing-note">
            <span className="sharing-dot" /> Member location sharing is strictly consent-driven
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
