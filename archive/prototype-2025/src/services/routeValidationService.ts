// Route Validation Service
// Ensures generated routes are walkable and safe using real mapping data

import { mapboxConfig } from './mapboxConfig'
import { mapboxUsageService } from './mapboxUsage'

export interface RouteValidationResult {
  isValid: boolean
  walkable: boolean
  distance: number // in meters
  duration: number // in minutes
  elevation: {
    gain: number
    loss: number
    max: number
    min: number
  }
  warnings: string[]
  errors: string[]
  surface: 'paved' | 'unpaved' | 'mixed' | 'unknown'
  accessibility: 'good' | 'moderate' | 'limited' | 'unknown'
}

export interface RouteSegment {
  start: [number, number]
  end: [number, number]
  distance: number
  duration: number
  instruction: string
  maneuver: string
  surface?: string
  grade?: number
}

export interface WalkableRoute {
  segments: RouteSegment[]
  totalDistance: number
  totalDuration: number
  isComplete: boolean
  alternatives?: WalkableRoute[]
}

class RouteValidationService {
  private readonly MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/walking'
  private readonly MAPBOX_MATRIX_URL = 'https://api.mapbox.com/directions-matrix/v1/mapbox/walking'
  
  // Walking speed assumptions (meters per minute)
  private readonly WALKING_SPEEDS = {
    easy: 67,     // 4 km/h
    moderate: 83, // 5 km/h
    challenging: 100 // 6 km/h
  }

  // Maximum acceptable distances for different route types
  private readonly MAX_SEGMENT_DISTANCES = {
    urban: 2000,    // 2km max between POIs in urban areas
    suburban: 3000, // 3km max in suburban areas
    rural: 5000     // 5km max in rural areas
  }

  async validateRoute(waypoints: [number, number][]): Promise<RouteValidationResult> {
    if (waypoints.length < 2) {
      return {
        isValid: false,
        walkable: false,
        distance: 0,
        duration: 0,
        elevation: { gain: 0, loss: 0, max: 0, min: 0 },
        warnings: [],
        errors: ['Route must have at least 2 waypoints'],
        surface: 'unknown',
        accessibility: 'unknown'
      }
    }

    try {
      // Check if we can make the API request
      if (!mapboxConfig.canMakeRequest('directions') || !mapboxUsageService.canMakeRequest('directionsRequests')) {
        return this.createFallbackValidation(waypoints)
      }

      // Get detailed route from Mapbox
      const route = await this.getDetailedRoute(waypoints)
      
      if (!route) {
        return {
          isValid: false,
          walkable: false,
          distance: 0,
          duration: 0,
          elevation: { gain: 0, loss: 0, max: 0, min: 0 },
          warnings: [],
          errors: ['No walkable route found between these points'],
          surface: 'unknown',
          accessibility: 'unknown'
        }
      }

      // Track API usage
      mapboxUsageService.trackDirectionsRequest()

      // Validate the route
      return this.analyzeRoute(route, waypoints)
    } catch (error) {
      console.error('Route validation failed:', error)
      return this.createFallbackValidation(waypoints)
    }
  }

