import type { PublicTree, Tree } from '~/types'

/**
 * A `trees` row as Supabase returns it: snake_case, untyped at the boundary.
 */
export interface TreeRow {
  id: string
  name: string
  slug: string
  species: string
  tree_type: string
  price: number
  description: string
  short_description: string
  care_level: string
  size: string
  age: number
  height: string
  pot_type: string
  images: string[]
  thumbnail: string
  model_3d_url?: string | null
  features: string[]
  in_stock: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

/**
 * Consumer-facing shape.
 *
 * Price is deliberately absent. `PublicTree = Omit<Tree, 'price'>` enforces that
 * at compile time only — this function is what enforces it at runtime, which is
 * why every public handler must map through here rather than spreading the row.
 */
export function mapPublicTreeRow(row: TreeRow): PublicTree {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    species: row.species,
    treeType: row.tree_type as PublicTree['treeType'],
    description: row.description,
    shortDescription: row.short_description,
    careLevel: row.care_level as PublicTree['careLevel'],
    size: row.size as PublicTree['size'],
    age: row.age,
    height: row.height,
    potType: row.pot_type,
    images: row.images,
    thumbnail: row.thumbnail,
    model3dUrl: row.model_3d_url ?? undefined,
    features: row.features,
    inStock: row.in_stock,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Admin shape — identical to the public one plus `price`.
 */
export function mapAdminTreeRow(row: TreeRow): Tree {
  return {
    ...mapPublicTreeRow(row),
    price: row.price,
  }
}

export function mapPublicTreeRows(rows: TreeRow[] | null): PublicTree[] {
  return (rows ?? []).map(mapPublicTreeRow)
}

export function mapAdminTreeRows(rows: TreeRow[] | null): Tree[] {
  return (rows ?? []).map(mapAdminTreeRow)
}
