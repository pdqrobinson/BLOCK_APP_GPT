export type PostType = 'status' | 'ask' | 'activity' | 'item'

export type Post = {
  id: string
  post_type: PostType
  content: string
  created_at?: string
  geometry?: string | null
  address_id?: string | null
  item_kind?: 'food' | 'physical' | null
}

export type MapBounds = {
  sw: { lng: number; lat: number }
  ne: { lng: number; lat: number }
}
