export type WeatherIconType =
  'clear' | 'partly_cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';

export interface CurrentWeather {
  temperature: number;
  apparentTemperature?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  condition: string;
  weatherCode: number;
  icon: WeatherIconType;
}

export interface DailyForecastItem {
  date: string; // YYYY-MM-DD
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax?: number;
  precipitationProbability?: number;
  windSpeedMax?: number;
  condition: string;
  weatherCode: number;
  icon: WeatherIconType;
}

export interface WeatherData {
  provider: string;
  location: {
    latitude: number;
    longitude: number;
  };
  current: CurrentWeather;
  daily: DailyForecastItem[];
  tripForecast?: DailyForecastItem[];
  forecastAvailableForDates: boolean;
  message?: string;
}
