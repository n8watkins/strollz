# Testing Guide - Mapbox Monitoring System

Comprehensive testing documentation for the Mapbox monitoring, rate limiting, and configuration system.

## Overview

The test suite ensures the Mapbox monitoring system works reliably without requiring actual API keys. All tests use mocks and can run in any environment.

## Test Structure

```
src/__tests__/
├── setup.ts                           # Test configuration and global mocks
├── services/
│   ├── mapboxUsage.test.ts            # Usage tracking and monitoring
│   ├── geocoding.test.ts              # Geocoding service with caching
│   └── mapboxConfig.test.ts           # Token and environment management
└── components/
    └── MapboxUsageDashboard.test.tsx   # Development dashboard UI
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test mapboxUsage.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Usage Tracking"
```

### Environment Setup

Tests run without requiring any Mapbox API keys or environment variables:

```bash
# No setup required - tests use mocks
npm test

# Optional: Run in different NODE_ENV
NODE_ENV=production npm test
```

## Test Coverage

### Services Coverage (90% minimum)

#### MapboxUsageService (`mapboxUsage.test.ts`)
- ✅ **Usage Tracking**: Map loads, geocoding, directions
- ✅ **Daily Usage**: Historical data and trends
- ✅ **Percentages**: Usage vs. free tier limits
- ✅ **Warning Levels**: Safe, yellow, orange, red alerts
- ✅ **Quota Management**: Remaining limits and permissions
- ✅ **Monthly Reset**: Automatic quota reset logic
- ✅ **Subscriptions**: Real-time update notifications
- ✅ **Error Handling**: localStorage failures and edge cases

#### GeocodingService (`geocoding.test.ts`)
- ✅ **Basic Geocoding**: Address to coordinates conversion
- ✅ **Caching**: 24-hour TTL with size limits
- ✅ **Debouncing**: 300ms delay for user input
- ✅ **Rate Limiting**: Quota and token validation
- ✅ **Request Deduplication**: Preventing duplicate API calls
- ✅ **Reverse Geocoding**: Coordinates to place names
- ✅ **Error Handling**: Network, quota, and validation errors
- ✅ **Cache Management**: TTL expiration and cleanup

#### MapboxConfigService (`mapboxConfig.test.ts`)
- ✅ **Environment Detection**: Dev, staging, production
- ✅ **Token Management**: Environment-specific tokens
- ✅ **Token Validation**: Format checking and warnings
- ✅ **Service Permissions**: Feature availability checks
- ✅ **Configuration Details**: Usage limits and restrictions
- ✅ **Setup Instructions**: Environment-specific guidance
- ✅ **Edge Cases**: Malformed tokens and missing variables

### Components Coverage (80% minimum)

#### MapboxUsageDashboard (`MapboxUsageDashboard.test.tsx`)
- ✅ **Environment Visibility**: Development only, hidden in production
- ✅ **Usage Display**: Current statistics and percentages
- ✅ **Warning Levels**: Color-coded button states
- ✅ **Progress Bars**: Visual usage indicators
- ✅ **Quick Actions**: Cache clearing and refresh
- ✅ **Details Section**: Daily usage and cache stats
- ✅ **Invalid Token Handling**: Setup instructions and warnings
- ✅ **Accessibility**: ARIA labels and keyboard navigation
- ✅ **Error Handling**: Service failures and missing data

## Mock Strategy

### Service Mocks

All external dependencies are mocked to ensure reliable, fast tests:

```typescript
// mapboxUsageService mock
jest.mock('@/services/mapboxUsage', () => ({
  mapboxUsageService: {
    canMakeRequest: jest.fn().mockReturnValue(true),
    trackGeocodingRequest: jest.fn(),
    getUsage: jest.fn().mockReturnValue({
      mapLoads: 1000,
      geocodingRequests: 500,
      directionsRequests: 100
    })
  }
}))

// mapboxConfig mock
jest.mock('@/services/mapboxConfig', () => ({
  mapboxConfig: {
    getToken: jest.fn().mockReturnValue('pk.test_token'),
    isTokenValid: jest.fn().mockReturnValue(true),
    canMakeRequest: jest.fn().mockReturnValue(true)
  }
}))

// fetch mock
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(mockMapboxResponse)
})
```

### Browser API Mocks

Essential browser APIs are mocked in `setup.ts`:

```typescript
// localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

// Console methods (to reduce test noise)
jest.spyOn(console, 'warn').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})

// Date mock (for consistent time-based tests)
Date.now = jest.fn(() => mockDate.getTime())
```

## Test Scenarios

### Usage Tracking Tests

```typescript
describe('Usage Tracking', () => {
  test('should track map loads correctly', () => {
    mapboxUsageService.trackMapLoad()
    mapboxUsageService.trackMapLoad()
    
    const usage = mapboxUsageService.getUsage()
    expect(usage.mapLoads).toBe(2)
  })

  test('should calculate usage percentages', () => {
    // Track 1000 map loads
    for (let i = 0; i < 1000; i++) {
      mapboxUsageService.trackMapLoad()
    }
    
    const percentages = mapboxUsageService.getUsagePercentages()
    expect(percentages.mapLoads).toBe(1000 / 50000) // 2%
  })
})
```

