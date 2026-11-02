"use client"

import { useState, useEffect } from 'react'
import { Search, Clock, MapPin, Star, Bookmark, Heart, Navigation, Loader2, Zap, Target, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MapComponent from '@/components/Map'
import Navbar from '@/components/Navbar'
import { useUserStore } from '@/store/userStore'
import { geocodingService, GeocodingResult } from '@/services/geocoding'
import { routeGenerationService, RoutePreferences, GeneratedWalk } from '@/services/routeGeneration'

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

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  challenging: 'bg-red-100 text-red-800 border-red-200'
}

// Mock walks data (same as discover page)
const mockWalks: Walk[] = [
  {
    id: '1',
    name: 'Golden Gate Park Loop',
    coordinates: [-122.4194, 37.7749],
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
    coordinates: [-73.9969, 40.7061],
    duration: 30,
    distance: 1.1,
    difficulty: 'easy',
    sceneryType: ['urban', 'historic'],
    description: 'Iconic walk across Brooklyn Bridge with stunning city skyline views.',
    rating: 4.9,
    saves: 445,
    createdBy: 'Mike R.'
  },
  {
    id: '3',
    name: 'Millennium Park to Navy Pier',
    coordinates: [-87.6298, 41.8781],
    duration: 60,
    distance: 3.2,
    difficulty: 'moderate',
    sceneryType: ['urban', 'waterfront'],
    description: 'Downtown Chicago walk from Millennium Park to Navy Pier along the lakefront.',
    rating: 4.7,
    saves: 312,
    createdBy: 'Lisa K.'
  }
]

