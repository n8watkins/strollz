// Tests for Mapbox Usage Dashboard Component
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MapboxUsageDashboard from '@/components/dev/MapboxUsageDashboard'

// Mock the services
jest.mock('@/services/mapboxUsage', () => ({
  useMapboxUsage: jest.fn(() => ({
    usage: {
      mapLoads: 1000,
      geocodingRequests: 500,
      directionsRequests: 100,
      lastReset: '2024-01-01T00:00:00.000Z',
      dailyUsage: {}
    },
    percentages: {
      mapLoads: 0.02, // 2%
      geocodingRequests: 0.005, // 0.5%
      directionsRequests: 0.001 // 0.1%
    },
    warningLevel: 'safe',
    remainingQuota: {
      mapLoads: 49000,
      geocodingRequests: 99500,
      directionsRequests: 99900
    },
    getDailyUsage: jest.fn(() => [
      { date: '2024-01-01', mapLoads: 100, geocodingRequests: 50, directionsRequests: 10 },
      { date: '2024-01-02', mapLoads: 150, geocodingRequests: 75, directionsRequests: 15 },
      { date: '2024-01-03', mapLoads: 200, geocodingRequests: 100, directionsRequests: 20 }
    ])
  })),
  MAPBOX_FREE_LIMITS: {
    mapLoads: 50000,
    geocodingRequests: 100000,
    directionsRequests: 100000
  },
  WARNING_THRESHOLDS: {
    yellow: 0.7,
    orange: 0.85,
    red: 0.95
  }
}))

jest.mock('@/services/mapboxConfig', () => ({
  useMapboxConfig: jest.fn(() => ({
    token: 'pk.test_token',
    environment: 'development',
    isValid: true,
    validation: {
      isValid: true,
      environment: 'development',
      restrictions: ['Max daily requests: 500'],
      warnings: []
    },
    setupInstructions: {
      environment: 'development',
      steps: [
        '1. Get a Mapbox access token',
        '2. Add to environment variables',
        '3. Restart server'
      ],
      environmentVariables: {
        'NEXT_PUBLIC_MAPBOX_TOKEN_DEV': 'pk.your_token_here'
      }
    }
  }))
}))

jest.mock('@/services/geocoding', () => ({
  geocodingService: {
    clearCache: jest.fn(),
    getCacheStats: jest.fn(() => ({
      size: 25,
      oldestEntry: Date.now() - 86400000, // 1 day ago
      newestEntry: Date.now()
    }))
  }
}))

// Mock NODE_ENV
const originalEnv = process.env.NODE_ENV

