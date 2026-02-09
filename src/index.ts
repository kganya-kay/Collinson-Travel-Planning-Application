import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { schema } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { OpenMeteoClient } from './clients/openmeteo.client.js';
import { CityService } from './modules/city/city.service.js';
import { WeatherService } from './modules/weather/weather.service.js';
import { ActivityService } from './modules/activity/activity.service.js';

/**
 * GraphQL Server Entry Point
 *
 * Configuration:
 * - Reads environment variables from .env file
 * - Falls back to sensible defaults for each setting
 * - Validates that required services are configured
 */
async function startServer() {
  // Log configuration for debugging
  const port = process.env.PORT || 4000;
  const env = process.env.NODE_ENV || 'development';
  
  console.log(`📋 Configuration:`);
  console.log(`   Environment: ${env}`);
  console.log(`   Port: ${port}`);
  console.log(`   Geocoding URL: ${process.env.OPENMETEO_GEOCODING_URL || 'default'}`);
  console.log(`   Forecast URL: ${process.env.OPENMETEO_FORECAST_URL || 'default'}`);

  // 1. Initialize external API client (loads URLs from env)
  const openMeteoClient = new OpenMeteoClient();

  // 2. Initialize service layer with dependency injection
  const cityService = new CityService(openMeteoClient);
  const weatherService = new WeatherService(openMeteoClient);
  const activityService = new ActivityService(weatherService);

  // 3. Create GraphQL server
  // - typeDefs (schema.ts) define the GraphQL type system
  // - resolvers handle incoming queries by delegating to services
  const server = new ApolloServer({
    typeDefs: schema,
    resolvers
  });

  // 4. Start the server in standalone mode
  // - Listens on configured port (default 4000)
  // - Hosts GraphQL Sandbox IDE at /
  // - Context is passed to every resolver for service access
  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(port) },
    context: async () => ({
      cityService,
      weatherService,
      activityService
    })
  });

  console.log(`🚀 Server ready at ${url}`);
  console.log(`📚 Visit ${url} and use Apollo Sandbox to explore the schema`);
}

// Start the server and handle startup errors
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
