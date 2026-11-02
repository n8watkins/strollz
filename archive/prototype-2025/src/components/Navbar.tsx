"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, TreePine, User, LogOut, Settings, Heart } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Map", href: "/map" },
    { name: "Walks", href: "/walks" },
    { name: "Blog", href: "/blog" },
    { name: "Subscription", href: "/subscription" },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <TreePine className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-green-800">StrollVibe</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:block">
            {status === 'loading' ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="font-medium text-gray-700">
                    {session.user?.name?.split(' ')[0] || 'User'}
                  </span>
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        href="/profile/saved"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 mr-3" />
                        Saved Walks
                      </Link>
                      <Link
                        href="/profile/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin">
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-green-100">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-3 py-2">
              {status === 'loading' ? (
                <div className="animate-pulse bg-gray-200 h-10 w-full rounded"></div>
              ) : session ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900">
                      {session.user?.name || 'User'}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-green-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </Link>
                  <Link
                    href="/profile/saved"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-green-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="h-4 w-4 mr-3" />
                    Saved Walks
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:text-green-600"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}