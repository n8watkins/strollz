# Unified Map Interface Documentation

## Overview

The unified map interface (`/map`) combines walk discovery and route generation into a single, intuitive experience. This eliminates the previous confusion of having separate `/discover` and `/generate` pages.

## User Interface Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Navbar                               │
├─────────────────┬───────────────────────────────────────────┤
│   Left Sidebar  │                                           │
│   (Controls)    │            Map Canvas                     │
│                 │                                           │
│   - Mode Toggle │                                           │
│   - Search      │                                           │
│   - Filters     │                                           │
│   - Walk List   │                                           │
│                 │                                           │
│                 │                                           │
├─────────────────┼───────────────────────────────────────────┤
│                 │        Walk Details Card                  │
│                 │        (Bottom Overlay)                   │
└─────────────────┴───────────────────────────────────────────┘
```

### Mode Toggle

The interface offers two primary modes:

#### 1. Discover Mode
- **Purpose**: Browse and explore existing curated walks
- **Features**:
  - Location search with geocoding
  - Advanced filtering (duration, difficulty, scenery)
  - Walk list with ratings and details
  - Map visualization of available walks
  - Save/bookmark functionality

#### 2. Generate Mode  
- **Purpose**: Create custom walking routes using real POI data
- **Features**:
  - Location-based route generation
  - Preference settings (duration, difficulty, POI types)
  - Real-time route creation
  - Route validation and metrics
  - Alternative route generation

## Core Features

### Location Search and Selection

#### Search Functionality
```typescript
// Debounced search with geocoding
const handleSearch = async (query: string) => {
  const results = await geocodingService.geocode(query)
  setSearchResults(results)
}
```

#### Location Methods
1. **Text Search**: Address, city, or landmark search
2. **Current Location**: GPS-based positioning
3. **Map Click**: Direct coordinate selection (future)

#### Search Results Display
- **Primary**: Place name (e.g., "Golden Gate Park, San Francisco")
- **Secondary**: Coordinates for precision
- **Interaction**: Click to select and center map

### Filtering System (Discover Mode)

#### Filter Categories
| Filter | Options | Purpose |
|--------|---------|---------|
| Duration | All, Short (0-30min), Medium (30-60min), Long (60min+) | Time-based filtering |
| Difficulty | All, Easy, Moderate, Challenging | Fitness level matching |
| Scenery | All, Parks, Urban, Waterfront, Historic, Nature | Experience preference |

#### Filter Implementation
```typescript
const filteredWalks = mockWalks.filter(walk => {
  // Duration filtering
  if (filters.duration !== 'all') {
    const durationRanges = {
      short: [0, 30],
      medium: [30, 60], 
      long: [60, 999]
    }
    const [min, max] = durationRanges[filters.duration]
    if (walk.duration < min || walk.duration > max) return false
  }
  
  // Additional filters...
  return true
})
```

### Route Generation (Generate Mode)

#### User Controls
- **Duration Slider**: 15 minutes to 2 hours
- **Difficulty Selection**: Easy, Moderate, Challenging
- **Preference Checkboxes**:
  - Prefer parks and green spaces
  - Prefer waterfront views
  - Include historic sites
  - Avoid busy roads

#### Generation Process
1. **Input Validation**: Ensure location is set
2. **POI Discovery**: Find real places based on preferences
3. **Route Creation**: Generate walkable path through POIs
4. **Validation**: Verify route is actually walkable
5. **Presentation**: Display route with details

### Map Integration

#### Map Features
- **Base Layer**: Mapbox street map
- **Walk Markers**: Visual indicators for available walks
- **Route Lines**: Generated route paths
- **User Location**: Current position indicator
- **Interactive**: Click to select walks or set location

#### Map State Management
```typescript
const mapCenter = userLocation || [-122.4194, 37.7749] // Default to SF
const mapWalks = mode === 'discover' ? filteredWalks : generatedWalks
```

### Walk Details Cards

#### Discover Mode Card
```typescript
interface WalkDetailsCard {
  title: string           // Walk name
  description: string     // Walk description
  metrics: {
    duration: number      // Minutes
    distance: number      // Miles
    rating: number        // 1-5 stars
    saves: number         // Bookmark count
  }
  difficulty: 'easy' | 'moderate' | 'challenging'
  actions: ['Start Walk', 'Save/Unsave']
}
```

#### Generate Mode Card
```typescript
interface GeneratedWalkCard {
  title: string           // Generated walk name
  description: string     // Auto-generated description
  metrics: {
    duration: number      // Minutes
    distance: number      // Miles
    calories: number      // Estimated burn
    elevation: number     // Feet of gain
  }
  difficulty: 'easy' | 'moderate' | 'challenging'
  actions: ['Start Walk', 'Generate New']
}
```

## Technical Implementation

### State Management

#### Core State Variables
```typescript
const [mode, setMode] = useState<'discover' | 'generate'>('discover')
const [searchQuery, setSearchQuery] = useState('')
const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
const [selectedWalk, setSelectedWalk] = useState<Walk | null>(null)
const [generatedWalk, setGeneratedWalk] = useState<GeneratedWalk | null>(null)
const [filters, setFilters] = useState({ duration: 'all', difficulty: 'all', sceneryType: 'all' })
const [preferences, setPreferences] = useState<RoutePreferences>({ /* defaults */ })
```

#### User Store Integration
```typescript
const { 
  userLocation, 
  setUserLocation, 
  savedWalks, 
  toggleSaveWalk 
} = useUserStore()
```

### Search Implementation

#### Debounced Search
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery && searchQuery !== 'Current Location') {
      handleSearch(searchQuery)
    }
  }, 300) // 300ms debounce
  
  return () => clearTimeout(timer)
}, [searchQuery])
```

