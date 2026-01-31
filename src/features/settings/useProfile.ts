import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export type Profile = {
  user_id: string
  zip_code: string | null
  zip_lat: number | null
  zip_lng: number | null
}

const ZIP_API = 'https://api.zippopotam.us/us/'

export function useProfile(enabled: boolean) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, zip_code, zip_lat, zip_lng')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      setError(error.message)
    }

    setProfile(
      data ?? {
        user_id: userId,
        zip_code: null,
        zip_lat: null,
        zip_lng: null
      }
    )
    setLoading(false)
  }, [enabled])

  const updateZip = useCallback(async (zip: string) => {
    const normalized = zip.trim()
    if (!normalized) throw new Error('ZIP code required')

    const response = await fetch(`${ZIP_API}${normalized}`)
    if (!response.ok) {
      throw new Error('ZIP lookup failed')
    }

    const data = await response.json()
    const place = data?.places?.[0]
    if (!place) {
      throw new Error('ZIP not found')
    }

    const zipLat = Number(place.latitude)
    const zipLng = Number(place.longitude)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) throw new Error('Sign in required')

    const { error } = await supabase.from('profiles').upsert({
      user_id: userId,
      zip_code: normalized,
      zip_lat: zipLat,
      zip_lng: zipLng,
      updated_at: new Date().toISOString()
    })

    if (error) throw error

    setProfile({ user_id: userId, zip_code: normalized, zip_lat: zipLat, zip_lng: zipLng })
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  return { profile, loading, error, updateZip, reload: loadProfile }
}
