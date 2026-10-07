import type { LucideIcon } from 'lucide-react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from 'lucide-react';
import type { WeatherIconType } from '../../types/weather';

export function getWeatherIcon(iconType: WeatherIconType): LucideIcon {
  switch (iconType) {
    case 'clear':
      return Sun;
    case 'partly_cloudy':
      return CloudSun;
    case 'cloudy':
      return Cloud;
    case 'fog':
      return CloudFog;
    case 'drizzle':
      return CloudDrizzle;
    case 'rain':
      return CloudRain;
    case 'snow':
      return CloudSnow;
    case 'thunderstorm':
      return CloudLightning;
    default:
      return Sun;
  }
}
