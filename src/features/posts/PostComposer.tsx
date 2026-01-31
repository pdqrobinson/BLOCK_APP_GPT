import { useEffect, useMemo, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { supabase } from '../../lib/supabase'
import type { Post, PostType } from '../../types'
import { usePinPlacement } from '../map/usePinPlacement'

const options: { label: string; value: PostType }[] = [
  { label: 'Status', value: 'status' },
  { label: 'Ask a Neighbor', value: 'ask' }
]

type PostComposerProps = {
  map: mapboxgl.Map | null
  onCreated: () => void
  mode: 'auth' | 'guest'
  onLocalCreate?: (post: Post) => void
  hasClaim: boolean
  claimCenter?: { lng: number; lat: number } | null
  claimRadiusMiles?: number | null
}

export function PostComposer({
  map,
  onCreated,
  mode,
  onLocalCreate,
  hasClaim,
  claimCenter,
  claimRadiusMiles
}: PostComposerProps) {
  const [postType, setPostType] = useState<PostType>('status')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const { coords, setToCenter, setToLocation } = usePinPlacement(map, true)

  const center = useMemo(() => coords, [coords])

  const durationRange = useMemo(() => {
    if (postType === 'status') {
      return hasClaim ? { min: 1440, max: 1440 } : { min: 60, max: 60 }
    }
    if (postType === 'ask') {
      return hasClaim ? { min: 60, max: 10080 } : { min: 60, max: 60 }
    }
    return { min: 60, max: 60 }
  }, [hasClaim, postType])

  const [durationMinutes, setDurationMinutes] = useState(durationRange.min)

  useEffect(() => {
    setDurationMinutes(durationRange.min)
  }, [durationRange.min])

  const createPost = async () => {
    if (!center || !content.trim()) return
    setSubmitting(true)
    setStatus(null)

    if (hasClaim && claimCenter && claimRadiusMiles) {
      const distance = distanceMiles(center, claimCenter)
      if (distance > claimRadiusMiles) {
        setStatus('Pin must be inside your claimed block radius.')
        setSubmitting(false)
        return
      }
    }

    if (!hasClaim) {
      const location = await requestLocation()
      if (!location) {
        setStatus('Location permission required to post without a claim.')
        setSubmitting(false)
        return
      }
      if (distanceMiles(center, location) > 1) {
        setStatus('Pin must be within 1 mile of your current location.')
        setSubmitting(false)
        return
      }
    }

    if (mode === 'guest') {
      onLocalCreate?.({
        id: `guest-${crypto.randomUUID()}`,
        post_type: postType,
        content: content.trim(),
        geometry: `SRID=4326;POINT(${center.lng} ${center.lat})`
      })
      setStatus('Posted locally (guest mode).')
      setContent('')
      onCreated()
      setSubmitting(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setStatus('Sign in required.')
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      post_type: postType,
      content: content.trim(),
      geometry: `SRID=4326;POINT(${center.lng} ${center.lat})`,
      duration_minutes: durationMinutes,
      expires_at: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
      idempotency_key: crypto.randomUUID()
    })

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
    <div className="post-composer">
      <div className="post-composer__header">
        <span>New post</span>
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
      <textarea
        placeholder={postType === 'ask' ? 'Ask something nearby…' : "What's happening near you?"}
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
          {center
            ? `Pinned at ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`
            : 'Map not ready'}
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
