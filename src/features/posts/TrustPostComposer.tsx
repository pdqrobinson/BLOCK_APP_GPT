import mapboxgl from 'mapbox-gl'
import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { PostType } from '../../types'

type TrustPostComposerProps = {
  map: mapboxgl.Map | null
  addressId: string
  onCreated: () => void
}

const options: { label: string; value: PostType }[] = [
  { label: 'Activity', value: 'activity' },
  { label: 'Item', value: 'item' }
]

export function TrustPostComposer({ map, addressId, onCreated }: TrustPostComposerProps) {
  const [postType, setPostType] = useState<PostType>('activity')
  const [itemKind, setItemKind] = useState<'food' | 'physical'>('food')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const center = useMemo(() => {
    if (!map) return null
    const c = map.getCenter()
    return { lng: c.lng, lat: c.lat }
  }, [map])

  const createPost = async () => {
    if (!center || !content.trim()) return
    setSubmitting(true)
    setStatus(null)

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
      idempotency_key: crypto.randomUUID(),
      address_id: addressId
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
