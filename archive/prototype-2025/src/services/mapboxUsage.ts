// Mapbox Usage Monitoring Service
// Tracks API usage to stay within free tier limits and provide usage analytics

export interface MapboxUsage {
  mapLoads: number
  geocodingRequests: number
  directionsRequests: number
  lastReset: string // ISO date string
  dailyUsage: {
    [date: string]: {
      mapLoads: number
      geocodingRequests: number
      directionsRequests: number
    }
  }
}

export interface MapboxLimits {
  mapLoads: number // 50,000/month free
  geocodingRequests: number // 100,000/month free
  directionsRequests: number // 100,000/month free
}

// Free tier limits from Mapbox
export const MAPBOX_FREE_LIMITS: MapboxLimits = {
  mapLoads: 50000,
  geocodingRequests: 100000,
  directionsRequests: 100000
}

// Warning thresholds (percentage of limit)
export const WARNING_THRESHOLDS = {
  yellow: 0.7, // 70%
  orange: 0.85, // 85%
  red: 0.95 // 95%
}

class MapboxUsageService {
  private readonly STORAGE_KEY = 'stroll-vibe-mapbox-usage'
  private usage: MapboxUsage
  private listeners: ((usage: MapboxUsage) => void)[] = []

  constructor() {
    this.usage = this.loadUsage()
    this.resetIfNewMonth()
  }

  private loadUsage(): MapboxUsage {
    if (typeof window === 'undefined') {
      return this.getDefaultUsage()
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load Mapbox usage data:', error)
    }

    return this.getDefaultUsage()
  }

  private getDefaultUsage(): MapboxUsage {
    return {
      mapLoads: 0,
      geocodingRequests: 0,
      directionsRequests: 0,
      lastReset: new Date().toISOString(),
      dailyUsage: {}
    }
  }

