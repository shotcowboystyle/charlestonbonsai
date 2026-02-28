// Tree type categories
export type TreeType
  = | 'ficus'
    | 'juniper'
    | 'maple'
    | 'pine'
    | 'elm'
    | 'cedar'
    | 'azalea'
    | 'bamboo'
    | 'other'

// Care level difficulty
export type CareLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

// Tree size categories
export type TreeSize = 'mini' | 'small' | 'medium' | 'large' | 'extra-large'

// Sort options for gallery
export type SortOption = 'price-asc' | 'price-desc' | 'name' | 'newest' | 'oldest'

// Main tree/listing interface
export interface Tree {
  id: string
  name: string
  slug: string
  species: string
  treeType: TreeType
  price: number
  description: string
  shortDescription: string
  careLevel: CareLevel
  size: TreeSize
  age: number
  height: string
  potType: string
  images: string[]
  thumbnail: string
  model3dUrl?: string
  features: string[]
  inStock: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

// Filter state for gallery
export interface FilterState {
  sizes: TreeSize[]
  careLevels: CareLevel[]
  treeTypes: TreeType[]
  priceRange: [number, number]
  search: string
  sortBy: SortOption
  inStockOnly: boolean
}

// API response types
export interface TreesResponse {
  trees: Tree[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Admin auth types
export interface AdminUser {
  id: string
  email: string
  createdAt: string
}

export interface AuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Form types for admin
export interface TreeFormData {
  name: string
  species: string
  treeType: TreeType
  price: number
  description: string
  shortDescription: string
  careLevel: CareLevel
  size: TreeSize
  age: number
  height: string
  potType: string
  features: string[]
  inStock: boolean
  featured: boolean
  images: string[]
  model3dUrl?: string
}

// Type guards
export function isTreeType(value: string): value is TreeType {
  return ['ficus', 'juniper', 'maple', 'pine', 'elm', 'cedar', 'azalea', 'bamboo', 'other'].includes(value)
}

export function isCareLevel(value: string): value is CareLevel {
  return ['beginner', 'intermediate', 'advanced', 'expert'].includes(value)
}

export function isTreeSize(value: string): value is TreeSize {
  return ['mini', 'small', 'medium', 'large', 'extra-large'].includes(value)
}

// Label mappings for display
export const TREE_TYPE_LABELS: Record<TreeType, string> = {
  ficus: 'Ficus',
  juniper: 'Juniper',
  maple: 'Maple',
  pine: 'Pine',
  elm: 'Elm',
  cedar: 'Cedar',
  azalea: 'Azalea',
  bamboo: 'Bamboo',
  other: 'Other',
}

export const CARE_LEVEL_LABELS: Record<CareLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
}

export const TREE_SIZE_LABELS: Record<TreeSize, string> = {
  'mini': 'Mini (< 6")',
  'small': 'Small (6-10")',
  'medium': 'Medium (10-16")',
  'large': 'Large (16-24")',
  'extra-large': 'Extra Large (24"+)',
}

export const SORT_OPTIONS: { value: SortOption, label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
]
