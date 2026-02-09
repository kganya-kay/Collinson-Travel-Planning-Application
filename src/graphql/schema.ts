export const schema = `#graphql
  enum ActivityType {
    SKIING
    SURFING
    INDOOR_SIGHTSEEING
    OUTDOOR_SIGHTSEEING
  }

  type City {
    id: ID!
    name: String!
    country: String!
    latitude: Float!
    longitude: Float!
  }

  type DailyForecast {
    date: String!
    temperatureMax: Float!
    temperatureMin: Float!
    precipitation: Float!
    windSpeedMax: Float!
  }

  type Forecast {
    city: City!
    daily: [DailyForecast!]!
  }

  type ActivityScore {
    activity: ActivityType!
    score: Int!
    reason: String!
  }

  type ActivityRanking {
    city: City!
    scores: [ActivityScore!]!
    recommended: ActivityType!
  }

  type Query {
    citySuggestions(query: String!): [City!]!
    forecast(cityId: ID!): Forecast!
    activityRanking(cityId: ID!): ActivityRanking!
  }
`;
