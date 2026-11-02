// Tests for Geocoding Service with Rate Limiting and Caching
import { geocodingService, GeocodingResult, GeocodingError } from '@/services/geocoding'
import { mapboxUsageService } from '@/services/mapboxUsage'
import { mapboxConfig } from '@/services/mapboxConfig'

// Mock the services
jest.mock('@/services/mapboxUsage', () => ({
  mapboxUsageService: {
    canMakeRequest: jest.fn().mockReturnValue(true),
    trackGeocodingRequest: jest.fn()
  }
}))

jest.mock('@/services/mapboxConfig', () => ({
  mapboxConfig: {
    getToken: jest.fn().mockReturnValue('pk.test_token'),
    isTokenValid: jest.fn().mockReturnValue(true),
    canMakeRequest: jest.fn().mockReturnValue(true)
  }
}))

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Sample Mapbox API response
const mockMapboxResponse = {
  features: [
    {
      center: [-122.4194, 37.7749],
      place_name: 'San Francisco, California, United States',
      relevance: 1,
      bbox: [-122.5, 37.7, -122.3, 37.8]
    },
    {
      center: [-122.4094, 37.7849],
      place_name: 'San Francisco City Hall, San Francisco, California',
      relevance: 0.9
    }
  ]
}

describe('GeocodingService', () => {
  beforeEach(() => {
    localStorageMock.clear()
    geocodingService.clearCache()
    jest.clearAllMocks()
    
    // Reset mocks to default behavior
    ;(mapboxConfig.isTokenValid as jest.Mock).mockReturnValue(true)
    ;(mapboxConfig.canMakeRequest as jest.Mock).mockReturnValue(true)
    ;(mapboxUsageService.canMakeRequest as jest.Mock).mockReturnValue(true)
  })

  describe('Basic Geocoding', () => {
    test('should successfully geocode a valid address', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      })

      const results = await geocodingService.geocode('San Francisco')

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        coordinates: [-122.4194, 37.7749],
        placeName: 'San Francisco, California, United States',
        center: [-122.4194, 37.7749],
        bbox: [-122.5, 37.7, -122.3, 37.8],
        relevance: 1
      })

      expect(mapboxUsageService.trackGeocodingRequest).toHaveBeenCalledTimes(1)
    })

    test('should reject empty queries', async () => {
      await expect(geocodingService.geocode('')).rejects.toMatchObject({
        code: 'INVALID_QUERY',
        message: 'Query cannot be empty'
      })
    })

    test('should reject queries that are too short', async () => {
      await expect(geocodingService.geocode('SF')).rejects.toMatchObject({
        code: 'INVALID_QUERY',
        message: 'Query must be at least 3 characters long'
      })
    })

    test('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      await expect(geocodingService.geocode('San Francisco')).rejects.toMatchObject({
        code: 'NETWORK_ERROR'
      })
    })

    test('should handle rate limiting', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429
      })

      await expect(geocodingService.geocode('San Francisco')).rejects.toMatchObject({
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded, please try again later'
      })
    })

    test('should handle no results', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      })

      await expect(geocodingService.geocode('InvalidLocation123')).rejects.toMatchObject({
        code: 'NO_RESULTS',
        message: 'No results found for this location'
      })
    })
  })

  describe('Caching', () => {
    test('should cache successful geocoding results', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      })

      // First request
      const results1 = await geocodingService.geocode('San Francisco')
      
      // Second request should use cache
      const results2 = await geocodingService.geocode('San Francisco')

      expect(results1).toEqual(results2)
      expect(global.fetch).toHaveBeenCalledTimes(1) // Only one API call
      expect(mapboxUsageService.trackGeocodingRequest).toHaveBeenCalledTimes(1)
    })

    test('should respect case insensitive caching', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      })

      await geocodingService.geocode('San Francisco')
      await geocodingService.geocode('san francisco')
      await geocodingService.geocode('SAN FRANCISCO')

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    test('should handle cache clearing', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMapboxResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMapboxResponse)
        })

      // First request
      await geocodingService.geocode('San Francisco')
      
      // Clear cache
      geocodingService.clearCache()
      
      // Second request should hit API again
      await geocodingService.geocode('San Francisco')

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    test('should provide cache statistics', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      })

      await geocodingService.geocode('San Francisco')

      const stats = geocodingService.getCacheStats()
      expect(stats.size).toBe(1)
      expect(stats.newestEntry).toBeTruthy()
      expect(stats.oldestEntry).toBeTruthy()
    })
  })

  describe('Debounced Geocoding', () => {
    test('should debounce rapid requests', (done) => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      })

      let callCount = 0
      const callback = jest.fn((results, error) => {
        callCount++
        if (callCount === 1) {
          // Should only be called once due to debouncing
          expect(results).toBeTruthy()
          expect(global.fetch).toHaveBeenCalledTimes(1)
          done()
        }
      })

      // Rapid fire requests
      geocodingService.debouncedGeocode('San Francisco', callback)
      geocodingService.debouncedGeocode('San Francisco', callback)
      geocodingService.debouncedGeocode('San Francisco', callback)
    })

    test('should return cached results immediately for debounced requests', (done) => {
      // Pre-populate cache
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      })

      geocodingService.geocode('San Francisco').then(() => {
        // Now test debounced with cached result
        geocodingService.debouncedGeocode('San Francisco', (results, error) => {
          expect(results).toBeTruthy()
          expect(error).toBeNull()
          expect(global.fetch).toHaveBeenCalledTimes(1) // Still only one call
          done()
        })
      })
    })

    test('should handle short queries in debounced mode', (done) => {
      geocodingService.debouncedGeocode('SF', (results, error) => {
        expect(results).toBeNull()
        expect(error).toBeNull()
        done()
      })
    })
  })

  describe('Reverse Geocoding', () => {
    test('should successfully reverse geocode coordinates', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          features: [mockMapboxResponse.features[0]]
        })
      })

      const result = await geocodingService.reverseGeocode([-122.4194, 37.7749])

      expect(result).toEqual({
        coordinates: [-122.4194, 37.7749],
        placeName: 'San Francisco, California, United States',
        center: [-122.4194, 37.7749],
        bbox: [-122.5, 37.7, -122.3, 37.8],
        relevance: 1
      })

      expect(mapboxUsageService.trackGeocodingRequest).toHaveBeenCalledTimes(1)
    })

    test('should cache reverse geocoding results', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          features: [mockMapboxResponse.features[0]]
        })
      })

      const coordinates: [number, number] = [-122.4194, 37.7749]
      
      const result1 = await geocodingService.reverseGeocode(coordinates)
      const result2 = await geocodingService.reverseGeocode(coordinates)

      expect(result1).toEqual(result2)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    test('should return null for no reverse geocoding results', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      })

      const result = await geocodingService.reverseGeocode([0, 0])
      expect(result).toBeNull()
    })
  })

  describe('Token and Quota Management', () => {
    test('should handle invalid token', async () => {
      ;(mapboxConfig.isTokenValid as jest.Mock).mockReturnValue(false)

      await expect(geocodingService.geocode('San Francisco')).rejects.toMatchObject({
        code: 'INVALID_QUERY',
        message: 'Mapbox token not configured or invalid'
      })
    })

    test('should handle service unavailable', async () => {
      ;(mapboxConfig.canMakeRequest as jest.Mock).mockReturnValue(false)

      await expect(geocodingService.geocode('San Francisco')).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
        message: 'Geocoding service not available for current environment'
      })
    })

    test('should handle quota exceeded', async () => {
      ;(mapboxUsageService.canMakeRequest as jest.Mock).mockReturnValue(false)

      await expect(geocodingService.geocode('San Francisco')).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
        message: 'Monthly geocoding quota exceeded'
      })
    })
  })

  describe('Request Deduplication', () => {
    test('should deduplicate identical simultaneous requests', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      })

      // Make multiple simultaneous requests
      const promises = [
        geocodingService.geocode('San Francisco'),
        geocodingService.geocode('San Francisco'),
        geocodingService.geocode('San Francisco')
      ]

      const results = await Promise.all(promises)

      // All results should be identical
      expect(results[0]).toEqual(results[1])
      expect(results[1]).toEqual(results[2])
      
      // Only one API call should have been made
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(mapboxUsageService.trackGeocodingRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Edge Cases', () => {
    test('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(geocodingService.geocode('San Francisco')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: 'Network error'
      })
    })

    test('should handle malformed API responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      await expect(geocodingService.geocode('San Francisco')).rejects.toMatchObject({
        code: 'NETWORK_ERROR'
      })
    })

    test('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      })

      // Should still work despite localStorage error
      const results = await geocodingService.geocode('San Francisco')
      expect(results).toBeTruthy()
    })
  })

  describe('Cache Management', () => {
    test('should handle cache size limits', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      }))

      // Fill cache beyond theoretical limit
      for (let i = 0; i < 10; i++) {
        await geocodingService.geocode(`Location ${i}`)
      }

      const stats = geocodingService.getCacheStats()
      expect(stats.size).toBeGreaterThan(0)
    })

    test('should handle TTL expiration', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMapboxResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMapboxResponse)
        })

      // First request
      await geocodingService.geocode('San Francisco')

      // Mock time passing beyond TTL
      const originalNow = Date.now
      Date.now = jest.fn(() => originalNow() + 25 * 60 * 60 * 1000) // 25 hours later

      // Second request should hit API again
      await geocodingService.geocode('San Francisco')

      expect(global.fetch).toHaveBeenCalledTimes(2)

      // Restore Date.now
      Date.now = originalNow
    })
  })
})