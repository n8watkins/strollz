# Mapbox Monitoring System - Admin Guide

This guide covers the day-to-day usage of the Mapbox monitoring system for developers and administrators working on StrollVibe.

## Table of Contents
- [Dashboard Overview](#dashboard-overview)
- [Daily Monitoring](#daily-monitoring)
- [Warning Level Management](#warning-level-management)
- [Token Management](#token-management)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

## Dashboard Overview

### Accessing the Dashboard

The monitoring dashboard is only visible during development. Look for the activity button in the bottom-right corner:

```
🟢 Green Button = Safe usage (< 70%)
🟡 Yellow Button = Elevated usage (70-85%)
🟠 Orange Button = High usage (85-95%)
🔴 Red Button = Critical usage (> 95%)
```

### Dashboard Sections

#### 1. **Token Status**
- ✅ **Valid**: Token is properly configured and working
- ❌ **Invalid**: Token needs configuration or has issues

#### 2. **Monthly Usage Overview**
Three progress bars showing consumption vs. free tier limits:
- **Map Loads**: 50,000/month limit
- **Geocoding**: 100,000/month limit  
- **Directions**: 100,000/month limit

#### 3. **Warning System**
Automated alerts when approaching limits:
- **70%**: Yellow warning - Monitor usage
- **85%**: Orange warning - Optimize usage
- **95%**: Red warning - Critical, may block requests

## Daily Monitoring

### What to Check Daily

1. **Overall Usage Level**
   - Button color in bottom-right corner
   - If yellow/orange/red, expand dashboard for details

2. **Daily Usage Trends**
   - Click "Details" to see 7-day history
   - Look for unusual spikes or patterns
   - Normal development should show consistent, low usage

3. **Cache Performance**
   - Check cache hit rates in detailed view
   - Clear cache if it's growing too large
   - Cache should reduce geocoding API calls significantly

### Weekly Review Checklist

- [ ] Review 7-day usage trends
- [ ] Check for any warning level escalations
- [ ] Verify token is still valid and properly configured
- [ ] Clear cache if needed (monthly maintenance)
- [ ] Review optimization opportunities

## Warning Level Management

### 🟡 Yellow Warning (70% Usage)
**Actions:**
1. Review recent development activities
2. Check for inefficient API usage patterns
3. Consider implementing additional caching
4. Monitor daily for trend changes

**Example Response:**
```typescript
// Check current usage
const usage = mapboxUsageService.getUsage()
console.log('Current usage:', usage)

// Verify caching is working
const cacheStats = geocodingService.getCacheStats()
console.log('Cache efficiency:', cacheStats)
```

### 🟠 Orange Warning (85% Usage)  
**Actions:**
1. **Immediate**: Review code for optimization opportunities
2. **Identify**: Heavy usage components or features
3. **Implement**: Additional caching or rate limiting
4. **Consider**: Postponing non-essential API calls

**Optimization Steps:**
```typescript
// Clear cache to reset geocoding efficiency
geocodingService.clearCache()

// Check for runaway requests
const dailyUsage = mapboxUsageService.getDailyUsage(7)
const today = dailyUsage[dailyUsage.length - 1]
if (today.mapLoads > 100) {
  console.warn('High map loads today:', today.mapLoads)
}
```

### 🔴 Red Warning (95% Usage)
**Actions:**
1. **Stop**: Non-essential development using Mapbox APIs
2. **Audit**: All recent code changes for inefficiencies  
3. **Wait**: For monthly reset before continuing
4. **Plan**: Better usage patterns for next month

**Emergency Steps:**
```typescript
// Check remaining quota
const remaining = mapboxUsageService.getRemainingQuota()
console.log('Emergency quota check:', remaining)

// Consider disabling non-essential features temporarily
if (remaining.mapLoads < 100) {
  // Disable map components in development
}
```

## Token Management

### Environment Setup

#### Development Environment
```bash
# .env.local (already configured)
NEXT_PUBLIC_MAPBOX_TOKEN_DEV=pk.REDACTED
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=development
```

#### Staging Environment  
```bash
# Vercel environment variables
NEXT_PUBLIC_MAPBOX_TOKEN_STAGING=pk.eyJ1Ijoic3Ryb2xsLXZpYmUtc3RhZ2luZ...
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=staging
```

#### Production Environment
```bash
# Vercel environment variables  
NEXT_PUBLIC_MAPBOX_TOKEN_PROD=pk.eyJ1Ijoic3Ryb2xsLXZpYmUtcHJvZA...
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=production
```

### Token Validation

The dashboard will show token status and provide setup guidance:

1. **Invalid Token Warnings:**
   - "Using placeholder token" - Replace with real token
   - "Token does not appear valid" - Check token format
   - "No token configured" - Add environment variable

2. **Setup Instructions:**
   - Dashboard shows exact environment variables needed
   - Step-by-step token configuration guide
   - URL restriction recommendations

### Creating New Tokens

1. **Visit**: https://account.mapbox.com/access-tokens/
2. **Create**: New token for each environment
3. **Scopes**: Enable Web Maps, Geocoding, Directions
4. **Restrictions**: Set URL restrictions per environment:
   - Dev: `localhost:3000`, `127.0.0.1:3000`
   - Staging: `*.vercel.app`, `your-staging-domain.com`
   - Prod: `strollvibe.com`, `*.strollvibe.com`

## Troubleshooting

### Common Issues

#### High Map Load Usage
**Symptoms:** Map loads approaching limit quickly
**Causes:**
- Multiple Map instances being created
- Map component re-mounting frequently
- Development hot-reload creating extra instances

**Solutions:**
```typescript
// Ensure single map instance
const [mapInstance, setMapInstance] = useState(null)
useEffect(() => {
  if (!mapInstance) {
    setMapInstance(new Map(...))
  }
}, [])

// Use useCallback for map event handlers
const handleMapLoad = useCallback(() => {
  mapboxUsageService.trackMapLoad()
}, [])
```

#### Excessive Geocoding Requests
**Symptoms:** Geocoding usage climbing rapidly
**Causes:**
- Geocoding on every keystroke without debouncing
- Not utilizing cache effectively
- Duplicate requests for same location

**Solutions:**
```typescript
// Use debounced geocoding
geocodingService.debouncedGeocode(query, (results, error) => {
  // Handle results
})

// Check cache before making requests
const cached = geocodingService.getCachedResult(query)
if (cached) {
  return cached
}
```

#### Cache Issues
**Symptoms:** Cache not working, repeated requests
**Causes:**
- localStorage full or disabled
- Cache TTL expired
- Browser in incognito mode

**Solutions:**
```typescript
// Check cache status
const stats = geocodingService.getCacheStats()
console.log('Cache stats:', stats)

// Clear and rebuild cache
geocodingService.clearCache()

// Verify localStorage availability
try {
  localStorage.setItem('test', 'test')
  localStorage.removeItem('test')
} catch (e) {
  console.warn('localStorage not available')
}
```

### Performance Debugging

#### Identifying Usage Patterns
```typescript
// Get detailed daily usage
const dailyUsage = mapboxUsageService.getDailyUsage(30)
const heavyDays = dailyUsage.filter(day => day.mapLoads > 50)
console.log('Heavy usage days:', heavyDays)

// Monitor real-time usage
mapboxUsageService.subscribe((usage) => {
  console.log('Usage updated:', usage)
})
```

#### API Call Optimization
```typescript
// Batch geocoding requests
const locations = ['SF', 'NYC', 'LA']
const promises = locations.map(loc => geocodingService.geocode(loc))
const results = await Promise.all(promises)

// Use reverse geocoding sparingly
if (needsPlaceName) {
  const placeName = await geocodingService.reverseGeocode(coordinates)
}
```

## Performance Optimization

### Caching Strategies

#### Geocoding Cache
- **TTL**: 24 hours (configurable)
- **Size**: 1000 entries max
- **Storage**: localStorage
- **Cleanup**: Automatic when full

```typescript
// Configure cache settings
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_SIZE = 1000

// Manual cache management
geocodingService.clearCache() // Clear all
const stats = geocodingService.getCacheStats() // Check stats
```

#### Map Instance Reuse
```typescript
// Good: Single map instance
const MapComponent = () => {
  const mapRef = useRef(null)
  
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new Map({...})
      mapboxUsageService.trackMapLoad()
    }
  }, [])
}

// Bad: Multiple instances
const MapComponent = () => {
  const [map] = useState(() => new Map({...})) // Creates on every render
}
```

### Rate Limiting Implementation

#### Debounced User Input
```typescript
// Location search with debouncing
const [query, setQuery] = useState('')

useEffect(() => {
  const timer = setTimeout(() => {
    if (query.length > 2) {
      geocodingService.geocode(query)
    }
  }, 300) // 300ms debounce

  return () => clearTimeout(timer)
}, [query])
```

#### Request Batching
```typescript
// Batch multiple requests
const requests = [
  () => geocodingService.geocode('Location 1'),
  () => geocodingService.geocode('Location 2'),
  () => geocodingService.geocode('Location 3')
]

// Execute with delay between requests
for (const request of requests) {
  await request()
  await new Promise(resolve => setTimeout(resolve, 100))
}
```

### Monthly Usage Planning

#### Development Phases
1. **Initial Development** (Weeks 1-2):
   - Expected: 1,000-2,000 map loads
   - Focus: Basic functionality, frequent testing

2. **Feature Development** (Weeks 3-4):
   - Expected: 3,000-5,000 map loads
   - Focus: Geocoding optimization, caching

3. **Testing & Polish** (Weeks 5-6):
   - Expected: 2,000-3,000 map loads
   - Focus: Performance optimization

#### Budget Allocation
- **Maps**: 40,000/50,000 (80% of limit)
- **Geocoding**: 10,000/100,000 (10% of limit)
- **Directions**: 5,000/100,000 (5% of limit)
- **Buffer**: 20% for unexpected usage

---

## Quick Reference

### Dashboard Controls
- **Toggle**: Bottom-right activity button
- **Expand**: Click button to open full dashboard
- **Details**: Click "Details" button for 7-day history
- **Clear Cache**: Emergency cache reset button
- **Refresh**: Reload usage data

### Console Commands
```typescript
// Quick usage check
mapboxUsageService.getUsage()

// Warning level
mapboxUsageService.getWarningLevel()

// Remaining quota
mapboxUsageService.getRemainingQuota()

// Cache stats
geocodingService.getCacheStats()

// Clear cache
geocodingService.clearCache()
```

### Emergency Procedures
1. **Red Alert**: Stop all non-essential development
2. **Check Usage**: Review dashboard for cause
3. **Clear Cache**: Reset to improve efficiency  
4. **Wait for Reset**: Monthly limits reset automatically
5. **Plan Better**: Implement optimizations for next month

This monitoring system is your development safety net. Use it proactively to build efficiently within free tier limits while maintaining full functionality.