  private async getDetailedRoute(waypoints: [number, number][]): Promise<any> {
    const token = mapboxConfig.getToken()
    const coordinates = waypoints.map(wp => `${wp[0]},${wp[1]}`).join(';')
    
    const url = `${this.MAPBOX_DIRECTIONS_URL}/${coordinates}?` +
      `geometries=geojson&overview=full&steps=true&` +
      `annotations=distance,duration,speed&` +
      `access_token=${token}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`)
    }

    const data = await response.json()
    return data.routes?.[0] || null
  }

  private analyzeRoute(route: any, originalWaypoints: [number, number][]): RouteValidationResult {
    const warnings: string[] = []
    const errors: string[] = []

    // Basic metrics
    const distance = route.distance || 0
    const duration = route.duration ? route.duration / 60 : 0 // Convert to minutes

    // Analyze elevation if available
    const elevation = this.analyzeElevation(route)
    
    // Analyze surface and accessibility
    const surface = this.analyzeSurface(route)
    const accessibility = this.analyzeAccessibility(route)

    // Check for potential issues
    this.checkRouteWarnings(route, warnings, errors)

    // Determine if route is valid and walkable
    const isValid = errors.length === 0
    const walkable = isValid && distance > 0 && duration > 0

    return {
      isValid,
      walkable,
      distance,
      duration,
      elevation,
      warnings,
      errors,
      surface,
      accessibility
    }
  }

  private analyzeElevation(route: any): RouteValidationResult['elevation'] {
    const elevation = { gain: 0, loss: 0, max: 0, min: 0 }

    // If route has elevation data, analyze it
    if (route.legs) {
      let currentElevation = 0
      let maxElevation = 0
      let minElevation = 0

      for (const leg of route.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            if (step.geometry?.coordinates) {
              for (const coord of step.geometry.coordinates) {
                if (coord[2] !== undefined) { // Has elevation
                  const elev = coord[2]
                  
                  if (elev > maxElevation) maxElevation = elev
                  if (elev < minElevation) minElevation = elev
                  
                  const change = elev - currentElevation
                  if (change > 0) {
                    elevation.gain += change
                  } else {
                    elevation.loss += Math.abs(change)
                  }
                  
                  currentElevation = elev
                }
              }
            }
          }
        }
      }

      elevation.max = maxElevation
      elevation.min = minElevation
    }

    return elevation
  }

  private analyzeSurface(route: any): RouteValidationResult['surface'] {
    // Analyze route steps for surface information
    let pavedSegments = 0
    let totalSegments = 0

    if (route.legs) {
      for (const leg of route.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            totalSegments++
            
            // Check for paved surface indicators in the step data
            const instruction = step.maneuver?.instruction?.toLowerCase() || ''
            const name = step.name?.toLowerCase() || ''
            
            if (instruction.includes('sidewalk') || 
                instruction.includes('path') || 
                name.includes('street') || 
                name.includes('avenue') || 
                name.includes('boulevard')) {
              pavedSegments++
            }
          }
        }
      }
    }

    if (totalSegments === 0) return 'unknown'
    
    const pavedRatio = pavedSegments / totalSegments
    if (pavedRatio > 0.8) return 'paved'
    if (pavedRatio > 0.4) return 'mixed'
    return 'unpaved'
  }

  private analyzeAccessibility(route: any): RouteValidationResult['accessibility'] {
    // Analyze route for accessibility features
    let accessibleSegments = 0
    let totalSegments = 0

    if (route.legs) {
      for (const leg of route.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            totalSegments++
            
            // Check for accessibility indicators
            const instruction = step.maneuver?.instruction?.toLowerCase() || ''
            
            if (instruction.includes('sidewalk') || 
                instruction.includes('ramp') || 
                !instruction.includes('stairs') &&
                !instruction.includes('steep')) {
              accessibleSegments++
            }
          }
        }
      }
    }

    if (totalSegments === 0) return 'unknown'
    
    const accessibleRatio = accessibleSegments / totalSegments
    if (accessibleRatio > 0.8) return 'good'
    if (accessibleRatio > 0.5) return 'moderate'
    return 'limited'
  }

  private checkRouteWarnings(route: any, warnings: string[], errors: string[]): void {
    const distance = route.distance || 0
    const duration = route.duration || 0

    // Check for overly long segments
    if (distance > this.MAX_SEGMENT_DISTANCES.urban) {
      warnings.push('Route contains long segments between points of interest')
    }

    // Check for unrealistic duration
    const expectedDuration = distance / this.WALKING_SPEEDS.moderate
    if (duration > expectedDuration * 2) {
      warnings.push('Route may be difficult to walk due to terrain or obstacles')
    }

    // Check for very short routes
    if (distance < 500) {
      warnings.push('Route is very short - consider extending for a better walking experience')
    }

    // Check for missing route data
    if (!route.legs || route.legs.length === 0) {
      errors.push('Route data is incomplete or corrupted')
    }
  }

  private createFallbackValidation(waypoints: [number, number][]): RouteValidationResult {
    // Calculate straight-line distance as fallback
    let totalDistance = 0
    for (let i = 1; i < waypoints.length; i++) {
      totalDistance += this.calculateDistance(waypoints[i-1], waypoints[i])
    }

    const duration = totalDistance / this.WALKING_SPEEDS.moderate

    return {
      isValid: true,
      walkable: true, // Assume walkable for fallback
      distance: totalDistance,
      duration,
      elevation: { gain: 0, loss: 0, max: 0, min: 0 },
      warnings: ['Route validation using fallback method - actual walkability not verified'],
      errors: [],
      surface: 'unknown',
      accessibility: 'unknown'
    }
  }

  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const [lon1, lat1] = point1
    const [lon2, lat2] = point2
    
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  // Helper method to check if a route between two points is walkable
  async isWalkable(start: [number, number], end: [number, number]): Promise<boolean> {
    const validation = await this.validateRoute([start, end])
    return validation.walkable
  }

  // Helper method to get the best route between multiple waypoints
  async getBestRoute(waypoints: [number, number][]): Promise<WalkableRoute | null> {
    const validation = await this.validateRoute(waypoints)
    
    if (!validation.walkable) {
      return null
    }

    // For now, return a simple route structure
    // In a full implementation, this would parse the detailed Mapbox response
    return {
      segments: this.createBasicSegments(waypoints),
      totalDistance: validation.distance,
      totalDuration: validation.duration,
      isComplete: true
    }
  }

  private createBasicSegments(waypoints: [number, number][]): RouteSegment[] {
    const segments: RouteSegment[] = []
    
    for (let i = 1; i < waypoints.length; i++) {
      const start = waypoints[i-1]
      const end = waypoints[i]
      const distance = this.calculateDistance(start, end)
      
      segments.push({
        start,
        end,
        distance,
        duration: distance / this.WALKING_SPEEDS.moderate,
        instruction: `Walk to next point`,
        maneuver: 'straight'
      })
    }

    return segments
  }
}

export const routeValidationService = new RouteValidationService()