// Rate Limiter Service
// Prevents API abuse and infinite re-renders by limiting request frequency

interface RateLimitConfig {
  maxRequests: number
  windowMs: number // Time window in milliseconds
  burstLimit?: number // Maximum burst requests
  burstWindowMs?: number // Burst window in milliseconds
}

interface RequestRecord {
  timestamp: number
  count: number
}

class RateLimiterService {
  private requestHistory: Map<string, RequestRecord[]> = new Map()
  
  // Default configurations for different API types
  private configs: Record<string, RateLimitConfig> = {
    routeGeneration: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
      burstLimit: 3,
      burstWindowMs: 10000 // 10 seconds
    },
    geocoding: {
      maxRequests: 50,
      windowMs: 60000, // 1 minute
      burstLimit: 10,
      burstWindowMs: 10000
    },
    directions: {
      maxRequests: 20,
      windowMs: 60000, // 1 minute
      burstLimit: 5,
      burstWindowMs: 10000
    }
  }

  // Check if a request is allowed
  canMakeRequest(apiType: string, userId: string = 'anonymous'): {
    allowed: boolean
    retryAfter?: number // Seconds to wait before retrying
    reason?: string
  } {
    const key = `${apiType}:${userId}`
    const config = this.configs[apiType]
    
    if (!config) {
      return { allowed: true }
    }

    const now = Date.now()
    const history = this.requestHistory.get(key) || []
    
    // Clean old entries
    const cleanHistory = history.filter(record => 
      now - record.timestamp < config.windowMs
    )

    // Check burst limit first
    if (config.burstLimit && config.burstWindowMs) {
      const burstHistory = cleanHistory.filter(record => 
        now - record.timestamp < config.burstWindowMs
      )
      
      const burstCount = burstHistory.reduce((sum, record) => sum + record.count, 0)
      
      if (burstCount >= config.burstLimit) {
        return {
          allowed: false,
          retryAfter: Math.ceil(config.burstWindowMs / 1000),
          reason: `Too many requests in burst window. Max ${config.burstLimit} requests per ${config.burstWindowMs / 1000} seconds.`
        }
      }
    }

    // Check main rate limit
    const totalCount = cleanHistory.reduce((sum, record) => sum + record.count, 0)
    
    if (totalCount >= config.maxRequests) {
      const oldestRecord = cleanHistory.reduce((oldest, record) => 
        record.timestamp < oldest.timestamp ? record : oldest
      )
      
      const retryAfter = Math.ceil((oldestRecord.timestamp + config.windowMs - now) / 1000)
      
      return {
        allowed: false,
        retryAfter,
        reason: `Rate limit exceeded. Max ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`
      }
    }

    return { allowed: true }
  }

  // Record a request
  recordRequest(apiType: string, userId: string = 'anonymous'): void {
    const key = `${apiType}:${userId}`
    const now = Date.now()
    const history = this.requestHistory.get(key) || []
    
    // Add new request
    history.push({
      timestamp: now,
      count: 1
    })

    // Keep only recent entries
    const config = this.configs[apiType]
    if (config) {
      const cleanHistory = history.filter(record => 
        now - record.timestamp < config.windowMs
      )
      this.requestHistory.set(key, cleanHistory)
    }
  }

  // Get current rate limit status
  getStatus(apiType: string, userId: string = 'anonymous'): {
    requestsInWindow: number
    maxRequests: number
    windowMs: number
    resetTime: number
    burstRequestsInWindow?: number
    burstLimit?: number
  } {
    const key = `${apiType}:${userId}`
    const config = this.configs[apiType]
    
    if (!config) {
      return {
        requestsInWindow: 0,
        maxRequests: 0,
        windowMs: 0,
        resetTime: 0
      }
    }

    const now = Date.now()
    const history = this.requestHistory.get(key) || []
    
    const cleanHistory = history.filter(record => 
      now - record.timestamp < config.windowMs
    )

    const requestsInWindow = cleanHistory.reduce((sum, record) => sum + record.count, 0)
    
    const oldestRecord = cleanHistory.length > 0 ? cleanHistory.reduce((oldest, record) => 
      record.timestamp < oldest.timestamp ? record : oldest
    ) : null
    
    const resetTime = oldestRecord ? oldestRecord.timestamp + config.windowMs : now

    const result: any = {
      requestsInWindow,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      resetTime
    }

    // Add burst info if configured
    if (config.burstLimit && config.burstWindowMs) {
      const burstHistory = cleanHistory.filter(record => 
        now - record.timestamp < config.burstWindowMs
      )
      
      result.burstRequestsInWindow = burstHistory.reduce((sum, record) => sum + record.count, 0)
      result.burstLimit = config.burstLimit
    }

    return result
  }

  // Update rate limit configuration
  updateConfig(apiType: string, config: Partial<RateLimitConfig>): void {
    this.configs[apiType] = { ...this.configs[apiType], ...config }
  }

  // Clear rate limit history (for testing or reset)
  clearHistory(apiType?: string, userId?: string): void {
    if (apiType && userId) {
      const key = `${apiType}:${userId}`
      this.requestHistory.delete(key)
    } else if (apiType) {
      // Clear all entries for this API type
      for (const key of this.requestHistory.keys()) {
        if (key.startsWith(`${apiType}:`)) {
          this.requestHistory.delete(key)
        }
      }
    } else {
      // Clear all
      this.requestHistory.clear()
    }
  }

  // Get all current rate limits
  getAllStatuses(userId: string = 'anonymous'): Record<string, any> {
    const statuses: Record<string, any> = {}
    
    for (const apiType of Object.keys(this.configs)) {
      statuses[apiType] = this.getStatus(apiType, userId)
    }
    
    return statuses
  }
}

// Export singleton instance
export const rateLimiterService = new RateLimiterService()

// React hook for easier component integration
export function useRateLimiter(apiType: string, userId: string = 'anonymous') {
  const canMakeRequest = () => rateLimiterService.canMakeRequest(apiType, userId)
  const recordRequest = () => rateLimiterService.recordRequest(apiType, userId)
  const getStatus = () => rateLimiterService.getStatus(apiType, userId)
  
  return {
    canMakeRequest,
    recordRequest,
    getStatus,
    rateLimiter: rateLimiterService
  }
}