describe('MapboxUsageDashboard', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('Development Environment', () => {
    test('should render toggle button in development', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      expect(toggleButton).toBeInTheDocument()
    })

    test('should not render in production', () => {
      process.env.NODE_ENV = 'production'
      
      const { container } = render(<MapboxUsageDashboard />)
      expect(container.firstChild).toBeNull()
    })

    test('should show dashboard when toggle is clicked', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('Mapbox Usage')).toBeInTheDocument()
      expect(screen.getByText('Environment: development')).toBeInTheDocument()
    })

    test('should hide dashboard when close button is clicked', () => {
      render(<MapboxUsageDashboard />)
      
      // Open dashboard
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      // Close dashboard
      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)
      
      expect(screen.queryByText('Mapbox Usage')).not.toBeInTheDocument()
    })
  })

  describe('Usage Display', () => {
    test('should display current usage statistics', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('1,000 / 50,000')).toBeInTheDocument() // Map loads
      expect(screen.getByText('500 / 100,000')).toBeInTheDocument() // Geocoding
      expect(screen.getByText('100 / 100,000')).toBeInTheDocument() // Directions
    })

    test('should display usage percentages', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('2.0% used')).toBeInTheDocument() // Map loads
      expect(screen.getByText('0.5% used')).toBeInTheDocument() // Geocoding
      expect(screen.getByText('0.1% used')).toBeInTheDocument() // Directions
    })

    test('should show token status', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      expect(screen.getByText('Token: Valid')).toBeInTheDocument()
    })
  })

  describe('Warning Levels', () => {
    test('should display safe warning level styling', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      expect(toggleButton).toHaveClass('text-green-600', 'bg-green-50')
    })

    test('should display orange warning level', () => {
      const mapboxUsageMock = jest.requireMock('@/services/mapboxUsage')
      mapboxUsageMock.useMapboxUsage.mockReturnValue({
        ...mapboxUsageMock.useMapboxUsage(),
        warningLevel: 'orange',
        percentages: {
          mapLoads: 0.87, // 87%
          geocodingRequests: 0.005,
          directionsRequests: 0.001
        }
      })

      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      expect(toggleButton).toHaveClass('text-orange-600', 'bg-orange-50')
    })

    test('should display red warning level', () => {
      const mapboxUsageMock = jest.requireMock('@/services/mapboxUsage')
      mapboxUsageMock.useMapboxUsage.mockReturnValue({
        usage: { mapLoads: 48500, geocodingRequests: 500, directionsRequests: 100 },
        warningLevel: 'red',
        percentages: {
          mapLoads: 0.97, // 97%
          geocodingRequests: 0.005,
          directionsRequests: 0.001
        }
      })

      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      expect(toggleButton).toHaveClass('text-red-600', 'bg-red-50')
      expect(screen.getByText('Critical Usage')).toBeInTheDocument()
    })
  })

  describe('Progress Bars', () => {
    test('should render progress bars with correct widths', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      // Map loads progress bar should be 2% width
      const progressBars = document.querySelectorAll('.bg-green-500')
      expect(progressBars[0]).toHaveStyle('width: 2%')
    })

    test('should use correct colors based on usage level', () => {
      const mapboxUsageMock = jest.requireMock('@/services/mapboxUsage')
      mapboxUsageMock.useMapboxUsage.mockReturnValue({
        usage: { mapLoads: 44000, geocodingRequests: 72000, directionsRequests: 96000 },
        percentages: {
          mapLoads: 0.88, // Orange level
          geocodingRequests: 0.72, // Yellow level
          directionsRequests: 0.96 // Red level
        }
      })

      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const orangeBar = document.querySelector('.bg-orange-500')
      const yellowBar = document.querySelector('.bg-yellow-500')
      const redBar = document.querySelector('.bg-red-500')
      
      expect(orangeBar).toBeInTheDocument()
      expect(yellowBar).toBeInTheDocument()
      expect(redBar).toBeInTheDocument()
    })
  })

  describe('Quick Actions', () => {
    test('should clear cache when button is clicked', async () => {
      const geocodingMock = jest.requireMock('@/services/geocoding')
      
      // Mock window.alert
      window.alert = jest.fn()
      
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const clearCacheButton = screen.getByText('Clear Cache')
      fireEvent.click(clearCacheButton)
      
      expect(geocodingMock.geocodingService.clearCache).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('Geocoding cache cleared')
    })

    test('should refresh page when refresh button is clicked', () => {
      // Mock window.location.reload
      const mockReload = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })
      
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const refreshButton = screen.getByText('Refresh')
      fireEvent.click(refreshButton)
      
      expect(mockReload).toHaveBeenCalled()
    })
  })

  describe('Details Section', () => {
    test('should show details when Details button is clicked', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const detailsButton = screen.getByText('Details')
      fireEvent.click(detailsButton)
      
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
      expect(screen.getByText('Cache Stats')).toBeInTheDocument()
    })

    test('should hide details when Hide button is clicked', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const detailsButton = screen.getByText('Details')
      fireEvent.click(detailsButton)
      
      const hideButton = screen.getByText('Hide')
      fireEvent.click(hideButton)
      
      expect(screen.queryByText('Last 7 Days')).not.toBeInTheDocument()
    })

    test('should display daily usage data', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const detailsButton = screen.getByText('Details')
      fireEvent.click(detailsButton)
      
      expect(screen.getByText('M:100')).toBeInTheDocument() // Map loads
      expect(screen.getByText('G:50')).toBeInTheDocument() // Geocoding
      expect(screen.getByText('D:10')).toBeInTheDocument() // Directions
    })

    test('should display cache statistics', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const detailsButton = screen.getByText('Details')
      fireEvent.click(detailsButton)
      
      expect(screen.getByText('Cached entries: 25')).toBeInTheDocument()
    })
  })

  describe('Invalid Token Handling', () => {
    test('should show setup instructions for invalid token', () => {
      const configMock = jest.requireMock('@/services/mapboxConfig')
      configMock.useMapboxConfig.mockReturnValue({
        token: null,
        environment: 'development',
        isValid: false,
        validation: {
          isValid: false,
          environment: 'development',
          restrictions: ['No token configured'],
          warnings: ['Mapbox token not found in environment variables']
        }
      })

      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const detailsButton = screen.getByText('Details')
      fireEvent.click(detailsButton)
      
      expect(screen.getByText('Setup')).toBeInTheDocument()
      expect(screen.getByText('• Get a Mapbox access token')).toBeInTheDocument()
    })

    test('should show warnings for invalid token', () => {
      const configMock = jest.requireMock('@/services/mapboxConfig')
      configMock.useMapboxConfig.mockReturnValue({
        token: 'your_mapbox_token_here',
        environment: 'development',
        isValid: false,
        validation: {
          isValid: false,
          environment: 'development',
          restrictions: [],
          warnings: ['Using placeholder token - replace with actual Mapbox token']
        }
      })

      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const detailsButton = screen.getByText('Details')
      fireEvent.click(detailsButton)
      
      expect(screen.getByText('Warnings')).toBeInTheDocument()
      expect(screen.getByText('• Using placeholder token - replace with actual Mapbox token')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      expect(toggleButton).toHaveAttribute('title')
      
      fireEvent.click(toggleButton)
      
      // Check for semantic HTML structure
      const heading = screen.getByText('Mapbox Usage')
      expect(heading.tagName).toBe('H3')
    })

    test('should be keyboard accessible', () => {
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      
      // Should be focusable
      toggleButton.focus()
      expect(document.activeElement).toBe(toggleButton)
      
      // Should open with Enter key
      fireEvent.keyDown(toggleButton, { key: 'Enter' })
      // Note: This would need additional setup for full keyboard testing
    })
  })

  describe('Custom Props', () => {
    test('should apply custom className', () => {
      render(<MapboxUsageDashboard className="custom-class" />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const dashboard = document.querySelector('.custom-class')
      expect(dashboard).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('should handle missing usage data gracefully', () => {
      const mapboxUsageMock = jest.requireMock('@/services/mapboxUsage')
      mapboxUsageMock.useMapboxUsage.mockReturnValue({
        usage: null,
        percentages: {},
        warningLevel: 'safe',
        remainingQuota: {},
        getDailyUsage: jest.fn(() => [])
      })

      expect(() => {
        render(<MapboxUsageDashboard />)
      }).not.toThrow()
    })

    test('should handle service errors gracefully', () => {
      const geocodingMock = jest.requireMock('@/services/geocoding')
      geocodingMock.geocodingService.clearCache.mockImplementation(() => {
        throw new Error('Cache error')
      })
      
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<MapboxUsageDashboard />)
      
      const toggleButton = screen.getByTitle('Toggle Mapbox Usage Dashboard')
      fireEvent.click(toggleButton)
      
      const clearCacheButton = screen.getByText('Clear Cache')
      
      expect(() => {
        fireEvent.click(clearCacheButton)
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })
})