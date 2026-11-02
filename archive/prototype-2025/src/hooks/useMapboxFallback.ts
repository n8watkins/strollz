// Hook for managing Mapbox fallback states and error handling
"use client"

import { useState, useEffect, useCallback } from 'react'
import { mapboxConfig } from '@/services/mapboxConfig'
import { mapboxUsageService } from '@/services/mapboxUsage'

export type MapboxErrorType = 
  | 'token_invalid'
  | 'quota_exceeded' 
  | 'network_error'
  | 'service_unavailable'
  | 'rate_limited'
  | 'unknown'

export interface MapboxError {
  type: MapboxErrorType
  message: string
  retryable: boolean
  retryAfter?: number // seconds
}

export interface MapboxFallbackState {
  isAvailable: boolean
  error: MapboxError | null
  isRetrying: boolean
  retryCount: number
  lastChecked: Date | null
}

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_BASE = 2000 // 2 seconds
const CHECK_INTERVAL = 30000 // 30 seconds

export function useMapboxFallback() {
  const [state, setState] = useState<MapboxFallbackState>({
    isAvailable: true,
    error: null,
    isRetrying: false,
    retryCount: 0,
    lastChecked: null
  })

  // Check if Mapbox services are available
  const checkMapboxAvailability = useCallback(async (): Promise<boolean> => {
    try {
      // Check token validity
      if (!mapboxConfig.isTokenValid()) {
        setState(prev => ({
          ...prev,
          isAvailable: false,
          error: {
            type: 'token_invalid',
            message: 'Mapbox token is invalid or not configured',
            retryable: false
          },
          lastChecked: new Date()
        }))
        return false
      }

      // Check quota limits
      if (!mapboxUsageService.canMakeRequest('mapLoads')) {
        setState(prev => ({
          ...prev,
          isAvailable: false,
          error: {
            type: 'quota_exceeded',
            message: 'Monthly map usage quota exceeded',
            retryable: false
          },
          lastChecked: new Date()
        }))
        return false
      }

      // Test actual Mapbox connectivity with a minimal request
      const token = mapboxConfig.getToken()
      if (!token) {
        throw new Error('No token available')
      }

      // Simple test request to Mapbox API
      const testUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${token}`
      const response = await fetch(testUrl, {
        method: 'HEAD', // Just check if the service is reachable
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
          setState(prev => ({
            ...prev,
            isAvailable: false,
            error: {
              type: 'rate_limited',
              message: 'Too many requests, please try again later',
              retryable: true,
              retryAfter
            },
            lastChecked: new Date()
          }))
          return false
        }

        if (response.status === 401 || response.status === 403) {
          setState(prev => ({
            ...prev,
            isAvailable: false,
            error: {
              type: 'token_invalid',
              message: 'Invalid or unauthorized Mapbox token',
              retryable: false
            },
            lastChecked: new Date()
          }))
          return false
        }

        throw new Error(`HTTP ${response.status}`)
      }

      // Service is available
      setState(prev => ({
        ...prev,
        isAvailable: true,
        error: null,
        retryCount: 0,
        lastChecked: new Date()
      }))
      return true

    } catch (error) {
      const isNetworkError = error instanceof TypeError || 
                           (error as Error).name === 'AbortError' ||
                           (error as Error).message.includes('fetch')

      setState(prev => ({
        ...prev,
        isAvailable: false,
        error: {
          type: isNetworkError ? 'network_error' : 'service_unavailable',
          message: isNetworkError 
            ? 'Network connection issue - check your internet connection'
            : 'Mapbox service temporarily unavailable',
          retryable: true
        },
        lastChecked: new Date()
      }))
      return false
    }
  }, [])

  // Retry with exponential backoff
  const retry = useCallback(async () => {
    if (state.isRetrying || state.retryCount >= MAX_RETRY_ATTEMPTS) {
      return false
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }))

    // Exponential backoff delay
    const delay = RETRY_DELAY_BASE * Math.pow(2, state.retryCount)
    await new Promise(resolve => setTimeout(resolve, delay))

    const isAvailable = await checkMapboxAvailability()

    setState(prev => ({
      ...prev,
      isRetrying: false
    }))

    return isAvailable
  }, [state.isRetrying, state.retryCount, checkMapboxAvailability])

  // Manual retry (resets retry count)
  const manualRetry = useCallback(async () => {
    setState(prev => ({
      ...prev,
      retryCount: 0,
      isRetrying: true
    }))

    const isAvailable = await checkMapboxAvailability()

    setState(prev => ({
      ...prev,
      isRetrying: false
    }))

    return isAvailable
  }, [checkMapboxAvailability])

  // Reset error state
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      retryCount: 0
    }))
  }, [])

  // Initial check and periodic monitoring
  useEffect(() => {
    checkMapboxAvailability()

    // Set up periodic health checks
    const interval = setInterval(() => {
      if (!state.isAvailable && state.error?.retryable && state.retryCount < MAX_RETRY_ATTEMPTS) {
        retry()
      } else if (state.isAvailable) {
        // Periodic health check when service is available
        checkMapboxAvailability()
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [state.isAvailable, state.error?.retryable, state.retryCount, checkMapboxAvailability, retry])

  // Get user-friendly error message
  const getErrorMessage = useCallback(() => {
    if (!state.error) return null

    switch (state.error.type) {
      case 'token_invalid':
        return 'Map service configuration issue'
      case 'quota_exceeded':
        return 'Monthly map usage limit reached'
      case 'network_error':
        return 'Network connection issue'
      case 'rate_limited':
        return `Too many requests - retry in ${state.error.retryAfter || 60} seconds`
      case 'service_unavailable':
        return 'Map service temporarily unavailable'
      default:
        return 'Map service unavailable'
    }
  }, [state.error])

  // Check if retry is recommended
  const shouldShowRetry = useCallback(() => {
    return state.error?.retryable && 
           state.retryCount < MAX_RETRY_ATTEMPTS && 
           !state.isRetrying
  }, [state.error?.retryable, state.retryCount, state.isRetrying])

  return {
    isAvailable: state.isAvailable,
    error: state.error,
    errorMessage: getErrorMessage(),
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    lastChecked: state.lastChecked,
    
    // Actions
    retry: manualRetry,
    clearError,
    checkAvailability: checkMapboxAvailability,
    shouldShowRetry: shouldShowRetry()
  }
}