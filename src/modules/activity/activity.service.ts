import { ActivityRanker } from '../../utils/activityRanker.js';
import { WeatherService } from '../weather/weather.service.js';
import type { ActivityScore, ActivityType } from './activity.types.js';

/**
 * ActivityService - Orchestrates activity recommendations.
 *
 * Responsible for:
 * - Fetching weather data for a location
 * - Running activity ranking algorithm
 * - Returning structured recommendation results
 *
 * Design Pattern:
 * - Uses ActivityRanker for pure business logic (testable)
 * - Uses WeatherService for data fetching (dependency-injected)
 * - Acts as orchestrator/coordinator between layers
 */
export class ActivityService {
  private ranker = new ActivityRanker();

  constructor(private weatherService: WeatherService) {}

  /**
   * Get activity rankings for a city based on its weather.
   *
   * Process:
   * 1. Fetch average weather forecast from WeatherService
   * 2. Pass weather data to ActivityRanker
   * 3. Return sorted activities with scores and reasons
   * 4. Include single "recommended" activity (highest score)
   *
   * Why average weather:
   * - Users want single recommendation, not daily breakdown
   * - Average represents typical conditions for the period
   * - Simpler UX than "best activity for tomorrow vs. next week"
   */
  async rankActivitiesForCity(latitude: number, longitude: number): Promise<{ scores: ActivityScore[]; recommended: ActivityType }>
  {
    // Get average weather for the forecast period
    const weatherData = await this.weatherService.getAverageForecast(latitude, longitude);

    // Rank activities based on average conditions
    const scores = this.ranker.rankActivities(weatherData);
    const recommended = scores[0]!.activity;

    return { scores, recommended };
  }
}
