# API Usage Limits and Management

## Overview

StrollVibe uses several external APIs to provide route generation and mapping functionality. This document outlines the usage limits, monitoring systems, and protection mechanisms in place.

## API Services and Limits

### Mapbox APIs

StrollVibe uses Mapbox's free tier with the following monthly limits:

#### 1. **Directions API** - Route Generation
- **Monthly Limit**: 100,000 requests
- **Usage**: Generate turn-by-turn walking directions between waypoints
- **Typical Route**: 1-3 requests per generated route
- **Rate Limit**: 10 requests per minute per user
- **Burst Limit**: 3 requests per 10 seconds

#### 2. **Geocoding API** - Location Search
- **Monthly Limit**: 100,000 requests
- **Usage**: Convert addresses to coordinates for location search
- **Typical Search**: 1 request per search query
- **Rate Limit**: 50 requests per minute per user
- **Burst Limit**: 10 requests per 10 seconds

#### 3. **Maps API** - Map Rendering
- **Monthly Limit**: 50,000 map loads
- **Usage**: Display interactive maps with routes and markers
- **Typical Session**: 1 map load per page visit
- **Rate Limit**: No client-side rate limiting (handled by Mapbox)

#### 4. **Isochrone API** - Reachable Areas
- **Monthly Limit**: Included in Directions API quota
- **Usage**: Calculate walking-reachable areas for route planning
- **Typical Route**: 1 request per route generation (optional)

### OpenStreetMap APIs

#### 1. **Overpass API** - Point of Interest Data
- **Monthly Limit**: No official limit (community-run)
- **Usage**: Find real places (cafes, parks, museums) for route destinations
- **Typical Route**: 1-2 requests per route generation
- **Rate Limit**: 5 requests per minute per user (self-imposed)
- **Caching**: 30-minute cache to reduce API load

## Protection Mechanisms

### 1. **Hard Stops** - Quota Protection

When API usage reaches critical levels, the system implements hard stops:

- **70% Quota**: All new requests blocked with clear error messages (HARD STOP)
- **60% Quota**: Red warning indicators and user notifications
- **50% Quota**: Orange warning indicators in admin dashboard
- **35% Quota**: Yellow warning indicators

### 2. **Rate Limiting** - Abuse Prevention

Multiple layers of rate limiting prevent API abuse:

#### User-Level Rate Limits
```typescript
// Route generation: 10 requests per minute
// Geocoding: 50 requests per minute
// Burst protection: 3-10 requests per 10 seconds
```

#### System-Level Protection
- **Debounced Requests**: UI prevents rapid-fire requests
- **Request Cancellation**: Cancel previous requests when new ones start
- **Loading States**: Clear feedback during API calls
- **Console Error Logging**: Rate limit violations logged to console for debugging

### 3. **Intelligent Caching** - Efficiency

Caching reduces API usage while maintaining performance:

- **POI Cache**: 30-minute TTL for OpenStreetMap data
- **Geocoding Cache**: 24-hour TTL for location searches
- **Route Cache**: Session-based caching for user experience

## Monitoring and Alerts

### 1. **Real-Time Monitoring**

The system tracks usage in real-time:

```typescript
// Current usage tracking
{
  mapLoads: 1234,
  geocodingRequests: 567,
  directionsRequests: 890,
  lastReset: "2024-01-01T00:00:00Z"
}
```

### 2. **Daily Usage Analytics**

Historical usage data for trend analysis:

```typescript
// Daily breakdown
{
  "2024-01-01": {
    mapLoads: 45,
    geocodingRequests: 23,
    directionsRequests: 12
  }
}
```

### 3. **Warning System**

Automated alerts at usage thresholds:

- **35%**: Yellow warning in console
- **50%**: Orange warning with user notification  
- **60%**: Red alert with feature restrictions
- **70%**: Hard stop with clear error messages (ALL REQUESTS BLOCKED)

## Usage Optimization Strategies

### 1. **Efficient Route Generation**

- **Batch POI Queries**: Multiple POI types in single OpenStreetMap request
- **Smart Waypoint Selection**: Minimize directions API calls
- **Route Validation**: Pre-validate routes before full generation

### 2. **Caching Strategy**

- **Geographic Clustering**: Cache POI data by location areas
- **User Session**: Cache routes during user session
- **Intelligent Invalidation**: Clear cache when data becomes stale

### 3. **User Experience Optimization**

- **Debounced Search**: Prevent excessive geocoding requests
- **Progressive Loading**: Load map tiles on demand
- **Offline Fallbacks**: Graceful degradation when APIs unavailable

## Cost Management

### Free Tier Sustainability

Current usage patterns keep us well within free tier limits:

