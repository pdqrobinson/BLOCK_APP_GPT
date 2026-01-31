import mapboxgl from 'mapbox-gl'
import { useState } from 'react'
import { usePinPlacement } from '../map/usePinPlacement'

type BlockClaimPanelProps = {
  map: mapboxgl.Map | null
  onCreate: (center: string, radiusMiles: number) => Promise<void>
}

export function BlockClaimPanel({ map, onCreate }: BlockClaimPanelProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [radius, setRadius] = useState(1)
  const { coords, setToCenter, setToLocation } = usePinPlacement(map, true)

  const submit = async () => {
    if (!coords) {
      setStatus('Map not ready.')
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      await onCreate(`SRID=4326;POINT(${coords.lng} ${coords.lat})`, radius)
      setStatus('Block claimed.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Claim failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="claim-panel">
      <div>
        <h3>Claim a block</h3>
        <p>Pick a center point and radius (1–3 miles).</p>
      </div>
      <div className="post-composer__pin">
        <button type="button" onClick={setToCenter}>Use map center</button>
        <button type="button" onClick={setToLocation}>Use my location</button>
      </div>
      <label className="claim-panel__radius">
        Radius
        <input
          type="range"
          min={1}
          max={3}
          step={0.5}
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
        <span>{radius.toFixed(1)} miles</span>
      </label>
      <button onClick={submit} disabled={loading}>
        {loading ? 'Claiming…' : 'Claim block'}
      </button>
      {status ? <span className="claim-panel__status">{status}</span> : null}
    </div>
  )
}
