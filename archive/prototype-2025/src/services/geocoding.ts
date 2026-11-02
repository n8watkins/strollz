// Geocoding Service with Rate Limiting and Caching
// Provides efficient geocoding with built-in optimizations for Mapbox API usage

import { mapboxUsageService } from './mapboxUsage'
import { mapboxConfig } from './mapboxConfig'

export interface GeocodingResult {
  coordinates: [number, number] // [longitude, latitude]
  placeName: string
  center: [number, number]
  bbox?: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
  relevance: number
}

export interface GeocodingError {
  code: 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'INVALID_QUERY' | 'NO_RESULTS'
  message: string
}

interface CachedResult {
  result: GeocodingResult[]
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class GeocodingService {
  private readonly STORAGE_KEY = 'stroll-vibe-geocoding-cache'
  private readonly DEBOUNCE_DELAY = 300 // ms
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private readonly MAX_CACHE_SIZE = 1000 // Maximum cached entries
  
  private debounceTimers = new Map<string, NodeJS.Timeout>()
  private pendingRequests = new Map<string, Promise<GeocodingResult[]>>()
  private cache = new Map<string, CachedResult>()

  constructor() {
    this.loadCache()
  }

  private loadCache(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const cacheData = JSON.parse(stored)
        this.cache = new Map(Object.entries(cacheData))
      }
    } catch (error) {
      console.warn('Failed to load geocoding cache:', error)
    }
  }

  private saveCache(): void {
    if (typeof window === 'undefined') return

    try {
      // Convert Map to Object for JSON serialization
      const cacheObject = Object.fromEntries(this.cache)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheObject))
    } catch (error) {
      console.warn('Failed to save geocoding cache:', error)
      // If storage is full, clear old entries and try again
      this.clearOldCacheEntries()
    }
  }

  private clearOldCacheEntries(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key)
      }
    })

    // If still too large, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .filter(([, value]) => now - value.timestamp <= value.ttl)
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this.MAX_CACHE_SIZE * 0.8) // Keep 80% of max size

      this.cache.clear()
      sortedEntries.forEach(([key, value]) => {
        this.cache.set(key, value)
      })
    }

    this.saveCache()
  }

  private getCacheKey(query: string): string {
    return query.toLowerCase().trim()
  }

  private getCachedResult(query: string): GeocodingResult[] | null {
    const key = this.getCacheKey(query)
    const cached = this.cache.get(key)

    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  private setCachedResult(query: string, result: GeocodingResult[]): void {
    const key = this.getCacheKey(query)
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    })
    this.saveCache()
  }

  private async makeGeocodingRequest(query: string): Promise<GeocodingResult[]> {
    const token = mapboxConfig.getToken()

    if (!mapboxConfig.isTokenValid()) {
      const error: GeocodingError = {
        code: 'INVALID_QUERY',
        message: 'Mapbox token not configured or invalid'
      }
      throw error
    }

    if (!mapboxConfig.canMakeRequest('geocoding')) {
      const error: GeocodingError = {
        code: 'QUOTA_EXCEEDED',
        message: 'Geocoding service not available for current environment'
      }
      throw error
    }

    // Check if we can make the request
    if (!mapboxUsageService.canMakeRequest('geocodingRequests')) {
      const error: GeocodingError = {
        code: 'QUOTA_EXCEEDED',
        message: 'Monthly geocoding quota exceeded'
      }
      throw error
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5&autocomplete=true`

    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 429) {
          const error: GeocodingError = {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded, please try again later'
          }
          throw error
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Track the successful request
      mapboxUsageService.trackGeocodingRequest()

      if (!data.features || data.features.length === 0) {
        const error: GeocodingError = {
          code: 'NO_RESULTS',
          message: 'No results found for this location'
        }
        throw error
      }

      // Transform Mapbox response to our format
      const results: GeocodingResult[] = data.features.map((feature: any) => ({
        coordinates: feature.center,
        placeName: feature.place_name,
        center: feature.center,
        bbox: feature.bbox,
        relevance: feature.relevance || 1
      }))

      return results

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error // Re-throw our custom errors
      }

      const geocodingError: GeocodingError = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed'
      }
      throw geocodingError
    }
  }

  // Main geocoding method with debouncing and caching
  async geocode(query: string): Promise<GeocodingResult[]> {
    const trimmedQuery = query.trim()
    
    if (!trimmedQuery) {
      const error: GeocodingError = {
        code: 'INVALID_QUERY',
        message: 'Query cannot be empty'
      }
      throw error
    }

    if (trimmedQuery.length < 3) {
      const error: GeocodingError = {
        code: 'INVALID_QUERY',
        message: 'Query must be at least 3 characters long'
      }
      throw error
    }

    // Check cache first
    const cached = this.getCachedResult(trimmedQuery)
    if (cached) {
      return cached
    }

    // Check if there's already a pending request for this query
    if (this.pendingRequests.has(trimmedQuery)) {
      return this.pendingRequests.get(trimmedQuery)!
    }

    // Create new request
    const requestPromise = this.makeGeocodingRequest(trimmedQuery)
      .then(results => {
        this.setCachedResult(trimmedQuery, results)
        this.pendingRequests.delete(trimmedQuery)
        return results
      })
      .catch(error => {
        this.pendingRequests.delete(trimmedQuery)
        throw error
      })

    this.pendingRequests.set(trimmedQuery, requestPromise)
    return requestPromise
  }

  // Debounced geocoding for real-time search with graceful fallback
  async debouncedGeocode(query: string, callback: (results: GeocodingResult[] | null, error: GeocodingError | null) => void): Promise<void> {
    const trimmedQuery = query.trim()

    // Clear existing timer for this query
    const existingTimer = this.debounceTimers.get(trimmedQuery)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // If query is too short, return immediately
    if (trimmedQuery.length < 3) {
      callback(null, null)
      return
    }

    // Check cache for immediate results
    const cached = this.getCachedResult(trimmedQuery)
    if (cached) {
      callback(cached, null)
      return
    }

    // Try fallback geocoding for common locations
    const fallbackResult = this.tryFallbackGeocode(trimmedQuery)
    if (fallbackResult) {
      callback([fallbackResult], null)
      return
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        const results = await this.geocode(trimmedQuery)
        callback(results, null)
      } catch (error) {
        // Try fallback again on error
        const fallback = this.tryFallbackGeocode(trimmedQuery)
        if (fallback) {
          callback([fallback], null)
        } else {
          callback(null, error as GeocodingError)
        }
      }
    }, this.DEBOUNCE_DELAY)

    this.debounceTimers.set(trimmedQuery, timer)
  }

  // Fallback geocoding for common locations when API is unavailable
  private tryFallbackGeocode(query: string): GeocodingResult | null {
    const normalizedQuery = query.toLowerCase().trim()
    
    // Common city coordinates database
    const commonLocations: Record<string, GeocodingResult> = {
      'san francisco': {
        coordinates: [-122.4194, 37.7749],
        placeName: 'San Francisco, California, United States',
        center: [-122.4194, 37.7749],
        relevance: 1
      },
      'new york': {
        coordinates: [-74.0060, 40.7128],
        placeName: 'New York, New York, United States',
        center: [-74.0060, 40.7128],
        relevance: 1
      },
      'new york city': {
        coordinates: [-74.0060, 40.7128],
        placeName: 'New York City, New York, United States',
        center: [-74.0060, 40.7128],
        relevance: 1
      },
      'nyc': {
        coordinates: [-74.0060, 40.7128],
        placeName: 'New York City, New York, United States',
        center: [-74.0060, 40.7128],
        relevance: 1
      },
      'chicago': {
        coordinates: [-87.6298, 41.8781],
        placeName: 'Chicago, Illinois, United States',
        center: [-87.6298, 41.8781],
        relevance: 1
      },
      'los angeles': {
        coordinates: [-118.2437, 34.0522],
        placeName: 'Los Angeles, California, United States',
        center: [-118.2437, 34.0522],
        relevance: 1
      },
      'seattle': {
        coordinates: [-122.3321, 47.6062],
        placeName: 'Seattle, Washington, United States',
        center: [-122.3321, 47.6062],
        relevance: 1
      },
      'boston': {
        coordinates: [-71.0589, 42.3601],
        placeName: 'Boston, Massachusetts, United States',
        center: [-71.0589, 42.3601],
        relevance: 1
      },
      'miami': {
        coordinates: [-80.1918, 25.7617],
        placeName: 'Miami, Florida, United States',
        center: [-80.1918, 25.7617],
        relevance: 1
      },
      'denver': {
        coordinates: [-104.9903, 39.7392],
        placeName: 'Denver, Colorado, United States',
        center: [-104.9903, 39.7392],
        relevance: 1
      },
      'austin': {
        coordinates: [-97.7431, 30.2672],
        placeName: 'Austin, Texas, United States',
        center: [-97.7431, 30.2672],
        relevance: 1
      },
      'portland': {
        coordinates: [-122.6784, 45.5152],
        placeName: 'Portland, Oregon, United States',
        center: [-122.6784, 45.5152],
        relevance: 1
      }
    }

    // Try exact match first
    if (commonLocations[normalizedQuery]) {
      return commonLocations[normalizedQuery]
    }

    // Try partial matches
    for (const [city, result] of Object.entries(commonLocations)) {
      if (city.includes(normalizedQuery) || normalizedQuery.includes(city)) {
        return result
      }
    }

    return null
  }

  // Reverse geocoding (coordinates to place name)
  async reverseGeocode(coordinates: [number, number]): Promise<GeocodingResult | null> {
    const token = mapboxConfig.getToken()

    if (!mapboxConfig.isTokenValid()) {
      const error: GeocodingError = {
        code: 'INVALID_QUERY',
        message: 'Mapbox token not configured or invalid'
      }
      throw error
    }

    if (!mapboxConfig.canMakeRequest('geocoding')) {
      const error: GeocodingError = {
        code: 'QUOTA_EXCEEDED',
        message: 'Geocoding service not available for current environment'
      }
      throw error
    }

    if (!mapboxUsageService.canMakeRequest('geocodingRequests')) {
      const error: GeocodingError = {
        code: 'QUOTA_EXCEEDED',
        message: 'Monthly geocoding quota exceeded'
      }
      throw error
    }

    const [lng, lat] = coordinates
    const cacheKey = `reverse_${lng.toFixed(6)}_${lat.toFixed(6)}`
    
    // Check cache
    const cached = this.getCachedResult(cacheKey)
    if (cached && cached.length > 0) {
      return cached[0]
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`

    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      mapboxUsageService.trackGeocodingRequest()

      if (!data.features || data.features.length === 0) {
        return null
      }

      const feature = data.features[0]
      const result: GeocodingResult = {
        coordinates: feature.center,
        placeName: feature.place_name,
        center: feature.center,
        bbox: feature.bbox,
        relevance: feature.relevance || 1
      }

      // Cache the result
      this.setCachedResult(cacheKey, [result])

      return result

    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      return null
    }
  }

  // Clear all cached results
  clearCache(): void {
    this.cache.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; oldestEntry: number | null; newestEntry: number | null } {
    const entries = Array.from(this.cache.values())
    const timestamps = entries.map(entry => entry.timestamp)
    
    return {
      size: this.cache.size,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    }
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()

// React hook for easier component integration
export function useGeocoding() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<GeocodingError | null>(null)

  const geocode = React.useCallback(async (query: string): Promise<GeocodingResult[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await geocodingService.geocode(query)
      return results
    } catch (err) {
      const error = err as GeocodingError
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const debouncedGeocode = React.useCallback((
    query: string,
    callback: (results: GeocodingResult[] | null, error: GeocodingError | null) => void
  ) => {
    setIsLoading(true)
    setError(null)

    geocodingService.debouncedGeocode(query, (results, error) => {
      setIsLoading(false)
      setError(error)
      callback(results, error)
    })
  }, [])

  return {
    geocode,
    debouncedGeocode,
    isLoading,
    error,
    clearCache: geocodingService.clearCache.bind(geocodingService),
    getCacheStats: geocodingService.getCacheStats.bind(geocodingService)
  }
}

// Import React for the hook
import React from 'react'