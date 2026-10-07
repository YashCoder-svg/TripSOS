import { CalendarDays, CloudRain, Droplets, Info, Wind } from 'lucide-react';
import { useWeather } from '../../services/weatherService';
import { getWeatherIcon } from './WeatherIcons';

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
  destinationName: string;
  startDate?: string;
  endDate?: string;
  compact?: boolean;
}

function formatDayName(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function WeatherWidget({
  latitude,
  longitude,
  destinationName,
  startDate,
  endDate,
  compact = false,
}: WeatherWidgetProps) {
  const { data: weather, isLoading, isError } = useWeather(latitude, longitude, startDate, endDate);

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return (
      <section className="weather-widget weather-widget--unavailable" aria-label="Weather forecast">
        <div className="weather-widget-header">
          <span className="eyebrow">WEATHER AT DESTINATION</span>
          <h3>{destinationName}</h3>
        </div>
        <p className="weather-notice">
          <Info size={16} /> Coordinates unavailable for this destination. Weather information
          cannot be displayed.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="weather-widget weather-widget--loading" aria-label="Loading weather">
        <div className="weather-skeleton">
          <div className="weather-spinner" aria-hidden="true" />
          <p>Gathering verified weather data for {destinationName}…</p>
        </div>
      </section>
    );
  }

  if (isError || !weather) {
    return (
      <section className="weather-widget weather-widget--error" aria-label="Weather error">
        <div className="weather-widget-header">
          <span className="eyebrow">WEATHER AT DESTINATION</span>
          <h3>{destinationName}</h3>
        </div>
        <p className="weather-notice">
          <Info size={16} /> Weather information is currently unavailable. Please check back
          shortly.
        </p>
      </section>
    );
  }

  const CurrentIcon = getWeatherIcon(weather.current.icon);
  const displayDaily =
    weather.tripForecast && weather.tripForecast.length > 0
      ? weather.tripForecast
      : weather.daily.slice(0, 5);

  if (compact) {
    return (
      <div
        className="weather-badge"
        title={`Current weather in ${destinationName}: ${weather.current.condition}`}
      >
        <CurrentIcon size={18} className="weather-badge-icon" aria-hidden="true" />
        <span className="weather-badge-temp">{Math.round(weather.current.temperature)}°C</span>
        <span className="weather-badge-cond">{weather.current.condition}</span>
      </div>
    );
  }

  return (
    <section className="weather-widget" aria-labelledby="weather-widget-heading">
      <header className="weather-widget-header">
        <div>
          <span className="eyebrow">DESTINATION CLIMATE</span>
          <h2 id="weather-widget-heading">Weather in {destinationName}</h2>
        </div>
        <span className="weather-provider-tag">Verified by {weather.provider}</span>
      </header>

      {/* Current Conditions Card */}
      <div className="weather-current-card">
        <div className="weather-current-main">
          <span className="weather-icon-circle">
            <CurrentIcon size={32} aria-hidden="true" />
          </span>
          <div>
            <div className="weather-temp-row">
              <span className="weather-temp-large">
                {Math.round(weather.current.temperature)}°C
              </span>
              {weather.current.apparentTemperature !== undefined && (
                <span className="weather-feels-like">
                  Feels like {Math.round(weather.current.apparentTemperature)}°C
                </span>
              )}
            </div>
            <p className="weather-condition-label">{weather.current.condition}</p>
          </div>
        </div>

        <div className="weather-metrics-grid">
          {weather.current.humidity !== undefined && (
            <div className="weather-metric">
              <Droplets size={16} aria-hidden="true" />
              <span>Humidity</span>
              <strong>{weather.current.humidity}%</strong>
            </div>
          )}
          {weather.current.windSpeed !== undefined && (
            <div className="weather-metric">
              <Wind size={16} aria-hidden="true" />
              <span>Wind</span>
              <strong>{weather.current.windSpeed} km/h</strong>
            </div>
          )}
          {weather.current.precipitation !== undefined && (
            <div className="weather-metric">
              <CloudRain size={16} aria-hidden="true" />
              <span>Precipitation</span>
              <strong>{weather.current.precipitation} mm</strong>
            </div>
          )}
        </div>
      </div>

      {/* Trip Forecast or Notice */}
      <div className="weather-forecast-section">
        <div className="weather-forecast-header">
          <CalendarDays size={16} aria-hidden="true" />
          <h3>
            {startDate && endDate && weather.forecastAvailableForDates
              ? 'Trip Forecast'
              : 'Upcoming Days'}
          </h3>
        </div>

        {startDate && endDate && !weather.forecastAvailableForDates ? (
          <div className="weather-distant-notice">
            <Info size={18} aria-hidden="true" />
            <div>
              <strong>Forecast will become available closer to your trip.</strong>
              <p>
                Authoritative weather models provide reliable forecasts up to 16 days ahead. Check
                back closer to your departure date for verified conditions.
              </p>
            </div>
          </div>
        ) : (
          <div className="weather-daily-grid">
            {displayDaily.map((day) => {
              const DayIcon = getWeatherIcon(day.icon);
              return (
                <article key={day.date} className="weather-day-card">
                  <span className="weather-day-date">{formatDayName(day.date)}</span>
                  <DayIcon size={24} className="weather-day-icon" aria-hidden="true" />
                  <span className="weather-day-condition">{day.condition}</span>
                  <div className="weather-day-temps">
                    <span className="weather-max-temp">{Math.round(day.temperatureMax)}°</span>
                    <span className="weather-min-temp">{Math.round(day.temperatureMin)}°</span>
                  </div>
                  {day.precipitationProbability !== undefined &&
                    day.precipitationProbability > 0 && (
                      <span className="weather-day-rain">
                        <Droplets size={12} aria-hidden="true" /> {day.precipitationProbability}%
                      </span>
                    )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
