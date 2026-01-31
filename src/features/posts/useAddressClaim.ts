import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type ClaimState = {
  addressId: string | null
  expiresAt: string | null
  loading: boolean
  error: string | null
}

export function useAddressClaim(enabled: boolean) {
  const [state, setState] = useState<ClaimState>({
    addressId: null,
    expiresAt: null,
    loading: false,
    error: null
  })

  const loadClaim = useCallback(async () => {
    if (!enabled) return
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase
      .from('address_claims')
      .select('address_id, expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      setState({ addressId: null, expiresAt: null, loading: false, error: error.message })
      return
    }

    setState({
      addressId: data?.address_id ?? null,
      expiresAt: data?.expires_at ?? null,
      loading: false,
      error: null
    })
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void loadClaim()
  }, [enabled, loadClaim])

  return { ...state, reload: loadClaim }
}
