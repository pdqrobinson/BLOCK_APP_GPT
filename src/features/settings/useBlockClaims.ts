import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export type BlockClaim = {
  id: string
  center: string
  radius_miles: number
  active: boolean
  created_at: string
}

export function useBlockClaims(enabled: boolean) {
  const [claims, setClaims] = useState<BlockClaim[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadClaims = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('block_claims')
      .select('id, center, radius_miles, active, created_at')
      .order('updated_at', { ascending: false })

    if (error) {
      setError(error.message)
      setClaims([])
    } else {
      setClaims((data ?? []) as BlockClaim[])
    }

    setLoading(false)
  }, [enabled])

  const deactivateClaim = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('block_claims')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    await loadClaims()
  }, [loadClaims])

  const createClaim = useCallback(
    async (center: string, radiusMiles: number) => {
      const { error } = await supabase.from('block_claims').insert({
        center,
        radius_miles: radiusMiles,
        active: true
      })

      if (error) throw error
      await loadClaims()
    },
    [loadClaims]
  )

  useEffect(() => {
    void loadClaims()
  }, [loadClaims])

  return { claims, loading, error, createClaim, deactivateClaim, reload: loadClaims }
}
