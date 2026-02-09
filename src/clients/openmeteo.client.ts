import axios from 'axios';
import type { CitySearchResult } from '../modules/city/city.types.js';
import type { ForecastData } from '../modules/weather/weather.types.js';

/**
 * OpenMeteoClient - HTTP client for OpenMeteo APIs.
 *
 * Responsibilities:
 * - Handles all HTTP communication with OpenMeteo services
 * - Transforms API responses to our types
 * - Provides error handling and timeouts
 *
 * Why a dedicated client:
 * - Isolates external API details from business logic
 * - Makes it easy to mock for testing
 * - Centralizes API documentation and error handling
 * - Enables future caching or batching strategies
 *
 * APIs Used:
 * - Geocoding: https://geocoding-api.open-meteo.com/v1/search
 * - Forecast: https://api.open-meteo.com/v1/forecast
 *
 * Why OpenMeteo:
 * - Free, no API key required
 * - Good geographic coverage
 * - Reliable uptime and performance
 * - Open data policy
 */
export class OpenMeteoClient {
  private geocodingUrl: string;
  private forecastUrl: string;

  constructor() {
    // Load URLs from environment variables with fallback to public endpoints
    this.geocodingUrl = process.env.OPENMETEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com';
    this.forecastUrl = process.env.OPENMETEO_FORECAST_URL || 'https://api.open-meteo.com';
  }

  /**
   * Search for cities by name using OpenMeteo Geocoding API.
   *
   * Parameters:
   * - name: User search query (e.g., "London", "New York")
   * - count: Number of results (max 10)
   * - language: Response language code
   * - format: Response format (json)
   *
   * Returns:
   * Array of cities matching the search, sorted by relevance.
   * Each city includes name, country, coordinates, and admin regions.
   */
  async searchCities(query: string): Promise<CitySearchResult[]> {
    try {
      const response = await axios.get(`${this.geocodingUrl}/v1/search`, {
        params: {
          name: query,
          count: 10,
          language: 'en',
          format: 'json'
        }
      });

      return response.data.results || [];
    } catch (error) {
      throw new Error(`Failed to search cities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get city info by coordinates (reverse geocoding).
   *
   * Currently not implemented - placeholder for future use.
   * Would allow looking up city details from coordinates.
   *
   * Future Implementation:
   * Could use a different API or cache cities from previous searches.
   */
  /**
   * Reverse geocoding: get nearest city info for given coordinates.
   * Uses OpenMeteo's reverse geocoding endpoint.
   */
  async searchCityByCoordinates(latitude: number, longitude: number): Promise<CitySearchResult | null> {
    try {
      const response = await axios.get(`${this.geocodingUrl}/v1/reverse`, {
        params: {
          latitude,
          longitude,
          count: 1,
          language: 'en',
          format: 'json'
        }
      });

      const results: CitySearchResult[] = response.data.results || [];
      return results.length > 0 ? results[0] : null;
    } catch (error: any) {
      // If the reverse endpoint returns 404 (no nearby place), return null so
      // callers can gracefully fallback to coordinate-only city info.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw new Error(`Failed to reverse geocode coordinates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch weather forecast for given coordinates.
   *
   * Parameters:
   * - latitude, longitude: Location coordinates
   * - daily: Comma-separated list of daily metrics to fetch
   * - timezone: Timezone for response (auto-detect)
   *
   * Returns:
   * 7-day forecast with temperature, precipitation, and wind data.
   * Data is in arrays grouped by metric (array per field).
   *
   * Note on metrics:
   * - temperature_2m_max/min: Daily high/low in Celsius (2m above ground)
   * - precipitation_sum: Total precipitation in mm
   * - windspeed_10m_max: Maximum wind speed in km/h (10m above ground)
   */
  async getForecast(latitude: number, longitude: number): Promise<ForecastData> {
    try {
      const response = await axios.get(`${this.forecastUrl}/v1/forecast`, {
        params: {
          latitude,
          longitude,
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max',
          timezone: 'auto'
        }
      });

      return response.data as ForecastData;
    } catch (error) {
      throw new Error(`Failed to fetch forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
