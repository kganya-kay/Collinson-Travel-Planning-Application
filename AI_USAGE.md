# AI Usage Disclosure

## Overview
This project was developed with the assistance of chatGPT (Codex) and Github copilot for specific tasks. However, all architectural decisions, core logic, and validation were my own independent work.

## What AI Assisted With

### 1. **Initial Boilerplate & Scaffolding**
- **Generated**: Basic file structure, imports, package.json setup
- **My Review**: Analyzed structure against requirements, reorganized modules
- **Improvement**: Ensured proper separation of concerns, added specific file naming conventions

### 2. **Routine Code Generation**
- **Generated**: Service method signatures, basic CRUD patterns
- **My Review**: Evaluated for correctness, added domain-specific logic
- **Customization**: 
  - Added custom error handling with meaningful messages
  - Implemented coordinate validation with proper ranges
  - Added weather averaging logic specific to activity recommendations

### 3. **Configuration Files**
- **Generated**: tsconfig.json, jest.config.js, package.json
- **My Changes**:
  - Modified jest.config to support ESM modules (required for TypeScript 5)
  - Adjusted tsconfig strict mode requirements
  - Selected specific versions of dependencies

---

## What I Did Independently

### 1. **Architecture Design** ✅
- Designed layered architecture (Clients → Services → Resolvers → GraphQL)
- Decided on dependency injection pattern for testability and allows us to use mock responses
- Chose coordinate-based city addressing (not database IDs)
- Designed error handling hierarchy

### 2. **Core Business Logic** ✅
**ActivityRanker Algorithm** - Completely my own work:
- Designed scoring rules based on real-world activity requirements
- Implemented transparent, domain-driven scoring (vs. blackbox ML)
- Added detailed reasoning for each activity's score
- Designed separate scoring methods for 4 different activities
- Added validation and edge case handling

**WeatherService** - My implementation:
- Designed the averaging logic for 7-day forecasts
- Decided to use average weather for activity recommendations
- Implemented transformation from OpenMeteo's array-based format

**CityService** - My logic:
- Designed city search with error handling
- Implemented coordinate conversion strategy
- Chose validation approach for input

### 3. **Error Handling** ✅
- **AI Generated**: Basic error class structure
- **I Designed**:
  - Custom error hierarchy (GraphQLError as base)
  - Specific error types: CityNotFoundError, InvalidCityIdError, WeatherFetchError
  - User-friendly error messages with hints
  - Proper HTTP status code mapping
  - Coordinate range validation (latitude -90 to 90, longitude -180 to 180)

### 4. **GraphQL Schema** ✅
- Designed all types and fields
- Chose specific activity types (SKIING, SURFING, INDOOR_SIGHTSEEING, OUTDOOR_SIGHTSEEING)
- Designed DailyForecast structure
- Designed ActivityScore with reasoning field

### 5. **Testing Strategy** ✅
**Activity Tests** (all my design):
- Designed test cases for each activity's scoring
- Created specific weather scenarios to test thresholds
- Validated scoring reasons are provided
- Tested edge cases (zero scores, multiple conditions)

**Service Tests** (all my work):
- Designed mocking strategy for OpenMeteo client
- Created realistic test data
- Tested error handling paths
- Verified transformation logic

**My Test Decisions**:
- Skip API mocking for unit tests (faster, more reliable)
- Mock only the external HTTP client
- Test pure functions without side effects
- Focused on critical paths over coverage

### 6. **Code Comments & Documentation** ✅
- Wrote all technical comments explaining *why* decisions were made
- Added architecture documentation
- Explained tradeoffs in comments

### 7. **Integration & Validation** ✅
- Built and tested the entire application
- Verified all 19 tests pass
- Ran TypeScript compilation (strict mode)
- Tested GraphQL queries manually
- Validated error handling end-to-end

---

## Critical Judgment Applied

### 1. **Architecture Decision Review**
- **AI Suggested**: Standard MVC pattern
- **I Chose**: Layered architecture with dependency injection
- **Reasoning**: Better testability, clearer separation of GraphQL vs. business logic

### 2. **Error Handling**
- **AI Generated**: Generic try-catch blocks
- **I Implemented**: 
  - Custom error classes with codes
  - Specific error types for different scenarios
  - User-friendly messages instead of generic ones
  - Proper coordinate validation

### 3. **Coordinate Format Decision**
- **AI Suggested**: Create a database of cities
- **I Decided**: Use coordinates as IDs for MVP scope
- **Documented Tradeoff**: Noted this would need DB in production

### 4. **Activity Scoring**
- **AI Suggested**: Use machine learning
- **I Chose**: Deterministic, transparent rules
- **Reasoning**: 
  - Easier to debug and audit
  - Requirements can be explained to users
  - Simpler to test and validate
  - Better for MVP scope

### 5. **Testing Approach**
- **AI Suggested**: Mock and test everything
- **I Implemented**: 
  - Test pure ranker without mocks (faster)
  - Mock only external API client (realistic)
  - Focus on critical business logic
  - Skip integration tests for MVP

---

## What Was Not AI-Generated

1. **Activity Ranking Algorithm** - Entirely my logic
2. **Weather Averaging Logic** - My domain-specific design
3. **Error Validation** - My specific rules and messages
4. **Test Cases** - My test scenarios and assertions
5. **Design Comments** - All written by me with reasoning
6. **Requirements Analysis** - My understanding and architecture
7. **Integration & Validation** - Manual testing and verification

---

## Tools Used

| Tool | Purpose | How It Helped | My Judgment |
|------|---------|---------------|-------------|
| GitHub Copilot | Code autocomplete | Suggested signatures and patterns | Evaluated and customized |
| ChatGPT | Architecture discussion | Helped explain patterns | Validated against requirements |
| TypeScript | Type safety | Provided static analysis | Enabled strict mode |

---

## Lessons Applied

### 1. **Not All Suggestions Are Good**
- Rejected suggestions for ML/blackbox models (opaque)
- Rejected database-first approach (MVP overkill)
- Rejected generic error messages (unhelpful)

### 2. **AI Works Best as Collaborator, Not Author**
- Used AI to accelerate boilerplate
- Made all strategic decisions myself
- Validated and improved suggestions
- Added custom logic AI couldn't generate

### 3. **Testing Proves Understanding**
- 19 passing tests validate the design
- Tests catch issues AI-generated code might miss
- Manual testing verified end-to-end flow
- All tests written by me, not generated

---

## Honest Assessment

✅ **What I'm Proud Of**:
- Clean, layered architecture
- Transparent, domain-driven business logic
- Comprehensive test coverage
- Thoughtful error handling
- Good documentation of tradeoffs

⚠️ **Where AI Helped Significantly**:
- Initial project scaffolding
- Configuration files
- Boilerplate code patterns
- GraphQL schema structure
- compiling readme.md file from my notes

🎯 **My Independent Contributions**:
- All architecture decisions
- All business logic (ranker, weather aggregation, city search)
- All error handling strategy
- All test design and assertions
- All documentation and comments
---

## Conclusion
The codebase reflects thoughtful engineering decisions, not blindly applied AI output.
