# Interview Preparation Guide

## Project Overview

This is a GraphQL API that demonstrates professional software engineering practices. The project helps users discover suitable activities based on city weather conditions using real-time OpenMeteo APIs.

## Key Architectural Decisions to Explain

### 1. **Layered Architecture Pattern**
- **Why**: Separation of concerns, testability, and maintainability
- **Layers**:
  - **Clients**: OpenMeteo HTTP client (external API integration)
  - **Services**: Business logic isolated from GraphQL/HTTP concerns
  - **Resolvers**: Thin adapters between GraphQL and services
  - **GraphQL Server**: HTTP and schema layer

**Interview Question Prep:**
- "How would you scale this if you needed to handle 10x more requests?"
  - Answer: Add caching (Redis), database (PostgreSQL), implement rate limiting
- "Why separate services from resolvers?"
  - Answer: Services can be reused by other interfaces (REST API, webhooks); easier testing

### 2. **Dependency Injection Pattern**
```typescript
// Services receive dependencies via constructor, not creating them
const cityService = new CityService(openMeteoClient);
const weatherService = new WeatherService(openMeteoClient);
```

**Why This Matters:**
- Makes mocking trivial for tests
- Decouples components
- Flexible to swap implementations (mock vs. real)

**Tradeoff:**
- A bit more ceremony setup in `index.ts`
- But tests become dramatically simpler

### 3. **Coordinate-Based Addressing**
- Format: `"latitude:longitude"` (e.g., `"-33.9249:18.4241"`)

**Why This Approach:**
- Eliminates need for a database/persistent storage
- Coordinates are immutable, deterministic references
- Works directly with OpenMeteo API

**Tradeoff Discussion:**
- Loses city name/country context after search
- Real app would store in DB with primary key IDs
- Current approach is MVP acceptable

### 4. **Deterministic Ranking Algorithm**
- Uses explicit, domain-driven scoring rules
- Not ML/blackbox (see `activityRanker.ts`)

**Why:**
- Transparent and auditable
- Easy to test and debug
- Can explain why an activity was recommended

**Interview Deep-Dive:**
- "How would you extend this to handle seasonal preferences?"
  - Could add seasonal weights or user preference learning
- "What if activity scoring conflicts occur?"
  - Current system sorts by score; could implement preference voting

## Code Quality Decisions

### Error Handling
Look at `utils/errors.ts`:
- **Custom error classes** extend Error with GraphQL codes
- **Structured errors** with helpful messages
- Inherited by services (CityNotFoundError, WeatherFetchError)

**Interview question:** "How do you handle errors in your GraphQL API?"
- Mention: Type-safe errors, meaningful messages, correct HTTP codes

### Testing Strategy
- **Activity Ranker**: Pure function testing (no external dependencies)
- **Services**: Mocked client tests
- **No API mocking needed**: Tests use mocked `OpenMeteoClient`

**Why this approach:**
- Unit tests are fast (no external API calls)
- Each layer is independently testable
- Integration testing could be added for end-to-end

### Type Safety
- Full TypeScript with `strict: true`
- Separate `.types.ts` files for domain models
- Type-safe services (no `any` types)

## What to Emphasize in the Interview

### 1. **Problem Understanding** ✅
You understood the requirements:
- City suggestions (autocomplete from user input)
- Weather forecasts (7-day from coordinates)
- Activity recommendations (based on weather conditions)

### 2. **Design Thinking** ✅
- Showed tradeoffs (coordinates vs. DB IDs)
- Addressed scalability concerns (caching, rate limiting noted in README)
- Clean folder structure matching requirements

### 3. **Implementation Quality** ✅
- Proper error handling with custom errors
- Tested with unit tests (19 passing)
- Meaningful code comments explaining *why*, not just *what*
- Type-safe throughout

### 4. **Business Logic** ✅
- Activity ranking algorithm is deterministic and explainable
- Scoring rules are domain-driven
- Average weather aggregation is justified

## Interview Questions You Should Ask Back

### Clarification Questions (shows you're thorough):
1. "Would this API be used by web, mobile, or both?"
2. "How many requests/day do we expect?"
3. "Should users be able to save their city preferences?"

