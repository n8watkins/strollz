// Tests for Mapbox Configuration and Token Management
import { mapboxConfig, MapboxEnvironment } from '@/services/mapboxConfig'

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: undefined,
  NEXT_PUBLIC_MAPBOX_TOKEN_DEV: undefined,
  NEXT_PUBLIC_MAPBOX_TOKEN_STAGING: undefined,
  NEXT_PUBLIC_MAPBOX_TOKEN_PROD: undefined,
  NEXT_PUBLIC_MAPBOX_ENVIRONMENT: undefined,
  NODE_ENV: undefined,
  VERCEL_ENV: undefined
}

// Helper to set env vars
const setEnvVars = (vars: Partial<typeof mockEnv>) => {
  Object.assign(process.env, vars)
  mapboxConfig.reinitialize()
}

// Helper to clear env vars
const clearEnvVars = () => {
  Object.keys(mockEnv).forEach(key => {
    delete (process.env as any)[key]
  })
  mapboxConfig.reinitialize()
}

describe('MapboxConfigService', () => {
  beforeEach(() => {
    clearEnvVars()
  })

  afterEach(() => {
    clearEnvVars()
  })

  describe('Environment Detection', () => {
    test('should detect development environment', () => {
      setEnvVars({ NODE_ENV: 'development' })
      
      expect(mapboxConfig.getEnvironment()).toBe('development')
    })

    test('should detect production environment from NODE_ENV', () => {
      setEnvVars({ NODE_ENV: 'production' })
      
      expect(mapboxConfig.getEnvironment()).toBe('production')
    })

    test('should detect production environment from VERCEL_ENV', () => {
      setEnvVars({ VERCEL_ENV: 'production' })
      
      expect(mapboxConfig.getEnvironment()).toBe('production')
    })

    test('should detect staging environment from VERCEL_ENV', () => {
      setEnvVars({ VERCEL_ENV: 'preview' })
      
      expect(mapboxConfig.getEnvironment()).toBe('staging')
    })

    test('should use explicit environment override', () => {
      setEnvVars({ 
        NODE_ENV: 'production',
        NEXT_PUBLIC_MAPBOX_ENVIRONMENT: 'development'
      })
      
      expect(mapboxConfig.getEnvironment()).toBe('development')
    })

    test('should default to development', () => {
      clearEnvVars()
      
      expect(mapboxConfig.getEnvironment()).toBe('development')
    })
  })

  describe('Token Management', () => {
    test('should prioritize environment-specific token for development', () => {
      setEnvVars({
        NODE_ENV: 'development',
        NEXT_PUBLIC_MAPBOX_TOKEN_DEV: 'pk.dev_token',
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.fallback_token'
      })
      
      expect(mapboxConfig.getToken()).toBe('pk.dev_token')
    })

    test('should prioritize environment-specific token for staging', () => {
      setEnvVars({
        VERCEL_ENV: 'preview',
        NEXT_PUBLIC_MAPBOX_TOKEN_STAGING: 'pk.staging_token',
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.fallback_token'
      })
      
      expect(mapboxConfig.getToken()).toBe('pk.staging_token')
    })

    test('should prioritize environment-specific token for production', () => {
      setEnvVars({
        NODE_ENV: 'production',
        NEXT_PUBLIC_MAPBOX_TOKEN_PROD: 'pk.prod_token',
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.fallback_token'
      })
      
      expect(mapboxConfig.getToken()).toBe('pk.prod_token')
    })

    test('should fallback to generic token', () => {
      setEnvVars({
        NODE_ENV: 'development',
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.fallback_token'
      })
      
      expect(mapboxConfig.getToken()).toBe('pk.fallback_token')
    })

    test('should return null for no token', () => {
      clearEnvVars()
      
      expect(mapboxConfig.getToken()).toBeNull()
    })

    test('should ignore placeholder token', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'your_mapbox_token_here'
      })
      
      expect(mapboxConfig.getToken()).toBeNull()
    })
  })

  describe('Token Validation', () => {
    test('should validate proper Mapbox token', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.eyJ1IjoidGVzdCIsImEiOiJjbGpkIn0'
      })
      
      expect(mapboxConfig.isTokenValid()).toBe(true)
    })

    test('should reject invalid token format', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'invalid_token'
      })
      
      expect(mapboxConfig.isTokenValid()).toBe(false)
    })

    test('should reject placeholder token', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'your_mapbox_token_here'
      })
      
      expect(mapboxConfig.isTokenValid()).toBe(false)
    })

    test('should reject empty token', () => {
      clearEnvVars()
      
      expect(mapboxConfig.isTokenValid()).toBe(false)
    })
  })

  describe('Service Permission Checking', () => {
    beforeEach(() => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.valid_token'
      })
    })

    test('should allow all services with valid token', () => {
      expect(mapboxConfig.canMakeRequest('maps')).toBe(true)
      expect(mapboxConfig.canMakeRequest('geocoding')).toBe(true)
      expect(mapboxConfig.canMakeRequest('directions')).toBe(true)
      expect(mapboxConfig.canMakeRequest('static')).toBe(true)
    })

    test('should deny all services with invalid token', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'invalid_token'
      })
      
      expect(mapboxConfig.canMakeRequest('maps')).toBe(false)
      expect(mapboxConfig.canMakeRequest('geocoding')).toBe(false)
      expect(mapboxConfig.canMakeRequest('directions')).toBe(false)
      expect(mapboxConfig.canMakeRequest('static')).toBe(false)
    })
  })

  describe('Token Configuration Details', () => {
    test('should provide correct configuration for development', () => {
      setEnvVars({
        NODE_ENV: 'development',
        NEXT_PUBLIC_MAPBOX_TOKEN_DEV: 'pk.dev_token'
      })
      
      const config = mapboxConfig.getTokenConfig()
      
      expect(config).toEqual({
        token: 'pk.dev_token',
        environment: 'development',
        restrictedUrls: expect.arrayContaining(['localhost:3000', '127.0.0.1:3000']),
        description: 'Development token for local StrollVibe development',
        usageRestrictions: {
          maxDailyRequests: 500,
          allowedServices: ['maps', 'geocoding', 'directions']
        }
      })
    })

    test('should provide correct configuration for staging', () => {
      setEnvVars({
        VERCEL_ENV: 'preview',
        NEXT_PUBLIC_MAPBOX_TOKEN_STAGING: 'pk.staging_token'
      })
      
      const config = mapboxConfig.getTokenConfig()
      
      expect(config?.environment).toBe('staging')
      expect(config?.usageRestrictions?.maxDailyRequests).toBe(1000)
      expect(config?.restrictedUrls).toContain('*.vercel.app')
    })

    test('should provide correct configuration for production', () => {
      setEnvVars({
        NODE_ENV: 'production',
        NEXT_PUBLIC_MAPBOX_TOKEN_PROD: 'pk.prod_token'
      })
      
      const config = mapboxConfig.getTokenConfig()
      
      expect(config?.environment).toBe('production')
      expect(config?.usageRestrictions?.maxDailyRequests).toBe(10000)
      expect(config?.restrictedUrls).toContain('strollvibe.com')
    })

    test('should return null config for invalid token', () => {
      clearEnvVars()
      
      const config = mapboxConfig.getTokenConfig()
      expect(config).toBeNull()
    })
  })

  describe('Token Validation Info', () => {
    test('should provide validation info for valid token', () => {
      setEnvVars({
        NODE_ENV: 'development',
        NEXT_PUBLIC_MAPBOX_TOKEN_DEV: 'pk.valid_token'
      })
      
      const validation = mapboxConfig.getTokenValidationInfo()
      
      expect(validation.isValid).toBe(true)
      expect(validation.environment).toBe('development')
      expect(validation.warnings).toEqual([])
      expect(validation.restrictions).toContain('Max daily requests: 500')
    })

    test('should provide validation info for invalid token', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'invalid_token'
      })
      
      const validation = mapboxConfig.getTokenValidationInfo()
      
      expect(validation.isValid).toBe(false)
      expect(validation.warnings).toContain('Token does not appear to be a valid Mapbox public token')
    })

    test('should provide validation info for placeholder token', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'your_mapbox_token_here'
      })
      
      const validation = mapboxConfig.getTokenValidationInfo()
      
      expect(validation.isValid).toBe(false)
      expect(validation.warnings).toContain('Using placeholder token - replace with actual Mapbox token')
    })

    test('should provide validation info for missing token', () => {
      clearEnvVars()
      
      const validation = mapboxConfig.getTokenValidationInfo()
      
      expect(validation.isValid).toBe(false)
      expect(validation.restrictions).toContain('No token configured')
      expect(validation.warnings).toContain('Mapbox token not found in environment variables')
    })
  })

  describe('Setup Instructions', () => {
    test('should provide development setup instructions', () => {
      setEnvVars({ NODE_ENV: 'development' })
      
      const setup = mapboxConfig.getSetupInstructions()
      
      expect(setup.environment).toBe('development')
      expect(setup.steps).toContain('1. Get a Mapbox access token from https://account.mapbox.com/access-tokens/')
      expect(setup.environmentVariables).toHaveProperty('NEXT_PUBLIC_MAPBOX_TOKEN_DEV')
    })

    test('should provide staging setup instructions', () => {
      setEnvVars({ VERCEL_ENV: 'preview' })
      
      const setup = mapboxConfig.getSetupInstructions()
      
      expect(setup.environment).toBe('staging')
      expect(setup.environmentVariables).toHaveProperty('NEXT_PUBLIC_MAPBOX_TOKEN_STAGING')
    })

    test('should provide production setup instructions', () => {
      setEnvVars({ NODE_ENV: 'production' })
      
      const setup = mapboxConfig.getSetupInstructions()
      
      expect(setup.environment).toBe('production')
      expect(setup.environmentVariables).toHaveProperty('NEXT_PUBLIC_MAPBOX_TOKEN_PROD')
    })
  })

  describe('Recommended Environment Variables', () => {
    test('should provide correct environment variable recommendations', () => {
      setEnvVars({ NODE_ENV: 'development' })
      
      const envVars = mapboxConfig.getRecommendedEnvVars()
      
      expect(envVars).toEqual({
        'Current Environment Token': 'NEXT_PUBLIC_MAPBOX_TOKEN_DEVELOPMENT',
        'Fallback Token': 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN',
        'Environment Override': 'NEXT_PUBLIC_MAPBOX_ENVIRONMENT',
        'Development Token': 'NEXT_PUBLIC_MAPBOX_TOKEN_DEV',
        'Staging Token': 'NEXT_PUBLIC_MAPBOX_TOKEN_STAGING',
        'Production Token': 'NEXT_PUBLIC_MAPBOX_TOKEN_PROD'
      })
    })
  })

  describe('Service Configuration', () => {
    test('should provide default service configuration', () => {
      const serviceConfig = mapboxConfig.getServiceConfig()
      
      expect(serviceConfig).toEqual({
        webMapsEnabled: true,
        geocodingEnabled: true,
        directionsEnabled: true,
        staticImagesEnabled: false,
        rateLimitingEnabled: true
      })
    })

    test('should allow service configuration updates', () => {
      mapboxConfig.updateServiceConfig({
        staticImagesEnabled: true,
        rateLimitingEnabled: false
      })
      
      const serviceConfig = mapboxConfig.getServiceConfig()
      
      expect(serviceConfig.staticImagesEnabled).toBe(true)
      expect(serviceConfig.rateLimitingEnabled).toBe(false)
      expect(serviceConfig.webMapsEnabled).toBe(true) // Should remain unchanged
    })

    test('should check if specific services are enabled', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.valid_token'
      })
      
      expect(mapboxConfig.isServiceEnabled('webMapsEnabled')).toBe(true)
      expect(mapboxConfig.isServiceEnabled('staticImagesEnabled')).toBe(false)
    })

    test('should disable all services for invalid token', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'invalid_token'
      })
      
      expect(mapboxConfig.isServiceEnabled('webMapsEnabled')).toBe(false)
      expect(mapboxConfig.isServiceEnabled('geocodingEnabled')).toBe(false)
    })
  })

  describe('Reinitialize', () => {
    test('should reinitialize configuration when called', () => {
      clearEnvVars()
      expect(mapboxConfig.getToken()).toBeNull()
      
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.new_token'
      })
      
      // Without reinitialize, still null
      expect(mapboxConfig.getToken()).toBeNull()
      
      // After reinitialize, should pick up new token
      mapboxConfig.reinitialize()
      expect(mapboxConfig.getToken()).toBe('pk.new_token')
    })
  })

  describe('Edge Cases', () => {
    test('should handle undefined environment variables gracefully', () => {
      // Explicitly set to undefined
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: undefined as any,
        NODE_ENV: undefined as any
      })
      
      expect(mapboxConfig.getToken()).toBeNull()
      expect(mapboxConfig.getEnvironment()).toBe('development')
      expect(mapboxConfig.isTokenValid()).toBe(false)
    })

    test('should handle empty string environment variables', () => {
      setEnvVars({
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: '',
        NODE_ENV: ''
      })
      
      expect(mapboxConfig.getToken()).toBeNull()
      expect(mapboxConfig.isTokenValid()).toBe(false)
    })

    test('should handle malformed tokens', () => {
      const malformedTokens = [
        'not_a_token',
        'sk.secret_token', // Secret token instead of public
        'pk.',
        'pk',
        null,
        undefined
      ]
      
      malformedTokens.forEach(token => {
        setEnvVars({
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: token as any
        })
        
        expect(mapboxConfig.isTokenValid()).toBe(false)
      })
    })
  })
})