- **Estimated Monthly Users**: ~1,000 active users
- **Average Routes per User**: ~10 routes/month
- **Projected API Usage**: ~30% of free tier limits

### Scaling Considerations

If usage grows beyond free tier limits:

1. **Paid Tier Upgrade**: Mapbox Pro ($5/month for higher limits)
2. **API Optimization**: Further reduce API calls through caching
3. **User Limits**: Implement per-user monthly route limits
4. **Premium Features**: Monetize advanced features

## Error Handling

### User-Friendly Error Messages

```typescript
// API quota exceeded (70% hard stop)
"We've reached our monthly route generation limit. Please try again next month or contact support."

// Rate limit hit (with console error logging)
"You're generating routes too quickly. Please wait 30 seconds before trying again."
// Console: "Rate limit exceeded: Rate limit exceeded. Max 10 requests per 60 seconds. Please wait 30 seconds."

// Service unavailable
"Route generation temporarily unavailable. Please try again in a few minutes."
```

### Console Error Logging

Rate limit violations are logged to the console for debugging:

```typescript
// Rate limit console error format
console.error(`Rate limit exceeded: ${rateLimitCheck.reason} Please wait ${rateLimitCheck.retryAfter} seconds.`)

// Example output:
// "Rate limit exceeded: Rate limit exceeded. Max 10 requests per 60 seconds. Please wait 30 seconds."
// "Rate limit exceeded: Too many requests in burst window. Max 3 requests per 10 seconds. Please wait 10 seconds."
```

### Graceful Degradation

- **Fallback Routes**: Use cached or simplified routes when APIs fail
- **Partial Functionality**: Disable advanced features while maintaining core functionality
- **Status Page**: Clear communication about service availability

## Testing

### 1. **Unit Tests**

Comprehensive test suites verify API usage protection:

#### Mapbox Usage Tests (`src/services/__tests__/mapboxUsage.test.ts`)
- Usage tracking accuracy
- Hard stop triggering at 70% threshold
- Warning level calculations
- Monthly quota resets
- Console warning logging

#### Rate Limiter Tests (`src/services/__tests__/rateLimiter.test.ts`)
- Request rate limiting per user
- Burst protection (3 requests/10 seconds)
- Different API type limits
- User isolation
- History cleanup

#### Route Generation Tests (`src/services/__tests__/routeGeneration.test.ts`)
- Hard stop protection integration
- Rate limiting with console error logging
- Distance-based generation
- Route variation algorithms
- Error handling and graceful degradation

### 2. **Running Tests**

```bash
# Run all API usage tests
npm test -- --testPathPattern="services/__tests__"

# Run specific test file
npm test -- src/services/__tests__/mapboxUsage.test.ts

# Run with coverage
npm test -- --coverage src/services/__tests__/
```

### 3. **Test Coverage Requirements**

- **Hard Stop Logic**: 100% coverage of quota protection
- **Rate Limiting**: 100% coverage of burst and sustained limits
- **Error Handling**: All error conditions tested
- **Integration**: End-to-end workflow testing

## Development Guidelines

### 1. **API Request Best Practices**

```typescript
// Always check limits before making requests
const status = mapboxUsageService.getAPIStatus('directionsRequests')
if (status.shouldHardStop) {
  throw new Error('API quota exceeded')
}

// Use rate limiting
const rateLimitCheck = rateLimiterService.canMakeRequest('routeGeneration')
if (!rateLimitCheck.allowed) {
  throw new Error(rateLimitCheck.reason)
}
```

### 2. **Testing Without API Usage**

- **Mock Services**: Use mock data for development
- **Test Environment**: Separate API tokens for testing
- **Unit Tests**: Test logic without external API calls

### 3. **Monitoring Integration**

```typescript
// Track all API usage
mapboxUsageService.trackDirectionsRequest()
rateLimiterService.recordRequest('routeGeneration')
```

## Troubleshooting

### Common Issues

1. **"API quota exceeded"**: Wait for monthly reset or contact support
2. **"Rate limit hit"**: Slow down request frequency
3. **"Service unavailable"**: Check API status pages

### Debug Information

Enable debug logging to see detailed API usage:

```typescript
// Enable in development
localStorage.setItem('strollvibe-debug', 'true')
```

## Support and Maintenance

### Monthly Reviews

- Review API usage patterns
- Adjust rate limits if needed
- Update caching strategies
- Monitor user feedback

### Capacity Planning

- Track growth trends
- Plan for seasonal usage spikes
- Prepare upgrade paths for higher tiers

---

**Last Updated**: January 2024
**Next Review**: February 2024

For questions about API usage or limits, contact the development team.