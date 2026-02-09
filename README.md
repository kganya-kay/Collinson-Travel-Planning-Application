# Weather Activity API

A GraphQL API that provides city suggestions, weather forecasts from OpenMeteo, and activity recommendations based on weather conditions.

## Overview

This API helps users find suitable activities for a selected city by:
1. **City Suggestions**: Search and autocomplete city names via OpenMeteo Geocoding API
2. **Weather Forecast**: Fetch detailed 7-day weather predictions with temperature, precipitation, and wind data
3. **Activity Ranking**: Recommend optimal activities (skiing, surfing, indoor/outdoor sightseeing) based on weather analysis

The entire application is built with TypeScript, focusing on clean architecture, type safety, and comprehensive testing.

## Project Structure

```
src/
  index.ts                 # Apollo Server entry point and service initialization
  graphql/
    schema.ts              # GraphQL type definitions (Query, types, enums)
    resolvers.ts           # Query resolvers with input validation and error handling
  modules/
    city/
      city.service.ts      # City search logic and API transformation
      city.types.ts        # TypeScript interfaces for city domain
    weather/
      weather.service.ts   # Weather forecast fetching and aggregation
      weather.types.ts     # Weather data types and structures
    activity/
      activity.service.ts  # Activity recommendation orchestration
      activity.types.ts    # Activity scoring types
  clients/
    openmeteo.client.ts    # OpenMeteo API HTTP client wrapper
  utils/
    activityRanker.ts      # Core activity scoring algorithm (deterministic)
    errors.ts              # Custom GraphQL error classes
tests/
  city.test.ts             # City service with mocked OpenMeteo client
  weather.test.ts          # Weather service with forecast transformations
  activity.test.ts         # Activity ranking algorithm verification (19 tests)
```

## Architecture

### Layered Design

The application follows a **layered architecture** pattern to separate concerns:

1. **HTTP/GraphQL Layer** (resolvers.ts)
   - Entry points for queries
   - Input validation and coordinate parsing
   - Error transformation to GraphQL format

2. **Business Logic Layer** (services/)
   - CityService: city search operations
   - WeatherService: forecast fetching and aggregation
   - ActivityService: activity recommendation orchestration

3. **External Integration Layer** (clients/)
   - OpenMeteoClient: HTTP communication with OpenMeteo APIs
   - Handles API request/response transformation

4. **Pure Business Logic Layer** (utils/)
   - ActivityRanker: deterministic scoring algorithm
   - Fully testable, no external dependencies

### Dependency Injection

Services receive dependencies through their constructors:
```typescript
const cityService = new CityService(openMeteoClient);
const weatherService = new WeatherService(openMeteoClient);
const activityService = new ActivityService(weatherService);
```

Benefits:
- Easy to mock for testing
- Decoupled components
- Flexible to swap implementations

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the server with hot reload:
```bash
npm run dev
```

Server runs on `http://localhost:4000`. Visit the URL to open **Apollo Sandbox** for interactive API exploration.

### Production Build

```bash
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled JavaScript
```

### Testing

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Results:** 19 tests, 100% pass rate

## API Examples

### Query 1: City Suggestions

```graphql
query CitySearch {
  citySuggestions(query: "london") {
    id
    name
    country
    latitude
    longitude
  }
}
```

Returns top 10 cities matching the search query.

### Query 2: Weather Forecast

```graphql
query GetForecast {
  forecast(cityId: "51.5074:-0.1278") {
    city {
      name
      latitude
      longitude
    }
    daily {
      date
      temperatureMax
      temperatureMin
      precipitation
      windSpeedMax
    }
  }
}
```

Note: `cityId` format is `"latitude:longitude"` (coordinates from city search).

### Query 3: Activity Recommendations

```graphql
query GetActivityRanking {
  activityRanking(cityId: "51.5074:-0.1278") {
    city {
      name
      country
    }
    scores {
      activity
      score
      reason
    }
    recommended
  }
}
```

Returns all activities sorted by suitability with scoring explanations.

## Activity Ranking Algorithm

The ranking system uses **explicit, domain-driven scoring rules**:

### Surfing
- Wind speed ≥ 25 km/h: **+30 points** (primary factor - creates swells)
- Precipitation < 2 mm: **+20 points** (visibility)
- Temperature > 18°C: **+20 points** (comfort)

### Skiing
- Temperature < 5°C: **+40 points** (snow preservation)
- Precipitation > 2 mm: **+20 points** (fresh powder)

### Outdoor Sightseeing
- Precipitation < 1 mm: **+40 points** (visibility and comfort)
- Temperature 18-28°C: **+30 points** (comfort range)

### Indoor Sightseeing
- Precipitation > 4 mm: **+40 points** (complement to outdoor activities)
- Wind speed > 30 km/h: **+20 points** (suggests staying indoors)

The algorithm:
1. Calculates average weather across the forecast period
2. Scores each activity independently using explicit rules
3. Ranks activities by total score
4. Returns the highest-scoring activity as "recommended"

