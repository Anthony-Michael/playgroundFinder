export type Amenities = {
  shade: boolean
  washrooms: boolean
  splash_pad: boolean
  parking: boolean
  baby_swings: boolean
  climbing: boolean
  slides: boolean
  benches: boolean
}

export type Playground = {
  id: string
  name: string
  lat: number
  lng: number
  google_place_id: string
  avg_rating: number
  rating_count: number
  city: string | null
  country: 'CA' | 'US' | null
  created_at: string
}

export type Rating = {
  id: string
  playground_id: string
  user_id: string
  stars: number
  amenities: Amenities
  comment: string | null
  created_at: string
  users?: { display_name: string }
}

export type UserProfile = {
  id: string
  display_name: string
  created_at: string
}

export type SeededTile = {
  tile: string
  seeded_at: string
}

export type Database = {
  public: {
    Tables: {
      playgrounds: { Row: Playground; Insert: Omit<Playground, 'id' | 'created_at' | 'avg_rating' | 'rating_count'>; Update: Partial<Playground> }
      ratings: { Row: Rating; Insert: Omit<Rating, 'id' | 'created_at'>; Update: Partial<Rating> }
      users: { Row: UserProfile; Insert: Omit<UserProfile, 'created_at'>; Update: Partial<UserProfile> }
      seeded_tiles: { Row: SeededTile; Insert: SeededTile; Update: Partial<SeededTile> }
    }
  }
}
