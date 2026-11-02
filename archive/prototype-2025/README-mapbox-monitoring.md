# Mapbox Monitoring & Rate Limiting System

A comprehensive development monitoring system for tracking Mapbox API usage, preventing quota overruns, and optimizing API calls during development.

## Overview

This system provides real-time monitoring of Mapbox API usage with intelligent caching, rate limiting, and environment-specific token management. It's designed to keep you within the free tier limits while providing full visibility into your API consumption.

## Features

### 🔍 **Usage Monitoring**
- Real-time tracking of Map Loads, Geocoding, and Directions API calls
- Monthly quota tracking with automatic reset
- Daily usage trends and analytics
- Color-coded warning system (Green → Yellow → Orange → Red)

### ⚡ **Rate Limiting & Optimization**
- Debounced geocoding (300ms delay) prevents rapid-fire requests
- Intelligent caching with 24-hour TTL
- Request deduplication for identical queries
- Automatic fallback when quotas are exceeded

### 🌍 **Environment Management**
- Separate tokens for development, staging, and production
- Environment-specific usage limits and restrictions
- Token validation and setup guidance
- URL restrictions per environment

### 📊 **Development Dashboard**
- **Development-only** monitoring interface (hidden in production)
- Fixed bottom-right toggle with warning level indicators
- Real-time usage bars showing free tier consumption
- 7-day usage history and cache management

## Free Tier Limits

| Service | Monthly Limit | What's Tracked |
|---------|---------------|----------------|
| **Web Maps** | 50,000 map loads | Each `Map()` initialization |
| **Geocoding** | 100,000 requests | Address → coordinates conversions |
| **Directions** | 100,000 requests | Route calculations |

### Warning Thresholds
- 🟡 **Yellow**: 70% of limit used
- 🟠 **Orange**: 85% of limit used  
- 🔴 **Red**: 95% of limit used

## Quick Start

### 1. Environment Setup

The project is already configured with a development token in `.env.local`:

```bash
# Development token (already configured)
NEXT_PUBLIC_MAPBOX_TOKEN_DEV=pk.REDACTED

# Fallback token (same as above for development)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.REDACTED

# Environment specified
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=development
```

**Note**: This development token is configured for localhost usage. For production deployment, create a separate token with production URL restrictions.

### 2. Ready to Use

The monitoring system is now active! You should see:

1. **Development Dashboard**: Look for the colored activity button in the bottom-right corner
2. **Valid Token Status**: Dashboard will show "Token: Valid" when expanded
3. **Interactive Maps**: The discover page should now display the actual Mapbox map
4. **Geocoding**: Location search will work with real address lookups

### 3. Production Setup (When Ready)

For production deployment, create separate tokens at https://account.mapbox.com/access-tokens/:
1. **Set scopes**: Web Maps, Geocoding, Directions
2. **Add URL restrictions**:
   - Staging: `*.vercel.app`, `staging.domain.com`
   - Production: `yourdomain.com`, `*.yourdomain.com`

### 4. Using the Dashboard

1. **In development**, look for the monitoring button in bottom-right corner
2. **Button colors** indicate usage level:
   - 🟢 Green: Safe usage
   - 🟡 Yellow: Elevated usage (70%+)
   - 🟠 Orange: High usage (85%+)
   - 🔴 Red: Critical usage (95%+)
3. **Click to expand** for detailed stats and controls

## API Usage

### Tracking Usage Manually

```typescript
import { mapboxUsageService } from '@/services/mapboxUsage'

// Track API calls
mapboxUsageService.trackMapLoad()
mapboxUsageService.trackGeocodingRequest()
mapboxUsageService.trackDirectionsRequest()

// Check quotas
const canMakeRequest = mapboxUsageService.canMakeRequest('geocodingRequests')
const remainingQuota = mapboxUsageService.getRemainingQuota()
const warningLevel = mapboxUsageService.getWarningLevel() // 'safe' | 'yellow' | 'orange' | 'red'
```

### Using Geocoding Service

```typescript
import { geocodingService } from '@/services/geocoding'

// Debounced geocoding (automatically cached)
geocodingService.debouncedGeocode('San Francisco', (results, error) => {
  if (results) {
    console.log('Found locations:', results)
  }
})

// Direct geocoding
try {
  const results = await geocodingService.geocode('123 Main St')
  console.log('Coordinates:', results[0].coordinates)
} catch (error) {
  console.error('Geocoding failed:', error.message)
}
```

### Configuration Management

