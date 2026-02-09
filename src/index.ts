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
 * Architecture:
 * This application uses a layered, dependency-injection pattern:
 *
 * Layers (from bottom to top):
 * 1. Clients (OpenMeteoClient) - External API communication
 * 2. Services - Business logic and data transformation
 * 3. Resolvers - GraphQL query handlers (thin adapter layer)
 * 4. Apollo Server - GraphQL server and HTTP transport
 *
 * Benefits of this structure:
 * - Services are testable in isolation (can mock clients)
 * - Resolvers are thin, making schema changes easy
 * - Business logic is reusable (not tied to GraphQL)
 * - Clear separation of concerns
 * - Easy to add new data sources (just create new client/service)
 *
 * Startup Process:
 * 1. Initialize the OpenMeteo client (stateless HTTP client)
 * 2. Inject client into services
 * 3. Create Apollo GraphQL server with schema and resolvers
 * 4. Start standalone server on port 4000
 * 5. Services are passed via context to resolvers
 */
async function startServer() {
  // 1. Initialize external API client
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
  // - Listens on default port 4000
  // - Hosts GraphQL Sandbox IDE at /
  // - Context is passed to every resolver for service access
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
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
