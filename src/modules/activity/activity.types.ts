export type ActivityType = 'SKIING' | 'SURFING' | 'INDOOR_SIGHTSEEING' | 'OUTDOOR_SIGHTSEEING';

export interface ActivityScore {
  activity: ActivityType;
  score: number;
  reason: string;
}

export interface ActivityScores {
  [key: string]: {
    base: number;
    reason: string[];
  };
}

export interface WeatherData {
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  windSpeedMax: number;
}
