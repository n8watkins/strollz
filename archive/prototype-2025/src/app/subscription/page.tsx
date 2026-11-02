import { Check, X, Crown, Zap, MapPin, Users, Shield, Star, Sparkles, Rocket, Lock, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-full shadow-2xl">
                <Crown className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6">
              Walk <span className="text-green-600 relative">
                Unlimited
                <div className="absolute -top-4 -right-4">
                  <Sparkles className="h-8 w-8 text-yellow-400" />
                </div>
              </span>
            </h1>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              Free gets you started. <span className="font-bold text-green-600">Pro sets you free.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="px-12 py-6 text-xl border-2 border-green-600 text-green-600 hover:bg-green-50">
                See Comparison
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          
          {/* Free Plan */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gray-100 px-4 py-2 rounded-bl-2xl">
              <span className="text-sm font-semibold text-gray-600">STARTER</span>
            </div>
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Free Forever</h3>
              <div className="mb-6">
                <span className="text-6xl font-black text-gray-900">$0</span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
              <p className="text-gray-600">Perfect for casual walkers getting started</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-6 w-6 text-green-500 mr-4 mt-1" />
                <span className="text-gray-700">Join up to 3 walking groups</span>
              </li>
              <li className="flex items-start">
                <Check className="h-6 w-6 text-green-500 mr-4 mt-1" />
                <span className="text-gray-700">Create 5 routes per month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-6 w-6 text-green-500 mr-4 mt-1" />
                <span className="text-gray-700">Basic safety features</span>
              </li>
              <li className="flex items-start">
                <X className="h-6 w-6 text-red-400 mr-4 mt-1" />
                <span className="text-gray-400">No offline maps</span>
              </li>
              <li className="flex items-start">
                <X className="h-6 w-6 text-red-400 mr-4 mt-1" />
                <span className="text-gray-400">Limited weather features</span>
              </li>
            </ul>
            
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-4 text-lg font-semibold">
              Get Started Free
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl shadow-2xl border-2 border-green-500 p-8 relative overflow-hidden transform scale-105">
            <div className="absolute top-0 right-0 bg-yellow-400 px-4 py-2 rounded-bl-2xl">
              <span className="text-sm font-bold text-gray-900">MOST POPULAR</span>
            </div>
            <div className="absolute -top-10 -right-10 opacity-20">
              <Rocket className="h-32 w-32 text-white" />
            </div>
            
            <div className="mb-8 relative z-10">
              <h3 className="text-3xl font-bold text-white mb-4">StrollVibe Pro</h3>
              <div className="mb-6">
                <span className="text-6xl font-black text-white">$4.99</span>
                <span className="text-green-200 ml-2">/month</span>
              </div>
              <p className="text-green-100">Unlimited walking adventures await</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-6 w-6 text-green-300 mr-4 mt-1" />
                <span className="text-white font-medium">Unlimited walking groups</span>
              </li>
              <li className="flex items-start">
                <Check className="h-6 w-6 text-green-300 mr-4 mt-1" />
                <span className="text-white font-medium">Unlimited route creation</span>
              </li>
              <li className="flex items-start">
                <Check className="h-6 w-6 text-green-300 mr-4 mt-1" />
                <span className="text-white font-medium">Offline maps & navigation</span>
              </li>
              <li className="flex items-start">
                <Check className="h-6 w-6 text-green-300 mr-4 mt-1" />
                <span className="text-white font-medium">Advanced weather radar</span>
              </li>
              <li className="flex items-start">
                <Check className="h-6 w-6 text-green-300 mr-4 mt-1" />
                <span className="text-white font-medium">Priority safety features</span>
              </li>
            </ul>
            
            <Button className="w-full bg-white hover:bg-green-50 text-green-700 py-4 text-lg font-bold shadow-xl">
              Try Pro Free for 7 Days
            </Button>
          </div>
        </div>
      </div>

      {/* Features Deep Dive */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black text-gray-900 mb-6">
            Why <span className="text-green-600">Go Pro?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of your walking adventures
          </p>
        </div>

        {/* Feature 1 - Unlimited Groups */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <div>
            <div className="bg-green-100 rounded-full p-4 w-fit mb-6">
              <Users className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Join <span className="text-green-600">Every Group</span> You Want
            </h3>
            <p className="text-xl text-gray-600 mb-8">
              Free limits you to 3 groups. Pro removes all barriers.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-2 mr-4">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-gray-600">Free: Only 3 groups</span>
              </div>
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-4">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-900 font-semibold">Pro: Unlimited groups</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-12 shadow-2xl">
              <div className="text-center text-white">
                <div className="text-8xl mb-6">🚀</div>
                <p className="text-xl font-semibold">Join morning joggers, evening strollers, weekend hikers, photography walks, and more!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 - Offline Maps */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <div className="relative md:order-first">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-12 shadow-2xl">
              <div className="text-center text-white">
                <div className="text-8xl mb-6">📍</div>
                <p className="text-xl font-semibold">Never lose your way, even without signal</p>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-blue-100 rounded-full p-4 w-fit mb-6">
              <MapPin className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Walk <span className="text-blue-600">Anywhere</span>, Anytime
            </h3>
            <p className="text-xl text-gray-600 mb-8">
              Download maps for offline use. No signal? No problem.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-2 mr-4">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-gray-600">Free: Internet required</span>
              </div>
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-4">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-gray-900 font-semibold">Pro: Offline maps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 - Advanced Weather */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <div>
            <div className="bg-purple-100 rounded-full p-4 w-fit mb-6">
              <Zap className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Beat the <span className="text-purple-600">Weather</span>
            </h3>
            <p className="text-xl text-gray-600 mb-8">
              Advanced radar shows exactly when and where it'll rain.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-2 mr-4">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-gray-600">Free: Basic weather</span>
              </div>
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-2 mr-4">
                  <Check className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-gray-900 font-semibold">Pro: Advanced radar</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-12 shadow-2xl">
              <div className="text-center text-white">
                <div className="text-8xl mb-6">⛈️</div>
                <p className="text-xl font-semibold">Plan perfect walks with minute-by-minute forecasts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4 - Priority Safety */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <div className="relative md:order-first">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-12 shadow-2xl">
              <div className="text-center text-white">
                <div className="text-8xl mb-6">🚨</div>
                <p className="text-xl font-semibold">Enhanced safety with priority emergency response</p>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-red-100 rounded-full p-4 w-fit mb-6">
              <Shield className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Walk with <span className="text-red-600">Zero Worry</span>
            </h3>
            <p className="text-xl text-gray-600 mb-8">
              Priority safety features keep you protected on every adventure.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-2 mr-4">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-gray-600">Free: Basic safety</span>
              </div>
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-2 mr-4">
                  <Check className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-gray-900 font-semibold">Pro: Priority safety</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-6 shadow-2xl">
              <Heart className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-5xl font-black text-white mb-6">
            Ready to Walk <span className="text-green-200">Unlimited?</span>
          </h2>
          <p className="text-2xl text-green-100 mb-12">
            Join 50,000+ walkers who've upgraded to Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" className="bg-white hover:bg-green-50 text-green-700 px-12 py-6 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all">
              Start 7-Day Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-12 py-6 text-xl font-bold">
              Questions? Chat with Us
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8 text-green-200">
            <div className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              <span>30-day guarantee</span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              <span>4.8★ rating</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}