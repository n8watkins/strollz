// Fallback Map Component for when Mapbox is unavailable
"use client"

import { MapPin, Navigation, Wifi, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Walk {
  id: string
  name: string
  coordinates: [number, number]
  duration: number
  distance: number
  difficulty: 'easy' | 'moderate' | 'challenging'
  sceneryType: string[]
  description: string
  rating: number
  saves: number
  createdBy: string
}

interface FallbackMapProps {
  walks?: Walk[]
  onWalkSelect?: (walk: Walk) => void
  className?: string
  error?: string
  onRetry?: () => void
  showRetry?: boolean
}

export default function FallbackMap({
  walks = [],
  onWalkSelect,
  className = "",
  error = "Map temporarily unavailable",
  onRetry,
  showRetry = true
}: FallbackMapProps) {
  
  const handleWalkClick = (walk: Walk) => {
    onWalkSelect?.(walk)
  }

  const getErrorIcon = () => {
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return <Wifi className="h-12 w-12 text-gray-400" />
    }
    if (error.toLowerCase().includes('quota') || error.toLowerCase().includes('limit')) {
      return <AlertTriangle className="h-12 w-12 text-orange-500" />
    }
    return <MapPin className="h-12 w-12 text-gray-400" />
  }

  const getErrorMessage = () => {
    if (error.toLowerCase().includes('network')) {
      return {
        title: "Connection Issue",
        message: "Unable to load map due to network connectivity issues.",
        suggestion: "Check your internet connection and try again."
      }
    }
    if (error.toLowerCase().includes('quota') || error.toLowerCase().includes('limit')) {
      return {
        title: "Service Temporarily Limited",
        message: "Map service usage limit reached for this month.",
        suggestion: "Maps will be available again next month. You can still browse walks below."
      }
    }
    if (error.toLowerCase().includes('token')) {
      return {
        title: "Configuration Issue",
        message: "Map service is not properly configured.",
        suggestion: "Please check the map service configuration."
      }
    }
    return {
      title: "Map Unavailable",
      message: error,
      suggestion: "You can still browse available walks below."
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg flex flex-col ${className}`}>
      {/* Error Message Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4">
          {getErrorIcon()}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {errorInfo.title}
        </h3>
        
        <p className="text-gray-600 mb-2 max-w-md">
          {errorInfo.message}
        </p>
        
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          {errorInfo.suggestion}
        </p>

        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="mb-6"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}

        {/* Walk List Fallback */}
        {walks.length > 0 && (
          <div className="w-full max-w-md">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Available Walks</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {walks.slice(0, 5).map((walk) => (
                <button
                  key={walk.id}
                  onClick={() => handleWalkClick(walk)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start">
                    <Navigation className="h-4 w-4 text-gray-400 mr-2 mt-1 flex-shrink-0 group-hover:text-green-600" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm group-hover:text-green-800">
                        {walk.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {walk.duration} min • {walk.distance} mi • {walk.difficulty}
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 ml-2">
                      <span>★ {walk.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
              
              {walks.length > 5 && (
                <div className="text-center py-2">
                  <span className="text-sm text-gray-500">
                    +{walks.length - 5} more walks available
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-100 px-4 py-2 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Map service offline</span>
          <span>{walks.length} walks available</span>
        </div>
      </div>
    </div>
  )
}