import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import type { MapBounds } from '../../types'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

type MapViewProps = {
  onMapReady: (map: mapboxgl.Map) => void
  onBoundsChange: (bounds: MapBounds) => void
  disabled?: boolean
  children?: React.ReactNode
}

export function MapView({ onMapReady, onBoundsChange, disabled, children }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (disabled || mapRef.current || !containerRef.current) return
    if (!mapboxgl.accessToken) {
      console.error('Missing VITE_MAPBOX_TOKEN')
      return
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-122.4194, 37.7749],
      zoom: 12
    })

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right')
    mapRef.current = map
    onMapReady(map)

    const emitBounds = () => {
      const bounds = map.getBounds()
      onBoundsChange({
        sw: bounds.getSouthWest(),
        ne: bounds.getNorthEast()
      })
    }

    map.on('load', emitBounds)
    map.on('moveend', emitBounds)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          map.easeTo({ center: [longitude, latitude], zoom: 14, duration: 1200 })
        },
        () => {
          // Ignore if user denies location; default view stays.
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
      )
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [disabled, onBoundsChange, onMapReady])

  return (
    <div className="map-view" ref={containerRef}>
      {children}
      {disabled ? (
        <div className="map-overlay map-overlay--disabled">
          Sign in to enable the map.
        </div>
      ) : null}
    </div>
  )
}
