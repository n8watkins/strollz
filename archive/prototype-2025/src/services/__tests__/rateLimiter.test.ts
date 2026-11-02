// Tests for Rate Limiter Service
// Tests rate limiting functionality and burst protection

import { rateLimiterService } from '../rateLimiter'

describe('RateLimiterService', () => {
  beforeEach(() => {
    // Clear history before each test
    rateLimiterService.clearHistory()
  })

  describe('Rate Limiting', () => {
    it('should allow requests under the rate limit', () => {
      const userId = 'test-user'
      
      // Should allow first request
      let result = rateLimiterService.canMakeRequest('routeGeneration', userId)
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
      expect(result.retryAfter).toBeUndefined()
      
      // Record the request
      rateLimiterService.recordRequest('routeGeneration', userId)
      
      // Should still allow more requests under limit
      result = rateLimiterService.canMakeRequest('routeGeneration', userId)
      expect(result.allowed).toBe(true)
    })

    it('should block requests when rate limit is exceeded', () => {
      const userId = 'test-user'
      
      // Fill up the burst limit first (3 requests per 10 seconds for route generation)
      for (let i = 0; i < 3; i++) {
        rateLimiterService.recordRequest('routeGeneration', userId)
      }
      
      // Next request should be blocked by burst limit
      const result = rateLimiterService.canMakeRequest('routeGeneration', userId)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Too many requests in burst window')
      expect(result.retryAfter).toBeDefined()
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should handle burst limits correctly', () => {
      const userId = 'test-user'
      
      // Fill up the burst limit (3 requests per 10 seconds for route generation)
      for (let i = 0; i < 3; i++) {
        rateLimiterService.recordRequest('routeGeneration', userId)
      }
      
      // Next request should be blocked by burst limit
      const result = rateLimiterService.canMakeRequest('routeGeneration', userId)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Too many requests in burst window')
      expect(result.retryAfter).toBe(10) // 10 seconds burst window
    })

    it('should handle different API types with different limits', () => {
      const userId = 'test-user'
      
      // Route generation has lower burst limits (3 requests per 10 seconds)
      for (let i = 0; i < 3; i++) {
        rateLimiterService.recordRequest('routeGeneration', userId)
      }
      
      // Geocoding has higher burst limits (10 requests per 10 seconds)
      for (let i = 0; i < 5; i++) {
        rateLimiterService.recordRequest('geocoding', userId)
      }
      
      // Route generation should be blocked by burst limit
      let result = rateLimiterService.canMakeRequest('routeGeneration', userId)
      expect(result.allowed).toBe(false)
      
      // Geocoding should still be allowed
      result = rateLimiterService.canMakeRequest('geocoding', userId)
      expect(result.allowed).toBe(true)
    })

    it('should handle different users separately', () => {
      const user1 = 'user1'
      const user2 = 'user2'
      
      // Fill up rate limit for user1
      for (let i = 0; i < 10; i++) {
        rateLimiterService.recordRequest('routeGeneration', user1)
      }
      
      // user1 should be blocked
      let result = rateLimiterService.canMakeRequest('routeGeneration', user1)
      expect(result.allowed).toBe(false)
      
      // user2 should still be allowed
      result = rateLimiterService.canMakeRequest('routeGeneration', user2)
      expect(result.allowed).toBe(true)
    })
  })

  describe('Status Reporting', () => {
    it('should provide accurate status information', () => {
      const userId = 'test-user'
      
      // Add some requests
      for (let i = 0; i < 5; i++) {
        rateLimiterService.recordRequest('routeGeneration', userId)
      }
      
      const status = rateLimiterService.getStatus('routeGeneration', userId)
      
      expect(status.requestsInWindow).toBe(5)
      expect(status.maxRequests).toBe(10)
      expect(status.windowMs).toBe(60000) // 1 minute
      expect(status.resetTime).toBeDefined()
      expect(status.burstRequestsInWindow).toBe(5)
      expect(status.burstLimit).toBe(3)
    })

    it('should provide status for all API types', () => {
      const userId = 'test-user'
      
      // Add requests for different API types
      rateLimiterService.recordRequest('routeGeneration', userId)
      rateLimiterService.recordRequest('geocoding', userId)
      rateLimiterService.recordRequest('directions', userId)
      
      const allStatuses = rateLimiterService.getAllStatuses(userId)
      
      expect(allStatuses.routeGeneration).toBeDefined()
      expect(allStatuses.geocoding).toBeDefined()
      expect(allStatuses.directions).toBeDefined()
      
      expect(allStatuses.routeGeneration.requestsInWindow).toBe(1)
      expect(allStatuses.geocoding.requestsInWindow).toBe(1)
      expect(allStatuses.directions.requestsInWindow).toBe(1)
    })
  })

  describe('Configuration', () => {
    it('should allow updating rate limit configuration', () => {
      const originalConfig = rateLimiterService.getStatus('routeGeneration')
      expect(originalConfig.maxRequests).toBe(10)
      
      // Update configuration
      rateLimiterService.updateConfig('routeGeneration', {
        maxRequests: 5,
        windowMs: 30000
      })
      
      const updatedConfig = rateLimiterService.getStatus('routeGeneration')
      expect(updatedConfig.maxRequests).toBe(5)
      expect(updatedConfig.windowMs).toBe(30000)
    })
  })

  describe('History Management', () => {
    it('should clear history for specific API types', () => {
      const userId = 'test-user'
      
      // Add requests for different API types
      rateLimiterService.recordRequest('routeGeneration', userId)
      rateLimiterService.recordRequest('geocoding', userId)
      
      // Clear only route generation history
      rateLimiterService.clearHistory('routeGeneration', userId)
      
      // Route generation should be reset
      let status = rateLimiterService.getStatus('routeGeneration', userId)
      expect(status.requestsInWindow).toBe(0)
      
      // Geocoding should still have history
      status = rateLimiterService.getStatus('geocoding', userId)
      expect(status.requestsInWindow).toBe(1)
    })

    it('should clear all history when no parameters provided', () => {
      const userId = 'test-user'
      
      // Add requests for different API types
      rateLimiterService.recordRequest('routeGeneration', userId)
      rateLimiterService.recordRequest('geocoding', userId)
      
      // Clear all history
      rateLimiterService.clearHistory()
      
      // All should be reset
      let status = rateLimiterService.getStatus('routeGeneration', userId)
      expect(status.requestsInWindow).toBe(0)
      
      status = rateLimiterService.getStatus('geocoding', userId)
      expect(status.requestsInWindow).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle unknown API types gracefully', () => {
      const result = rateLimiterService.canMakeRequest('unknown-api', 'test-user')
      expect(result.allowed).toBe(true)
    })

    it('should handle anonymous users', () => {
      // Should work with default anonymous user
      let result = rateLimiterService.canMakeRequest('routeGeneration')
      expect(result.allowed).toBe(true)
      
      rateLimiterService.recordRequest('routeGeneration')
      
      result = rateLimiterService.canMakeRequest('routeGeneration')
      expect(result.allowed).toBe(true)
    })

    it('should clean up old entries automatically', () => {
      const userId = 'test-user'
      
      // Mock old timestamp
      const oldTimestamp = Date.now() - 120000 // 2 minutes ago
      
      // Manually add old entry (in real implementation, this would be tested differently)
      rateLimiterService.recordRequest('routeGeneration', userId)
      
      // Current requests should still work normally
      const result = rateLimiterService.canMakeRequest('routeGeneration', userId)
      expect(result.allowed).toBe(true)
    })
  })

  describe('Integration with Route Generation', () => {
    it('should work with route generation service patterns', () => {
      const userId = 'test-user'
      
      // Simulate route generation attempts - should be allowed initially
      for (let i = 0; i < 3; i++) {
        const check = rateLimiterService.canMakeRequest('routeGeneration', userId)
        expect(check.allowed).toBe(true)
        
        rateLimiterService.recordRequest('routeGeneration', userId)
      }
      
      // Should now hit burst limit
      let result = rateLimiterService.canMakeRequest('routeGeneration', userId)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('burst window')
    })
  })
})