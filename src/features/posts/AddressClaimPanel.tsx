import mapboxgl from 'mapbox-gl'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type AddressClaimPanelProps = {
  map: mapboxgl.Map | null
  onClaimed: () => void
}

export function AddressClaimPanel({ map, onClaimed }: AddressClaimPanelProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const claimAddress = async () => {
    if (!map) {
      setStatus('Map not ready.')
      return
    }

    const center = map.getCenter()
    setLoading(true)
    setStatus(null)

    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .insert({ geometry: `SRID=4326;POINT(${center.lng} ${center.lat})` })
      .select('id')
      .single()

    if (addressError) {
      setStatus(addressError.message)
      setLoading(false)
      return
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()

    const { error: claimError } = await supabase.from('address_claims').insert({
      address_id: address.id,
      expires_at: expiresAt
    })

    if (claimError) {
      setStatus(claimError.message)
    } else {
      setStatus('Address claimed.')
      onClaimed()
    }

    setLoading(false)
  }

  return (
    <div className="claim-panel">
      <div>
        <h3>Claim your address</h3>
        <p>Required to post Activities or Items.</p>
      </div>
      <button onClick={claimAddress} disabled={loading}>
        {loading ? 'Claiming…' : 'Claim current location'}
      </button>
      {status ? <span className="claim-panel__status">{status}</span> : null}
    </div>
  )
}
