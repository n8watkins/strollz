// Real POI Service using OpenStreetMap Overpass API
// Queries actual points of interest to create meaningful walking routes

export interface RealPOI {
  id: string
  name: string
  coordinates: [number, number] // [longitude, latitude]
  type: POIType
  category: POICategory
  tags: Record<string, string>
  distance?: number // Distance from query center in meters
  rating?: number
  description?: string
  openingHours?: string
  website?: string
  phone?: string
  amenities?: string[]
}

export type POIType = 
  | 'park' | 'garden' | 'playground' | 'sports_centre'
  | 'cafe' | 'restaurant' | 'bar' | 'fast_food' | 'ice_cream'
  | 'museum' | 'gallery' | 'theatre' | 'library' | 'monument'
  | 'viewpoint' | 'artwork' | 'fountain' | 'memorial'
  | 'shop' | 'market' | 'pharmacy' | 'bank'
  | 'church' | 'temple' | 'mosque' | 'synagogue'
  | 'hospital' | 'school' | 'university'
  | 'water' | 'river' | 'lake' | 'beach'

export type POICategory = 
  | 'nature' | 'food' | 'culture' | 'recreation' | 'shopping' | 'services' | 'religious' | 'education'

export interface POIQuery {
  center: [number, number]
  radius: number // in meters
  categories?: POICategory[]
  types?: POIType[]
  limit?: number
  includeRatings?: boolean
}

export interface POISearchResult {
  pois: RealPOI[]
  totalFound: number
  queryTime: number
  source: 'overpass' | 'cache'
}

class RealPOIService {
  private readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
  private readonly CACHE_KEY = 'stroll-vibe-poi-cache'
  private readonly CACHE_DURATION = 1000 * 60 * 30 // 30 minutes
  private cache: Map<string, { data: POISearchResult; timestamp: number }> = new Map()

  // Mapping of our categories to OpenStreetMap tags
  private readonly CATEGORY_MAPPINGS: Record<POICategory, string[]> = {
    nature: [
      'leisure=park',
      'leisure=garden',
      'leisure=nature_reserve',
      'leisure=playground',
      'natural=water',
      'natural=beach',
      'landuse=forest',
      'landuse=meadow'
    ],
    food: [
      'amenity=cafe',
      'amenity=restaurant',
      'amenity=bar',
      'amenity=fast_food',
      'amenity=ice_cream',
      'amenity=food_court',
      'amenity=pub'
    ],
    culture: [
      'tourism=museum',
      'tourism=gallery',
      'amenity=theatre',
      'amenity=library',
      'historic=monument',
      'historic=memorial',
      'tourism=artwork',
      'amenity=fountain'
    ],
    recreation: [
      'leisure=sports_centre',
      'leisure=fitness_centre',
      'leisure=swimming_pool',
      'leisure=bowling_alley',
      'tourism=viewpoint',
      'leisure=park'
    ],
    shopping: [
      'shop=*',
      'amenity=marketplace',
      'amenity=pharmacy',
      'amenity=bank'
    ],
    services: [
      'amenity=hospital',
      'amenity=clinic',
      'amenity=post_office',
      'amenity=police',
      'amenity=fire_station'
    ],
    religious: [
      'amenity=place_of_worship',
      'building=church',
      'building=mosque',
      'building=synagogue',
      'building=temple'
    ],
    education: [
      'amenity=school',
      'amenity=university',
      'amenity=college',
      'amenity=kindergarten'
    ]
  }

  async searchPOIs(query: POIQuery): Promise<POISearchResult> {
    const cacheKey = this.generateCacheKey(query)
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return { ...cached, source: 'cache' }
    }

    const startTime = Date.now()
    
    try {
      // Build Overpass query
      const overpassQuery = this.buildOverpassQuery(query)
      
      // Execute query
      const response = await fetch(this.OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      })

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Parse response
      const pois = this.parseOverpassResponse(data, query.center)
      
