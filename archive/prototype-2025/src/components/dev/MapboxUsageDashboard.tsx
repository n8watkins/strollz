// Development-only Mapbox Usage Dashboard
// Simple monitoring component for tracking API usage during development

"use client"

import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMapboxUsage, MAPBOX_FREE_LIMITS, WARNING_THRESHOLDS } from '@/services/mapboxUsage'
import { useMapboxConfig } from '@/services/mapboxConfig'
import { geocodingService } from '@/services/geocoding'

interface MapboxUsageDashboardProps {
  className?: string
}

export default function MapboxUsageDashboard({ className = "" }: MapboxUsageDashboardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  const {
    usage,
    percentages,
    warningLevel,
    remainingQuota,
    getDailyUsage
  } = useMapboxUsage()

  const {
    token,
    environment,
    isValid,
    validation,
    setupInstructions
  } = useMapboxConfig()

  const dailyUsage = getDailyUsage(7) // Last 7 days

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'red': return 'text-red-600 bg-red-50'
      case 'orange': return 'text-orange-600 bg-orange-50'
      case 'yellow': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-green-600 bg-green-50'
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatPercentage = (decimal: number) => {
    return `${(decimal * 100).toFixed(1)}%`
  }

  const handleClearCache = () => {
    geocodingService.clearCache()
    alert('Geocoding cache cleared')
  }

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          size="sm"
          className={`${getWarningColor(warningLevel)} border-2 shadow-lg`}
          title="Toggle Mapbox Usage Dashboard"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <Activity className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Dashboard Panel */}
      {isVisible && (
        <div className={`fixed bottom-16 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-40 max-h-[calc(100vh-200px)] overflow-y-auto ${className}`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Mapbox Usage
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowDetails(!showDetails)}
                  size="sm"
                  variant="outline"
                >
                  {showDetails ? 'Hide' : 'Details'}
                </Button>
                <Button
                  onClick={() => setIsVisible(false)}
                  size="sm"
                  variant="outline"
                >
                  ×
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Environment: <span className="font-medium capitalize">{environment}</span>
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Token Status */}
            <div className="flex items-center space-x-2">
              {isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                Token: {isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>

            {/* Monthly Usage Overview */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Monthly Usage</h4>
              
              {/* Map Loads */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Map Loads</span>
                  <span className={percentages.mapLoads >= WARNING_THRESHOLDS.orange ? 'text-orange-600 font-medium' : ''}>
                    {formatNumber(usage.mapLoads)} / {formatNumber(MAPBOX_FREE_LIMITS.mapLoads)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      percentages.mapLoads >= WARNING_THRESHOLDS.red ? 'bg-red-500' :
                      percentages.mapLoads >= WARNING_THRESHOLDS.orange ? 'bg-orange-500' :
                      percentages.mapLoads >= WARNING_THRESHOLDS.yellow ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentages.mapLoads * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {formatPercentage(percentages.mapLoads)} used
                </div>
              </div>

              {/* Geocoding Requests */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Geocoding</span>
                  <span className={percentages.geocodingRequests >= WARNING_THRESHOLDS.orange ? 'text-orange-600 font-medium' : ''}>
                    {formatNumber(usage.geocodingRequests)} / {formatNumber(MAPBOX_FREE_LIMITS.geocodingRequests)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      percentages.geocodingRequests >= WARNING_THRESHOLDS.red ? 'bg-red-500' :
                      percentages.geocodingRequests >= WARNING_THRESHOLDS.orange ? 'bg-orange-500' :
                      percentages.geocodingRequests >= WARNING_THRESHOLDS.yellow ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentages.geocodingRequests * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {formatPercentage(percentages.geocodingRequests)} used
                </div>
              </div>

              {/* Directions Requests */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Directions</span>
                  <span className={percentages.directionsRequests >= WARNING_THRESHOLDS.orange ? 'text-orange-600 font-medium' : ''}>
                    {formatNumber(usage.directionsRequests)} / {formatNumber(MAPBOX_FREE_LIMITS.directionsRequests)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      percentages.directionsRequests >= WARNING_THRESHOLDS.red ? 'bg-red-500' :
                      percentages.directionsRequests >= WARNING_THRESHOLDS.orange ? 'bg-orange-500' :
                      percentages.directionsRequests >= WARNING_THRESHOLDS.yellow ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentages.directionsRequests * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {formatPercentage(percentages.directionsRequests)} used
                </div>
              </div>
            </div>

            {/* Warning Level */}
            {warningLevel !== 'safe' && (
              <div className={`p-3 rounded-lg ${getWarningColor(warningLevel)}`}>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    {warningLevel === 'red' ? 'Critical Usage' :
                     warningLevel === 'orange' ? 'High Usage' : 'Elevated Usage'}
                  </span>
                </div>
                <p className="text-xs mt-1">
                  Consider optimizing API calls or implementing additional caching
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleClearCache}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Cache
              </Button>
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>

            {/* Detailed Information */}
            {showDetails && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                {/* Daily Usage Chart */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Last 7 Days</h5>
                  <div className="space-y-1">
                    {dailyUsage.slice(-7).map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex gap-2 text-gray-700">
                          <span>M:{day.mapLoads}</span>
                          <span>G:{day.geocodingRequests}</span>
                          <span>D:{day.directionsRequests}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cache Stats */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Cache Stats</h5>
                  <div className="text-xs text-gray-600 space-y-1">
                    {(() => {
                      const stats = geocodingService.getCacheStats()
                      return (
                        <>
                          <div>Cached entries: {stats.size}</div>
                          {stats.oldestEntry && (
                            <div>Oldest: {new Date(stats.oldestEntry).toLocaleDateString()}</div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Token Info */}
                {validation.warnings.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Warnings</h5>
                    <div className="text-xs text-orange-600 space-y-1">
                      {validation.warnings.map((warning, index) => (
                        <div key={index}>• {warning}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Setup Instructions (if token invalid) */}
                {!isValid && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Setup</h5>
                    <div className="text-xs text-gray-600 space-y-1">
                      {setupInstructions.steps.slice(0, 3).map((step, index) => (
                        <div key={index}>• {step.replace(/^\d+\.\s/, '')}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}