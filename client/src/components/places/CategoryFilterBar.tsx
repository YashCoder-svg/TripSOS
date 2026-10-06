import {
  Bed,
  Coffee,
  Fuel,
  Grid,
  HeartPulse,
  Landmark,
  Pill,
  Shield,
  ShoppingBag,
  TrainFront,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';
import type { PlaceCategory } from '../../types/place';

export type CategoryFilterValue = PlaceCategory | 'all';

interface CategoryOption {
  id: CategoryFilterValue;
  label: string;
  icon: typeof Grid;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'All Places', icon: Grid },
  { id: 'food', label: 'Food & Dining', icon: UtensilsCrossed },
  { id: 'hotels', label: 'Hotels & Stay', icon: Bed },
  { id: 'hospitals', label: 'Hospitals', icon: HeartPulse },
  { id: 'pharmacies', label: 'Pharmacies', icon: Pill },
  { id: 'police', label: 'Police', icon: Shield },
  { id: 'atms', label: 'ATMs & Banks', icon: Landmark },
  { id: 'fuel', label: 'Fuel & EV', icon: Fuel },
  { id: 'groceries', label: 'Groceries', icon: ShoppingBag },
  { id: 'cafes', label: 'Cafés', icon: Coffee },
  { id: 'transport', label: 'Transport', icon: TrainFront },
  { id: 'repair', label: 'Vehicle Repair', icon: Wrench },
];

export interface CategoryFilterBarProps {
  selectedCategory: CategoryFilterValue;
  onSelectCategory: (category: CategoryFilterValue) => void;
  className?: string;
}

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
  className = '',
}: CategoryFilterBarProps) {
  return (
    <div
      className={`category-filter-bar ${className}`}
      role="toolbar"
      aria-label="Filter places by category"
    >
      <div className="category-chips-scroll">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const isSelected = selectedCategory === id;
          return (
            <button
              key={id}
              type="button"
              className={`category-chip ${isSelected ? 'is-active' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(id)}
            >
              <Icon size={14} className="category-chip__icon" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
