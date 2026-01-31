import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { MapBounds, Post } from '../../types'

type UseFeedOptions = {
  bounds: MapBounds | null
  enabled?: boolean
  refreshToken?: number
}

export function useFeed({ bounds, enabled = true, refreshToken = 0 }: UseFeedOptions) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !bounds) return

    let active = true
    setLoading(true)
    setError(null)

    supabase
      .rpc('posts_in_bounds', {
        sw_lng: bounds.sw.lng,
        sw_lat: bounds.sw.lat,
        ne_lng: bounds.ne.lng,
        ne_lat: bounds.ne.lat
      })
      .then(({ data, error: rpcError }) => {
        if (!active) return
        if (rpcError) {
          setError(rpcError.message)
          setPosts([])
        } else {
          setPosts((data ?? []) as Post[])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [bounds, enabled, refreshToken])

  return { posts, loading, error }
}
