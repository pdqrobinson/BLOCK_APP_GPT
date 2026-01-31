import mapboxgl from 'mapbox-gl'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { PostType } from '../../types'
import { usePinPlacement } from '../map/usePinPlacement'

type TrustPostComposerProps = {
  map: mapboxgl.Map | null
  onCreated: () => void
  claimCenter?: { lng: number; lat: number } | null
  claimRadiusMiles?: number | null
}

const options: { label: string; value: PostType }[] = [
  { label: 'Activity', value: 'activity' },
  { label: 'Item', value: 'item' }
]

export function TrustPostComposer({ map, onCreated, claimCenter, claimRadiusMiles }: TrustPostComposerProps) {
  const [postType, setPostType] = useState<PostType>('activity')
  const [itemKind, setItemKind] = useState<'food' | 'physical'>('food')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const { coords, setToCenter, setToLocation } = usePinPlacement(map, true)

  const center = useMemo(() => coords, [coords])

  const durationRange = useMemo(() => {
    if (postType === 'activity') return { min: 60, max: 10080 }
    if (postType === 'item' && itemKind === 'food') return { min: 1440, max: 1440 }
    return { min: 1440, max: 43200 }
  }, [itemKind, postType])

  const [durationMinutes, setDurationMinutes] = useState(durationRange.min)

  useEffect(() => {
    setDurationMinutes(durationRange.min)
  }, [durationRange.min])

  const createPost = async () => {
    if (!center || !content.trim()) return
    setSubmitting(true)
    setStatus(null)

    if (claimCenter && claimRadiusMiles) {
      const distance = distanceMiles(center, claimCenter)
      if (distance > claimRadiusMiles) {
        setStatus('Pin must be inside your claimed block radius.')
        setSubmitting(false)
        return
      }
    }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setStatus('Sign in required.')
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      user_id: userId,
      post_type: postType,
      content: content.trim(),
      geometry: `SRID=4326;POINT(${center.lng} ${center.lat})`,
      duration_minutes: durationMinutes,
      expires_at: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
      idempotency_key: crypto.randomUUID()
    }

    if (postType === 'item') {
      payload.item_kind = itemKind
    }

    const { error } = await supabase.from('posts').insert(payload)

    if (error) {
      setStatus(error.message)
    } else {
      setStatus('Posted!')
      setContent('')
      onCreated()
    }

    setSubmitting(false)
  }

  return (
    <div className="post-composer trust">
      <div className="post-composer__header">
        <span>Trust posts</span>
        <div className="post-composer__types">
          {options.map((option) => (
            <button
              key={option.value}
              className={postType === option.value ? 'is-active' : ''}
              onClick={() => setPostType(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {postType === 'item' ? (
        <div className="post-composer__item-kind">
          <button
            className={itemKind === 'food' ? 'is-active' : ''}
            onClick={() => setItemKind('food')}
          >
            Food
          </button>
          <button
            className={itemKind === 'physical' ? 'is-active' : ''}
            onClick={() => setItemKind('physical')}
          >
            Physical
          </button>
        </div>
      ) : null}
      <textarea
        placeholder={postType === 'activity' ? 'Plan an activity nearby…' : 'Describe the item…'}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
      />
      <div className="post-composer__pin">
        <button type="button" onClick={setToCenter}>Use map center</button>
        <button type="button" onClick={setToLocation}>Use my location</button>
      </div>
      <div className="post-composer__duration">
        <label>
          Duration
          <input
            type="range"
            min={durationRange.min}
            max={durationRange.max}
            step={60}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            disabled={durationRange.min === durationRange.max}
          />
          <span>{Math.round(durationMinutes / 60)}h</span>
        </label>
      </div>
      <div className="post-composer__footer">
        <span>
          {center ? `Pinned at ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : 'Map not ready'}
        </span>
        <button onClick={createPost} disabled={submitting || !content.trim() || !center}>
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>
      {status ? <div className="post-composer__status">{status}</div> : null}
    </div>
  )
}

function distanceMiles(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
