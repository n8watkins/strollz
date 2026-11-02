// Route Generation Service
// Generates circular walks and exploration routes based on user location and preferences
// Now uses real POI data from OpenStreetMap

import { mapboxConfig } from './mapboxConfig'
import { mapboxUsageService } from './mapboxUsage'
import { realPOIService, RealPOI } from './realPOIService'
import { routeValidationService } from './routeValidationService'
import { rateLimiterService } from './rateLimiter'

export interface RoutePoint {
  coordinates: [number, number] // [longitude, latitude]
  elevation?: number
  instruction?: string
  distance?: number // Distance from previous point in meters
}

export interface GeneratedWalk {
  id: string
  name: string
  coordinates: [number, number] // Starting point
  route: RoutePoint[]
  duration: number // Estimated duration in minutes
  distance: number // Total distance in miles
  difficulty: 'easy' | 'moderate' | 'challenging'
  sceneryType: string[]
  description: string
  estimatedCalories: number
  elevation: {
    gain: number
    loss: number
    highest: number
    lowest: number
  }
  generatedAt: string
  seed?: string // For reproducible generation
}

export interface RoutePreferences {
  duration: number // Desired duration in minutes
  difficulty: 'easy' | 'moderate' | 'challenging'
  avoidBusyRoads: boolean
  preferParks: boolean
  preferWaterfront: boolean
  preferHistoric: boolean
  surfaceType: 'any' | 'paved' | 'trails' | 'mixed'
  includeSteps: boolean
  maxElevationGain: number // In feet
}

export interface RouteGenerationOptions {
  center: [number, number]
  preferences: RoutePreferences
  routeType: 'circular' | 'out_and_back' | 'linear'
  targetDistance?: number // Target distance in miles (overrides duration-based calculation)
  exploration?: {
    previousRoutes: GeneratedWalk[]
    explorationRadius: number // In miles
    noveltyWeight: number // 0-1, how much to favor unexplored areas
  }
}

class RouteGenerationService {
  private readonly MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox'
  private readonly MAPBOX_ISOCHRONE_URL = 'https://api.mapbox.com/isochrones/v1/mapbox'
  private readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
  
  // Walking speeds for different difficulty levels (miles per hour)
  private readonly WALKING_SPEEDS = {
    easy: 2.0,
    moderate: 2.5,
    challenging: 3.0
  }

  // Track recently generated routes for variation
  private recentRoutes: Map<string, GeneratedWalk[]> = new Map()

  // Add route to recent routes tracking
  private addToRecentRoutes(locationKey: string, route: GeneratedWalk): void {
    if (!this.recentRoutes.has(locationKey)) {
      this.recentRoutes.set(locationKey, [])
    }
    
    const routes = this.recentRoutes.get(locationKey)!
    routes.push(route)
    
    // Keep only last 5 routes per location
    if (routes.length > 5) {
      routes.shift()
    }
  }

  // Get recent routes for a location
  private getRecentRoutes(locationKey: string): GeneratedWalk[] {
    return this.recentRoutes.get(locationKey) || []
  }

  // Generate location key for route tracking
  private generateLocationKey(center: [number, number], radius: number = 0.5): string {
    // Round to ~0.1 mile precision for grouping nearby locations
    const precision = 0.001
    const lat = Math.round(center[1] / precision) * precision
    const lng = Math.round(center[0] / precision) * precision
    return `${lat},${lng}`
  }

