import { Users, MapPin, Trophy, Shield, Camera, Bell } from "lucide-react"
import Navbar from "@/components/Navbar"

export default function FeaturesPage() {
  const features = [
    {
      icon: Users,
      title: "Social Walking Groups",
      description: "Join vibrant communities of walkers in your area",
      details: [
        "Instant group creation in 30 seconds",
        "Public & private groups for all preferences",
        "Group chat for pre-walk planning",
        "Recurring walks with automated reminders"
      ]
    },
    {
      icon: MapPin,
      title: "Smart Route Discovery",
      description: "AI-powered recommendations for the perfect walk",
      details: [
        "Personalized routes based on your fitness level",
        "Community-curated paths with local insights",
        "Seasonal route suggestions",
        "Multi-stop routes with cafes and viewpoints"
      ]
    },
    {
      icon: Trophy,
      title: "Challenges & Rewards",
      description: "Stay motivated with fun walking achievements",
      details: [
        "Daily and weekly walking streaks",
        "Group challenges and competitions",
        "Milestone badges and achievements",
        "City-wide leaderboards"
      ]
    },
    {
      icon: Shield,
      title: "Safety & Security",
      description: "Walk with confidence using our safety features",
      details: [
        "Real-time location sharing with groups",
        "Emergency SOS with one-tap alerts",
        "Buddy system for solo walkers",
        "Community-verified safe routes"
      ]
    },
    {
      icon: Camera,
      title: "Photo Sharing",
      description: "Capture and share your walking adventures",
      details: [
        "In-app photo sharing with groups",
        "Route photo galleries",
        "Nature spotting features",
        "Community photo challenges"
      ]
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay connected without being overwhelmed",
      details: [
        "Group walk reminders",
        "Weather alerts for your routes",
        "Achievement notifications",
        "Safety check-ins for solo walks"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need for 
            <span className="text-green-600"> Better Walks</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            StrollVibe combines social connection, route discovery, and safety features 
            to transform your daily walks into extraordinary adventures.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 border border-green-100">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 rounded-lg p-3 mr-4">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700 text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="bg-green-600 rounded-2xl p-8 md:p-12 text-center text-white mt-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Walks?</h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of walkers who've discovered the joy of social walking with StrollVibe's comprehensive feature set.
          </p>
          <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            Start Your Walking Journey
          </button>
        </div>
      </div>
    </div>
  )
}