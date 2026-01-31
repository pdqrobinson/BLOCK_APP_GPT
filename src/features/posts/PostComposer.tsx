import { useMemo, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { supabase } from '../../lib/supabase'
import type { Post, PostType } from '../../types'

const options: { label: string; value: PostType }[] = [
  { label: 'Status', value: 'status' },
  { label: 'Ask a Neighbor', value: 'ask' }
]

type PostComposerProps = {
  map: mapboxgl.Map | null
  onCreated: () => void
  mode: 'auth' | 'guest'
  onLocalCreate?: (post: Post) => void
}

export function PostComposer({ map, onCreated, mode, onLocalCreate }: PostComposerProps) {
  const [postType, setPostType] = useState<PostType>('status')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [guestLocation, setGuestLocation] = useState<{ lng: number; lat: number } | null>(null)

  const center = useMemo(() => {
    if (!map) return null
    const c = map.getCenter()
    return { lng: c.lng, lat: c.lat }
  }, [map])

  const createPost = async () => {
    if (!center || !content.trim()) return
    setSubmitting(true)
    setStatus(null)

    if (mode === 'guest') {
      const useLocation = guestLocation ?? (await requestLocation())
      if (!useLocation) {
        setStatus('Location permission required to post in guest mode.')
        setSubmitting(false)
        return
      }

      onLocalCreate?.({
        id: `guest-${crypto.randomUUID()}`,
        post_type: postType,
        content: content.trim(),
        geometry: `SRID=4326;POINT(${useLocation.lng} ${useLocation.lat})`
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

  const requestLocation = async () => {
    if (!navigator.geolocation) return null

    return new Promise<{ lng: number; lat: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lng: position.coords.longitude, lat: position.coords.latitude }
          setGuestLocation(coords)
          resolve(coords)
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
      )
    })
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
      <div className="post-composer__footer">
        <span>
          {mode === 'guest'
            ? guestLocation
              ? `Using location ${guestLocation.lat.toFixed(4)}, ${guestLocation.lng.toFixed(4)}`
              : 'Location required for guest posts'
            : center
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