  private saveUsage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.usage))
      this.notifyListeners()
    } catch (error) {
      console.warn('Failed to save Mapbox usage data:', error)
    }
  }

  private resetIfNewMonth(): void {
    const lastReset = new Date(this.usage.lastReset)
    const now = new Date()

    // Reset if it's a new month
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      this.resetMonthlyUsage()
    }
  }

  private resetMonthlyUsage(): void {
    this.usage = {
      ...this.usage,
      mapLoads: 0,
      geocodingRequests: 0,
      directionsRequests: 0,
      lastReset: new Date().toISOString()
    }
    this.saveUsage()
  }

  private getCurrentDateKey(): string {
    return new Date().toISOString().split('T')[0]
  }

  private updateDailyUsage(type: keyof Omit<MapboxUsage, 'lastReset' | 'dailyUsage'>): void {
    const dateKey = this.getCurrentDateKey()
    
    if (!this.usage.dailyUsage[dateKey]) {
      this.usage.dailyUsage[dateKey] = {
        mapLoads: 0,
        geocodingRequests: 0,
        directionsRequests: 0
      }
    }

    this.usage.dailyUsage[dateKey][type]++
  }

  // Public methods to track usage
  trackMapLoad(): void {
    this.usage.mapLoads++
    this.updateDailyUsage('mapLoads')
    this.saveUsage()

    // Log warning if approaching limit
    const percentage = this.usage.mapLoads / MAPBOX_FREE_LIMITS.mapLoads
    if (percentage >= WARNING_THRESHOLDS.orange) {
      console.warn(`Map loads at ${(percentage * 100).toFixed(1)}% of monthly limit`)
    }
  }

  trackGeocodingRequest(): void {
    this.usage.geocodingRequests++
    this.updateDailyUsage('geocodingRequests')
    this.saveUsage()

    const percentage = this.usage.geocodingRequests / MAPBOX_FREE_LIMITS.geocodingRequests
    if (percentage >= WARNING_THRESHOLDS.orange) {
      console.warn(`Geocoding requests at ${(percentage * 100).toFixed(1)}% of monthly limit`)
    }
  }

  trackDirectionsRequest(): void {
    this.usage.directionsRequests++
    this.updateDailyUsage('directionsRequests')
    this.saveUsage()

    const percentage = this.usage.directionsRequests / MAPBOX_FREE_LIMITS.directionsRequests
    if (percentage >= WARNING_THRESHOLDS.orange) {
      console.warn(`Directions requests at ${(percentage * 100).toFixed(1)}% of monthly limit`)
    }
  }

  // Get current usage data
  getUsage(): MapboxUsage {
    return { ...this.usage }
  }

  // Get usage percentages
  getUsagePercentages(): { [key: string]: number } {
    return {
      mapLoads: this.usage.mapLoads / MAPBOX_FREE_LIMITS.mapLoads,
      geocodingRequests: this.usage.geocodingRequests / MAPBOX_FREE_LIMITS.geocodingRequests,
      directionsRequests: this.usage.directionsRequests / MAPBOX_FREE_LIMITS.directionsRequests
    }
  }

  // Check if we're approaching any limits
  getWarningLevel(): 'safe' | 'yellow' | 'orange' | 'red' {
    const percentages = this.getUsagePercentages()
    const maxPercentage = Math.max(...Object.values(percentages))

    if (maxPercentage >= WARNING_THRESHOLDS.red) return 'red'
    if (maxPercentage >= WARNING_THRESHOLDS.orange) return 'orange'
    if (maxPercentage >= WARNING_THRESHOLDS.yellow) return 'yellow'
    return 'safe'
  }

  // Get remaining quota
  getRemainingQuota(): MapboxLimits {
    return {
      mapLoads: Math.max(0, MAPBOX_FREE_LIMITS.mapLoads - this.usage.mapLoads),
      geocodingRequests: Math.max(0, MAPBOX_FREE_LIMITS.geocodingRequests - this.usage.geocodingRequests),
      directionsRequests: Math.max(0, MAPBOX_FREE_LIMITS.directionsRequests - this.usage.directionsRequests)
    }
  }

  // Check if a specific API type is safe to use
  canMakeRequest(type: keyof MapboxLimits): boolean {
    const remaining = this.getRemainingQuota()
    return remaining[type] > 0
  }

  // Hard stop - Check if we're at the limit where we should completely stop
  shouldHardStop(type: keyof MapboxLimits): boolean {
    const percentages = this.getUsagePercentages()
    return percentages[type] >= 0.70 // Hard stop at 70% to prevent overages
  }

  // Get detailed status for a specific API type
  getAPIStatus(type: keyof MapboxLimits): {
    canMakeRequest: boolean
    shouldHardStop: boolean
    remaining: number
    percentage: number
    warningLevel: 'safe' | 'yellow' | 'orange' | 'red' | 'hardstop'
  } {
    const remaining = this.getRemainingQuota()
    const percentages = this.getUsagePercentages()
    const percentage = percentages[type]
    
    let warningLevel: 'safe' | 'yellow' | 'orange' | 'red' | 'hardstop' = 'safe'
    
    if (percentage >= 0.70) warningLevel = 'hardstop'
    else if (percentage >= WARNING_THRESHOLDS.red) warningLevel = 'red'
    else if (percentage >= WARNING_THRESHOLDS.orange) warningLevel = 'orange'
    else if (percentage >= WARNING_THRESHOLDS.yellow) warningLevel = 'yellow'
    
    return {
      canMakeRequest: remaining[type] > 0 && !this.shouldHardStop(type),
      shouldHardStop: this.shouldHardStop(type),
      remaining: remaining[type],
      percentage,
      warningLevel
    }
  }

  // Subscribe to usage updates
  subscribe(callback: (usage: MapboxUsage) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.usage))
  }

  // Get daily usage for charts/analytics
  getDailyUsage(days: number = 30): Array<{
    date: string
    mapLoads: number
    geocodingRequests: number
    directionsRequests: number
  }> {
    const result = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      
      result.push({
        date: dateKey,
        mapLoads: this.usage.dailyUsage[dateKey]?.mapLoads || 0,
        geocodingRequests: this.usage.dailyUsage[dateKey]?.geocodingRequests || 0,
        directionsRequests: this.usage.dailyUsage[dateKey]?.directionsRequests || 0
      })
    }

    return result
  }

  // Force reset (for testing or admin purposes)
  forceReset(): void {
    this.usage = this.getDefaultUsage()
    this.saveUsage()
  }
}

// Export singleton instance
export const mapboxUsageService = new MapboxUsageService()

// Hook for React components
export function useMapboxUsage() {
  const [usage, setUsage] = React.useState(mapboxUsageService.getUsage())

  React.useEffect(() => {
    const unsubscribe = mapboxUsageService.subscribe(setUsage)
    return unsubscribe
  }, [])

  return {
    usage,
    percentages: mapboxUsageService.getUsagePercentages(),
    warningLevel: mapboxUsageService.getWarningLevel(),
    remainingQuota: mapboxUsageService.getRemainingQuota(),
    canMakeRequest: mapboxUsageService.canMakeRequest.bind(mapboxUsageService),
    trackMapLoad: mapboxUsageService.trackMapLoad.bind(mapboxUsageService),
    trackGeocodingRequest: mapboxUsageService.trackGeocodingRequest.bind(mapboxUsageService),
    trackDirectionsRequest: mapboxUsageService.trackDirectionsRequest.bind(mapboxUsageService),
    getDailyUsage: mapboxUsageService.getDailyUsage.bind(mapboxUsageService)
  }
}

// Import React for the hook
import React from 'react'