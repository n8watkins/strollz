# StrollVibe Admin Documentation

Administrative documentation for developers and maintainers of the StrollVibe platform.

## Table of Contents

### Development Tools
- [Mapbox Monitoring Guide](./mapbox-monitoring-guide.md) - Complete guide for monitoring and optimizing Mapbox API usage during development

### System Architecture
- [Services Overview](#services-overview)
- [Environment Configuration](#environment-configuration)
- [Development Workflow](#development-workflow)

## Services Overview

### Mapbox Integration Services

#### Usage Monitoring (`/src/services/mapboxUsage.ts`)
Tracks API consumption to prevent quota overruns:
- **Map Loads**: Web map initializations (50K/month limit)
- **Geocoding**: Address-to-coordinate conversions (100K/month limit)  
- **Directions**: Route calculations (100K/month limit)
- **Daily Tracking**: Historical usage data with 7-day trends
- **Automatic Alerts**: Color-coded warnings at 70%, 85%, 95% usage

#### Geocoding Service (`/src/services/geocoding.ts`)
Optimized location search with caching and rate limiting:
- **Debounced Requests**: 300ms delay prevents rapid-fire API calls
- **Intelligent Caching**: 24-hour TTL with 1000 entry limit
- **Request Deduplication**: Prevents duplicate calls for same query
- **Error Handling**: Graceful fallbacks for quota/network issues

#### Configuration Management (`/src/services/mapboxConfig.ts`)
Environment-specific token and settings management:
- **Multi-Environment**: Separate tokens for dev/staging/production
- **Token Validation**: Automatic verification and setup guidance
- **Service Controls**: Per-environment feature enabling/disabling
- **Usage Restrictions**: Environment-specific daily limits

### Development Dashboard (`/src/components/dev/MapboxUsageDashboard.tsx`)
Real-time monitoring interface (development only):
- **Usage Visualization**: Progress bars with color-coded warnings
- **Historical Data**: 7-day usage trends and analytics
- **Cache Management**: Clear cache and view statistics
- **Quick Actions**: Reset, refresh, and diagnostic tools

## Environment Configuration

### Development Setup
```bash
# Primary development token
NEXT_PUBLIC_MAPBOX_TOKEN_DEV=pk.your_dev_token_here

# Environment specification (optional)
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=development

# Fallback token (if environment-specific not available)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_fallback_token_here
```

### Staging Setup
```bash
NEXT_PUBLIC_MAPBOX_TOKEN_STAGING=pk.your_staging_token_here
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=staging
```

### Production Setup
```bash
NEXT_PUBLIC_MAPBOX_TOKEN_PROD=pk.your_production_token_here
NEXT_PUBLIC_MAPBOX_ENVIRONMENT=production
```

### Token Configuration
1. **Create tokens** at https://account.mapbox.com/access-tokens/
2. **Enable scopes**: Web Maps, Geocoding, Directions
3. **Set URL restrictions**:
   - **Dev**: `localhost:3000`, `127.0.0.1:3000`
   - **Staging**: `*.vercel.app`, `staging.yourdomain.com`
   - **Production**: `yourdomain.com`, `*.yourdomain.com`

## Development Workflow

### Daily Development
1. **Start Development**: Monitor usage button appears bottom-right
2. **Check Status**: Button color indicates current usage level
3. **Review Usage**: Expand dashboard for detailed metrics
4. **Optimize**: Use cache clearing and refresh as needed

### Weekly Maintenance
1. **Review Trends**: Check 7-day usage history
2. **Clear Cache**: Monthly cache cleanup for optimal performance
3. **Validate Tokens**: Ensure all environments have valid tokens
4. **Monitor Warnings**: Address any approaching quota limits

### Monthly Planning
- **Budget Usage**: Plan feature development within free tier limits
- **Review Patterns**: Analyze usage trends for optimization opportunities
- **Update Tokens**: Rotate tokens if needed for security
- **Document Changes**: Update team on any configuration changes

## Monitoring Alerts

### Usage Warning Levels
- 🟢 **Safe** (0-70%): Normal development operations
- 🟡 **Elevated** (70-85%): Monitor usage patterns, consider optimization
- 🟠 **High** (85-95%): Implement optimizations, reduce non-essential usage
- 🔴 **Critical** (95-100%): Stop non-essential development, wait for reset

### Automated Responses
- **Console Warnings**: Logged when approaching limits
- **Request Blocking**: Automatic prevention when quotas exceeded
- **Fallback UI**: Graceful degradation when services unavailable
- **Cache Optimization**: Automatic cleanup when storage full

## Troubleshooting

### Common Issues
1. **High Map Usage**: Multiple map instances, fix with singleton pattern
2. **Excessive Geocoding**: Missing debouncing, implement 300ms delay
3. **Cache Problems**: localStorage full, use clear cache button
4. **Token Errors**: Invalid configuration, check environment variables

### Debug Commands
```typescript
// Check current usage
mapboxUsageService.getUsage()

// View warning level
mapboxUsageService.getWarningLevel()

// Inspect cache
geocodingService.getCacheStats()

// Validate token
mapboxConfig.getTokenValidationInfo()
```

### Emergency Procedures
1. **Red Alert**: Immediately stop all non-essential Mapbox usage
2. **Investigate**: Use dashboard to identify usage spikes
3. **Clear Cache**: Reset to improve request efficiency
4. **Optimize Code**: Implement better caching and rate limiting
5. **Wait for Reset**: Monthly quotas reset automatically

## Best Practices

### Code Optimization
- **Debounce User Input**: Wait 300ms before geocoding
- **Cache Aggressively**: Store results for 24 hours
- **Reuse Map Instances**: Avoid creating multiple Map objects
- **Batch Requests**: Group API calls when possible

### Development Habits
- **Monitor Daily**: Check usage dashboard regularly
- **Plan Features**: Consider API impact before implementation
- **Test Efficiently**: Use cached data when possible
- **Document Usage**: Track heavy usage features

### Team Coordination
- **Share Tokens**: Use team tokens for shared development
- **Communicate Limits**: Alert team when approaching quotas
- **Review Together**: Weekly usage review meetings
- **Optimize Collectively**: Share optimization techniques

## Resources

### Documentation
- [Mapbox Monitoring Guide](./mapbox-monitoring-guide.md) - Detailed usage guide
- [Mapbox API Documentation](https://docs.mapbox.com/) - Official API docs
- [Account Dashboard](https://account.mapbox.com/) - Usage and billing

### Tools
- **Development Dashboard**: Built-in monitoring (bottom-right corner)
- **Browser DevTools**: Console warnings and network inspection
- **Mapbox Account**: Official usage tracking and billing

### Support
- **Internal**: Check dashboard diagnostics and setup instructions
- **Documentation**: Review admin guides and API documentation  
- **Mapbox Support**: Contact for account and billing issues

---

This admin documentation provides the foundation for efficient Mapbox development within free tier constraints. The monitoring system ensures you can build confidently while staying within limits.