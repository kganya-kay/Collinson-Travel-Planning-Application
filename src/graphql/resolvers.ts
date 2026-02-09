import type { CityService } from '../modules/city/city.service.js';
import type { WeatherService } from '../modules/weather/weather.service.js';
import type { ActivityService } from '../modules/activity/activity.service.js';
import { InvalidCityIdError, WeatherFetchError } from '../utils/errors.js';

interface ResolverContext {
  cityService: CityService;
  weatherService: WeatherService;
  activityService: ActivityService;
}

/**
 * GraphQL Resolvers - Entry points for all queries.
 *
 * Architecture Decision:
 * Resolvers act as thin adapters that:
 * 1. Validate input format
 * 2. Call appropriate services
 * 3. Transform results to GraphQL types
 * 4. Handle errors with user-friendly messages
 *
 * This keeps business logic in services, keeping resolvers focused on GraphQL concerns.
 */
export const resolvers = {
  Query: {
    /**
     * Search for cities by user input.
     *
     * Implementation Notes:
     * - Delegates to CityService which calls OpenMeteo Geocoding API
     * - Returns top 10 matches sorted by relevance (OpenMeteo default)
     * - City ID is formatted as "latitude:longitude" for coordinate-based lookups
     */
    citySuggestions: async (_: unknown, { query }: { query: string }, { cityService }: ResolverContext) => {
      try {
        return await cityService.searchCities(query);
      } catch (error) {
        // CityService throws CityNotFoundError which Apollo will format as GraphQL error
        throw error;
      }
    },

    /**
     * Get weather forecast for a city.
     *
     * Input Format:
     * - cityId: "latitude:longitude" (e.g., "-33.9249:18.4241" for Cape Town)
     *
     * Design Rationale:
     * - Using coordinates instead of persisting city IDs avoids needing a database
     * - Coordinates are immutable and deterministic references to locations
     * - Weather API (OpenMeteo) requires coordinates anyway
     *
     * Tradeoff:
     * - Client must maintain the city selection state
     * - In a real app, we'd use database IDs or session storage
     *
     * Error Handling:
     * - Validates coordinate format before API call
     * - Wraps API errors with helpful messages
     */
    forecast: async (
      _: unknown,
      { cityId }: { cityId: string },
      { weatherService }: ResolverContext
    ) => {
      const { latitude, longitude } = parseCoordinates(cityId);

      try {
        const daily = await weatherService.getForecast(latitude, longitude);

        return {
          city: {
            id: cityId,
            name: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            country: 'Unknown',
            latitude,
            longitude
          },
          daily
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new WeatherFetchError(`Could not fetch forecast for coordinates ${cityId}: ${error.message}`);
        }
        throw new WeatherFetchError();
      }
    },

    /**
     * Get activity recommendations for a city.
     *
     * Uses the same coordinate format as forecast query.
     * Integrates weather data with activity ranking algorithm.
     *
     * Process:
     * 1. Parse coordinates from cityId
     * 2. Fetch average weather across forecast period
     * 3. Run ActivityRanker to generate scores
     * 4. Return sorted activities with explanations
     */
    activityRanking: async (
      _: unknown,
      { cityId }: { cityId: string },
      { activityService }: ResolverContext
    ) => {
      const { latitude, longitude } = parseCoordinates(cityId);

      try {
        const { scores, recommended } = await activityService.rankActivitiesForCity(latitude, longitude);

        return {
          city: {
            id: cityId,
            name: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            country: 'Unknown',
            latitude,
            longitude
          },
          scores,
          recommended
        };
      } catch (error) {
        if (error instanceof Error) {
          throw new WeatherFetchError(`Could not rank activities: ${error.message}`);
        }
        throw new WeatherFetchError();
      }
    }
  }
};

/**
 * Helper: Parse and validate coordinate string format.
 *
 * Input Format: "latitude:longitude"
 * Example: "-33.9249:18.4241"
 *
 * Validates that latitude is in [-90, 90] and longitude is in [-180, 180].
 * Throws InvalidCityIdError if format is invalid or values are out of range.
 */
function parseCoordinates(cityId: string): { latitude: number; longitude: number } {
  const parts = cityId.split(':');

  if (parts.length !== 2) {
    throw new InvalidCityIdError(cityId);
  }

  const latitude = parseFloat(parts[0]!);
  const longitude = parseFloat(parts[1]!);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new InvalidCityIdError(cityId);
  }

  if (latitude < -90 || latitude > 90) {
    throw new InvalidCityIdError(cityId);
  }

  if (longitude < -180 || longitude > 180) {
    throw new InvalidCityIdError(cityId);
  }

  return { latitude, longitude };
}
