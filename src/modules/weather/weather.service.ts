import { OpenMeteoClient } from '../../clients/openmeteo.client.js';
import type { DailyForecast, ForecastData } from './weather.types.js';

/**
 * WeatherService - Handles weather forecast operations.
 *
 * Responsible for:
 * - Fetching weather data from OpenMeteo API
 * - Transforming raw API data to user-facing format
 * - Computing aggregated weather metrics for activity ranking
 */
export class WeatherService {
  constructor(private client: OpenMeteoClient) {}

  /**
   * Fetch weather forecast for given coordinates.
   *
   * Implementation:
   * - Calls OpenMeteo forecast API with coordinates
   * - Returns 7-day forecast with key weather metrics
   * - Transformed from OpenMeteo's array-based format to objects
   *
   * Why 7 days:
   * - Provides enough data for trend analysis
   * - Typical forecast accuracy window
   * - Balances response size with usefulness
   */
  async getForecast(latitude: number, longitude: number): Promise<DailyForecast[]> {
    const data = await this.client.getForecast(latitude, longitude);
    return this.transformForecast(data);
  }

  /**
   * Transform OpenMeteo forecast data to our domain format.
   *
   * OpenMeteo returns parallel arrays (time[], temp_max[], temp_min[], etc.)
   * We convert to array of objects with named fields for clarity.
   *
   * This is a data transformation layer:
   * - Insulates our code from API schema changes
   * - Makes forecast data easier to work with
   * - Enables easy unit testing with mock data
   */
  private transformForecast(data: ForecastData): DailyForecast[] {
    const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, windspeed_10m_max } = data.daily;

    return time.map((date, index) => ({
      date,
      temperatureMax: temperature_2m_max[index]!,
      temperatureMin: temperature_2m_min[index]!,
      precipitation: precipitation_sum[index]!,
      windSpeedMax: windspeed_10m_max[index]!
    }));
  }

  /**
   * Get average weather across all forecast days.
   *
   * Used for activity ranking since activities care about overall conditions,
   * not specific daily details.
   *
   * Why averaging:
   * - ActivityRanker needs simple input (one set of weather metrics)
   * - Average represents expected conditions over the period
   * - Simpler than per-day activity recommendations (MVP approach)
   *
   * Limitation:
   * - Loses temporal information (e.g., rain tomorrow vs. next week)
   * - In production, could do per-day ranking or weighted scoring
   */
  async getAverageForecast(latitude: number, longitude: number): Promise<{
    temperatureMax: number;
    temperatureMin: number;
    precipitation: number;
    windSpeedMax: number;
  }> {
    const forecast = await this.getForecast(latitude, longitude);

    const avgTemp = forecast.reduce((sum, day) => sum + day.temperatureMax, 0) / forecast.length;
    const avgTempMin = forecast.reduce((sum, day) => sum + day.temperatureMin, 0) / forecast.length;
    const avgPrecip = forecast.reduce((sum, day) => sum + day.precipitation, 0) / forecast.length;
    const avgWind = forecast.reduce((sum, day) => sum + day.windSpeedMax, 0) / forecast.length;

    return {
      temperatureMax: avgTemp,
      temperatureMin: avgTempMin,
      precipitation: avgPrecip,
      windSpeedMax: avgWind
    };
  }
}
