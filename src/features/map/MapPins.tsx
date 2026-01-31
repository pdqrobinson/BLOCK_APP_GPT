import { useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Post } from '../../types'

type MapPinsProps = {
  map: mapboxgl.Map | null
  posts: Post[]
  selectedPostId: string | null
  onSelect: (postId: string) => void
}

function parsePoint(geometry?: string | null) {
  if (!geometry) return null
  const match = geometry.match(/POINT\((-?\d+\.?\d*)\s+(-?\d+\.?\d*)\)/i)
  if (!match) return null
  return { lng: Number(match[1]), lat: Number(match[2]) }
}

export function MapPins({ map, posts, selectedPostId, onSelect }: MapPinsProps) {
  useEffect(() => {
    if (!map) return

    const markers = posts
      .map((post) => {
        const coords = parsePoint(post.geometry)
        if (!coords) return null

        const el = document.createElement('div')
        el.className = `map-pin map-pin--${post.post_type}`
        if (post.id === selectedPostId) {
          el.classList.add('is-selected')
        }

        const icon = document.createElement('div')
        icon.className = 'map-pin__icon'

        const glyph = document.createElement('span')
        glyph.className = 'map-pin__glyph'
        glyph.innerHTML =
          post.post_type === 'status'
            ? '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"6\"/></svg>'
            : post.post_type === 'ask'
            ? '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 4c-3.3 0-6 2.2-6 5h3c0-1.3 1.3-2.5 3-2.5s3 1.1 3 2.5c0 1.1-.7 1.8-1.9 2.5-1.4.8-2.1 1.7-2.1 3.5v.5h3v-.3c0-.9.4-1.4 1.5-2 1.7-.9 2.5-2.2 2.5-4.2 0-2.8-2.7-5-6-5zm-1.5 14h3v3h-3z\"/></svg>'
            : post.post_type === 'activity'
            ? '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M13 2 3 14h7l-1 8 12-16h-7z\"/></svg>'
            : '<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 7h14v10H5z\"/><path d=\"M9 7V5h6v2\"/></svg>'
        icon.appendChild(glyph)
        el.appendChild(icon)

        el.addEventListener('click', () => onSelect(post.id))

        return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map)
      })
      .filter(Boolean) as mapboxgl.Marker[]

    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [map, onSelect, posts, selectedPostId])

  return null
}
