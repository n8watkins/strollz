// Exploration History Service
// Tracks user exploration patterns and suggests new areas to discover

import { GeneratedWalk, RoutePoint } from './routeGeneration'

export interface ExplorationArea {
  id: string
  center: [number, number]
  radius: number // In miles
  visitCount: number
  lastVisited: string
  totalDistance: number
  averageRating?: number
  walkIds: string[]
}

export interface ExplorationStats {
  totalWalks: number
  totalDistance: number
  totalDuration: number
  areasExplored: number
  favoriteArea?: ExplorationArea
  explorationRadius: number // How far from home the user typically explores
  noveltyScore: number // 0-1, how much new area they've covered recently
}

export interface ExplorationSuggestion {
  id: string
  center: [number, number]
  name: string
  description: string
  distance: number // Distance from user's location
  noveltyScore: number // How much new territory this would cover
  difficulty: 'easy' | 'moderate' | 'challenging'
  estimatedDuration: number
  highlights: string[]
  type: 'nearby_unexplored' | 'extension' | 'return_favorite' | 'challenge'
}

export interface WalkHistory {
  id: string
  walkId: string
  userId?: string
  startedAt: string
  completedAt?: string
  distance: number
  duration: number // Actual duration in minutes
  route: RoutePoint[]
  rating?: number
  notes?: string
  weather?: string
  companions?: string[]
  photos?: string[]
  isGenerated: boolean
  generationSeed?: string
}

class ExplorationHistoryService {
  private readonly STORAGE_KEY = 'stroll-vibe-exploration-history'
  private readonly AREAS_KEY = 'stroll-vibe-exploration-areas'
  private readonly AREA_RADIUS = 0.3 // Miles - how close walks need to be to count as same area
  