      // Sort by distance and limit results
      const sortedPOIs = pois
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, query.limit || 50)

      const result: POISearchResult = {
        pois: sortedPOIs,
        totalFound: pois.length,
        queryTime: Date.now() - startTime,
        source: 'overpass'
      }

      // Cache result
      this.setCache(cacheKey, result)

      return result
    } catch (error) {
      console.error('POI search failed:', error)
      
      // Return empty result on error
      return {
        pois: [],
        totalFound: 0,
        queryTime: Date.now() - startTime,
        source: 'overpass'
      }
    }
  }

  private buildOverpassQuery(query: POIQuery): string {
    const { center, radius, categories = ['nature', 'food', 'culture'] } = query
    const [lng, lat] = center

    // Build tag filters based on categories
    const tagFilters: string[] = []
    for (const category of categories) {
      if (this.CATEGORY_MAPPINGS[category]) {
        tagFilters.push(...this.CATEGORY_MAPPINGS[category])
      }
    }

    // Build the Overpass QL query
    const filters = tagFilters.map(tag => `  nwr[${tag}](around:${radius},${lat},${lng});`).join('\n')
    
    return `
[out:json][timeout:25];
(
${filters}
);
out center meta;
    `.trim()
  }

  private parseOverpassResponse(data: any, center: [number, number]): RealPOI[] {
    if (!data.elements) return []

    return data.elements
      .map((element: any) => this.parseOverpassElement(element, center))
      .filter((poi: RealPOI | null) => poi !== null) as RealPOI[]
  }

  private parseOverpassElement(element: any, center: [number, number]): RealPOI | null {
    // Get coordinates
    let coordinates: [number, number]
    if (element.type === 'node') {
      coordinates = [element.lon, element.lat]
    } else if (element.center) {
      coordinates = [element.center.lon, element.center.lat]
    } else {
      return null // Skip elements without coordinates
    }

    // Get name
    const name = element.tags?.name || element.tags?.brand || this.generateNameFromTags(element.tags)
    if (!name) return null

    // Determine type and category
    const { type, category } = this.categorizeElement(element.tags)

    // Calculate distance
    const distance = this.calculateDistance(center, coordinates)

    return {
      id: `osm_${element.type}_${element.id}`,
      name,
      coordinates,
      type,
      category,
      tags: element.tags || {},
      distance,
      description: this.generateDescription(element.tags, type),
      openingHours: element.tags?.opening_hours,
      website: element.tags?.website,
      phone: element.tags?.phone,
      amenities: this.extractAmenities(element.tags)
    }
  }

  private categorizeElement(tags: Record<string, string>): { type: POIType; category: POICategory } {
    // Check amenity tags
    if (tags.amenity) {
      switch (tags.amenity) {
        case 'cafe':
        case 'restaurant':
        case 'bar':
        case 'fast_food':
        case 'ice_cream':
        case 'pub':
          return { type: tags.amenity as POIType, category: 'food' }
        case 'theatre':
        case 'library':
          return { type: tags.amenity as POIType, category: 'culture' }
        case 'place_of_worship':
          return { type: 'church', category: 'religious' }
        case 'hospital':
        case 'school':
        case 'university':
          return { type: tags.amenity as POIType, category: 'services' }
        case 'marketplace':
        case 'pharmacy':
        case 'bank':
          return { type: tags.amenity as POIType, category: 'shopping' }
        default:
          return { type: tags.amenity as POIType, category: 'services' }
      }
    }

    // Check leisure tags
    if (tags.leisure) {
      switch (tags.leisure) {
        case 'park':
        case 'garden':
        case 'playground':
          return { type: tags.leisure as POIType, category: 'nature' }
        case 'sports_centre':
          return { type: tags.leisure as POIType, category: 'recreation' }
        default:
          return { type: tags.leisure as POIType, category: 'recreation' }
      }
    }

    // Check tourism tags
    if (tags.tourism) {
      switch (tags.tourism) {
        case 'museum':
        case 'gallery':
        case 'artwork':
          return { type: tags.tourism as POIType, category: 'culture' }
        case 'viewpoint':
          return { type: 'viewpoint', category: 'recreation' }
        default:
          return { type: tags.tourism as POIType, category: 'culture' }
      }
    }

    // Check shop tags
    if (tags.shop) {
      return { type: 'shop', category: 'shopping' }
    }

    // Check historic tags
    if (tags.historic) {
      return { type: tags.historic as POIType, category: 'culture' }
    }

    // Check natural tags
    if (tags.natural) {
      return { type: 'water', category: 'nature' }
    }

    // Default fallback
    return { type: 'park', category: 'nature' }
  }

  private generateNameFromTags(tags: Record<string, string>): string {
    // Try various name fields
    return tags.name || tags.brand || tags.operator || tags.amenity || tags.shop || tags.leisure || 'Unknown Place'
  }

  private generateDescription(tags: Record<string, string>, type: POIType): string {
    const descriptions: Record<POIType, string> = {
      park: 'A green space perfect for walking and relaxation',
      garden: 'A beautiful garden with plants and peaceful paths',
      playground: 'A family-friendly area with play equipment',
      sports_centre: 'A facility for sports and fitness activities',
      cafe: 'A cozy spot for coffee and light meals',
      restaurant: 'A dining establishment with local cuisine',
      bar: 'A place for drinks and social gathering',
      fast_food: 'Quick and convenient dining option',
      ice_cream: 'Sweet treats and frozen desserts',
      museum: 'A cultural institution with exhibits and collections',
      gallery: 'An art space featuring local and international works',
      theatre: 'A venue for performances and entertainment',
      library: 'A quiet space for reading and learning',
      monument: 'A historical landmark worth visiting',
      viewpoint: 'A scenic spot with beautiful views',
      artwork: 'Public art installation or sculpture',
      fountain: 'A decorative water feature',
      memorial: 'A place of remembrance and reflection',
      shop: 'A retail establishment for shopping',
      market: 'A local marketplace with vendors',
      pharmacy: 'A health and wellness store',
      bank: 'Financial services and ATM',
      church: 'A place of worship and spiritual reflection',
      temple: 'A sacred space for prayer and meditation',
      mosque: 'A place of Islamic worship',
      synagogue: 'A Jewish place of worship',
      hospital: 'A medical facility',
      school: 'An educational institution',
      university: 'A higher education campus',
      water: 'A natural water feature',
      river: 'A flowing waterway',
      lake: 'A peaceful body of water',
      beach: 'A sandy or rocky shoreline'
    }

    return descriptions[type] || 'An interesting place to visit'
  }

  private extractAmenities(tags: Record<string, string>): string[] {
    const amenities: string[] = []
    
    if (tags.wheelchair === 'yes') amenities.push('Wheelchair accessible')
    if (tags.wifi === 'yes' || tags.internet_access === 'wlan') amenities.push('Free WiFi')
    if (tags.outdoor_seating === 'yes') amenities.push('Outdoor seating')
    if (tags.takeaway === 'yes') amenities.push('Takeaway available')
    if (tags.toilets === 'yes') amenities.push('Restrooms')
    if (tags.parking === 'yes') amenities.push('Parking available')
    if (tags.air_conditioning === 'yes') amenities.push('Air conditioning')

    return amenities
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

  private generateCacheKey(query: POIQuery): string {
    const { center, radius, categories = [], types = [] } = query
    return `${center[0]},${center[1]}_${radius}_${categories.sort().join(',')}_${types.sort().join(',')}`
  }

  private getFromCache(key: string): POISearchResult | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: POISearchResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Clean up old cache entries
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }

  // Helper method to get POIs for route generation
  async getPOIsForRoute(
    center: [number, number], 
    radiusKm: number, 
    preferences: { preferParks?: boolean; preferFood?: boolean; preferCulture?: boolean }
  ): Promise<RealPOI[]> {
    const categories: POICategory[] = []
    
    if (preferences.preferParks) categories.push('nature')
    if (preferences.preferFood) categories.push('food')
    if (preferences.preferCulture) categories.push('culture')
    
    // Default to nature if no preferences
    if (categories.length === 0) categories.push('nature', 'culture')

    const result = await this.searchPOIs({
      center,
      radius: radiusKm * 1000, // Convert km to meters
      categories,
      limit: 20
    })

    return result.pois
  }
}

export const realPOIService = new RealPOIService()