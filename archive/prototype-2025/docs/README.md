# StrollVibe Documentation

> Real-world walking discovery platform - "Strava meets AllTrails for urban walking"

## 📖 Documentation Overview

This documentation covers the complete StrollVibe system, from high-level architecture to detailed implementation guides.

### 🏗️ System Architecture

- **[System Overview](./SYSTEM_OVERVIEW.md)** - Complete system architecture and how everything works together
- **[Real POI System](./REAL_POI_SYSTEM.md)** - Deep dive into OpenStreetMap integration and real destination discovery
- **[Unified Map Interface](./UNIFIED_MAP_INTERFACE.md)** - User interface design and interaction patterns

## 🚀 Quick Start

1. **Install dependencies**: `npm install`
2. **Set up environment**: Add Mapbox token to `.env.local`
3. **Run development server**: `npm run dev`
4. **Visit the app**: `http://localhost:3000/map`

## 🎯 Key Features

### ✅ Real Destinations
- Routes go to actual cafes, parks, museums, historic sites
- OpenStreetMap integration provides genuine POI data
- No more walking to random coordinates

### ✅ Verified Walkability  
- All routes validated using Mapbox Directions API
- Surface type and accessibility analysis
- Safety and quality assurance

### ✅ Unified Interface
- Single `/map` page for discovery and generation
- Mode toggle between browsing and creating
- Location search with map pins

### ✅ Smart Generation
- Preference-based POI selection
- Multiple route types (circular, out-and-back, linear)
- Real-time route validation

## 🔧 Technical Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Maps**: Mapbox (visualization, directions, geocoding)
- **POI Data**: OpenStreetMap Overpass API
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence

## 📚 Documentation Structure

### Core System Documentation
- **[System Overview](./SYSTEM_OVERVIEW.md)** - How everything fits together
- **[Real POI System](./REAL_POI_SYSTEM.md)** - POI discovery and validation
- **[Unified Map Interface](./UNIFIED_MAP_INTERFACE.md)** - User experience design

### API Integration
- **OpenStreetMap**: Real POI data from Overpass API
- **Mapbox**: Maps, directions, geocoding with usage monitoring
- **Caching**: Intelligent caching for performance

### User Experience
- **Discovery Mode**: Browse curated walks with filtering
- **Generation Mode**: Create custom routes with preferences
- **Location Search**: Address search with map pins
- **Route Validation**: Walkability verification

## 🎨 User Interface

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                        Navbar                               │
├─────────────────┬───────────────────────────────────────────┤
│   Left Sidebar  │                                           │
│   - Mode Toggle │            Map with Pins                  │
│   - Search      │                                           │
│   - Filters     │                                           │
│   - Walk List   │                                           │
│                 │                                           │
├─────────────────┼───────────────────────────────────────────┤
│                 │        Walk Details Card                  │
└─────────────────┴───────────────────────────────────────────┘
```

### Visual Elements
- **Blue Pin**: User's searched location
- **Green Markers**: Available walks (duration-labeled)
- **Route Lines**: Generated walking paths
- **Detail Cards**: Rich walk information

## 🔍 How It Works

### Route Generation Process
1. **User sets location** → Search or GPS with map pin
2. **System finds real POIs** → OpenStreetMap query
3. **Creates route through destinations** → Mapbox routing
4. **Validates walkability** → Safety and feasibility check
5. **Presents route** → "Walk to Central Park → Starbucks → Museum"

### Example Generated Route
**Input**: "30-minute walk from Union Square, prefer parks and cafes"

**Output**:
- **Route**: Union Square → Washington Square Park → Joe Coffee → Back to start
- **Details**: 1.8 miles, 145 calories, 30ft elevation gain
- **Real destinations**: Actual businesses and landmarks

## 🛠️ Development

### Environment Setup
```bash
# Required environment variables
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here
MAPBOX_USAGE_ENVIRONMENT=development
```

### Key Services
- **realPOIService**: OpenStreetMap integration
- **routeValidationService**: Walkability verification  
- **routeGenerationService**: Route creation with real POIs
- **geocodingService**: Location search and caching

### Testing
```bash
npm run build    # Test production build
npm run dev      # Development server
npm run test     # Run test suite
```

## 📊 Performance

### Caching Strategy
- **POI Cache**: 30-minute TTL, location-based
- **Route Cache**: Session-based for UX
- **Geocoding Cache**: 24-hour TTL

### API Optimization
- **Batch queries**: Multiple POI types in single request
- **Geographic filtering**: Targeted area searches
- **Intelligent fallbacks**: Graceful degradation

## 🔮 Future Enhancements

### Planned Features
- **Community Reviews**: User ratings and photos
- **Personal History**: Track completed walks
- **Social Sharing**: Share routes with friends
- **Offline Mode**: Download walks for offline use
- **Real-time Updates**: Live POI status

### Technical Improvements
- **Machine Learning**: Better POI recommendations
- **Enhanced Validation**: Weather and safety integration
- **Performance**: Faster generation and validation

## 🏃‍♂️ Getting Started

1. **Read the [System Overview](./SYSTEM_OVERVIEW.md)** to understand the architecture
2. **Check out the [Real POI System](./REAL_POI_SYSTEM.md)** for technical details
3. **Review the [Unified Map Interface](./UNIFIED_MAP_INTERFACE.md)** for UX patterns
4. **Set up your development environment** and start exploring!

## 📞 Support

For questions about the system architecture or implementation details, refer to the specific documentation files above. Each document provides comprehensive coverage of its respective area.

---

**StrollVibe** - Connecting people with real places through intelligent walking route discovery.