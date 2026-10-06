import { MapPin, Search, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGeocode } from '../../services/placeService';
import type { GeocodingResult } from '../../types/place';

export interface DestinationAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodingResult) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}

export function DestinationAutocomplete({
  id = 'destination-autocomplete',
  value,
  onChange,
  onSelect,
  placeholder = 'Search destination (e.g. Manali, Tokyo, Paris)',
  error,
}: DestinationAutocompleteProps) {
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Debounce the query for geocoding
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const shouldFetch = isOpen && debouncedQuery.trim().length >= 2;
  const {
    data: results = [],
    isLoading,
    isError,
  } = useGeocode(debouncedQuery, {
    enabled: shouldFetch,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && value.trim().length >= 2) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault();
        handleSelect(results[activeIndex]!);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (item: GeocodingResult) => {
    const displayName = item.name
      ? `${item.name}${item.country ? `, ${item.country}` : ''}`
      : item.formattedAddress || '';
    onChange(displayName);
    onSelect(item);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="destination-autocomplete-wrap" ref={wrapperRef}>
      <div className="destination-input-inner">
        <span className="destination-input-icon">
          <Search size={16} aria-hidden="true" />
        </span>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (value.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {isLoading && (
          <span className="destination-loading-spinner" aria-hidden="true">
            <Loader2 size={16} className="animate-spin" />
          </span>
        )}
        {!isLoading && value.length > 0 && (
          <button
            type="button"
            className="destination-clear-btn"
            onClick={handleClear}
            aria-label="Clear destination"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {error && (
        <span className="form-field__error" id={`${id}-error`}>
          {error}
        </span>
      )}

      {isOpen && value.trim().length >= 2 && (
        <div className="destination-dropdown" role="region" aria-label="Destination suggestions">
          {isLoading && (
            <div className="destination-dropdown__message" role="status">
              <Loader2 size={16} className="animate-spin" />
              <span>Searching locations…</span>
            </div>
          )}

          {isError && (
            <div className="destination-dropdown__message destination-dropdown__error" role="alert">
              <span>Could not connect to location service. Try typing a destination.</span>
            </div>
          )}

          {!isLoading && !isError && results.length === 0 && (
            <div className="destination-dropdown__message" role="status">
              <span>No destinations found for "{value}".</span>
            </div>
          )}

          {!isLoading && !isError && results.length > 0 && (
            <ul
              id={`${id}-listbox`}
              ref={listboxRef}
              role="listbox"
              className="destination-dropdown__list"
            >
              {results.map((item, idx) => {
                const isSelected = idx === activeIndex;
                const secondary = [item.region, item.country].filter(Boolean).join(', ');
                return (
                  <li
                    key={item.providerId || `${item.latitude}-${item.longitude}-${idx}`}
                    id={`${id}-option-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`destination-dropdown__item ${isSelected ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(item)}
                  >
                    <span className="destination-item-pin">
                      <MapPin size={16} aria-hidden="true" />
                    </span>
                    <div className="destination-item-text">
                      <strong className="destination-item-title">{item.name}</strong>
                      {secondary && (
                        <small className="destination-item-subtitle">{secondary}</small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