**Why deterministic scoring:**
- Transparent and auditable
- Easy to test and verify
- Can explain recommendations to users
- Simpler to iterate based on feedback

## Architectural Tradeoffs

### Design Decisions Made

#### 1. Coordinates as City IDs
**Choice:** Use `"latitude:longitude"` format instead of database IDs

**Advantages:**
- No database required (MVP simplicity)
- Stateless, coordinates are immutable references
- Works directly with OpenMeteo API

**Limitations:**
- Loses city name/country context in subsequent queries
- Users must preserve coordinates between interactions
- Production systems would use database primary keys

#### 2. Average Weather for Ranking
**Choice:** Use average forecast metrics rather than daily ranking

**Advantages:**
- Simpler API response
- Single clear recommendation
- Faster ranking calculation

**Limitations:**
- Temporal context lost (heavy rain tomorrow vs. all week same score)
- Can't show activity suitability timeline
- Production systems might use weighted per-day scoring

#### 3. No Caching
**Choice:** Fetch fresh data on every request

**Advantages:**
- Always current forecast
- Simpler implementation

**Limitations:**
- Slower responses (API round-trip)
- Higher load on OpenMeteo
- Production systems would cache with 2-4 hour TTL

#### 4. No Authentication
**Choice:** Public API without authentication

**Advantages:**
- Simplified testing and exploration
- No user management burden

**Limitations:**
- No rate limiting per user
- Can't provide personalized preferences
- Production systems need JWT + rate limiting

## Improvements for Production

If given more time or increased scope:

### Performance
- [ ] **Redis caching** for forecasts (2-4 hour TTL)
- [ ] **DataLoader** for batch queries
- [ ] **Persisted queries** to reduce payload size
- [ ] **CDN** for static schema assets

### Reliability
- [ ] **Rate limiting** (100 req/min per IP)
- [ ] **Input validation** with Zod/Joi
- [ ] **Error tracking** (Sentry integration)
- [ ] **Health check endpoint** for monitoring
- [ ] **Graceful fallback** for API outages

### Features
- [ ] **User profiles** with saved favorite cities
- [ ] **Historical preferences** for personalization
- [ ] **Multi-day activity plans** (itineraries)
- [ ] **Push notifications** for ideal activity windows
- [ ] **REST API** alongside GraphQL

### Observability
- [ ] **Prometheus metrics** for monitoring
- [ ] **Distributed tracing** (OpenTelemetry)
- [ ] **Structured logging** (JSON logs)
- [ ] **Performance profiling**

### Security
- [ ] **API key authentication** and management
- [ ] **CORS configuration** for frontend origins
- [ ] **Input sanitization**
- [ ] **Rate limiting per API key**
- [ ] **HTTPS enforcement**

## Technology Stack

| Layer | Technology | Version | Why This Choice |
|-------|-----------|---------|-----------------|
| Runtime | Node.js | 18+ | Modern, stable, good package ecosystem |
| Language | TypeScript | 5.0+ | Type safety, better IDE support, catches errors early |
| GraphQL | Apollo Server | 4.10+ | Feature-complete, great developer experience, Apollo Sandbox |
| Testing | Jest | 29.5+ | Fast, comprehensive, built-in mocking support |
| HTTP Client | Axios | 1.6+ | Promise-based, simple error handling, request interceptors |
| Dev Server | tsx | 4.0+ | Native ESM support, hot reload, fast development |

## Error Handling

The API returns structured GraphQL errors with helpful messages:

```graphql
query {
  citySuggestions(query: "")
}
```

Response:
```json
{
  "errors": [
    {
      "message": "No cities found matching \"\". Try searching for major cities like \"London\", \"Paris\", or \"New York\".",
      "extensions": {
        "code": "CITY_NOT_FOUND"
      }
    }
  ]
}
```

Custom error classes in `utils/errors.ts` provide:
- Meaningful error messages
- Error codes for client handling
- Appropriate HTTP status codes

## Testing Strategy

### Unit Testing Approach

**ActivityRanker Tests** (11 tests)
- Pure function testing - no mocking needed
- Tests specific weather scenarios
- Verifies scoring logic and sorting

**Service Tests** (8 tests)
- Mocked OpenMeteo client (no real API calls)
- Fast execution (< 1ms each)
- Tests data transformation and error handling

Test coverage:
- ✅ Activity scoring with various weather conditions
- ✅ City search with success and error cases
- ✅ Weather forecast transformation
- ✅ Edge cases (empty input, invalid coords, zero scores)

### Why This Approach

1. **No External API Calls**: Tests run in milliseconds, no network latency
2. **Deterministic**: Same input always produces same output
3. **Isolated**: Each layer tested independently
4. **Clear Intent**: Tests document expected behavior

## License

MIT

---

## Questions or Feedback?

For architecture explanations, see [INTERVIEW_PREP.md](./INTERVIEW_PREP.md) which documents design decisions and potential interview questions.