  async generateRoute(options: RouteGenerationOptions): Promise<GeneratedWalk | null> {
    try {
      const token = mapboxConfig.getToken()
      if (!mapboxConfig.isTokenValid() || !mapboxConfig.canMakeRequest('directions')) {
        throw new Error('Mapbox directions not available')
      }

      // Check for hard stop
      const directionsStatus = mapboxUsageService.getAPIStatus('directionsRequests')
      if (directionsStatus.shouldHardStop) {
        throw new Error(`API quota nearly exhausted (${(directionsStatus.percentage * 100).toFixed(1)}%). Please try again next month.`)
      }

      // Check usage limits
      if (!mapboxUsageService.canMakeRequest('directionsRequests')) {
        throw new Error('Monthly directions quota exceeded')
      }

      // Check rate limiting
      const rateLimitCheck = rateLimiterService.canMakeRequest('routeGeneration')
      if (!rateLimitCheck.allowed) {
        console.error(`Rate limit exceeded: ${rateLimitCheck.reason} Please wait ${rateLimitCheck.retryAfter} seconds.`)
        throw new Error(`Please wait ${rateLimitCheck.retryAfter} seconds before generating another route.`)
      }

      // Record the request attempt
      rateLimiterService.recordRequest('routeGeneration')

      // Generate route based on type
      switch (options.routeType) {
        case 'circular':
          return await this.generateCircularWalk(options)
        case 'out_and_back':
          return await this.generateOutAndBackWalk(options)
        case 'linear':
          return await this.generateLinearWalk(options)
        default:
          throw new Error('Invalid route type')
      }
    } catch (error) {
      console.error('Route generation failed:', error)
      return null
    }
  }

  private async generateCircularWalk(options: RouteGenerationOptions): Promise<GeneratedWalk> {
    const { center, preferences, targetDistance: providedDistance } = options
    const [centerLng, centerLat] = center

    // Use provided target distance or calculate from duration and difficulty
    const targetDistance = providedDistance || this.calculateTargetDistance(preferences.duration, preferences.difficulty)
    
    // Get walking isochrone to understand reachable area
    const reachableArea = await this.getWalkingIsochrone(center, preferences.duration)
    
    // Find points of interest within the area
    const pois = await this.findPointsOfInterest(center, targetDistance / 2, preferences)
    
    // Get recent routes for variation
    const locationKey = this.generateLocationKey(center)
    const recentRoutes = this.getRecentRoutes(locationKey)
    
    // Generate waypoints for a circular route
    const waypoints = await this.generateCircularWaypoints(center, targetDistance, pois, preferences, options.exploration, recentRoutes)
    
    // Validate route is walkable
    const validation = await routeValidationService.validateRoute(waypoints)
    if (!validation.walkable) {
      throw new Error('Generated route is not walkable')
    }
    
    // Get detailed route using Mapbox Directions
    const route = await this.getDetailedRoute(waypoints, 'walking')
    
    // Calculate route metrics
    const routeMetrics = this.calculateRouteMetrics(route, preferences.difficulty)
    
    // Generate walk metadata
    const walk: GeneratedWalk = {
      id: this.generateWalkId(center, preferences),
      name: this.generateWalkName(center, pois, preferences),
      coordinates: center,
      route: route,
      duration: preferences.duration,
      distance: routeMetrics.distance,
      difficulty: preferences.difficulty,
      sceneryType: this.determineSceneryTypes(pois, preferences),
      description: this.generateWalkDescription(routeMetrics, pois, preferences),
      estimatedCalories: this.calculateCalories(routeMetrics.distance, preferences.difficulty, routeMetrics.elevation.gain),
      elevation: routeMetrics.elevation,
      generatedAt: new Date().toISOString(),
      seed: this.generateSeed(center, preferences)
    }

    // Track API usage
    mapboxUsageService.trackDirectionsRequest()
    
    // Track this route for variation (reuse locationKey from above)
    this.addToRecentRoutes(locationKey, walk)
    
    return walk
  }

