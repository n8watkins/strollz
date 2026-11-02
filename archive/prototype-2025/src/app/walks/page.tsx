import { MapPin, Clock, Users, Star, Compass, TreePine } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"

export default function WalksPage() {
  const featuredWalks = [
    {
      title: "Riverside Morning Stroll",
      location: "Central Park Area",
      duration: "45 min",
      difficulty: "Easy",
      participants: 12,
      rating: 4.8,
      image: "🌅",
      description: "Start your day with a peaceful walk along the river with fellow early risers.",
      tags: ["Scenic", "Morning", "Peaceful"]
    },
    {
      title: "Urban Forest Discovery",
      location: "Green Hills District",
      duration: "1.5 hours",
      difficulty: "Moderate",
      participants: 8,
      rating: 4.9,
      image: "🌲",
      description: "Explore hidden trails and discover urban wildlife in the heart of the city.",
      tags: ["Nature", "Wildlife", "Adventure"]
    },
    {
      title: "Historic Downtown Loop",
      location: "Historic Quarter",
      duration: "1 hour",
      difficulty: "Easy",
      participants: 15,
      rating: 4.7,
      image: "🏛️",
      description: "Walk through centuries of history while getting your daily steps in.",
      tags: ["Historical", "Cultural", "Educational"]
    },
    {
      title: "Sunset Hill Climb",
      location: "Overlook Point",
      duration: "2 hours",
      difficulty: "Challenging",
      participants: 6,
      rating: 4.9,
      image: "🌄",
      description: "Challenge yourself with a rewarding climb to catch the perfect sunset.",
      tags: ["Challenging", "Scenic", "Sunset"]
    },
    {
      title: "Neighborhood Food Tour",
      location: "Arts District",
      duration: "2.5 hours",
      difficulty: "Easy",
      participants: 10,
      rating: 4.6,
      image: "🍽️",
      description: "Combine walking with local flavors on this delicious neighborhood tour.",
      tags: ["Food", "Local", "Social"]
    },
    {
      title: "Beach Boardwalk Walk",
      location: "Coastal Area",
      duration: "1 hour",
      difficulty: "Easy",
      participants: 20,
      rating: 4.8,
      image: "🏖️",
      description: "Enjoy ocean views and fresh sea air on this relaxing coastal walk.",
      tags: ["Beach", "Relaxing", "Scenic"]
    }
  ]

  const categories = [
    { name: "Nature Walks", icon: TreePine, count: 24 },
    { name: "Urban Exploring", icon: Compass, count: 18 },
    { name: "Morning Walks", icon: Clock, count: 15 },
    { name: "Group Adventures", icon: Users, count: 32 },
    { name: "Scenic Routes", icon: MapPin, count: 28 },
    { name: "Challenging Hikes", icon: Star, count: 12 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Discover Amazing 
            <span className="text-green-600"> Walking Routes</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Explore curated walks in your area, join group adventures, and discover hidden gems 
            with fellow walking enthusiasts.
          </p>
          <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
            Find Walks Near You
          </Button>
        </div>

        {/* Categories */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <div key={index} className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-shadow border border-green-100 cursor-pointer">
                  <Icon className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.count} walks</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Featured Walks */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Featured Walks</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredWalks.map((walk, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-green-100">
                <div className="p-6">
                  <div className="text-4xl mb-4 text-center">{walk.image}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{walk.title}</h3>
                  <p className="text-gray-600 mb-4">{walk.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {walk.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      {walk.duration} • {walk.difficulty}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {walk.participants} participants
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      {walk.rating} rating
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {walk.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Join This Walk
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-green-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Create Your Own Walking Group</h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Don't see a walk that fits your style? Create your own group and invite others to join your walking adventure.
          </p>
          <Button className="bg-white text-green-600 px-8 py-3 hover:bg-green-50">
            Start a Walking Group
          </Button>
        </div>
      </div>
    </div>
  )
}