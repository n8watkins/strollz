import { Button } from "@/components/ui/button"
import { MapPin, Users, Trophy, Shield, TreePine, Heart, Star, Quote, Mail, CheckCircle } from "lucide-react"
import Navbar from "@/components/Navbar"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-full">
                <TreePine className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Walk Together, <br />
            <span className="text-green-600">Explore More</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Turn your daily walks into social adventures. Join groups, make friends, and discover the best routes in your city.
          </p>
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg" asChild>
            <Link href="/discover">Discover Walks Near You - It's Free</Link>
          </Button>
          <p className="text-gray-500 mt-4">
            Join 10,000+ walkers who've made 50,000+ connections
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Walking Alone? You're Missing Half the Journey
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <div className="text-center p-6 bg-gradient-to-b from-green-50 to-white rounded-xl border border-green-100">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Lonely Miles</h3>
              <p className="text-gray-600">"I love walking but wish I had company"</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-green-50 to-white rounded-xl border border-green-100">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Same Old Routes</h3>
              <p className="text-gray-600">"I walk the same boring path every day"</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-green-50 to-white rounded-xl border border-green-100">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Intimidated by Running Groups</h3>
              <p className="text-gray-600">"I want to be active but running groups are too intense"</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-green-50 to-white rounded-xl border border-green-100">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TreePine className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Lost Potential</h3>
              <p className="text-gray-600">"I know there are better routes but don't know where"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Images */}
      <section className="bg-green-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Everything You Need for Better Walks
          </h2>
          
          {/* Feature 1 - Social Groups */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Join Vibrant Walking Communities</h3>
              <p className="text-lg text-gray-600 mb-6">
                Connect with fellow walkers in your area through our smart group matching system. Whether you're looking for morning power walks or leisurely evening strolls, there's a community waiting for you.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Instant group creation in 30 seconds</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Public & private groups for all preferences</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Built-in chat for coordination</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Recurring walks with automated reminders</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-green-100">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-600 text-sm">Walking group meeting at Central Park</p>
              </div>
            </div>
          </div>

          {/* Feature 2 - Route Discovery */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-green-100 md:order-first">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-600 text-sm">AI-powered route recommendations</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Discover Amazing Routes</h3>
              <p className="text-lg text-gray-600 mb-6">
                Our AI-powered system learns your preferences and suggests the perfect routes. From hidden urban gems to scenic nature trails, never walk the same boring path again.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Personalized AI recommendations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Community-curated paths with local insights</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Seasonal route suggestions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Multi-stop routes with cafes and viewpoints</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 - Safety */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Walk with Complete Confidence</h3>
              <p className="text-lg text-gray-600 mb-6">
                Your safety is our priority. Our comprehensive safety features ensure you can enjoy every walk with peace of mind, whether you're walking solo or in a group.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Real-time location sharing with trusted contacts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Emergency SOS with one-tap alerts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Buddy system for solo walkers</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Community-verified safe routes</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-green-100">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🛡️</div>
                <p className="text-gray-600 text-sm">Advanced safety features for peace of mind</p>
              </div>
            </div>
          </div>

          {/* Feature 4 - Challenges */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-green-100 md:order-first">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-gray-600 text-sm">Achievements and walking challenges</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Stay Motivated & Have Fun</h3>
              <p className="text-lg text-gray-600 mb-6">
                Turn your walking routine into an engaging adventure with our gamification features. Earn badges, compete with friends, and celebrate your achievements.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Daily and weekly walking streaks</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Group challenges and competitions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>Milestone badges and achievements</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-1" />
                  <span>City-wide leaderboards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Real Stories from Real Walkers
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Discover how StrollVibe has transformed the walking experience for thousands of users worldwide.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-50 rounded-xl p-8 border border-green-100">
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-green-600 mr-3" />
                <div className="flex text-green-600">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "I moved to Seattle knowing nobody. Three months later, I have a walking group that meets every Tuesday and Thursday. We've become real friends!"
              </p>
              <div className="flex items-center">
                <div className="bg-green-200 rounded-full p-3 mr-4">
                  <div className="text-2xl">👩‍💻</div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah M.</p>
                  <p className="text-gray-600 text-sm">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-8 border border-green-100">
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-green-600 mr-3" />
                <div className="flex text-green-600">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "As a retiree, StrollVibe gave me structure and community. Our morning walking group is the highlight of my day. I've never felt more connected to my neighborhood."
              </p>
              <div className="flex items-center">
                <div className="bg-green-200 rounded-full p-3 mr-4">
                  <div className="text-2xl">👨‍🏫</div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Robert K.</p>
                  <p className="text-gray-600 text-sm">Retired Teacher</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-8 border border-green-100">
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-green-600 mr-3" />
                <div className="flex text-green-600">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                "I've discovered parts of my city I never knew existed. The AI recommendations are spot-on for my fitness level, and the safety features give me confidence to explore."
              </p>
              <div className="flex items-center">
                <div className="bg-green-200 rounded-full p-3 mr-4">
                  <div className="text-2xl">👩‍💼</div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Maya P.</p>
                  <p className="text-gray-600 text-sm">Marketing Manager</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">50K+</div>
                <p className="text-gray-600">Active Walkers</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
                <p className="text-gray-600">Cities</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">2M+</div>
                <p className="text-gray-600">Miles Walked Together</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">4.8★</div>
                <p className="text-gray-600">App Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-green-600 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <Mail className="h-16 w-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">
            Stay Connected with the Walking Community
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Get weekly walking tips, route recommendations, community highlights, and exclusive access to new features. Join our newsletter family of passionate walkers.
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 border-0 focus:ring-2 focus:ring-green-300"
              />
              <Button className="bg-white text-green-600 px-6 py-3 hover:bg-green-50">
                Subscribe
              </Button>
            </div>
            <p className="text-green-200 text-sm mt-4">
              No spam, ever. Unsubscribe anytime with one click.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Ready to Transform Your Walking Experience?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands who've made walking their favorite social activity. Your next adventure starts with a single step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg" asChild>
              <Link href="/discover">Start Your First Walk - It's Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 border-green-200 text-green-700 hover:bg-green-50 text-lg" asChild>
              <Link href="/discover">Explore Walks Now</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
            <div className="flex items-center justify-center">
              <Shield className="h-4 w-4 mr-2 text-green-600" />
              <span>Your data is secure</span>
            </div>
            <div className="flex items-center justify-center">
              <MapPin className="h-4 w-4 mr-2 text-green-600" />
              <span>Location used only during walks</span>
            </div>
            <div className="flex items-center justify-center">
              <Users className="h-4 w-4 mr-2 text-green-600" />
              <span>No spam, ever</span>
            </div>
            <div className="flex items-center justify-center">
              <Trophy className="h-4 w-4 mr-2 text-green-600" />
              <span>4.8 rating from 10,000+ reviews</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