  private async generateOutAndBackWalk(options: RouteGenerationOptions): Promise<GeneratedWalk> {
    const { center, preferences } = options
    const targetDistance = this.calculateTargetDistance(preferences.duration, preferences.difficulty)
    
    // For out-and-back, we need half the distance as the "out" portion
    const outDistance = targetDistance / 2
    
    // Find an interesting destination point
    const pois = await this.findPointsOfInterest(center, outDistance, preferences)
    const destination = this.selectBestDestination(center, pois, outDistance, preferences)
    
    // Create route: start -> destination -> start
    const waypoints = [center, destination, center]
    const route = await this.getDetailedRoute(waypoints, 'walking')
    
    const routeMetrics = this.calculateRouteMetrics(route, preferences.difficulty)
    
    const destinationPOI: RealPOI = {
      id: 'destination_poi',
      coordinates: destination,
      type: 'viewpoint',
      category: 'recreation',
      name: 'Destination',
      tags: {},
      description: 'Your walk destination'
    }

    const walk: GeneratedWalk = {
      id: this.generateWalkId(center, preferences),
      name: this.generateWalkName(center, [destinationPOI], preferences),
      coordinates: center,
      route: route,
      duration: preferences.duration,
      distance: routeMetrics.distance,
      difficulty: preferences.difficulty,
      sceneryType: this.determineSceneryTypes([destinationPOI], preferences),
      description: this.generateWalkDescription(routeMetrics, [destinationPOI], preferences),
      estimatedCalories: this.calculateCalories(routeMetrics.distance, preferences.difficulty, routeMetrics.elevation.gain),
      elevation: routeMetrics.elevation,
      generatedAt: new Date().toISOString(),
      seed: this.generateSeed(center, preferences)
    }

    mapboxUsageService.trackDirectionsRequest()
    return walk
  }

  private async generateLinearWalk(options: RouteGenerationOptions): Promise<GeneratedWalk> {
    const { center, preferences } = options
    const targetDistance = this.calculateTargetDistance(preferences.duration, preferences.difficulty)
    
    // Find interesting waypoints along a linear path
    const pois = await this.findPointsOfInterest(center, targetDistance, preferences)
    const waypoints = this.createLinearRoute(center, pois, targetDistance, preferences)
    
    const route = await this.getDetailedRoute(waypoints, 'walking')
    const routeMetrics = this.calculateRouteMetrics(route, preferences.difficulty)
    
    const walk: GeneratedWalk = {
      id: this.generateWalkId(center, preferences),
      name: this.generateWalkName(center, pois, preferences),
      coordinates: center,
      route: route,
      duration: preferences.duration,
      distance: routeMetrics.distance,
      difficulty: preferences.difficulty,
      sceneryType: this.determineSceneryTypes(pois, preferences),
      description: this.generateWalkDescription(routeMetrics, pois, preferences),
      estimatedCalories: this.calculateCalories(routeMetrics.distance, preferences.difficulty, routeMetrics.elevation.gain),
      elevation: routeMetrics.elevation,
      generatedAt: new Date().toISOString(),
      seed: this.generateSeed(center, preferences)
    }

    mapboxUsageService.trackDirectionsRequest()
    return walk
  }

  private calculateTargetDistance(duration: number, difficulty: 'easy' | 'moderate' | 'challenging'): number {
    // Base walking speed: easy=2mph, moderate=2.5mph, challenging=3mph
    const speeds = { easy: 2.0, moderate: 2.5, challenging: 3.0 }
    const speed = speeds[difficulty]
    return (duration / 60) * speed // Distance in miles
  }

