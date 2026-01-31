import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

type PinCoords = { lng: number; lat: number }

export function usePinPlacement(map: mapboxgl.Map | null, enabled: boolean) {
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const [coords, setCoords] = useState<PinCoords | null>(null)

  useEffect(() => {
    if (!map || !enabled) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    const center = map.getCenter()
    const marker = new mapboxgl.Marker({ draggable: true })
      .setLngLat([center.lng, center.lat])
      .addTo(map)

    marker.on('dragend', () => {
      const point = marker.getLngLat()
      setCoords({ lng: point.lng, lat: point.lat })
    })

    markerRef.current = marker
    setCoords({ lng: center.lng, lat: center.lat })

    return () => {
      marker.remove()
      markerRef.current = null
    }
  }, [enabled, map])

  const setToCenter = () => {
    if (!map || !markerRef.current) return
    const center = map.getCenter()
    markerRef.current.setLngLat(center)
    setCoords({ lng: center.lng, lat: center.lat })
  }

  const setToLocation = () => {
    if (!markerRef.current || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lng: position.coords.longitude, lat: position.coords.latitude }
        markerRef.current?.setLngLat(next)
        setCoords(next)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    )
  }

  return { coords, setToCenter, setToLocation }
}