#### Location Selection
```typescript
const handleLocationSelect = (result: GeocodingResult) => {
  setUserLocation(result.coordinates)        // Update global state
  setSearchQuery(result.placeName)           // Update search display
  setSearchResults([])                       // Clear results
  // Map automatically centers on new location
}
```

### Route Generation Integration

#### Generation Flow
```typescript
const handleGenerateWalk = async () => {
  if (!userLocation) return
  
  setIsGenerating(true)
  try {
    const walk = await routeGenerationService.generateRoute({
      center: userLocation,
      preferences,
      routeType: 'circular'
    })
    
    if (walk) {
      setGeneratedWalk(walk)
      // Map shows generated route
    }
  } catch (error) {
    // Handle error
  } finally {
    setIsGenerating(false)
  }
}
```

## User Experience Flow

### Discover Mode Flow
1. **Land on page** → Default to Discover mode
2. **Search location** → Type address or use current location
3. **Apply filters** → Duration, difficulty, scenery preferences
4. **Browse walks** → Scroll through filtered results
5. **Select walk** → Click walk to see details and map route
6. **Save walk** → Bookmark for later (optional)
7. **Start walk** → Begin navigation (future feature)

### Generate Mode Flow
1. **Switch to Generate** → Toggle mode in top controls
2. **Set location** → Search or use current location
3. **Set preferences** → Duration, difficulty, POI types
4. **Generate route** → Click generate button
5. **Review route** → See generated walk details and map
6. **Try alternatives** → Generate new route or adjust preferences
7. **Start walk** → Begin walking the generated route

## Responsive Design

### Mobile Optimization
- **Collapsible Sidebar**: Overlay on mobile, fixed on desktop
- **Touch Interactions**: Tap to select, swipe to navigate
- **Simplified Filters**: Streamlined filter interface
- **Map Controls**: Touch-friendly zoom and pan

### Desktop Experience
- **Side Panel**: Fixed 384px width sidebar
- **Keyboard Shortcuts**: Tab navigation, Enter to select
- **Hover States**: Visual feedback on interactive elements
- **Multi-column Layout**: Efficient space usage

## Performance Considerations

### Loading States
- **Search**: Spinner during geocoding
- **Generation**: Loading state during route creation
- **Map**: Progressive loading of map tiles and markers

### Error Handling
- **No Location**: Clear messaging to set location
- **API Failures**: Graceful fallback with user messaging
- **Network Issues**: Offline-capable features where possible

### Optimization
- **Debounced Search**: Reduce API calls
- **Memoized Components**: Prevent unnecessary re-renders
- **Lazy Loading**: Load walk details on demand

## Accessibility

### Keyboard Navigation
- **Tab Order**: Logical progression through controls
- **Focus Indicators**: Clear visual focus states
- **Screen Reader**: Proper ARIA labels and descriptions

### Visual Accessibility
- **Color Contrast**: WCAG 2.1 AA compliance
- **Text Size**: Scalable font sizes
- **Visual Hierarchy**: Clear information architecture

## Future Enhancements

### Planned Features
1. **Map Pins**: Show starting location pin when searching
2. **Route Sharing**: Share generated routes with others
3. **Offline Mode**: Cache maps and walks for offline use
4. **Voice Search**: Audio location search
5. **Augmented Reality**: AR navigation for walks

### UX Improvements
1. **Onboarding**: Tutorial for new users
2. **Personalization**: Learn user preferences over time
3. **Social Features**: Rate and review walks
4. **Weather Integration**: Weather-appropriate suggestions
5. **Achievement System**: Gamification elements

This unified interface provides a seamless experience for both discovering existing walks and generating custom routes, all while maintaining the flexibility to evolve with user needs and feedback.