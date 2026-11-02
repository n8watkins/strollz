import { Calendar, User, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"

export default function BlogPage() {
  // Mock blog posts for demonstration
  const blogPosts = [
    {
      id: "1",
      title: "The Science Behind Walking and Mental Health",
      excerpt: "Discover how regular walking can boost your mood, reduce stress, and improve cognitive function according to the latest research.",
      author: "Dr. Sarah Mitchell",
      publishedAt: "2024-01-15",
      category: "Health & Wellness",
      image: "🧠",
      readTime: "5 min read"
    },
    {
      id: "2",
      title: "Building Community Through Walking Groups",
      excerpt: "Learn how walking groups are creating stronger neighborhoods and lasting friendships in cities around the world.",
      author: "Marcus Johnson",
      publishedAt: "2024-01-10",
      category: "Community",
      image: "🤝",
      readTime: "7 min read"
    },
    {
      id: "3",
      title: "Urban Walking: Finding Nature in the City",
      excerpt: "Tips and tricks for discovering green spaces, parks, and natural beauty during your urban walking adventures.",
      author: "Elena Rodriguez",
      publishedAt: "2024-01-08",
      category: "Urban Exploration",
      image: "🌳",
      readTime: "6 min read"
    },
    {
      id: "4",
      title: "Walking Safety: A Comprehensive Guide",
      excerpt: "Essential safety tips for solo walkers, group leaders, and everyone in between to ensure safe and enjoyable walking experiences.",
      author: "Officer Mike Thompson",
      publishedAt: "2024-01-05",
      category: "Safety",
      image: "🛡️",
      readTime: "8 min read"
    },
    {
      id: "5",
      title: "The Perfect Walking Route: Design Principles",
      excerpt: "What makes a walking route engaging and memorable? Explore the key elements that create unforgettable walking experiences.",
      author: "Lisa Chen",
      publishedAt: "2024-01-03",
      category: "Route Planning",
      image: "🗺️",
      readTime: "4 min read"
    },
    {
      id: "6",
      title: "Walking Through the Seasons: Year-Round Adventures",
      excerpt: "Embrace every season with our guide to walking through spring blooms, summer trails, autumn colors, and winter wonderlands.",
      author: "David Park",
      publishedAt: "2024-01-01",
      category: "Seasonal Walking",
      image: "🍂",
      readTime: "6 min read"
    }
  ]

  const categories = [
    "All Posts",
    "Health & Wellness",
    "Community",
    "Urban Exploration",
    "Safety",
    "Route Planning",
    "Seasonal Walking"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Walking Stories & 
            <span className="text-green-600"> Expert Tips</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover insights, stories, and practical advice from walking enthusiasts, 
            health experts, and community leaders around the world.
          </p>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                className={`${
                  index === 0 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "border-green-200 text-green-700 hover:bg-green-50"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        <div className="mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12">
                <div className="flex items-center mb-4">
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                    Featured
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {blogPosts[0].title}
                </h2>
                <p className="text-gray-600 mb-6">
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-6">
                  <User className="h-4 w-4 mr-2" />
                  <span className="mr-4">{blogPosts[0].author}</span>
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="mr-4">{blogPosts[0].publishedAt}</span>
                  <span>{blogPosts[0].readTime}</span>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Read Full Article
                </Button>
              </div>
              <div className="md:w-1/2 bg-green-100 flex items-center justify-center p-12">
                <div className="text-8xl">{blogPosts[0].image}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {blogPosts.slice(1).map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-green-100">
              <div className="p-6">
                <div className="text-4xl mb-4 text-center">{post.image}</div>
                <div className="flex items-center mb-3">
                  <Tag className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">{post.category}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <User className="h-4 w-4 mr-2" />
                  <span className="mr-4">{post.author}</span>
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="mr-4">{post.publishedAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                  <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                    Read More
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-green-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Stay Updated with Walking Tips</h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Get weekly walking tips, route recommendations, and community stories delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
            />
            <Button className="bg-white text-green-600 px-6 py-3 hover:bg-green-50">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}