### Technical Depth Questions (you ask them):
1. "Would you prefer caching at the API layer or database layer?"
2. "For activity ranking, would users expect personalization or general recommendations?"
3. "How important is real-time weather accuracy vs. performance?"

## Potential Critiques (Be Ready!)

**"Why no database?"**
- Explain: This is an MVP. OpenMeteo coordinates work well for stateless design. Production would add PostgreSQL for user persistence.

**"Why average weather instead of per-day recommendations?"**
- Explain: MVP scope - simpler UX. Could extend to daily rankings with time-based queries.

**"Why no authentication?"**
- Explain: Removed per requirements (MVP simplicity). Production needs JWT + rate limiting.

**"The coordinate format is awkward for users"**
- Agree: This is a tradeoff. Real app would:
  - Store cities in DB with proper IDs
  - Pass city data through session/context
  - Use GraphQL aliases for better UX

## Performance & Scalability Talking Points

**If asked about scaling to 100k users/day:**

1. **Caching Layer** (Redis)
   - Cache forecast results (2-4 hour TTL)
   - Cache city search results

2. **Database** (PostgreSQL)
   - Store user preferences
   - Cache popular city searches
   - Index on coordinates for fast lookup

3. **Rate Limiting**
   - 100 req/min per IP
   - 1000 req/day per API key
   - Backpressure for OpenMeteo API costs

4. **Infrastructure**
   - Load balancer (multiple server instances)
   - CDN for static assets
   - Separate read/write replicas

## Code Walkthrough (Explain This in Interview)

### Start with resolvers.ts
"Look at how simple the resolver is - it just validates input and calls services. This keeps GraphQL concerns separate from business logic."

### Show the service layer
"Each service is focused on one job. CityService handles searches, WeatherService handles forecasts. Easy to test in isolation."

### Point out the ranker
"The ranking algorithm is pure - no side effects, fully testable. We pass in weather, get back scored activities with reasons."

### Tests
"We test the critical path: does ranking work correctly? Does city search error properly? These are unit tests so they run in milliseconds."

## Red Flags to Avoid

❌ **Don't say:** "I just followed the requirements without thinking about tradeoffs"
✅ **Do say:** "I chose coordinates because it simplified the MVP, but recognized that production would use database IDs"

❌ **Don't say:** "I don't know why I structured it this way"
✅ **Do say:** "This layered approach makes the code testable and decoupled from GraphQL specifics"

❌ **Don't say:** "I just used whatever felt easiest"
✅ **Do say:** "I considered several approaches and chose this one because of [reasons]"

## Final Checklist Before Interview

- [ ] Can I explain the activity ranking algorithm without looking at code?
- [ ] Can I explain why coordinates are used instead of database IDs?
- [ ] Can I talk about the layered architecture benefits and tradeoffs?
- [ ] Can I walk through a single GraphQL query from resolver to service to API client?
- [ ] Can I explain the testing strategy and why it's effective?
- [ ] Can I discuss how I'd scale this to production?
- [ ] Can I justify each dependency choice (Apollo Server, OpenMeteo, Jest)?
- [ ] Can I articulate what I'd do differently with more time?

## Mock Interview Questions

**Q1: Walk me through what happens when a user searches for a city.**
A: The `citySuggestions` resolver receives the query, calls `cityService.searchCities()` which calls the OpenMeteo Geocoding API, transforms the results to our City type, and returns them. If no results, throws a structed error.

**Q2: Why use coordinates for city IDs instead of a database?**
A: Tradeoff for MVP scope. Coordinates are stateless, work directly with OpenMeteo, require no persistence. Real app would use DB IDs, sacrifice this simplicity, gain user persistence.

**Q3: How would you handle a spike in weather API calls?**
A: Implement caching with Redis (forecast results have 2-4 hour validity). Rate limit the external API. In longer term, batch requests and use a queue.

**Q4: Show me a test and explain your testing philosophy.**
Point to `tests/activity.test.ts` - explain that the ranker is pure function, so no mocking needed. Testing services requires mocking the client.

**Q5: What's a limitation of your current approach?**
A: Averaging weather loses temporal context. Heavy rain only tomorrow vs. all week gets same score. Could improve with weighted scoring or per-day recommendations.
