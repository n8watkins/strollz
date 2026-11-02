// Tests for Mapbox Usage Monitoring Service
import { mapboxUsageService, MAPBOX_FREE_LIMITS, WARNING_THRESHOLDS } from '@/services/mapboxUsage'

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

// Mock console methods
const consoleSpy = {
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {})
}

describe('MapboxUsageService', () => {
  beforeEach(() => {
    // Clear localStorage and reset service
    localStorageMock.clear()
    mapboxUsageService.forceReset()
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleSpy.warn.mockRestore()
    consoleSpy.log.mockRestore()
  })

  describe('Usage Tracking', () => {
    test('should track map loads correctly', () => {
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackMapLoad()
      
      const usage = mapboxUsageService.getUsage()
      expect(usage.mapLoads).toBe(2)
      expect(usage.geocodingRequests).toBe(0)
      expect(usage.directionsRequests).toBe(0)
    })

    test('should track geocoding requests correctly', () => {
      mapboxUsageService.trackGeocodingRequest()
      mapboxUsageService.trackGeocodingRequest()
      mapboxUsageService.trackGeocodingRequest()
      
      const usage = mapboxUsageService.getUsage()
      expect(usage.geocodingRequests).toBe(3)
      expect(usage.mapLoads).toBe(0)
    })

    test('should track directions requests correctly', () => {
      mapboxUsageService.trackDirectionsRequest()
      
      const usage = mapboxUsageService.getUsage()
      expect(usage.directionsRequests).toBe(1)
    })

    test('should persist usage data to localStorage', () => {
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackGeocodingRequest()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'stroll-vibe-mapbox-usage',
        expect.any(String)
      )
    })
  })

  describe('Daily Usage Tracking', () => {
    test('should track daily usage correctly', () => {
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackGeocodingRequest()
      
      const dailyUsage = mapboxUsageService.getDailyUsage(1)
      const today = dailyUsage[0]
      
      expect(today.mapLoads).toBe(1)
      expect(today.geocodingRequests).toBe(1)
      expect(today.directionsRequests).toBe(0)
      expect(today.date).toBe(new Date().toISOString().split('T')[0])
    })

    test('should return correct number of days', () => {
      const usage7Days = mapboxUsageService.getDailyUsage(7)
      const usage30Days = mapboxUsageService.getDailyUsage(30)
      
      expect(usage7Days).toHaveLength(7)
      expect(usage30Days).toHaveLength(30)
    })
  })

  describe('Usage Percentages', () => {
    test('should calculate usage percentages correctly', () => {
      // Track some usage
      for (let i = 0; i < 1000; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      const percentages = mapboxUsageService.getUsagePercentages()
      expect(percentages.mapLoads).toBe(1000 / MAPBOX_FREE_LIMITS.mapLoads)
      expect(percentages.geocodingRequests).toBe(0)
    })
  })

  describe('Warning Levels', () => {
    test('should return safe warning level for low usage', () => {
      mapboxUsageService.trackMapLoad()
      
      const warningLevel = mapboxUsageService.getWarningLevel()
      expect(warningLevel).toBe('safe')
    })

    test('should return yellow warning level at 70% usage', () => {
      const yellowThreshold = Math.floor(MAPBOX_FREE_LIMITS.mapLoads * WARNING_THRESHOLDS.yellow)
      
      for (let i = 0; i < yellowThreshold + 100; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      const warningLevel = mapboxUsageService.getWarningLevel()
      expect(warningLevel).toBe('yellow')
    })

    test('should return orange warning level at 85% usage', () => {
      const orangeThreshold = Math.floor(MAPBOX_FREE_LIMITS.mapLoads * WARNING_THRESHOLDS.orange)
      
      for (let i = 0; i < orangeThreshold + 100; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      const warningLevel = mapboxUsageService.getWarningLevel()
      expect(warningLevel).toBe('orange')
    })

    test('should return red warning level at 95% usage', () => {
      const redThreshold = Math.floor(MAPBOX_FREE_LIMITS.mapLoads * WARNING_THRESHOLDS.red)
      
      for (let i = 0; i < redThreshold + 100; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      const warningLevel = mapboxUsageService.getWarningLevel()
      expect(warningLevel).toBe('red')
    })

    test('should log warnings when approaching limits', () => {
      const orangeThreshold = Math.floor(MAPBOX_FREE_LIMITS.mapLoads * WARNING_THRESHOLDS.orange)
      
      for (let i = 0; i < orangeThreshold + 100; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Map loads at')
      )
    })
  })

  describe('Remaining Quota', () => {
    test('should calculate remaining quota correctly', () => {
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackGeocodingRequest()
      
      const remaining = mapboxUsageService.getRemainingQuota()
      
      expect(remaining.mapLoads).toBe(MAPBOX_FREE_LIMITS.mapLoads - 1)
      expect(remaining.geocodingRequests).toBe(MAPBOX_FREE_LIMITS.geocodingRequests - 1)
      expect(remaining.directionsRequests).toBe(MAPBOX_FREE_LIMITS.directionsRequests)
    })

    test('should not return negative quota', () => {
      // Exceed limits
      for (let i = 0; i < MAPBOX_FREE_LIMITS.mapLoads + 1000; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      const remaining = mapboxUsageService.getRemainingQuota()
      expect(remaining.mapLoads).toBe(0)
    })
  })

  describe('Request Permission Checking', () => {
    test('should allow requests when under quota', () => {
      expect(mapboxUsageService.canMakeRequest('mapLoads')).toBe(true)
      expect(mapboxUsageService.canMakeRequest('geocodingRequests')).toBe(true)
      expect(mapboxUsageService.canMakeRequest('directionsRequests')).toBe(true)
    })

    test('should deny requests when quota exceeded', () => {
      // Exceed map loads quota
      for (let i = 0; i < MAPBOX_FREE_LIMITS.mapLoads + 100; i++) {
        mapboxUsageService.trackMapLoad()
      }
      
      expect(mapboxUsageService.canMakeRequest('mapLoads')).toBe(false)
      expect(mapboxUsageService.canMakeRequest('geocodingRequests')).toBe(true)
    })
  })

  describe('Monthly Reset', () => {
    test('should reset usage data for new month', () => {
      // Track some usage
      mapboxUsageService.trackMapLoad()
      mapboxUsageService.trackGeocodingRequest()
      
      // Mock date to be next month
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      jest.spyOn(Date, 'now').mockReturnValue(nextMonth.getTime())
      
      // Force reset check
      mapboxUsageService.forceReset()
      
      const usage = mapboxUsageService.getUsage()
      expect(usage.mapLoads).toBe(0)
      expect(usage.geocodingRequests).toBe(0)
      expect(usage.directionsRequests).toBe(0)
      
      jest.restoreAllMocks()
    })
  })

  describe('Subscription System', () => {
    test('should notify subscribers of usage updates', () => {
      const mockCallback = jest.fn()
      
      const unsubscribe = mapboxUsageService.subscribe(mockCallback)
      
      mapboxUsageService.trackMapLoad()
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          mapLoads: 1
        })
      )
      
      unsubscribe()
    })

    test('should allow unsubscription', () => {
      const mockCallback = jest.fn()
      
      const unsubscribe = mapboxUsageService.subscribe(mockCallback)
      unsubscribe()
      
      mapboxUsageService.trackMapLoad()
      
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })
      
      expect(() => {
        mapboxUsageService.trackMapLoad()
      }).not.toThrow()
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Failed to save Mapbox usage data:',
        expect.any(Error)
      )
    })

    test('should handle missing localStorage gracefully', () => {
      // Mock localStorage methods to return null
      localStorageMock.getItem.mockReturnValue(null)
      
      const usage = mapboxUsageService.getUsage()
      
      expect(usage.mapLoads).toBe(0)
      expect(usage.geocodingRequests).toBe(0)
      expect(usage.directionsRequests).toBe(0)
    })
  })

  describe('Constants Validation', () => {
    test('should have correct free tier limits', () => {
      expect(MAPBOX_FREE_LIMITS.mapLoads).toBe(50000)
      expect(MAPBOX_FREE_LIMITS.geocodingRequests).toBe(100000)
      expect(MAPBOX_FREE_LIMITS.directionsRequests).toBe(100000)
    })

    test('should have correct warning thresholds', () => {
      expect(WARNING_THRESHOLDS.yellow).toBe(0.7)
      expect(WARNING_THRESHOLDS.orange).toBe(0.85)
      expect(WARNING_THRESHOLDS.red).toBe(0.95)
    })
  })
})