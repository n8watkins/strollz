"use client"

import { useState, useEffect } from 'react'
import { MapPin, Clock, Zap, Target, History, Compass, Settings, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MapComponent from '@/components/Map'
import Navbar from '@/components/Navbar'
import { useUserStore } from '@/store/userStore'
import { routeGenerationService, RoutePreferences, GeneratedWalk, RouteGenerationOptions } from '@/services/routeGeneration'
import { explorationHistoryService, ExplorationSuggestion, ExplorationStats } from '@/services/explorationHistory'

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  challenging: 'bg-red-100 text-red-800 border-red-200'
}

const routeTypeIcons = {
  circular: Target,
  out_and_back: TrendingUp,
  linear: Compass
}

export default function GeneratePage() {
  const [isClient, setIsClient] = useState(false)
  const [currentTab, setCurrentTab] = useState<'generate' | 'explore' | 'history'>('generate')
  const [generatedWalk, setGeneratedWalk] = useState<GeneratedWalk | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [explorationSuggestions, setExplorationSuggestions] = useState<ExplorationSuggestion[]>([])
  const [explorationStats, setExplorationStats] = useState<ExplorationStats | null>(null)
  
  const { userLocation, setUserLocation } = useUserStore()
  
  // Route generation preferences
  const [preferences, setPreferences] = useState<RoutePreferences>({
    duration: 30,
    difficulty: 'moderate',
    avoidBusyRoads: true,
    preferParks: true,
    preferWaterfront: false,
    preferHistoric: false,
    surfaceType: 'any',
    includeSteps: true,
    maxElevationGain: 200
  })
  
  const [routeType, setRouteType] = useState<'circular' | 'out_and_back' | 'linear'>('circular')

  useEffect(() => {
    setIsClient(true)
    useUserStore.persist.rehydrate()
    
    // Load exploration data
    const stats = explorationHistoryService.getExplorationStats()
    setExplorationStats(stats)
  }, [])

  // Separate effect for handling userLocation changes
  useEffect(() => {
    if (userLocation) {
      const suggestions = explorationHistoryService.generateExplorationSuggestions(userLocation)
      setExplorationSuggestions(suggestions)
    }
  }, [userLocation])

  const handleGenerateWalk = async () => {
    if (!userLocation) {
      alert('Please set your location first')
      return
    }

    setIsGenerating(true)
    
    try {
      const options: RouteGenerationOptions = {
        center: userLocation,
        preferences,
        routeType,
        exploration: currentTab === 'explore' ? {
          previousRoutes: explorationHistoryService.getExplorationHistory()
            .filter(h => h.isGenerated)
            .map(h => ({
              id: h.walkId,
              coordinates: userLocation, // Simplified for demo
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
          explorationRadius: explorationStats?.explorationRadius || 1.0,
          noveltyWeight: 0.7
        } : undefined
      }
      
      const walk = await routeGenerationService.generateRoute(options)
      
      if (walk) {
        setGeneratedWalk(walk)
        
        // Save to history if user wants to track
        if (currentTab === 'explore') {
          explorationHistoryService.saveWalkToHistory(walk)
          
          // Refresh exploration data
          const newStats = explorationHistoryService.getExplorationStats()
          setExplorationStats(newStats)
          
          const newSuggestions = explorationHistoryService.generateExplorationSuggestions(userLocation)
          setExplorationSuggestions(newSuggestions)
        }
      } else {
        alert('Failed to generate route. Please try different settings.')
      }
    } catch (error) {
      console.error('Route generation failed:', error)
      alert('Route generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSuggestionSelect = (suggestion: ExplorationSuggestion) => {
    setUserLocation(suggestion.center)
    setPreferences(prev => ({
      ...prev,
      duration: suggestion.estimatedDuration,
      difficulty: suggestion.difficulty
    }))
    setCurrentTab('generate')
  }

  const handleCompleteWalk = (rating: number) => {
    if (generatedWalk) {
      explorationHistoryService.completeWalk(generatedWalk.id, rating)
      
      // Refresh stats
      const newStats = explorationHistoryService.getExplorationStats()
      setExplorationStats(newStats)
      
      setGeneratedWalk(null)
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-2">Loading Route Generator...</div>
            <div className="text-gray-600">Preparing your walking adventure</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Controls */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setCurrentTab('generate')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
                  currentTab === 'generate'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Zap className="h-4 w-4 inline mr-2" />
                Generate
              </button>
              <button
                onClick={() => setCurrentTab('explore')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
                  currentTab === 'explore'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Compass className="h-4 w-4 inline mr-2" />
                Explore
              </button>
              <button
                onClick={() => setCurrentTab('history')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
                  currentTab === 'history'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <History className="h-4 w-4 inline mr-2" />
                History
              </button>
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {currentTab === 'generate' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Generate Walk</h1>
                  <p className="text-gray-600">Create a custom walking route based on your preferences.</p>
                </div>

                {/* Route Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Route Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['circular', 'out_and_back', 'linear'] as const).map((type) => {
                      const Icon = routeTypeIcons[type]
                      const isSelected = routeType === type
                      return (
                        <button
                          key={type}
                          onClick={() => setRouteType(type)}
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            isSelected
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Icon className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs font-medium">
                            {type === 'circular' && 'Circular'}
                            {type === 'out_and_back' && 'Out & Back'}
                            {type === 'linear' && 'Linear'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration: {preferences.duration} minutes
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={preferences.duration}
                    onChange={(e) => setPreferences(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>15 min</span>
                    <span>2 hours</span>
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'moderate', 'challenging'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setPreferences(prev => ({ ...prev, difficulty: diff }))}
                        className={`p-2 border rounded-lg text-sm font-medium transition-colors ${
                          preferences.difficulty === diff
                            ? difficultyColors[diff]
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
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
                      <Settings className="h-4 w-4 mr-2 animate-spin" />
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
                    Please set your location in the Discover page first to generate routes.
                  </p>
                )}
              </div>
            )}

            {currentTab === 'explore' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Explore Around You</h1>
                  <p className="text-gray-600">Discover new areas based on your exploration history.</p>
                </div>

                {/* Exploration Stats */}
                {explorationStats && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 mb-3">Your Exploration Progress</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-green-600 font-medium">{explorationStats.totalWalks}</div>
                        <div className="text-green-700">Walks Completed</div>
                      </div>
                      <div>
                        <div className="text-green-600 font-medium">{explorationStats.areasExplored}</div>
                        <div className="text-green-700">Areas Explored</div>
                      </div>
                      <div>
                        <div className="text-green-600 font-medium">{explorationStats.totalDistance.toFixed(1)} mi</div>
                        <div className="text-green-700">Total Distance</div>
                      </div>
                      <div>
                        <div className="text-green-600 font-medium">{Math.round(explorationStats.noveltyScore * 100)}%</div>
                        <div className="text-green-700">Novelty Score</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Exploration Suggestions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Exploration Suggestions</h3>
                  {explorationSuggestions.length > 0 ? (
                    <div className="space-y-3">
                      {explorationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[suggestion.difficulty]}`}>
                              {suggestion.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {suggestion.distance.toFixed(1)} mi away
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              ~{suggestion.estimatedDuration} min
                            </span>
                            <span className="flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              {Math.round(suggestion.noveltyScore * 100)}% new
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Compass className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Start exploring to get personalized suggestions!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Walk History</h1>
                  <p className="text-gray-600">Your recent walking adventures.</p>
                </div>

                {/* Walk History List */}
                <div className="space-y-3">
                  {explorationHistoryService.getExplorationHistory().map((walk) => (
                    <div key={walk.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {walk.isGenerated ? 'Generated Walk' : 'Custom Walk'}
                        </h4>
                        {walk.rating && (
                          <div className="flex items-center text-sm text-yellow-600">
                            <Star className="h-4 w-4 mr-1 fill-current" />
                            {walk.rating}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {walk.duration} min
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {walk.distance.toFixed(1)} mi
                        </span>
                        <span>{new Date(walk.startedAt).toLocaleDateString()}</span>
                      </div>
                      {walk.notes && (
                        <p className="text-sm text-gray-600 mt-2">{walk.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Map */}
        <div className="flex-1 relative">
          <MapComponent
            walks={generatedWalk ? [{
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
            }] : []}
            onWalkSelect={() => {}}
            className="h-full"
            center={userLocation || [-122.4194, 37.7749]}
            showUserLocation={!!userLocation}
          />
          
          {/* Generated Walk Card Overlay */}
          {generatedWalk && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-6 max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{generatedWalk.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[generatedWalk.difficulty]}`}>
                  {generatedWalk.difficulty}
                </span>
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
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {generatedWalk.elevation.gain.toFixed(0)}ft gain
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCompleteWalk(5)}
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