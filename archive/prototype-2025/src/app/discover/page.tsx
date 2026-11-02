"use client"

import { useState, useEffect } from 'react'
import { Search, Clock, MapPin, Star, Bookmark, Heart, Navigation, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MapComponent from '@/components/Map'
import Navbar from '@/components/Navbar'
import { useUserStore } from '@/store/userStore'
import { geocodingService, GeocodingResult, GeocodingError } from '@/services/geocoding'

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
  imageUrl?: string
  createdBy: string
}

// Mock data for demonstration - diverse locations
const mockWalks: Walk[] = [
  {
    id: '1',
    name: 'Golden Gate Park Loop',
    coordinates: [-122.4194, 37.7749], // San Francisco
    duration: 45,
    distance: 2.8,
    difficulty: 'easy',
    sceneryType: ['park', 'nature'],
    description: 'Beautiful loop through Golden Gate Park with gardens and peaceful paths.',
    rating: 4.8,
    saves: 234,
    createdBy: 'Sarah M.'
  },
  {
    id: '2',
    name: 'Brooklyn Bridge Walk',
    coordinates: [-73.9969, 40.7061], // New York City
    duration: 30,
    distance: 1.1,
    difficulty: 'easy',
    sceneryType: ['urban', 'historic'],
    description: 'Iconic walk across Brooklyn Bridge with stunning city skyline views.',
    rating: 4.9,
    saves: 892,
    createdBy: 'Mike T.'
  },
  {
    id: '3',
    name: 'Lake Michigan Shoreline',
    coordinates: [-87.6298, 41.8781], // Chicago
    duration: 60,
    distance: 3.2,
    difficulty: 'easy',
    sceneryType: ['coastal', 'nature'],
    description: 'Peaceful lakefront path with beaches and city views.',
    rating: 4.7,
    saves: 412,
    createdBy: 'Elena R.'
  },
  {
    id: '4',
    name: 'Venice Beach Boardwalk',
    coordinates: [-118.4694, 33.9850], // Los Angeles
    duration: 45,
    distance: 2.5,
    difficulty: 'easy',
    sceneryType: ['coastal', 'art'],
    description: 'Vibrant beach walk with street performers, murals, and ocean views.',
    rating: 4.6,
    saves: 567,
    createdBy: 'Carlos D.'
  },
  {
    id: '5',
    name: 'Discovery Park Trail',
    coordinates: [-122.4037, 47.6587], // Seattle
    duration: 75,
    distance: 4.1,
    difficulty: 'moderate',
    sceneryType: ['park', 'nature'],
    description: 'Forest trails leading to lighthouse with Puget Sound views.',
    rating: 4.8,
    saves: 298,
    createdBy: 'Jennifer L.'
  },
  {
    id: '6',
    name: 'Freedom Trail Historic Walk',
    coordinates: [-71.0589, 42.3601], // Boston
    duration: 90,
    distance: 2.5,
    difficulty: 'easy',
    sceneryType: ['historic', 'urban'],
    description: 'Follow the red brick line through Revolutionary War sites.',
    rating: 4.5,
    saves: 445,
    createdBy: 'David H.'
  }
]

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  challenging: 'bg-red-100 text-red-800'
}