  private async getWalkingIsochrone(center: [number, number], duration: number): Promise<any> {
    const token = mapboxConfig.getToken()
    const [lng, lat] = center
    
    // Convert duration to seconds (max 60 minutes for walking isochrone)
    const durationSeconds = Math.min(duration * 60, 3600)
    
    const url = `${this.MAPBOX_ISOCHRONE_URL}/walking/${lng},${lat}?contours_minutes=${Math.floor(durationSeconds / 60)}&polygons=true&access_token=${token}`
    
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      return await response.json()
    } catch (error) {
      console.warn('Isochrone API failed, using fallback area calculation')
      return this.createFallbackIsochrone(center, duration)
    }
  }

  private createFallbackIsochrone(center: [number, number], duration: number): any {
    // Fallback: create a simple circular area based on estimated walking distance
    const walkingSpeed = 2.5 // mph
    const radiusMiles = (duration / 60) * walkingSpeed * 0.5 // Conservative estimate
    const radiusDegrees = radiusMiles / 69 // Rough conversion for latitude
    
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [this.createCircleCoordinates(center, radiusDegrees)]
        }
      }]
    }
  }

  private createCircleCoordinates(center: [number, number], radius: number): [number, number][] {
    const [lng, lat] = center
    const points: [number, number][] = []
    
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * 2 * Math.PI
      const x = lng + radius * Math.cos(angle)
      const y = lat + radius * Math.sin(angle)
      points.push([x, y])
    }
    
    return points
  }

  private async findPointsOfInterest(
    center: [number, number], 
    radius: number, 
    preferences: RoutePreferences
  ): Promise<RealPOI[]> {
    try {
      // Use real POI service to get actual places
      const pois = await realPOIService.getPOIsForRoute(center, radius, {
        preferParks: preferences.preferParks,
        preferFood: true, // Always include some food options
        preferCulture: preferences.preferHistoric
      })
      
      return pois
    } catch (error) {
      console.warn('Real POI search failed, using fallback:', error)
      return this.generateFallbackPOIs(center, radius, preferences)
    }
  }

  private generateFallbackPOIs(
    center: [number, number], 
    radius: number, 
    preferences: RoutePreferences
  ): RealPOI[] {
    const [centerLng, centerLat] = center
    const pois: RealPOI[] = []
    
    // Generate fallback POIs based on preferences
    const radiusDegrees = radius / 69 // Rough conversion for latitude
    
    if (preferences.preferParks) {
      pois.push({
        id: 'fallback_park_1',
        coordinates: [centerLng + radiusDegrees * 0.3, centerLat + radiusDegrees * 0.2],
        type: 'park',
        category: 'nature',
        name: 'Local Park Area',
        tags: {},
        description: 'A green space in your neighborhood'
      })
    }
    
    if (preferences.preferWaterfront) {
      pois.push({
        id: 'fallback_water_1',
        coordinates: [centerLng - radiusDegrees * 0.4, centerLat + radiusDegrees * 0.1],
        type: 'water',
        category: 'nature',
        name: 'Waterfront Area',
        tags: {},
        description: 'A scenic water view'
      })
    }
    
    if (preferences.preferHistoric) {
      pois.push({
        id: 'fallback_historic_1',
        coordinates: [centerLng + radiusDegrees * 0.2, centerLat - radiusDegrees * 0.3],
        type: 'monument',
        category: 'culture',
        name: 'Historic Area',
        tags: {},
        description: 'A place of historical interest'
      })
    }
    
    // Always add a general viewpoint
    pois.push({
      id: 'fallback_viewpoint_1',
      coordinates: [centerLng + radiusDegrees * 0.1, centerLat + radiusDegrees * 0.4],
      type: 'viewpoint',
      category: 'recreation',
      name: 'Scenic Point',
      tags: {},
      description: 'A nice place to stop and look around'
    })
    
    return pois
  }

  private async generateCircularWaypoints(
    center: [number, number],
    targetDistance: number,
    pois: RealPOI[],
    preferences: RoutePreferences,
    exploration?: RouteGenerationOptions['exploration'],
    recentRoutes: GeneratedWalk[] = []
  ): Promise<[number, number][]> {
    const waypoints: [number, number][] = [center]
    
    // If exploration mode, avoid previously explored areas
    const avoidAreas = exploration?.previousRoutes?.map(route => route.coordinates) || []
    
    // Add recent routes to avoid areas for variation
    const recentRouteAreas = recentRoutes.map(route => route.coordinates)
    const allAvoidAreas = [...avoidAreas, ...recentRouteAreas]
    
    // Select 3-5 intermediate waypoints
    const numWaypoints = Math.min(pois.length, 4)
    const selectedPOIs = this.selectDiverseWaypoints(center, pois, numWaypoints, preferences, allAvoidAreas)
    
    // Arrange waypoints in a roughly circular pattern
    const arrangedWaypoints = this.arrangeCircularWaypoints(center, selectedPOIs)
    waypoints.push(...arrangedWaypoints)
    
    // Return to start
    waypoints.push(center)
    
    return waypoints
  }

  private selectDiverseWaypoints(
    center: [number, number],
    pois: RealPOI[],
    count: number,
    preferences: RoutePreferences,
    avoidAreas: [number, number][]
  ): [number, number][] {
    // Score POIs based on preferences and diversity
    const scoredPOIs = pois.map(poi => ({
      ...poi,
      score: this.scorePOI(poi, center, preferences, avoidAreas)
    }))
    
    // Sort by score and select top ones
    scoredPOIs.sort((a, b) => b.score - a.score)
    
    return scoredPOIs.slice(0, count).map(poi => poi.coordinates)
  }

  private scorePOI(
    poi: RealPOI,
    center: [number, number],
    preferences: RoutePreferences,
    avoidAreas: [number, number][]
  ): number {
    let score = 1.0
    
    // Distance scoring (prefer moderate distances)
    const distance = this.calculateDistance(center, poi.coordinates)
    const optimalDistance = 0.3 // miles
    score *= 1 - Math.abs(distance - optimalDistance) / optimalDistance
    
    // Type preference scoring
    if (preferences.preferParks && poi.category === 'nature') score *= 1.5
    if (preferences.preferWaterfront && poi.type === 'water') score *= 1.5
    if (preferences.preferHistoric && poi.category === 'culture') score *= 1.5
    
    // Novelty scoring (avoid previously explored areas)
    for (const avoidArea of avoidAreas) {
      const avoidDistance = this.calculateDistance(poi.coordinates, avoidArea)
      if (avoidDistance < 0.2) { // Within 0.2 miles of previous route
        score *= 0.5
      }
    }
    
    return score
  }

  private arrangeCircularWaypoints(center: [number, number], waypoints: [number, number][]): [number, number][] {
    // Sort waypoints by angle from center for a more circular route
    const [centerLng, centerLat] = center
    
    const waypointsWithAngles = waypoints.map(wp => {
      const angle = Math.atan2(wp[1] - centerLat, wp[0] - centerLng)
      return { coordinates: wp, angle }
    })
    
    waypointsWithAngles.sort((a, b) => a.angle - b.angle)
    
    return waypointsWithAngles.map(wp => wp.coordinates)
  }

  private selectBestDestination(
    center: [number, number],
    pois: RealPOI[],
    targetDistance: number,
    preferences: RoutePreferences
  ): [number, number] {
    if (pois.length === 0) {
      // Fallback: create a destination point at target distance
      const angle = Math.random() * 2 * Math.PI
      const radiusDegrees = targetDistance / 69
      return [
        center[0] + radiusDegrees * Math.cos(angle),
        center[1] + radiusDegrees * Math.sin(angle)
      ]
    }
    
    // Find POI closest to target distance
    let bestPOI = pois[0]
    let bestScore = -Infinity
    
    for (const poi of pois) {
      const distance = this.calculateDistance(center, poi.coordinates)
      const distanceScore = 1 - Math.abs(distance - targetDistance) / targetDistance
      const typeScore = this.scorePOI(poi, center, preferences, []).valueOf()
      const totalScore = distanceScore * 0.6 + typeScore * 0.4
      
      if (totalScore > bestScore) {
        bestScore = totalScore
        bestPOI = poi
      }
    }
    
    return bestPOI.coordinates
  }

  private createLinearRoute(
    start: [number, number],
    pois: RealPOI[],
    targetDistance: number,
    preferences: RoutePreferences
  ): [number, number][] {
    const waypoints: [number, number][] = [start]
    
    // Create a roughly linear route through selected POIs
    const sortedPOIs = pois
      .filter(poi => this.calculateDistance(start, poi.coordinates) <= targetDistance)
      .sort((a, b) => this.calculateDistance(start, a.coordinates) - this.calculateDistance(start, b.coordinates))
    
    let currentDistance = 0
    let currentPoint = start
    
    for (const poi of sortedPOIs) {
      const segmentDistance = this.calculateDistance(currentPoint, poi.coordinates)
      if (currentDistance + segmentDistance <= targetDistance * 0.9) {
        waypoints.push(poi.coordinates)
        currentDistance += segmentDistance
        currentPoint = poi.coordinates
      }
    }
    
    return waypoints
  }

  private async getDetailedRoute(waypoints: [number, number][], profile: string = 'walking'): Promise<RoutePoint[]> {
    const token = mapboxConfig.getToken()
    const coordinatesString = waypoints.map(wp => `${wp[0]},${wp[1]}`).join(';')
    
    const url = `${this.MAPBOX_DIRECTIONS_URL}/${profile}/${coordinatesString}?` +
      `geometries=geojson&overview=full&steps=true&access_token=${token}`
    
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        return this.parseRouteGeometry(route)
      }
      
      throw new Error('No route found')
    } catch (error) {
      console.warn('Mapbox Directions failed, creating fallback route')
      return this.createFallbackRoute(waypoints)
    }
  }

  private parseRouteGeometry(route: any): RoutePoint[] {
    const points: RoutePoint[] = []
    
    if (route.geometry && route.geometry.coordinates) {
      const coordinates = route.geometry.coordinates
      let cumulativeDistance = 0
      
      for (let i = 0; i < coordinates.length; i++) {
        const coord = coordinates[i]
        const distance = i > 0 ? this.calculateDistance(coordinates[i-1], coord) * 1609.34 : 0 // Convert miles to meters
        cumulativeDistance += distance
        
        points.push({
          coordinates: [coord[0], coord[1]],
          distance: distance,
          elevation: coord[2] || undefined // Elevation if available
        })
      }
    }
    
    return points
  }

  private createFallbackRoute(waypoints: [number, number][]): RoutePoint[] {
    // Create a simple route by connecting waypoints with straight lines
    const points: RoutePoint[] = []
    
    for (let i = 0; i < waypoints.length; i++) {
      const coord = waypoints[i]
      const distance = i > 0 ? this.calculateDistance(waypoints[i-1], coord) * 1609.34 : 0
      
      points.push({
        coordinates: coord,
        distance: distance
      })
      
      // Add intermediate points for smoother visualization
      if (i < waypoints.length - 1) {
        const next = waypoints[i + 1]
        const intermediatePoints = this.interpolatePoints(coord, next, 5)
        points.push(...intermediatePoints.map(pt => ({
          coordinates: pt,
          distance: this.calculateDistance(coord, pt) * 1609.34 / intermediatePoints.length
        })))
      }
    }
    
    return points
  }

  private interpolatePoints(start: [number, number], end: [number, number], count: number): [number, number][] {
    const points: [number, number][] = []
    
    for (let i = 1; i < count; i++) {
      const ratio = i / count
      const lng = start[0] + (end[0] - start[0]) * ratio
      const lat = start[1] + (end[1] - start[1]) * ratio
      points.push([lng, lat])
    }
    
    return points
  }

  private calculateRouteMetrics(route: RoutePoint[], difficulty: string) {
    let totalDistance = 0
    let elevationGain = 0
    let elevationLoss = 0
    let highestPoint = -Infinity
    let lowestPoint = Infinity
    
    for (let i = 0; i < route.length; i++) {
      const point = route[i]
      
      if (point.distance) {
        totalDistance += point.distance
      }
      
      if (point.elevation !== undefined) {
        if (point.elevation > highestPoint) highestPoint = point.elevation
        if (point.elevation < lowestPoint) lowestPoint = point.elevation
        
        if (i > 0 && route[i-1].elevation !== undefined) {
          const elevationChange = point.elevation - route[i-1].elevation!
          if (elevationChange > 0) {
            elevationGain += elevationChange
          } else {
            elevationLoss += Math.abs(elevationChange)
          }
        }
      }
    }
    
    // Convert meters to miles
    const distanceInMiles = totalDistance * 0.000621371
    
    return {
      distance: distanceInMiles,
      elevation: {
        gain: elevationGain * 3.28084, // Convert to feet
        loss: elevationLoss * 3.28084,
        highest: highestPoint === -Infinity ? 0 : highestPoint * 3.28084,
        lowest: lowestPoint === Infinity ? 0 : lowestPoint * 3.28084
      }
    }
  }

  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    // Haversine formula for distance calculation
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

  private calculateCalories(distance: number, difficulty: string, elevationGain: number): number {
    // Base calories: ~50 calories per mile for average person
    let calories = distance * 50
    
    // Adjust for difficulty
    const difficultyMultipliers = { easy: 0.9, moderate: 1.0, challenging: 1.2 }
    calories *= difficultyMultipliers[difficulty as keyof typeof difficultyMultipliers] || 1.0
    
    // Add calories for elevation gain (10 calories per 100 feet of gain)
    calories += (elevationGain / 100) * 10
    
    return Math.round(calories)
  }

  private generateWalkId(center: [number, number], preferences: RoutePreferences): string {
    const timestamp = Date.now()
    const locationHash = Math.abs(center[0] * 1000 + center[1] * 1000) % 10000
    const prefHash = Math.abs(preferences.duration + preferences.difficulty.length) % 100
    return `walk_${locationHash}_${prefHash}_${timestamp}`
  }

  private generateWalkName(
    center: [number, number], 
    pois: RealPOI[],
    preferences: RoutePreferences
  ): string {
    const difficultyNames = {
      easy: 'Leisurely',
      moderate: 'Scenic',
      challenging: 'Adventurous'
    }
    
    const baseName = difficultyNames[preferences.difficulty]
    
    if (pois.length > 0) {
      const mainPOI = pois[0]
      if (mainPOI.category === 'nature') return `${baseName} Nature Walk`
      if (mainPOI.category === 'food') return `${baseName} Foodie Stroll`
      if (mainPOI.category === 'culture') return `${baseName} Cultural Walk`
      if (mainPOI.name && mainPOI.name !== 'Unknown Place') {
        return `${baseName} Walk via ${mainPOI.name}`
      }
    }
    
    return `${baseName} Neighborhood Walk`
  }

  private determineSceneryTypes(
    pois: RealPOI[],
    preferences: RoutePreferences
  ): string[] {
    const types: string[] = ['urban'] // Default
    
    for (const poi of pois) {
      if (poi.category === 'nature' && !types.includes('nature')) {
        types.push('nature')
      }
      if (poi.type === 'water' && !types.includes('coastal')) {
        types.push('coastal')
      }
      if (poi.category === 'culture' && !types.includes('historic')) {
        types.push('historic')
      }
      if (poi.category === 'food' && !types.includes('culinary')) {
        types.push('culinary')
      }
    }
    
    return types
  }

  private generateWalkDescription(
    metrics: { distance: number, elevation: any },
    pois: RealPOI[],
    preferences: RoutePreferences
  ): string {
    let description = `A ${preferences.difficulty} ${Math.round(metrics.distance * 10) / 10}-mile walk`
    
    if (metrics.elevation.gain > 50) {
      description += ` with ${Math.round(metrics.elevation.gain)} feet of elevation gain`
    }
    
    if (pois.length > 0) {
      const poiCategories = [...new Set(pois.map(poi => poi.category))]
      const poiNames = pois.filter(poi => poi.name && poi.name !== 'Unknown Place').map(poi => poi.name)
      
      if (poiCategories.includes('nature')) description += ', passing through green spaces'
      if (poiCategories.includes('food')) description += ', with cafes and restaurants along the way'
      if (poiCategories.includes('culture')) description += ', showcasing local culture and history'
      
      if (poiNames.length > 0) {
        description += `. Highlights include: ${poiNames.slice(0, 3).join(', ')}`
      }
    }
    
    description += '. Perfect for exploring your neighborhood and discovering new places.'
    
    return description
  }

  private generateSeed(center: [number, number], preferences: RoutePreferences): string {
    // Create a semi-random seed for variation while maintaining some consistency
    const centerStr = `${center[0].toFixed(4)},${center[1].toFixed(4)}`
    const prefStr = `${preferences.duration}_${preferences.difficulty}_${preferences.preferParks ? 'p' : ''}${preferences.preferWaterfront ? 'w' : ''}${preferences.preferHistoric ? 'h' : ''}`
    
    // Add timestamp-based variation to ensure different routes
    const timestamp = Date.now()
    const variation = Math.floor(timestamp / 60000) % 100 // Changes every minute
    
    return btoa(`${centerStr}_${prefStr}_${variation}`).slice(0, 16)
  }
}

// Export singleton instance
export const routeGenerationService = new RouteGenerationService()