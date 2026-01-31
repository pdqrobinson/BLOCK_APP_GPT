import { useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export function usePresence(user: User | null) {
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    if (!user || !navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now()
        if (now - lastUpdateRef.current < 30000) return
        lastUpdateRef.current = now

        const { latitude, longitude } = position.coords
        await supabase.from('user_presence').upsert(
          {
            user_id: user.id,
            geometry: `SRID=4326;POINT(${longitude} ${latitude})`,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
      },
      (error) => {
        console.warn('Presence update failed', error)
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [user])
}
