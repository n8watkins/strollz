import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types for type safety
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  walking_level: 'beginner' | 'intermediate' | 'advanced' | null
  preferred_walking_times: string[] | null
  location_city: string | null
  safety_contacts: SafetyContact[] | null
  privacy_settings: PrivacySettings | null
  provider: string | null
  created_at: string
  updated_at: string
}

export interface SafetyContact {
  name: string
  phone: string
  relationship: string
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private'
  location_sharing: 'always' | 'walking_only' | 'never'
  allow_group_invites: boolean
  show_walking_stats: boolean
}

export interface UserWalk {
  id: string
  user_id: string
  walk_id: string
  saved_at: string
  notes: string | null
}

export interface UserPreferences {
  id: string
  user_id: string
  duration_preference: 'all' | 'short' | 'medium' | 'long'
  difficulty_preference: 'all' | 'easy' | 'moderate' | 'challenging'
  scenery_preference: string[] | null
  notification_settings: NotificationSettings | null
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  group_invites: boolean
  walk_reminders: boolean
  safety_alerts: boolean
}

// Helper functions for user management
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
    return false
  }

  return true
}

export async function getUserSavedWalks(userId: string): Promise<string[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('user_walks')
    .select('walk_id')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching saved walks:', error)
    return []
  }

  return data.map(item => item.walk_id)
}

export async function saveWalkForUser(userId: string, walkId: string, notes?: string): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from('user_walks')
    .insert({
      user_id: userId,
      walk_id: walkId,
      notes: notes || null
    })

  if (error) {
    console.error('Error saving walk:', error)
    return false
  }

  return true
}

export async function removeSavedWalk(userId: string, walkId: string): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from('user_walks')
    .delete()
    .eq('user_id', userId)
    .eq('walk_id', walkId)

  if (error) {
    console.error('Error removing saved walk:', error)
    return false
  }

  return true
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user preferences:', error)
    return null
  }

  return data
}

export async function updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error updating user preferences:', error)
    return false
  }

  return true
}