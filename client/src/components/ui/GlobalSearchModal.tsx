import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  HeartPulse,
  MapPin,
  Search,
  ShieldAlert,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  X,
} from 'lucide-react';
import { useTrips } from '../../services/tripService';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: string;
  icon: typeof Search;
  action: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: trips = [] } = useTrips();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation & Esc listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const defaultSuggestions: SearchItem[] = [
    {
      id: 'quick-emergency',
      title: 'Emergency Help & 112 Dispatch',
      category: 'Safety',
      icon: ShieldAlert,
      action: () => {
        navigate('/emergency');
        onClose();
      },
    },
    {
      id: 'quick-hospitals',
      title: 'Find nearby emergency hospitals',
      category: 'Medical',
      icon: HeartPulse,
      action: () => {
        navigate('/explore?category=hospitals');
        onClose();
      },
    },
    {
      id: 'quick-food',
      title: 'Vegetarian & local food places',
      category: 'Dining',
      icon: UtensilsCrossed,
      action: () => {
        navigate('/explore?category=food');
        onClose();
      },
    },
    {
      id: 'quick-repair',
      title: 'Vehicle breakdown & repair shops',
      category: 'Assistance',
      icon: Wrench,
      action: () => {
        navigate('/explore?category=repair');
        onClose();
      },
    },
  ];

  // Dynamic search results matching query
  const searchResults: SearchItem[] = [];

  if (query.trim()) {
    const q = query.toLowerCase();

    // Matching User Trips
    trips
      .filter((t) => t.name.toLowerCase().includes(q) || t.destinationName.toLowerCase().includes(q))
      .forEach((t) => {
        searchResults.push({
          id: `trip-${t._id}`,
          title: `${t.name} (${t.destinationName})`,
          category: 'Your Trips',
          icon: Compass,
          action: () => {
            navigate(`/trips/${t._id}`);
            onClose();
          },
        });
      });

    // Custom explore query
    searchResults.push({
      id: `explore-query`,
      title: `Search destination or amenity "${query}" on map`,
      category: 'Explore Maps',
      icon: MapPin,
      action: () => {
        navigate(`/explore?q=${encodeURIComponent(query)}`);
        onClose();
      },
    });

    // Emergency quick jump if keywords match
    if (['sos', 'help', 'hospital', 'doctor', 'police', 'danger', 'accident', 'breakdown'].some((k) => q.includes(k))) {
      searchResults.unshift({
        id: 'emergency-jump',
        title: `I'M IN TROUBLE - Immediate Safety Guidance`,
        category: 'Emergency SOS',
        icon: ShieldAlert,
        action: () => {
          navigate('/emergency');
          onClose();
        },
      });
    }
  }

  const itemsToDisplay = query.trim() ? searchResults : defaultSuggestions;

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % itemsToDisplay.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + itemsToDisplay.length) % itemsToDisplay.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = itemsToDisplay[selectedIndex];
      if (item) {
        item.action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="TripSOS Global Search"
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyNavigation}
            placeholder="Search destination, hospital, food, repair, or trip… (Press Esc to close)"
            className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X size={15} />
            </button>
          )}
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {query.trim() ? 'Matching Results' : 'Suggested Inquiries'}
          </div>

          {itemsToDisplay.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition ${
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <span className="font-medium text-slate-100">{item.title}</span>
                </div>
                <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                  {item.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Use <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono">↓</kbd> to navigate
            </span>
            <span>·</span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono">Enter</kbd> to select
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles size={12} />
            <span>TripSOS Fast Search</span>
          </div>
        </div>
      </div>
    </div>
  );
}
