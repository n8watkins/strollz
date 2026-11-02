import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Session } from 'next-auth'
import { UserProfile } from '@/lib/supabase'

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

interface UserState {
  // Authentication state
  session: Session | null
  profile: UserProfile | null
  isAuthenticated: boolean
  
  // Local state (persisted for anonymous users)
  savedWalks: Set<string>
  userLocation: [number, number] | null
  preferences: {
    preferredDuration: string
    preferredDifficulty: string
    preferredScenery: string[]
  }
  
  // Actions
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  saveWalk: (walkId: string) => void
  unsaveWalk: (walkId: string) => void
  toggleSaveWalk: (walkId: string) => void
  setUserLocation: (location: [number, number]) => void
  updatePreferences: (preferences: Partial<UserState['preferences']>) => void
  clearSavedWalks: () => void
  syncWithServer: () => Promise<void>
  signOut: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Authentication state
      session: null,
      profile: null,
      isAuthenticated: false,
      
      // Local state
      savedWalks: new Set(),
      userLocation: null,
      preferences: {
        preferredDuration: 'medium',
        preferredDifficulty: 'easy',
        preferredScenery: []
      },

      setSession: (session) =>
        set({ 
          session, 
          isAuthenticated: !!session 
        }),

      setProfile: (profile) =>
        set({ profile }),

      saveWalk: (walkId: string) => {
        const { isAuthenticated, session } = get()
        set((state) => ({
          savedWalks: new Set([...Array.from(state.savedWalks), walkId])
        }))
        
        // If authenticated, also save to server
        if (isAuthenticated && session?.user?.id) {
          import('@/lib/supabase').then(({ saveWalkForUser }) => {
            saveWalkForUser(session.user.id, walkId)
          })
        }
      },

      unsaveWalk: (walkId: string) => {
        const { isAuthenticated, session } = get()
        set((state) => {
          const newSavedWalks = new Set(state.savedWalks)
          newSavedWalks.delete(walkId)
          return { savedWalks: newSavedWalks }
        })
        
        // If authenticated, also remove from server
        if (isAuthenticated && session?.user?.id) {
          import('@/lib/supabase').then(({ removeSavedWalk }) => {
            removeSavedWalk(session.user.id, walkId)
          })
        }
      },

      toggleSaveWalk: (walkId: string) => {
        const { savedWalks } = get()
        if (savedWalks.has(walkId)) {
          get().unsaveWalk(walkId)
        } else {
          get().saveWalk(walkId)
        }
      },

      setUserLocation: (location: [number, number]) =>
        set({ userLocation: location }),

      updatePreferences: (newPreferences) => {
        const { isAuthenticated, session } = get()
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        }))
        
        // If authenticated, also save to server
        if (isAuthenticated && session?.user?.id) {
          import('@/lib/supabase').then(({ updateUserPreferences }) => {
            updateUserPreferences(session.user.id, {
              duration_preference: newPreferences.preferredDuration as 'all' | 'short' | 'medium' | 'long' || 'all',
              difficulty_preference: newPreferences.preferredDifficulty as 'all' | 'easy' | 'moderate' | 'challenging' || 'all',
              scenery_preference: newPreferences.preferredScenery || null
            })
          })
        }
      },

      clearSavedWalks: () =>
        set({ savedWalks: new Set() }),

      syncWithServer: async () => {
        const { session, isAuthenticated } = get()
        if (!isAuthenticated || !session?.user?.id) return

        try {
          const { getUserSavedWalks, getUserPreferences } = await import('@/lib/supabase')
          
          // Sync saved walks
          const serverWalks = await getUserSavedWalks(session.user.id)
          set({ savedWalks: new Set(serverWalks) })
          
          // Sync preferences
          const serverPreferences = await getUserPreferences(session.user.id)
          if (serverPreferences) {
            set({
              preferences: {
                preferredDuration: serverPreferences.duration_preference || 'medium',
                preferredDifficulty: serverPreferences.difficulty_preference || 'easy',
                preferredScenery: serverPreferences.scenery_preference || []
              }
            })
          }
        } catch (error) {
          console.error('Failed to sync with server:', error)
        }
      },

      signOut: () => {
        set({
          session: null,
          profile: null,
          isAuthenticated: false,
          savedWalks: new Set(),
          preferences: {
            preferredDuration: 'medium',
            preferredDifficulty: 'easy',
            preferredScenery: []
          }
        })
      }
    }),
    {
      name: 'stroll-vibe-user-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        }
      }),
      partialize: (state) => ({
        savedWalks: Array.from(state.savedWalks),
        preferences: state.preferences,
        userLocation: state.userLocation
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.savedWalks)) {
          state.savedWalks = new Set(state.savedWalks)
        }
      },
      skipHydration: true
    }
  )
)