export default function MapPage() {
  const [mode, setMode] = useState<'discover' | 'generate'>('discover')
  
  // Debug: Check environment setup
  useEffect(() => {
    console.log('=== Debug Environment Setup ===');
    console.log('Mapbox token available:', !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);
    console.log('Mapbox dev token available:', !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN_DEV);
    console.log('Environment:', process.env.NEXT_PUBLIC_MAPBOX_ENVIRONMENT);
    console.log('Node environment:', process.env.NODE_ENV);
    console.log('=== End Debug ===');
  }, []);
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedWalk, setSelectedWalk] = useState<Walk | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [generatedWalk, setGeneratedWalk] = useState<GeneratedWalk | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const { userLocation, setUserLocation, savedWalks, toggleSaveWalk } = useUserStore()
  
  // Filter states
  const [filters, setFilters] = useState({
    duration: 'all',
    difficulty: 'all',
    sceneryType: 'all'
  })

  // Route generation preferences
  const [preferences, setPreferences] = useState<RoutePreferences>({
    duration: 30, // Will be calculated from distance
    difficulty: 'moderate',
    avoidBusyRoads: true,
    preferParks: true,
    preferWaterfront: false,
    preferHistoric: false,
    surfaceType: 'any',
    includeSteps: true,
    maxElevationGain: 200
  })

  // New distance-based preference
  const [targetDistance, setTargetDistance] = useState(1.5) // miles

  // Filter walks based on current filters
  const filteredWalks = mockWalks.filter(walk => {
    if (filters.duration !== 'all') {
      const durationRanges = {
        short: [0, 30],
        medium: [30, 60],
        long: [60, 999]
      }
      const [min, max] = durationRanges[filters.duration as keyof typeof durationRanges]
      if (walk.duration < min || walk.duration > max) return false
    }
    
    if (filters.difficulty !== 'all' && walk.difficulty !== filters.difficulty) {
      return false
    }
    
    if (filters.sceneryType !== 'all' && !walk.sceneryType.includes(filters.sceneryType)) {
      return false
    }
    
    return true
  })

  // Search functionality
  const handleSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await geocodingService.geocode(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleLocationSelect = (result: GeocodingResult) => {
    setUserLocation(result.coordinates)
    setSearchQuery(result.placeName)
    setSearchResults([])
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ]
          setUserLocation(coords)
          setSearchQuery('Current Location')
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your location. Please search for a location manually.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  // Generate walk functionality
  const handleGenerateWalk = async () => {
    if (!userLocation) {
      alert('Please set your location first')
      return
    }

    setIsGenerating(true)
    
    try {
      console.log('Starting route generation with:', { userLocation, preferences });
      
      // Calculate estimated duration from distance and difficulty
      const estimatedDuration = Math.round(targetDistance * (preferences.difficulty === 'easy' ? 30 : preferences.difficulty === 'moderate' ? 24 : 20))
      
      const walk = await routeGenerationService.generateRoute({
        center: userLocation,
        preferences: {
          ...preferences,
          duration: estimatedDuration
        },
        routeType: 'circular',
        targetDistance: targetDistance
      })
      
      console.log('Route generation result:', walk);
      
      if (walk) {
        setGeneratedWalk(walk)
        console.log('Generated walk set successfully');
      } else {
        console.error('Route generation returned null');
        alert('Failed to generate route. Please try different settings.')
      }
    } catch (error) {
      console.error('Route generation failed:', error)
      alert(`Route generation failed: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery !== 'Current Location') {
        handleSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Mode Toggle */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('discover')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  mode === 'discover'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search className="h-4 w-4 inline mr-2" />
                Discover
              </button>
              <button
                onClick={() => setMode('generate')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  mode === 'generate'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-2" />
                Generate
              </button>
            </div>
          </div>

          {/* Content based on mode */}
          {mode === 'discover' ? (
            <div className="flex-1 overflow-y-auto">
              {/* Search Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for a location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(result)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-gray-900">{result.placeName}</div>
                        <div className="text-xs text-gray-500">
                          {result.coordinates[1].toFixed(4)}, {result.coordinates[0].toFixed(4)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  onClick={getCurrentLocation}
                  variant="outline"
                  className="w-full mt-3"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="ghost"
                    size="sm"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                {showFilters && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                      <select
                        value={filters.duration}
                        onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="all">All Durations</option>
                        <option value="short">Short (0-30 min)</option>
                        <option value="medium">Medium (30-60 min)</option>
                        <option value="long">Long (60+ min)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        value={filters.difficulty}
                        onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="challenging">Challenging</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Scenery</label>
                      <select
                        value={filters.sceneryType}
                        onChange={(e) => setFilters(prev => ({ ...prev, sceneryType: e.target.value }))}
                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="all">All Types</option>
                        <option value="park">Parks</option>
                        <option value="urban">Urban</option>
                        <option value="waterfront">Waterfront</option>
                        <option value="historic">Historic</option>
                        <option value="nature">Nature</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Walks List */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Available Walks ({filteredWalks.length})
                </h3>
                
                <div className="space-y-3">
                  {filteredWalks.map((walk) => (
                    <div
                      key={walk.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedWalk?.id === walk.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedWalk(walk)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{walk.name}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSaveWalk(walk.id)
                          }}
                          className={`p-1 rounded-full ${
                            savedWalks.has(walk.id)
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${savedWalks.has(walk.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{walk.description}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {walk.duration} min
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {walk.distance} mi
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[walk.difficulty]}`}>
                          {walk.difficulty}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center text-sm text-gray-500">
                          <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                          {walk.rating} ({walk.saves} saves)
                        </div>
                        <div className="text-xs text-gray-500">by {walk.createdBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Generate Mode */
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Generate Walk</h2>
                  <p className="text-sm text-gray-600">Create a custom walking route based on your preferences.</p>
                </div>

                {/* Distance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance: {targetDistance} miles
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.25"
                    value={targetDistance}
                    onChange={(e) => setTargetDistance(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5 mi</span>
                    <span>5 mi</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Estimated time: {Math.round(targetDistance * (preferences.difficulty === 'easy' ? 30 : preferences.difficulty === 'moderate' ? 24 : 20))} minutes
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <div className="space-y-2">
                    {([
                      { key: 'easy', label: 'Easy', desc: 'Flat terrain, paved paths' },
                      { key: 'moderate', label: 'Moderate', desc: 'Some hills, mixed surfaces' },
                      { key: 'challenging', label: 'Challenging', desc: 'Hilly terrain, stairs, elevation gain' }
                    ] as const).map((diff) => (
                      <button
                        key={diff.key}
                        onClick={() => setPreferences(prev => ({ ...prev, difficulty: diff.key }))}
                        className={`w-full p-3 border rounded-lg text-left transition-colors ${
                          preferences.difficulty === diff.key
                            ? difficultyColors[diff.key]
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium">{diff.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{diff.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Preferences</label>
                  <div className="space-y-3">
                    {[
                      { key: 'preferParks', label: 'Prefer parks and green spaces' },
                      { key: 'preferWaterfront', label: 'Prefer waterfront views' },
                      { key: 'preferHistoric', label: 'Include historic sites' },
                      { key: 'avoidBusyRoads', label: 'Avoid busy roads' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences[key as keyof RoutePreferences] as boolean}
                          onChange={(e) => setPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateWalk}
                  disabled={isGenerating || !userLocation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Route...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Walk
                    </>
                  )}
                </Button>

                {!userLocation && (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Please set your location first to generate routes.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Map */}
        <div className="flex-1 relative">
          <MapComponent
            walks={mode === 'discover' ? filteredWalks : (generatedWalk ? [{
              id: generatedWalk.id,
              name: generatedWalk.name,
              coordinates: generatedWalk.coordinates,
              duration: generatedWalk.duration,
              distance: generatedWalk.distance,
              difficulty: generatedWalk.difficulty,
              sceneryType: generatedWalk.sceneryType,
              description: generatedWalk.description,
              rating: 0,
              saves: 0,
              createdBy: 'AI Generated'
            }] : [])}
            onWalkSelect={setSelectedWalk}
            className="h-full"
            center={userLocation || [-122.4194, 37.7749]}
            showUserLocation={!!userLocation}
            userLocation={userLocation}
            showLocationPin={!!userLocation}
            generatedRoute={generatedWalk}
          />
          
          {/* Walk Details Card */}
          {selectedWalk && mode === 'discover' && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-6 max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedWalk.name}</h3>
                <button
                  onClick={() => setSelectedWalk(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">{selectedWalk.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {selectedWalk.duration} minutes
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {selectedWalk.distance} miles
                </div>
                <div className="flex items-center text-gray-600">
                  <Star className="h-4 w-4 mr-2 fill-current text-yellow-400" />
                  {selectedWalk.rating} rating
                </div>
                <div className="flex items-center text-gray-600">
                  <Bookmark className="h-4 w-4 mr-2" />
                  {selectedWalk.saves} saves
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {/* TODO: Start walk logic */}}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Start Walk
                </Button>
                <Button 
                  onClick={() => toggleSaveWalk(selectedWalk.id)}
                  variant="outline" 
                  className={`border-green-600 text-green-600 hover:bg-green-50 ${
                    savedWalks.has(selectedWalk.id) ? 'bg-green-50' : ''
                  }`}
                >
                  <Heart className={`h-4 w-4 ${savedWalks.has(selectedWalk.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          )}

          {/* Generated Walk Card */}
          {generatedWalk && mode === 'generate' && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-6 max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{generatedWalk.name}</h3>
                <button
                  onClick={() => setGeneratedWalk(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">{generatedWalk.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {generatedWalk.duration} minutes
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {generatedWalk.distance.toFixed(1)} miles
                </div>
                <div className="flex items-center text-gray-600">
                  <Zap className="h-4 w-4 mr-2" />
                  {generatedWalk.estimatedCalories} calories
                </div>
                <div className="flex items-center text-gray-600">
                  <Target className="h-4 w-4 mr-2" />
                  {generatedWalk.elevation.gain.toFixed(0)}ft gain
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {/* TODO: Start walk logic */}}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Start Walk
                </Button>
                <Button 
                  onClick={handleGenerateWalk}
                  variant="outline" 
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  New Route
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}