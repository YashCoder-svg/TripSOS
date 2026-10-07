import type { DailyForecastItem, WeatherData, WeatherIconType, WeatherProvider } from '../types.js';

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
}

function mapWmoCode(code: number): { condition: string; icon: WeatherIconType } {
  switch (code) {
    case 0:
      return { condition: 'Clear sky', icon: 'clear' };
    case 1:
      return { condition: 'Mainly clear', icon: 'clear' };
    case 2:
      return { condition: 'Partly cloudy', icon: 'partly_cloudy' };
    case 3:
      return { condition: 'Overcast', icon: 'cloudy' };
    case 45:
    case 48:
      return { condition: 'Foggy', icon: 'fog' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', icon: 'drizzle' };
    case 56:
    case 57:
      return { condition: 'Freezing drizzle', icon: 'drizzle' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', icon: 'rain' };
    case 66:
    case 67:
      return { condition: 'Freezing rain', icon: 'rain' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snowfall', icon: 'snow' };
    case 77:
      return { condition: 'Snow grains', icon: 'snow' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain showers', icon: 'rain' };
    case 85:
    case 86:
      return { condition: 'Snow showers', icon: 'snow' };
    case 95:
      return { condition: 'Thunderstorm', icon: 'thunderstorm' };
    case 96:
    case 99:
      return { condition: 'Thunderstorm with hail', icon: 'thunderstorm' };
    default:
      return { condition: 'Variable', icon: 'partly_cloudy' };
  }
}

export class OpenMeteoProvider implements WeatherProvider {
  readonly name = 'Open-Meteo';

  async getWeather(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string,
  ): Promise<WeatherData> {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude.toFixed(4));
    url.searchParams.set('longitude', longitude.toFixed(4));
    url.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    );
    url.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max',
    );
    url.searchParams.set('timezone', 'auto');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: { Accept: 'application/json', 'User-Agent': 'TripSOS/1.0' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }

    const data = (await res.json()) as OpenMeteoResponse;

    const currentRaw = data.current;
    const currentCode = currentRaw?.weather_code ?? 0;
    const currentMeta = mapWmoCode(currentCode);

    const current = {
      temperature: currentRaw?.temperature_2m ?? 0,
      apparentTemperature: currentRaw?.apparent_temperature,
      humidity: currentRaw?.relative_humidity_2m,
      windSpeed: currentRaw?.wind_speed_10m,
      precipitation: currentRaw?.precipitation,
      condition: currentMeta.condition,
      weatherCode: currentCode,
      icon: currentMeta.icon,
    };

    const daily: DailyForecastItem[] = [];
    if (data.daily && Array.isArray(data.daily.time)) {
      const times = data.daily.time;
      for (let i = 0; i < times.length; i++) {
        const dateStr = times[i]!;
        const code = data.daily.weather_code[i] ?? 0;
        const meta = mapWmoCode(code);
        daily.push({
          date: dateStr,
          temperatureMax: data.daily.temperature_2m_max[i] ?? 0,
          temperatureMin: data.daily.temperature_2m_min[i] ?? 0,
          apparentTemperatureMax: data.daily.apparent_temperature_max?.[i],
          precipitationProbability: data.daily.precipitation_probability_max?.[i],
          windSpeedMax: data.daily.wind_speed_10m_max?.[i],
          condition: meta.condition,
          weatherCode: code,
          icon: meta.icon,
        });
      }
    }

    let tripForecast: DailyForecastItem[] | undefined;
    let forecastAvailableForDates = true;
    let message: string | undefined;

    if (startDate && endDate) {
      // Find days in daily forecast that match the trip's date range
      const matching = daily.filter((d) => d.date >= startDate && d.date <= endDate);
      if (matching.length > 0) {
        tripForecast = matching;
        forecastAvailableForDates = true;
      } else {
        tripForecast = [];
        forecastAvailableForDates = false;
        message = 'Forecast will become available closer to your trip.';
      }
    }

    return {
      provider: this.name,
      location: {
        latitude,
        longitude,
      },
      current,
      daily,
      tripForecast,
      forecastAvailableForDates,
      message,
    };
  }
}
