import { OpenMeteoClient } from '../../clients/openmeteo.client.js';
import { CityNotFoundError, InvalidCityIdError } from '../../utils/errors.js';
import type { City, CitySearchResult } from './city.types.js';

/**
 * CityService - Handles city search operations.
 *
 * Responsible for:
 * - Searching cities via OpenMeteo Geocoding API
 * - Transforming raw API results to our City type
 * - Validating and error handling for city searches
 */
export class CityService {
  constructor(private client: OpenMeteoClient) {}

  /**
   * Search for cities by name query.
   *
   * Implementation:
   * - Calls OpenMeteo Geocoding API with user query
   * - Returns top 10 matches (configurable in client)
   * - Throws CityNotFoundError if no results
   *
   * Why this pattern:
   * - User sees multiple suggestions (autocomplete UX)
   * - Reuses coordinates from search result for later queries
   * - No database needed - search results are stateless
   */
  async searchCities(query: string): Promise<City[]> {
    if (!query || query.trim().length === 0) {
      throw new CityNotFoundError('');
    }

    const results = await this.client.searchCities(query);

    if (results.length === 0) {
      throw new CityNotFoundError(query);
    }

    return results.map((result) => this.transformResult(result));
  }

  /**
   * Get a single city by ID. For this app we accept a coordinate-based ID
   * in the format "latitude:longitude" and perform reverse geocoding.
   */
  async getCityById(cityId: string): Promise<City> {
    const parts = cityId.split(':');
    if (parts.length !== 2) {
      throw new InvalidCityIdError(cityId);
    }

    const latitude = parseFloat(parts[0]!);
    const longitude = parseFloat(parts[1]!);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new InvalidCityIdError(cityId);
    }

    const result = await this.client.searchCityByCoordinates(latitude, longitude);
    if (!result) {
      throw new CityNotFoundError(cityId);
    }

    return this.transformResult(result);
  }

  /**
   * Transform OpenMeteo result to our City domain type.
   *
   * Converts:
   * - API response fields to our standardized names
   * - Numeric ID to string for GraphQL ID type
   * - Only includes essential fields (drops admin regions, etc.)
   */
  private transformResult(result: CitySearchResult): City {
    return {
      id: result.id.toString(),
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude
    };
  }
}
