// Tests for Route Generation Service
// Tests route generation with API limits and rate limiting

import { routeGenerationService } from '../routeGeneration'
import { mapboxUsageService } from '../mapboxUsage'
import { rateLimiterService } from '../rateLimiter'

// Mock the dependencies
jest.mock('../mapboxConfig', () => ({
  mapboxConfig: {
    getToken: jest.fn(() => 'test-token'),
    isTokenValid: jest.fn(() => true),
    canMakeRequest: jest.fn(() => true)
  }
}))

jest.mock('../mapboxUsage')
jest.mock('../rateLimiter')
jest.mock('../realPOIService', () => ({
  realPOIService: {
    getPOIsForRoute: jest.fn(() => Promise.resolve([
      {
        id: 'test-poi-1',
        coordinates: [-122.4094, 37.7849],
        type: 'cafe',
        category: 'food',
        name: 'Test Cafe',
        tags: {},
        description: 'A test cafe'
      }
    ]))
  }
}))

jest.mock('../routeValidationService', () => ({
  routeValidationService: {
    validateRoute: jest.fn(() => Promise.resolve({ walkable: true }))
  }
}))

// Mock fetch for Mapbox API calls
global.fetch = jest.fn()

describe('RouteGenerationService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup default mock responses
    ;(mapboxUsageService.getAPIStatus as jest.Mock).mockReturnValue({
      shouldHardStop: false,
      canMakeRequest: true,
      percentage: 0.1,
      remaining: 90000,
      warningLevel: 'safe'
    })
    
    ;(mapboxUsageService.canMakeRequest as jest.Mock).mockReturnValue(true)
    ;(mapboxUsageService.trackDirectionsRequest as jest.Mock).mockImplementation(() => {})
    
    ;(rateLimiterService.canMakeRequest as jest.Mock).mockReturnValue({
      allowed: true,
      reason: undefined,
      retryAfter: undefined
    })
    
    ;(rateLimiterService.recordRequest as jest.Mock).mockImplementation(() => {})
    
    // Mock successful Mapbox API responses
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        routes: [{
          geometry: {
            coordinates: [
              [-122.4194, 37.7749],
              [-122.4094, 37.7849],
              [-122.4194, 37.7749]
            ]
          },
          distance: 1000,
          duration: 600
        }]
      })
    })
  })

  describe('Hard Stop Protection', () => {
    it('should prevent route generation when hard stop is triggered', async () => {
      // Mock hard stop condition
      ;(mapboxUsageService.getAPIStatus as jest.Mock).mockReturnValue({
        shouldHardStop: true,
        canMakeRequest: false,
        percentage: 0.70,
        remaining: 30000,
        warningLevel: 'hardstop'
      })

      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const
      }

      const result = await routeGenerationService.generateRoute(options)
      
      // Should return null due to hard stop
      expect(result).toBeNull()

      // Should not record any requests
      expect(rateLimiterService.recordRequest).not.toHaveBeenCalled()
    })

    it('should allow route generation when under hard stop threshold', async () => {
      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const,
        targetDistance: 1.5
      }

      const result = await routeGenerationService.generateRoute(options)
      
      expect(result).toBeTruthy()
      expect(result!.name).toBeDefined()
      expect(result!.distance).toBeDefined()
      expect(result!.route).toBeDefined()
      
      // Should record the request
      expect(rateLimiterService.recordRequest).toHaveBeenCalledWith('routeGeneration')
      expect(mapboxUsageService.trackDirectionsRequest).toHaveBeenCalled()
    })
  })

  describe('Rate Limiting', () => {
    it('should prevent route generation when rate limited', async () => {
      // Mock rate limit exceeded
      ;(rateLimiterService.canMakeRequest as jest.Mock).mockReturnValue({
        allowed: false,
        reason: 'Rate limit exceeded. Max 10 requests per 60 seconds.',
        retryAfter: 30
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const
      }

      const result = await routeGenerationService.generateRoute(options)
      
      // Should return null due to rate limiting
      expect(result).toBeNull()

      // Should log error to console
      expect(consoleSpy).toHaveBeenCalledWith(
        'Rate limit exceeded: Rate limit exceeded. Max 10 requests per 60 seconds. Please wait 30 seconds.'
      )

      // Should not record the request since it was blocked
      expect(rateLimiterService.recordRequest).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should allow route generation when not rate limited', async () => {
      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const
      }

      const result = await routeGenerationService.generateRoute(options)
      
      expect(result).toBeTruthy()
      expect(rateLimiterService.recordRequest).toHaveBeenCalledWith('routeGeneration')
    })
  })

  describe('Distance-Based Generation', () => {
    it('should use target distance when provided', async () => {
      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const,
        targetDistance: 2.0
      }

      const result = await routeGenerationService.generateRoute(options)
      
      expect(result).toBeTruthy()
      expect(result!.distance).toBeDefined()
      // The actual distance should be close to target (within reasonable margin)
      expect(result!.distance).toBeLessThan(3.0)
    })

    it('should use provided duration from preferences', async () => {
      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 60, // Pre-calculated duration from distance
          difficulty: 'easy' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const,
        targetDistance: 2.0 // 2 miles
      }

      const result = await routeGenerationService.generateRoute(options)
      
      expect(result).toBeTruthy()
      expect(result!.duration).toBeDefined()
      // Duration should match the provided duration
      expect(result!.duration).toBe(60)
    })
  })

  describe('Route Variation', () => {
    it('should generate different routes for the same location', async () => {
      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const
      }

      const route1 = await routeGenerationService.generateRoute(options)
      
      // Wait slightly to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const route2 = await routeGenerationService.generateRoute(options)
      
      expect(route1).toBeTruthy()
      expect(route2).toBeTruthy()
      
      // Routes should have different IDs (timestamp-based)
      expect(route1!.id).not.toBe(route2!.id)
      
      // Both routes should be valid
      expect(route1!.name).toBeDefined()
      expect(route2!.name).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      // Mock API failure
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const
      }

      const result = await routeGenerationService.generateRoute(options)
      
      // Should still return a route using fallback logic
      expect(result).toBeTruthy()
      expect(result!.route).toBeDefined()
    })

    it('should handle invalid token gracefully', async () => {
      // Mock invalid token - this will cause the service to return null
      const { mapboxConfig } = require('../mapboxConfig')
      mapboxConfig.isTokenValid.mockReturnValue(false)
      mapboxConfig.canMakeRequest.mockReturnValue(false)

      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const
      }

      const result = await routeGenerationService.generateRoute(options)
      
      // The service still generates a fallback route with invalid token
      expect(result).toBeTruthy()
      expect(result!.route).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should complete full route generation workflow', async () => {
      const options = {
        center: [-122.4194, 37.7749] as [number, number],
        preferences: {
          duration: 30,
          difficulty: 'moderate' as const,
          avoidBusyRoads: true,
          preferParks: true,
          preferWaterfront: false,
          preferHistoric: false,
          surfaceType: 'any' as const,
          includeSteps: true,
          maxElevationGain: 200
        },
        routeType: 'circular' as const,
        targetDistance: 1.5
      }

      const result = await routeGenerationService.generateRoute(options)
      
      // Verify all checks were performed
      expect(mapboxUsageService.getAPIStatus).toHaveBeenCalledWith('directionsRequests')
      expect(mapboxUsageService.canMakeRequest).toHaveBeenCalledWith('directionsRequests')
      expect(rateLimiterService.canMakeRequest).toHaveBeenCalledWith('routeGeneration')
      expect(rateLimiterService.recordRequest).toHaveBeenCalledWith('routeGeneration')
      expect(mapboxUsageService.trackDirectionsRequest).toHaveBeenCalled()
      
      // Verify result structure
      expect(result).toBeTruthy()
      expect(result!.id).toBeDefined()
      expect(result!.name).toBeDefined()
      expect(result!.coordinates).toEqual(options.center)
      expect(result!.route).toBeDefined()
      expect(result!.distance).toBeDefined()
      expect(result!.duration).toBeDefined()
      expect(result!.difficulty).toBe('moderate')
      expect(result!.estimatedCalories).toBeDefined()
      expect(result!.elevation).toBeDefined()
      expect(result!.generatedAt).toBeDefined()
      expect(result!.seed).toBeDefined()
    })
  })
})