### Caching Tests

```typescript
describe('Caching', () => {
  test('should cache successful geocoding results', async () => {
    // First request hits API
    const results1 = await geocodingService.geocode('San Francisco')
    
    // Second request uses cache
    const results2 = await geocodingService.geocode('San Francisco')

    expect(results1).toEqual(results2)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('should respect TTL expiration', async () => {
    await geocodingService.geocode('San Francisco')

    // Mock time passing beyond TTL
    Date.now = jest.fn(() => Date.now() + 25 * 60 * 60 * 1000)

    await geocodingService.geocode('San Francisco')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
```

### Error Handling Tests

```typescript
describe('Error Handling', () => {
  test('should handle quota exceeded', async () => {
    mapboxUsageService.canMakeRequest.mockReturnValue(false)

    await expect(geocodingService.geocode('test')).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
      message: 'Monthly geocoding quota exceeded'
    })
  })

  test('should handle localStorage errors gracefully', () => {
    localStorage.setItem.mockImplementation(() => {
      throw new Error('Storage full')
    })

    expect(() => {
      mapboxUsageService.trackMapLoad()
    }).not.toThrow()
  })
})
```

### Component Tests

```typescript
describe('Dashboard Component', () => {
  test('should hide in production', () => {
    process.env.NODE_ENV = 'production'
    
    const { container } = render(<MapboxUsageDashboard />)
    expect(container.firstChild).toBeNull()
  })

  test('should display usage statistics', () => {
    render(<MapboxUsageDashboard />)
    
    fireEvent.click(screen.getByTitle('Toggle Mapbox Usage Dashboard'))
    
    expect(screen.getByText('1,000 / 50,000')).toBeInTheDocument()
  })
})
```

## Running Without API Keys

The entire test suite is designed to run without any Mapbox configuration:

### Mock Data
```typescript
// Sample Mapbox API response
const mockMapboxResponse = {
  features: [
    {
      center: [-122.4194, 37.7749],
      place_name: 'San Francisco, California, United States',
      relevance: 1
    }
  ]
}

// Mock token
const mockToken = 'pk.xxx'
```

### Environment Variables
Tests automatically mock all environment variables:

```typescript
// All tests work without any .env configuration
beforeEach(() => {
  process.env = { ...originalEnv }
  // Tests set their own mock values as needed
})
```

## Performance Testing

### Response Time Tests

```typescript
test('should debounce rapid geocoding requests', (done) => {
  let callCount = 0
  const callback = (results, error) => {
    callCount++
    if (callCount === 1) {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      done()
    }
  }

  // Rapid fire requests - only one should go through
  geocodingService.debouncedGeocode('test', callback)
  geocodingService.debouncedGeocode('test', callback)
  geocodingService.debouncedGeocode('test', callback)
})
```

### Memory Usage Tests

```typescript
test('should handle cache size limits', async () => {
  // Fill cache beyond limits
  for (let i = 0; i < 1500; i++) {
    await geocodingService.geocode(`Location ${i}`)
  }

  const stats = geocodingService.getCacheStats()
  expect(stats.size).toBeLessThanOrEqual(1000) // Max cache size
})
```

## Continuous Integration

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

### Coverage Requirements

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/services/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  }
}
```

## Debugging Tests

### Common Issues

1. **Mock not working**: Check import order and jest.mock() placement
2. **Async test failures**: Ensure proper await/Promise handling
3. **localStorage errors**: Verify localStorage mock is setup
4. **Environment variables**: Check process.env mocking

### Debug Commands

```bash
# Run single test with debug output
npm test -- --testNamePattern="specific test" --verbose

# Run with Node debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Check coverage for specific file
npm test -- --coverage --collectCoverageFrom="src/services/mapboxUsage.ts"
```

### Test Utilities

```typescript
// Helper for testing async operations
const waitForAsyncOperations = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper for testing debounced functions
const waitForDebounce = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Helper for mocking time
const mockTime = (timeMs) => {
  Date.now = jest.fn(() => timeMs)
}
```

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Test both happy path and error cases
- Keep tests focused and isolated

### Mock Management
- Reset mocks between tests
- Use specific mocks for specific scenarios
- Avoid over-mocking (mock only what's needed)
- Document complex mock setups

### Assertion Strategy
- Test behavior, not implementation
- Use specific matchers (toBeCalledWith vs toBeCalled)
- Test edge cases and error conditions
- Verify both positive and negative scenarios

### Coverage Goals
- Services: 90%+ (core business logic)
- Components: 80%+ (UI and interaction)
- Focus on critical paths and error handling
- Don't chase 100% coverage at expense of quality

This testing strategy ensures the Mapbox monitoring system is reliable, maintainable, and can be developed with confidence even without API access.