// Hook for route generation with user preferences and location integration

import { useState, useCallback, useEffect } from 'react'
import { routeGenerationService, GeneratedWalk, RoutePreferences, RouteGenerationOptions } from '@/services/routeGeneration'
import { explorationHistoryService } from '@/services/explorationHistory'
import { useUserStore } from '@/store/userStore'

interface UseRouteGenerationOptions {
  autoSaveToHistory?: boolean
  includeExplorationData?: boolean
}

export function useRouteGeneration(options: UseRouteGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedWalk, setGeneratedWalk] = useState<GeneratedWalk | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { userLocation } = useUserStore()
  const { autoSaveToHistory = false, includeExplorationData = true } = options

  const generateRoute = useCallback(async (
    preferences: RoutePreferences,
    routeType: 'circular' | 'out_and_back' | 'linear' = 'circular',
    center?: [number, number]
  ): Promise<GeneratedWalk | null> => {
    const location = center || userLocation
    
    if (!location) {
      setError('Location is required for route generation')
      return null
    }

    setIsGenerating(true)
    setError(null)

    try {
      const generationOptions: RouteGenerationOptions = {
        center: location,
        preferences,
        routeType
      }

      // Include exploration data if enabled
      if (includeExplorationData) {
        const explorationHistory = explorationHistoryService.getExplorationHistory()
        const explorationStats = explorationHistoryService.getExplorationStats()
        
        generationOptions.exploration = {
          previousRoutes: explorationHistory
            .filter(h => h.isGenerated)
            .map(h => ({
              id: h.walkId,
              coordinates: location, // Simplified - in real app would use actual route center
              route: h.route,
              duration: h.duration,
              distance: h.distance,
              difficulty: preferences.difficulty,
              sceneryType: ['urban'],
              description: '',
              estimatedCalories: 0,
              elevation: { gain: 0, loss: 0, highest: 0, lowest: 0 },
              generatedAt: h.startedAt,
              name: 'Previous Walk'
            } as GeneratedWalk)),
          explorationRadius: explorationStats.explorationRadius || 1.0,
          noveltyWeight: 0.7
        }
      }

      const walk = await routeGenerationService.generateRoute(generationOptions)
      
      if (walk) {
        setGeneratedWalk(walk)
        
        // Auto-save to history if enabled
        if (autoSaveToHistory) {
          explorationHistoryService.saveWalkToHistory(walk)
        }
        
        return walk
      } else {
        setError('Failed to generate route. Please try different settings.')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Route generation failed'
      setError(errorMessage)
      console.error('Route generation error:', err)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [userLocation, autoSaveToHistory, includeExplorationData])

  const saveWalkToHistory = useCallback((walk: GeneratedWalk) => {
    explorationHistoryService.saveWalkToHistory(walk)
  }, [])

  const completeWalk = useCallback((walkId: string, rating?: number, notes?: string, actualDuration?: number) => {
    explorationHistoryService.completeWalk(walkId, rating, notes, actualDuration)
  }, [])

  const clearGeneratedWalk = useCallback(() => {
    setGeneratedWalk(null)
    setError(null)
  }, [])

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    generateRoute,
    isGenerating,
    generatedWalk,
    error,
    saveWalkToHistory,
    completeWalk,
    clearGeneratedWalk,
    hasLocation: !!userLocation,
    userLocation
  }
}

// Hook for exploration suggestions based on user's history
export function useExplorationSuggestions() {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const { userLocation } = useUserStore()

  const refreshSuggestions = useCallback(() => {
    if (userLocation) {
      const newSuggestions = explorationHistoryService.generateExplorationSuggestions(userLocation)
      setSuggestions(newSuggestions)
    }
    
    const newStats = explorationHistoryService.getExplorationStats()
    setStats(newStats)
  }, [userLocation])

  useEffect(() => {
    refreshSuggestions()
  }, [refreshSuggestions])

  return {
    suggestions,
    stats,
    refreshSuggestions
  }
}