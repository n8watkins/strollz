"use client"

import { useRef, useState, useEffect } from 'react'
import ReactMapGL, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl'
import { MapPin } from 'lucide-react'
import { mapboxUsageService } from '@/services/mapboxUsage'
import { mapboxConfig } from '@/services/mapboxConfig'
import { useMapboxFallback } from '@/hooks/useMapboxFallback'
import FallbackMap from './FallbackMap'
import 'mapbox-gl/dist/mapbox-gl.css'

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

interface MapComponentProps {
  walks?: Walk[]
  onWalkSelect?: (walk: Walk) => void
  className?: string
  showUserLocation?: boolean
  center?: [number, number]
  zoom?: number
  userLocation?: [number, number] | null
  showLocationPin?: boolean
  generatedRoute?: any // Generated route to display
}

export default function MapComponent({
  walks = [],
  onWalkSelect,
  className = "",
  showUserLocation = true,
  center = [-122.4194, 37.7749], // Default to San Francisco
  zoom = 12,
  userLocation = null,
  showLocationPin = false,
  generatedRoute = null
}: MapComponentProps) {
  const mapRef = useRef(null)
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom
  })

  // Calculate bearing between two points for arrow direction
  const calculateBearing = (start: [number, number], end: [number, number]): number => {
    const [startLng, startLat] = start
    const [endLng, endLat] = end
    
    const dLng = (endLng - startLng) * Math.PI / 180
    const startLatRad = startLat * Math.PI / 180
    const endLatRad = endLat * Math.PI / 180
    
    const y = Math.sin(dLng) * Math.cos(endLatRad)
    const x = Math.cos(startLatRad) * Math.sin(endLatRad) - Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLng)
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI
    return (bearing + 360) % 360
  }
  
  // Fallback management
  const { 
    isAvailable, 
    errorMessage, 
    retry, 
    shouldShowRetry 
  } = useMapboxFallback()

  // Update view when center changes (e.g., when user location is set)
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: center[0],
      latitude: center[1]
    }))
  }, [center[0], center[1]])

  const mapboxToken = mapboxConfig.getToken()
  const isTokenValid = mapboxConfig.isTokenValid()
  const canUseMaps = mapboxConfig.canMakeRequest('maps')

  // Track map load when component mounts and token is available
  useEffect(() => {
    if (isTokenValid && canUseMaps && isAvailable) {
      mapboxUsageService.trackMapLoad()
    }
  }, [isTokenValid, canUseMaps, isAvailable])

  // Show fallback if Mapbox is not available
  if (!isAvailable) {
    return (
      <FallbackMap
        walks={walks}
        onWalkSelect={onWalkSelect}
        className={className}
        error={errorMessage || 'Map service unavailable'}
        onRetry={shouldShowRetry ? retry : undefined}
        showRetry={shouldShowRetry}
      />
    )
  }

  // Show setup instructions if token/config issues
  if (!isTokenValid || !canUseMaps) {
    const validation = mapboxConfig.getTokenValidationInfo()
    const setup = mapboxConfig.getSetupInstructions()
    
    return (
      <div className={`bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex flex-col items-center justify-center ${className} p-8`}>
        <div className="text-center">
          <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Map Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            {validation.warnings.length > 0 ? validation.warnings[0] : 'Configure your Mapbox token to see the interactive map with walk locations.'}
          </p>
          <div className="bg-white rounded-lg p-4 text-left max-w-md">
            <p className="text-sm text-gray-700 mb-2">
              Environment: <span className="font-medium capitalize">{validation.environment}</span>
            </p>
            <p className="text-sm text-gray-700 mb-2">To enable maps:</p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              {setup.steps.slice(0, 4).map((step, index) => (
                <li key={index}>{step.replace(/^\d+\.\s/, '')}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <ReactMapGL
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={mapboxToken || undefined}
        style={{width: '100%', height: '100%'}}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        
        {/* Geolocation Control */}
        {showUserLocation && (
          <GeolocateControl
            position="top-right"
            trackUserLocation={true}
            showUserHeading={true}
          />
        )}

        {/* User Location Pin */}
        {showLocationPin && userLocation && (
          <Marker
            longitude={userLocation[0]}
            latitude={userLocation[1]}
            anchor="bottom"
          >
            <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white">
              <MapPin className="h-5 w-5" />
            </div>
          </Marker>
        )}

        {/* Generated Route */}
        {generatedRoute && generatedRoute.route && (
          <>
            {/* Route Line */}
            <Source
              id="route"
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: generatedRoute.route.map((point: any) => point.coordinates)
                }
              }}
            >
              <Layer
                id="route"
                type="line"
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 4,
                  'line-opacity': 0.8
                }}
              />
            </Source>

            {/* Route Direction Arrows - Using Custom Markers */}
            {generatedRoute.route
              .slice(0, -1)
              .filter((_: any, index: number) => index % 10 === 0) // Show arrow every 10th point
              .map((point: any, index: number) => {
                const nextPoint = generatedRoute.route[index * 10 + 1];
                if (!nextPoint) return null;
                
                const bearing = calculateBearing(point.coordinates, nextPoint.coordinates);
                
                return (
                  <Marker
                    key={`arrow-${index}`}
                    longitude={point.coordinates[0]}
                    latitude={point.coordinates[1]}
                    anchor="center"
                  >
                    <div 
                      className="text-blue-600 text-lg font-bold"
                      style={{
                        transform: `rotate(${bearing}deg)`,
                        transformOrigin: 'center'
                      }}
                    >
                      ▶
                    </div>
                  </Marker>
                );
              })
              .filter(Boolean)
            }

            {/* Start Marker */}
            <Source
              id="route-start"
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: generatedRoute.route[0].coordinates
                }
              }}
            >
              <Layer
                id="route-start"
                type="circle"
                paint={{
                  'circle-color': '#10b981',
                  'circle-radius': 8,
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-width': 2
                }}
              />
            </Source>

            {/* End Marker (for non-circular routes) */}
            {generatedRoute.route.length > 1 && (
              <Source
                id="route-end"
                type="geojson"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: generatedRoute.route[generatedRoute.route.length - 1].coordinates
                  }
                }}
              >
                <Layer
                  id="route-end"
                  type="circle"
                  paint={{
                    'circle-color': '#ef4444',
                    'circle-radius': 8,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2
                  }}
                />
              </Source>
            )}
          </>
        )}

        {/* Walk Markers */}
        {walks.map((walk) => (
          <Marker
            key={walk.id}
            longitude={walk.coordinates[0]}
            latitude={walk.coordinates[1]}
            anchor="bottom"
            onClick={() => onWalkSelect?.(walk)}
          >
            <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors shadow-lg">
              <span className="text-sm font-bold">{walk.duration}m</span>
            </div>
          </Marker>
        ))}
      </ReactMapGL>
    </div>
  )
}