  // Get user's exploration history
  getExplorationHistory(): WalkHistory[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load exploration history:', error)
      return []
    }
  }

  // Save walk to exploration history
  saveWalkToHistory(walk: GeneratedWalk | WalkHistory): void {
    if (typeof window === 'undefined') return

    try {
      const history = this.getExplorationHistory()
      
      // Convert GeneratedWalk to WalkHistory if needed
      const historyEntry: WalkHistory = 'generatedAt' in walk ? {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walkId: walk.id,
        startedAt: new Date().toISOString(),
        distance: walk.distance,
        duration: walk.duration,
        route: walk.route,
        isGenerated: true,
        generationSeed: walk.seed
      } : walk
      
      history.unshift(historyEntry) // Add to beginning
      
      // Keep only last 100 walks
      const trimmedHistory = history.slice(0, 100)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory))
      
      // Update exploration areas
      this.updateExplorationAreas(historyEntry)
      
    } catch (error) {
      console.warn('Failed to save walk to history:', error)
    }
  }

  // Mark walk as completed with rating and notes
  completeWalk(walkId: string, rating?: number, notes?: string, actualDuration?: number): void {
    try {
      const history = this.getExplorationHistory()
      const walkIndex = history.findIndex(w => w.walkId === walkId || w.id === walkId)
      
      if (walkIndex !== -1) {
        history[walkIndex].completedAt = new Date().toISOString()
        if (rating) history[walkIndex].rating = rating
        if (notes) history[walkIndex].notes = notes
        if (actualDuration) history[walkIndex].duration = actualDuration
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
        
        // Update area stats
        this.updateExplorationAreas(history[walkIndex])
      }
    } catch (error) {
      console.warn('Failed to complete walk:', error)
    }
  }

  // Get exploration areas user has visited
  getExplorationAreas(): ExplorationArea[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.AREAS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load exploration areas:', error)
      return []
    }
  }

  private updateExplorationAreas(walk: WalkHistory): void {
    try {
      const areas = this.getExplorationAreas()
      const walkCenter = this.calculateWalkCenter(walk.route)
      
      // Find existing area within radius
      const existingArea = areas.find(area => 
        this.calculateDistance(area.center, walkCenter) <= this.AREA_RADIUS
      )
      
      if (existingArea) {
        // Update existing area
        existingArea.visitCount++
        existingArea.lastVisited = walk.completedAt || walk.startedAt
        existingArea.totalDistance += walk.distance
        existingArea.walkIds.push(walk.walkId)
        
        // Update average rating if walk is rated
        if (walk.rating && existingArea.averageRating) {
          const totalRatings = existingArea.walkIds.length
          existingArea.averageRating = (existingArea.averageRating * (totalRatings - 1) + walk.rating) / totalRatings
        } else if (walk.rating && !existingArea.averageRating) {
          existingArea.averageRating = walk.rating
        }
      } else {
        // Create new area
        const newArea: ExplorationArea = {
          id: `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          center: walkCenter,
          radius: this.AREA_RADIUS,
          visitCount: 1,
          lastVisited: walk.completedAt || walk.startedAt,
          totalDistance: walk.distance,
          averageRating: walk.rating,
          walkIds: [walk.walkId]
        }
        areas.push(newArea)
      }
      
      localStorage.setItem(this.AREAS_KEY, JSON.stringify(areas))
    } catch (error) {
      console.warn('Failed to update exploration areas:', error)
    }
  }

  private calculateWalkCenter(route: RoutePoint[]): [number, number] {
    if (route.length === 0) return [0, 0]
    
    let totalLng = 0
    let totalLat = 0
    
    for (const point of route) {
      totalLng += point.coordinates[0]
      totalLat += point.coordinates[1]
    }
    
    return [totalLng / route.length, totalLat / route.length]
  }

  // Calculate user's exploration statistics
  getExplorationStats(): ExplorationStats {
    const history = this.getExplorationHistory()
    const areas = this.getExplorationAreas()
    
    if (history.length === 0) {
      return {
        totalWalks: 0,
        totalDistance: 0,
        totalDuration: 0,
        areasExplored: 0,
        explorationRadius: 0,
        noveltyScore: 1.0
      }
    }
    
    const totalWalks = history.filter(w => w.completedAt).length
    const totalDistance = history.reduce((sum, w) => sum + w.distance, 0)
    const totalDuration = history.reduce((sum, w) => sum + w.duration, 0)
    
    // Find favorite area (most visits)
    const favoriteArea = areas.length > 0 
      ? areas.reduce((prev, current) => prev.visitCount > current.visitCount ? prev : current)
      : undefined
    
    // Calculate exploration radius (average distance from home/most visited area)
    const homeBase = favoriteArea?.center || (history.length > 0 ? this.calculateWalkCenter(history[0].route) : [0, 0])
    const explorationRadius = this.calculateAverageDistanceFromBase(history, homeBase)
    
    // Calculate novelty score (how much new territory covered in recent walks)
    const noveltyScore = this.calculateNoveltyScore(history, areas)
    
    return {
      totalWalks,
      totalDistance,
      totalDuration,
      areasExplored: areas.length,
      favoriteArea,
      explorationRadius,
      noveltyScore
    }
  }

  private calculateAverageDistanceFromBase(history: WalkHistory[], base: [number, number]): number {
    if (history.length === 0) return 0
    
    const distances = history.map(walk => {
      const walkCenter = this.calculateWalkCenter(walk.route)
      return this.calculateDistance(base, walkCenter)
    })
    
    return distances.reduce((sum, dist) => sum + dist, 0) / distances.length
  }

  private calculateNoveltyScore(history: WalkHistory[], areas: ExplorationArea[]): number {
    if (history.length === 0) return 1.0
    
    // Look at last 10 walks and see how many were in new vs familiar areas
    const recentWalks = history.slice(0, 10)
    let newAreaWalks = 0
    
    for (const walk of recentWalks) {
      const walkCenter = this.calculateWalkCenter(walk.route)
      const inExistingArea = areas.some(area => 
        this.calculateDistance(area.center, walkCenter) <= area.radius &&
        new Date(area.lastVisited) < new Date(walk.startedAt)
      )
      
      if (!inExistingArea) {
        newAreaWalks++
      }
    }
    
    return newAreaWalks / recentWalks.length
  }

  // Generate exploration suggestions based on history
  generateExplorationSuggestions(
    currentLocation: [number, number],
    maxSuggestions: number = 5
  ): ExplorationSuggestion[] {
    const history = this.getExplorationHistory()
    const areas = this.getExplorationAreas()
    const stats = this.getExplorationStats()
    
    const suggestions: ExplorationSuggestion[] = []
    
    // 1. Nearby unexplored areas
    const nearbyUnexplored = this.findNearbyUnexploredAreas(currentLocation, areas)
    suggestions.push(...nearbyUnexplored.slice(0, 2))
    
    // 2. Extensions of favorite areas
    if (stats.favoriteArea) {
      const extensions = this.generateAreaExtensions(stats.favoriteArea, areas)
      suggestions.push(...extensions.slice(0, 1))
    }
    
    // 3. Return to highly rated areas
    const favoriteReturns = this.generateFavoriteReturns(areas, currentLocation)
    suggestions.push(...favoriteReturns.slice(0, 1))
    
    // 4. Challenge suggestions (if user is ready)
    if (stats.totalWalks > 5) {
      const challenges = this.generateChallengeSuggestions(currentLocation, stats)
      suggestions.push(...challenges.slice(0, 1))
    }
    
    // Sort by relevance and return top suggestions
    return suggestions
      .sort((a, b) => b.noveltyScore - a.noveltyScore)
      .slice(0, maxSuggestions)
  }

  private findNearbyUnexploredAreas(
    currentLocation: [number, number], 
    exploredAreas: ExplorationArea[]
  ): ExplorationSuggestion[] {
    const suggestions: ExplorationSuggestion[] = []
    
    // Generate potential exploration points in a grid around current location
    const searchRadius = 2.0 // miles
    const gridSize = 8
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const angle = (i / gridSize) * 2 * Math.PI
        const distance = (j + 1) / gridSize * searchRadius
        
        const targetLng = currentLocation[0] + (distance / 69) * Math.cos(angle)
        const targetLat = currentLocation[1] + (distance / 69) * Math.sin(angle)
        const target: [number, number] = [targetLng, targetLat]
        
        // Check if this area has been explored
        const isExplored = exploredAreas.some(area => 
          this.calculateDistance(area.center, target) <= area.radius
        )
        
        if (!isExplored && distance > 0.2) { // Not too close to current location
          suggestions.push({
            id: `unexplored_${i}_${j}`,
            center: target,
            name: `New Area ${String.fromCharCode(65 + suggestions.length)}`,
            description: `Discover a new neighborhood about ${distance.toFixed(1)} miles away.`,
            distance: distance,
            noveltyScore: 1.0 - (distance / searchRadius) * 0.3, // Closer areas score higher
            difficulty: 'moderate' as const,
            estimatedDuration: 30 + Math.round(distance * 10),
            highlights: ['Unexplored territory', 'New discoveries', 'Adventure'],
            type: 'nearby_unexplored' as const
          })
        }
      }
    }
    
    return suggestions
  }

  private generateAreaExtensions(
    favoriteArea: ExplorationArea, 
    allAreas: ExplorationArea[]
  ): ExplorationSuggestion[] {
    const suggestions: ExplorationSuggestion[] = []
    
    // Generate extension points around the favorite area
    const extensionDistance = favoriteArea.radius + 0.5 // Extend beyond current area
    
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
      const targetLng = favoriteArea.center[0] + (extensionDistance / 69) * Math.cos(angle)
      const targetLat = favoriteArea.center[1] + (extensionDistance / 69) * Math.sin(angle)
      const target: [number, number] = [targetLng, targetLat]
      
      // Check if this extension has been explored
      const isExplored = allAreas.some(area => 
        this.calculateDistance(area.center, target) <= area.radius
      )
      
      if (!isExplored) {
        suggestions.push({
          id: `extension_${favoriteArea.id}_${angle}`,
          center: target,
          name: `Extend Your Favorite Area`,
          description: `Explore new paths around your favorite walking area.`,
          distance: this.calculateDistance(favoriteArea.center, target),
          noveltyScore: 0.8,
          difficulty: 'easy' as const,
          estimatedDuration: 25,
          highlights: ['Familiar starting point', 'Gradual exploration', 'Comfort zone expansion'],
          type: 'extension' as const
        })
      }
    }
    
    return suggestions
  }

  private generateFavoriteReturns(
    areas: ExplorationArea[], 
    currentLocation: [number, number]
  ): ExplorationSuggestion[] {
    return areas
      .filter(area => area.averageRating && area.averageRating >= 4.0)
      .filter(area => {
        const daysSinceLastVisit = (Date.now() - new Date(area.lastVisited).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceLastVisit > 7 // Haven't been there in a week
      })
      .map(area => ({
        id: `return_${area.id}`,
        center: area.center,
        name: `Return to a Favorite`,
        description: `Revisit this highly-rated area you enjoyed before.`,
        distance: this.calculateDistance(currentLocation, area.center),
        noveltyScore: 0.4,
        difficulty: 'easy' as const,
        estimatedDuration: 30,
        highlights: [`${area.averageRating?.toFixed(1)}★ rated`, 'Familiar paths', 'Proven enjoyment'],
        type: 'return_favorite' as const
      }))
      .sort((a, b) => a.distance - b.distance) // Closer first
  }

  private generateChallengeSuggestions(
    currentLocation: [number, number], 
    stats: ExplorationStats
  ): ExplorationSuggestion[] {
    const suggestions: ExplorationSuggestion[] = []
    
    // Suggest exploring further than usual
    const challengeDistance = stats.explorationRadius * 1.5
    
    const angle = Math.random() * 2 * Math.PI
    const targetLng = currentLocation[0] + (challengeDistance / 69) * Math.cos(angle)
    const targetLat = currentLocation[1] + (challengeDistance / 69) * Math.sin(angle)
    const target: [number, number] = [targetLng, targetLat]
    
    suggestions.push({
      id: `challenge_distance`,
      center: target,
      name: `Distance Challenge`,
      description: `Push your exploration boundaries with a longer walk to a new area.`,
      distance: challengeDistance,
      noveltyScore: 0.9,
      difficulty: 'challenging' as const,
      estimatedDuration: 45,
      highlights: ['Personal challenge', 'Distance goal', 'New territory'],
      type: 'challenge' as const
    })
    
    return suggestions
  }

  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    // Haversine formula
    const [lon1, lat1] = point1
    const [lon2, lat2] = point2
    
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Clear all exploration data (for testing or reset)
  clearExplorationData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.AREAS_KEY)
    }
  }

  // Import/export for data portability
  exportExplorationData(): { history: WalkHistory[], areas: ExplorationArea[] } {
    return {
      history: this.getExplorationHistory(),
      areas: this.getExplorationAreas()
    }
  }

  importExplorationData(data: { history: WalkHistory[], areas: ExplorationArea[] }): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.history))
      localStorage.setItem(this.AREAS_KEY, JSON.stringify(data.areas))
    }
  }
}

// Export singleton instance
export const explorationHistoryService = new ExplorationHistoryService()