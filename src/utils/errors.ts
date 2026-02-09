/**
 * Custom error classes for GraphQL error handling.
 * These extend Error to provide structured error responses via GraphQL.
 */

export class GraphQLError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'GraphQLError';
    Object.setPrototypeOf(this, GraphQLError.prototype);
  }
}

export class CityNotFoundError extends GraphQLError {
  constructor(query: string) {
    super(
      `No cities found matching "${query}". Try searching for major cities like "London", "Paris", or "New York".`,
      'CITY_NOT_FOUND',
      404
    );
    Object.setPrototypeOf(this, CityNotFoundError.prototype);
  }
}

export class InvalidCityIdError extends GraphQLError {
  constructor(cityId: string) {
    super(
      `Invalid city ID format: "${cityId}". Expected format: "latitude:longitude" (e.g., "51.5074:-0.1278")`,
      'INVALID_CITY_ID',
      400
    );
    Object.setPrototypeOf(this, InvalidCityIdError.prototype);
  }
}

export class WeatherFetchError extends GraphQLError {
  constructor(message: string = 'Failed to fetch weather data from OpenMeteo API. Please try again.') {
    super(message, 'WEATHER_FETCH_ERROR', 503);
    Object.setPrototypeOf(this, WeatherFetchError.prototype);
  }
}

export class ValidationError extends GraphQLError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
