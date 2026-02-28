// Database types - auto-generated from Supabase schema
// Run `npx supabase gen types typescript --project-id your-project-id > types/database.ts` to generate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trees: {
        Row: {
          id: string
          name: string
          slug: string
          species: string
          tree_type: 'ficus' | 'juniper' | 'maple' | 'pine' | 'elm' | 'cedar' | 'azalea' | 'bamboo' | 'other'
          price: number
          description: string
          short_description: string
          care_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          size: 'mini' | 'small' | 'medium' | 'large' | 'extra-large'
          age: number
          height: string
          pot_type: string
          images: string[]
          thumbnail: string
          model_3d_url: string | null
          features: string[]
          in_stock: boolean
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          species: string
          tree_type: 'ficus' | 'juniper' | 'maple' | 'pine' | 'elm' | 'cedar' | 'azalea' | 'bamboo' | 'other'
          price: number
          description: string
          short_description: string
          care_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          size: 'mini' | 'small' | 'medium' | 'large' | 'extra-large'
          age: number
          height: string
          pot_type: string
          images?: string[]
          thumbnail: string
          model_3d_url?: string | null
          features?: string[]
          in_stock?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          species?: string
          tree_type?: 'ficus' | 'juniper' | 'maple' | 'pine' | 'elm' | 'cedar' | 'azalea' | 'bamboo' | 'other'
          price?: number
          description?: string
          short_description?: string
          care_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          size?: 'mini' | 'small' | 'medium' | 'large' | 'extra-large'
          age?: number
          height?: string
          pot_type?: string
          images?: string[]
          thumbnail?: string
          model_3d_url?: string | null
          features?: string[]
          in_stock?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          password_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