export default function DiscoverPage() {
  const [walks] = useState<Walk[]>(mockWalks)
  const [selectedWalk, setSelectedWalk] = useState<Walk | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    duration: 'all',
    difficulty: 'all',
    sceneryType: 'all'
  })
  const [isClient, setIsClient] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationInput, setLocationInput] = useState('')
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [geocodingResults, setGeocodingResults] = useState<GeocodingResult[]>([])
  const [showGeocodingResults, setShowGeocodingResults] = useState(false)
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false)
  
  const { savedWalks, toggleSaveWalk, setUserLocation: setStoreLocation } = useUserStore()

  useEffect(() => {
    setIsClient(true)
    // Manually hydrate the store
    useUserStore.persist.rehydrate()
  }, [])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser. Try entering a city name or coordinates.')
      return
    }

    setIsGettingLocation(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: [number, number] = [position.coords.longitude, position.coords.latitude]
        setUserLocation(location)
        setStoreLocation(location)
        setLocationInput(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
        setIsGettingLocation(false)
        
        // Try to reverse geocode to get a human-readable address (with fallback)
        geocodingService.reverseGeocode(location)
          .then(result => {
            if (result) {
              setLocationInput(result.placeName)
            }
          })
          .catch(() => {
            // Ignore reverse geocoding errors, coordinates are fine
          })
      },
      (error) => {
        let errorMessage = 'Unable to get your location. '
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied. Please enable location permissions and try again.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. Try entering your location manually.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Try again or enter your location manually.'
            break
          default:
            errorMessage += 'Please enter your location manually or try coordinates.'
            break
        }
        
        setLocationError(errorMessage)
        setIsGettingLocation(false)
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Handle location input changes with debounced geocoding
  const handleLocationInputChange = (value: string) => {
    setLocationInput(value)
    setLocationError('')
    
    if (!value.trim()) {
      setGeocodingResults([])
      setShowGeocodingResults(false)
      return
    }

    // Check if it's coordinates first (longitude, latitude)
    const coordMatch = value.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
    if (coordMatch) {
      const [, lat, lng] = coordMatch
      const location: [number, number] = [parseFloat(lng), parseFloat(lat)]
      setUserLocation(location)
      setStoreLocation(location)
      setShowGeocodingResults(false)
      return
    }

    // Use debounced geocoding for address search with fallback support
    setIsGeocodingLoading(true)
    geocodingService.debouncedGeocode(value, (results, error) => {
      setIsGeocodingLoading(false)
      
      if (error) {
        // Show a user-friendly error message but don't completely block functionality
        if (error.code === 'QUOTA_EXCEEDED') {
          setLocationError('Location search temporarily limited. Try common city names or coordinates.')
        } else if (error.code === 'NETWORK_ERROR') {
          setLocationError('Connection issue. Try again or enter coordinates.')
        } else {
          setLocationError('Location search unavailable. Enter coordinates like "37.7749, -122.4194".')
        }
        setGeocodingResults([])
        setShowGeocodingResults(false)
      } else if (results) {
        setGeocodingResults(results)
        setShowGeocodingResults(results.length > 0)
        // Clear any previous errors since we got results
        setLocationError('')
      }
    })
  }

  // Handle selecting a geocoding result
  const handleGeocodingResultSelect = (result: GeocodingResult) => {
    setUserLocation(result.coordinates)
    setStoreLocation(result.coordinates)
    setLocationInput(result.placeName)
    setShowGeocodingResults(false)
    setGeocodingResults([])
  }

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationInput.trim()) return

    // If we have geocoding results, use the first one
    if (geocodingResults.length > 0) {
      handleGeocodingResultSelect(geocodingResults[0])
    }
  }

  const filteredWalks = walks.filter(walk => {
    const matchesSearch = walk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         walk.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDuration = filters.duration === 'all' || 
                           (filters.duration === 'short' && walk.duration <= 30) ||
                           (filters.duration === 'medium' && walk.duration > 30 && walk.duration <= 60) ||
                           (filters.duration === 'long' && walk.duration > 60)
    
    const matchesDifficulty = filters.difficulty === 'all' || walk.difficulty === filters.difficulty
    
    const matchesScenery = filters.sceneryType === 'all' || 
                          walk.sceneryType.includes(filters.sceneryType)
    
    return matchesSearch && matchesDuration && matchesDifficulty && matchesScenery
  })

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-2">Loading Walks...</div>
            <div className="text-gray-600">Finding amazing routes near you</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Search & Filters */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Discover Walks</h1>
            
            {/* Location Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Starting Point</label>
              <form onSubmit={handleLocationSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter address or coordinates..."
                      value={locationInput}
                      onChange={(e) => handleLocationInputChange(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      autoComplete="off"
                    />
                    {isGeocodingLoading && (
                      <Loader2 className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="bg-green-600 hover:bg-green-700 text-white px-3"
                    title="Use my current location"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Geocoding Results Dropdown */}
                {showGeocodingResults && geocodingResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {geocodingResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleGeocodingResultSelect(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {result.placeName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.coordinates[1].toFixed(4)}, {result.coordinates[0].toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {locationError && (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>{locationError}</span>
                  </div>
                )}
                {userLocation && !showGeocodingResults && (
                  <div className="flex items-center text-sm text-green-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>Location set: {userLocation[1].toFixed(4)}, {userLocation[0].toFixed(4)}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search walks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <select
                  value={filters.duration}
                  onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All durations</option>
                  <option value="short">Short (≤30 min)</option>
                  <option value="medium">Medium (30-60 min)</option>
                  <option value="long">Long (60+ min)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="challenging">Challenging</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scenery</label>
                <select
                  value={filters.sceneryType}
                  onChange={(e) => setFilters(prev => ({ ...prev, sceneryType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All types</option>
                  <option value="park">Parks</option>
                  <option value="urban">Urban</option>
                  <option value="coastal">Coastal</option>
                  <option value="historic">Historic</option>
                  <option value="nature">Nature</option>
                  <option value="art">Art & Culture</option>
                </select>
              </div>
            </div>
          </div>

          {/* Walk List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {filteredWalks.map((walk) => (
                <div
                  key={walk.id}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedWalk?.id === walk.id ? 'ring-2 ring-green-500 border-green-500' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedWalk(walk)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{walk.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSaveWalk(walk.id)
                      }}
                      className={`p-1 rounded transition-colors ${
                        savedWalks.has(walk.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${savedWalks.has(walk.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{walk.description}</p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      {walk.duration} min
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {walk.distance} mi
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                      {walk.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[walk.difficulty]}`}>
                        {walk.difficulty}
                      </span>
                      {walk.sceneryType.slice(0, 2).map(type => (
                        <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {type}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Bookmark className="h-4 w-4 mr-1" />
                      {walk.saves}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Map */}
        <div className="flex-1 relative">
          <MapComponent
            walks={filteredWalks}
            onWalkSelect={setSelectedWalk}
            className="h-full"
            center={userLocation || [-122.4194, 37.7749]}
            showUserLocation={!!userLocation}
          />
          
          {/* Selected Walk Card Overlay */}
          {selectedWalk && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-6 max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedWalk.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSaveWalk(selectedWalk.id)
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    savedWalks.has(selectedWalk.id) ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`h-6 w-6 ${savedWalks.has(selectedWalk.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">{selectedWalk.description}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  {selectedWalk.duration} minutes
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  {selectedWalk.distance} miles
                </div>
                <div className="flex items-center text-gray-600">
                  <Star className="h-5 w-5 mr-2 text-yellow-400" />
                  {selectedWalk.rating}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[selectedWalk.difficulty]}`}>
                    {selectedWalk.difficulty}
                  </span>
                  {selectedWalk.sceneryType.slice(0, 2).map(type => (
                    <span key={type} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {type}
                    </span>
                  ))}
                </div>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Start Walk
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}