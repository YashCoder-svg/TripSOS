import { CalendarDays, Check, MapPin, MessageCircle, Plus, Users } from 'lucide-react';
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
          <span>Photo via Unsplash</span>
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
              <span className="eyebrow">SHARED SPACE · DEMO</span>
              <h3>Mountain Escape</h3>
            </div>
            <button
              className="group-add"
              aria-label="Invite a traveler preview"
              type="button"
              disabled
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="group-people">
            <span className="avatar avatar--one">A</span>
            <span className="avatar avatar--two">M</span>
            <span className="avatar avatar--three">J</span>
            <span className="avatar avatar--add">+</span>
            <span className="people-caption">Sample travelers</span>
          </div>
          <div className="group-plan-row">
            <span className="group-plan-icon">
              <CalendarDays size={17} />
            </span>
            <span>
              <b>Trip outline</b>
              <small>One shared plan, shaped together</small>
            </span>
            <Check size={15} />
          </div>
          <div className="group-plan-row">
            <span className="group-plan-icon group-plan-icon--clay">
              <MapPin size={17} />
            </span>
            <span>
              <b>Saved places</b>
              <small>Ideas from everyone in the group</small>
            </span>
            <Check size={15} />
          </div>
          <div className="group-plan-row">
            <span className="group-plan-icon group-plan-icon--blue">
              <MessageCircle size={17} />
            </span>
            <span>
              <b>Group notes</b>
              <small>A place for the little details</small>
            </span>
            <Check size={15} />
          </div>
          <div className="sharing-note">
            <span className="sharing-dot" /> Location sharing is always optional
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
