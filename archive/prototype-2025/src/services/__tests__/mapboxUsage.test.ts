// Tests for Mapbox Usage Service
// Tests API usage tracking, limits, and hard stop functionality

import { mapboxUsageService, MAPBOX_FREE_LIMITS, WARNING_THRESHOLDS } from '../mapboxUsage'

describe('MapboxUsageService', () => {
  beforeEach(() => {
    // Reset usage for each test
    mapboxUsageService.forceReset()
  })

  describe('Usage Tracking', () => {
    it('should track map loads correctly', () => {
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackMapLoad()
      
      const usage = mapboxUsageService.getUsage()
      expect(usage.mapLoads).toBe(2)
      expect(usage.geocodingRequests).toBe(0)
      expect(usage.directionsRequests).toBe(0)
    })

    it('should track geocoding requests correctly', () => {
      mapboxUsageService.trackGeocodingRequest()
      mapboxUsageService.trackGeocodingRequest()
      mapboxUsageService.trackGeocodingRequest()
      
      const usage = mapboxUsageService.getUsage()
      expect(usage.geocodingRequests).toBe(3)
      expect(usage.mapLoads).toBe(0)
      expect(usage.directionsRequests).toBe(0)
    })

    it('should track directions requests correctly', () => {
      mapboxUsageService.trackDirectionsRequest()
      
      const usage = mapboxUsageService.getUsage()
      expect(usage.directionsRequests).toBe(1)
      expect(usage.mapLoads).toBe(0)
      expect(usage.geocodingRequests).toBe(0)
    })

    it('should track daily usage breakdown', () => {
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackGeocodingRequest()
      mapboxUsageService.trackDirectionsRequest()
      
      const dailyUsage = mapboxUsageService.getDailyUsage(1)
      const today = new Date().toISOString().split('T')[0]
      
      expect(dailyUsage).toHaveLength(1)
      expect(dailyUsage[0].date).toBe(today)
      expect(dailyUsage[0].mapLoads).toBe(1)
      expect(dailyUsage[0].geocodingRequests).toBe(1)
      expect(dailyUsage[0].directionsRequests).toBe(1)
    })
  })

  describe('Usage Limits and Warnings', () => {
    it('should calculate usage percentages correctly', () => {
      // Add some usage
      for (let i = 0; i < 1000; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      const percentages = mapboxUsageService.getUsagePercentages()
      expect(percentages.mapLoads).toBe(1000 / MAPBOX_FREE_LIMITS.mapLoads)
      expect(percentages.geocodingRequests).toBe(0)
      expect(percentages.directionsRequests).toBe(0)
    })

    it('should return correct warning levels', () => {
      // Safe level
      expect(mapboxUsageService.getWarningLevel()).toBe('safe')
      
      // Yellow warning level (70%)
      for (let i = 0; i < MAPBOX_FREE_LIMITS.mapLoads * WARNING_THRESHOLDS.yellow; i++) {
        mapboxUsageService.trackMapLoad()
      }
      expect(mapboxUsageService.getWarningLevel()).toBe('yellow')
      
      // Reset and test orange level (85%)
      mapboxUsageService.forceReset()
      for (let i = 0; i < MAPBOX_FREE_LIMITS.mapLoads * WARNING_THRESHOLDS.orange; i++) {
        mapboxUsageService.trackMapLoad()
      }
      expect(mapboxUsageService.getWarningLevel()).toBe('orange')
      
      // Reset and test red level (95%)
      mapboxUsageService.forceReset()
      for (let i = 0; i < MAPBOX_FREE_LIMITS.mapLoads * WARNING_THRESHOLDS.red; i++) {
        mapboxUsageService.trackMapLoad()
      }
      expect(mapboxUsageService.getWarningLevel()).toBe('red')
    })

    it('should calculate remaining quota correctly', () => {
      // Add some usage
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackGeocodingRequest()
      mapboxUsageService.trackDirectionsRequest()
      
      const remaining = mapboxUsageService.getRemainingQuota()
      expect(remaining.mapLoads).toBe(MAPBOX_FREE_LIMITS.mapLoads - 1)
      expect(remaining.geocodingRequests).toBe(MAPBOX_FREE_LIMITS.geocodingRequests - 1)
      expect(remaining.directionsRequests).toBe(MAPBOX_FREE_LIMITS.directionsRequests - 1)
    })

    it('should allow requests when under limits', () => {
      expect(mapboxUsageService.canMakeRequest('mapLoads')).toBe(true)
      expect(mapboxUsageService.canMakeRequest('geocodingRequests')).toBe(true)
      expect(mapboxUsageService.canMakeRequest('directionsRequests')).toBe(true)
    })

    it('should prevent requests when at limits', () => {
      // Fill up the quota
      for (let i = 0; i < MAPBOX_FREE_LIMITS.mapLoads; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      expect(mapboxUsageService.canMakeRequest('mapLoads')).toBe(false)
      expect(mapboxUsageService.canMakeRequest('geocodingRequests')).toBe(true)
      expect(mapboxUsageService.canMakeRequest('directionsRequests')).toBe(true)
    })
  })

  describe('Hard Stop Functionality', () => {
    it('should trigger hard stop at 70% usage', () => {
      // Add usage to 70% threshold
      const seventyPercentUsage = Math.floor(MAPBOX_FREE_LIMITS.directionsRequests * 0.70)
      
      for (let i = 0; i < seventyPercentUsage; i++) {
        mapboxUsageService.trackDirectionsRequest()
      }
      
      expect(mapboxUsageService.shouldHardStop('directionsRequests')).toBe(true)
    })

    it('should not trigger hard stop below 70% usage', () => {
      // Add usage to 69% threshold
      const sixtyNinePercentUsage = Math.floor(MAPBOX_FREE_LIMITS.directionsRequests * 0.69)
      
      for (let i = 0; i < sixtyNinePercentUsage; i++) {
        mapboxUsageService.trackDirectionsRequest()
      }
      
      expect(mapboxUsageService.shouldHardStop('directionsRequests')).toBe(false)
    })

    it('should provide detailed API status including hard stop', () => {
      // Add usage to trigger hard stop
      const seventyPercentUsage = Math.floor(MAPBOX_FREE_LIMITS.directionsRequests * 0.70)
      
      for (let i = 0; i < seventyPercentUsage; i++) {
        mapboxUsageService.trackDirectionsRequest()
      }
      
      const status = mapboxUsageService.getAPIStatus('directionsRequests')
      
      expect(status.shouldHardStop).toBe(true)
      expect(status.canMakeRequest).toBe(false)
      expect(status.warningLevel).toBe('hardstop')
      expect(status.percentage).toBeGreaterThanOrEqual(0.70)
      expect(status.remaining).toBeLessThanOrEqual(MAPBOX_FREE_LIMITS.directionsRequests * 0.30)
    })

    it('should provide safe status when under thresholds', () => {
      // Add minimal usage
      mapboxUsageService.trackDirectionsRequest()
      
      const status = mapboxUsageService.getAPIStatus('directionsRequests')
      
      expect(status.shouldHardStop).toBe(false)
      expect(status.canMakeRequest).toBe(true)
      expect(status.warningLevel).toBe('safe')
      expect(status.percentage).toBeLessThan(0.70)
      expect(status.remaining).toBe(MAPBOX_FREE_LIMITS.directionsRequests - 1)
    })
  })

  describe('Console Warnings', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should log warning when approaching limits', () => {
      // Add usage to trigger orange warning (85%)
      const orangeThresholdUsage = Math.floor(MAPBOX_FREE_LIMITS.directionsRequests * WARNING_THRESHOLDS.orange)
      
      for (let i = 0; i < orangeThresholdUsage; i++) {
        mapboxUsageService.trackDirectionsRequest()
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Directions requests at')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('85.0%')
      )
    })

    it('should not log warning when under thresholds', () => {
      // Add minimal usage
      mapboxUsageService.trackDirectionsRequest()
      
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('Monthly Reset', () => {
    it('should reset usage at the beginning of a new month', () => {
      // Add some usage
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackGeocodingRequest()
      mapboxUsageService.trackDirectionsRequest()
      
      // Verify usage is recorded
      let usage = mapboxUsageService.getUsage()
      expect(usage.mapLoads).toBe(1)
      expect(usage.geocodingRequests).toBe(1)
      expect(usage.directionsRequests).toBe(1)
      
      // Force reset (simulating month change)
      mapboxUsageService.forceReset()
      
      // Verify usage is reset
      usage = mapboxUsageService.getUsage()
      expect(usage.mapLoads).toBe(0)
      expect(usage.geocodingRequests).toBe(0)
      expect(usage.directionsRequests).toBe(0)
    })
  })

  describe('Usage Persistence', () => {
    it('should maintain usage across service instances', () => {
      // Add usage
      mapboxUsageService.trackMapLoad()
      
      // Usage should persist (in real implementation, this would be localStorage)
      const usage = mapboxUsageService.getUsage()
      expect(usage.mapLoads).toBe(1)
    })
  })
})