```typescript
import { mapboxConfig } from '@/services/mapboxConfig'

// Check token status
const isValid = mapboxConfig.isTokenValid()
const environment = mapboxConfig.getEnvironment() // 'development' | 'staging' | 'production'

// Verify service availability
const canUseGeocoding = mapboxConfig.canMakeRequest('geocoding')
const canUseMaps = mapboxConfig.canMakeRequest('maps')

// Get setup instructions
const setup = mapboxConfig.getSetupInstructions()
console.log('Environment variables needed:', setup.environmentVariables)
```

## File Structure

```
src/
├── services/
│   ├── mapboxUsage.ts      # Usage tracking and monitoring
│   ├── geocoding.ts        # Rate-limited geocoding with caching
│   └── mapboxConfig.ts     # Environment and token management
├── components/
│   └── dev/
│       └── MapboxUsageDashboard.tsx  # Development monitoring UI
└── app/
    └── layout.tsx          # Dashboard integration
```

## Environment Configuration

### Development
```bash
NEXT_PUBLIC_MAPBOX_TOKEN_DEV=pk.eyJ...
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=development
```
- **Daily limit**: 500 requests
- **URL restrictions**: `localhost:3000`, `127.0.0.1:3000`
- **Services**: Maps, Geocoding, Directions

### Staging  
```bash
NEXT_PUBLIC_MAPBOX_TOKEN_STAGING=pk.eyJ...
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=staging
```
- **Daily limit**: 1,000 requests
- **URL restrictions**: `*.vercel.app`, `staging.domain.com`
- **Services**: Maps, Geocoding, Directions

### Production
```bash
NEXT_PUBLIC_MAPBOX_TOKEN_PROD=pk.eyJ...
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=production
```
- **Daily limit**: 10,000 requests
- **URL restrictions**: `yourdomain.com`, `*.yourdomain.com`
- **Services**: Maps, Geocoding, Directions

## Optimization Tips

### 🚀 **Staying Within Free Tier**

1. **Use caching**: Geocoding results are cached for 24 hours
2. **Debounce inputs**: Wait 300ms before geocoding user input
3. **Lazy load maps**: Only initialize when needed
4. **Reuse instances**: Don't create multiple Map objects
5. **Monitor usage**: Check the dashboard regularly

### 🛠 **Troubleshooting**

**Token Issues:**
- Verify token starts with `pk.`
- Check URL restrictions match your domain
- Ensure token has correct scopes

**High Usage:**
- Clear geocoding cache if needed
- Check for runaway loops in components
- Review console warnings for optimization hints

**Cache Issues:**
- Use "Clear Cache" button in dashboard
- Check browser localStorage limits
- Verify cache TTL settings

## Best Practices

1. **Token Security**: Never commit tokens to git, use environment variables
2. **Environment Separation**: Use different tokens for dev/staging/prod
3. **Monitor Regularly**: Check usage dashboard weekly
4. **Optimize Early**: Implement caching and debouncing from the start
5. **Set Alerts**: Use console warnings to catch issues early

## Dashboard Features

### Usage Overview
- Monthly consumption vs. free tier limits
- Real-time percentage bars with color coding
- Remaining quota calculations

### Historical Data  
- 7-day usage trends
- Daily breakdown by service type
- Cache hit/miss statistics

### Quick Actions
- Clear geocoding cache
- Refresh usage data
- Token validation status

### Detailed Info
- Environment configuration
- Token warnings and setup guidance
- Cache statistics and management

## Error Handling

The system gracefully handles various error scenarios:

- **Quota Exceeded**: Blocks requests and shows user-friendly messages
- **Invalid Token**: Provides setup instructions and validation info
- **Network Errors**: Retries with exponential backoff
- **Cache Full**: Automatically cleans old entries

## Production Deployment

The monitoring dashboard is automatically hidden in production builds:

```typescript
// Dashboard only appears in development
if (process.env.NODE_ENV === 'production') {
  return null
}
```

For production monitoring, consider:
- Server-side logging of API usage
- External monitoring tools (DataDog, New Relic)
- Mapbox's usage dashboard: https://account.mapbox.com/

---

## Support

For issues or questions:
1. Check the browser console for warnings
2. Use the dashboard's "Details" view for diagnostics
3. Verify environment variable configuration
4. Review Mapbox account usage at https://account.mapbox.com/

This monitoring system is designed to be your safety net during development, ensuring you never accidentally exceed free tier limits while building amazing location-based features.