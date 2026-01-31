import { useEffect, useMemo, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'
import { MapView } from './features/map/MapView'
import { MapPins } from './features/map/MapPins'
import { CategoryFilters } from './features/posts/CategoryFilters'
import { PostsPanel } from './features/posts/PostsPanel'
import { useAuth } from './features/auth/useAuth'
import { AuthPanel } from './features/auth/AuthPanel'
import { usePresence } from './features/presence/usePresence'
import { useFeed } from './features/feed/useFeed'
import { useProfile } from './features/settings/useProfile'
import { useBlockClaims } from './features/settings/useBlockClaims'
import { SettingsPanel } from './features/settings/SettingsPanel'
import { supabase } from './lib/supabase'
import type { Post, PostType } from './types'

function App() {
  const { user, loading } = useAuth()
  const [guestMode, setGuestMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [activeTypes, setActiveTypes] = useState<PostType[]>([])
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [bounds, setBounds] = useState<{
    sw: { lng: number; lat: number }
    ne: { lng: number; lat: number }
  } | null>(null)

  usePresence(user && !guestMode ? user : null)

  const [refreshToken, setRefreshToken] = useState(0)
  const { posts: livePosts, error, loading: feedLoading } = useFeed({
    bounds,
    enabled: !!user && !guestMode,
    refreshToken
  })

  const profile = useProfile(!!user && !guestMode)
  const claims = useBlockClaims(!!user && !guestMode)
  const activeClaim = claims.claims.find((claim) => claim.active) ?? null
  const claimCenter = activeClaim ? parsePoint(activeClaim.center) : null
  const claimRadiusMiles = activeClaim?.radius_miles ?? null

  const [localGuestPosts, setLocalGuestPosts] = useState<Post[]>([])
  const demoPosts = useMemo<Post[]>(
    () => [
      {
        id: 'demo-1',
        post_type: 'status',
        content: 'Sidewalk chalk party on 5th, bring colors.',
        geometry: 'SRID=4326;POINT(-122.4194 37.7749)'
      },
      {
        id: 'demo-2',
        post_type: 'ask',
        content: 'Anyone know a good local coffee cart?',
        geometry: 'SRID=4326;POINT(-122.4138 37.7768)'
      }
    ],
    []
  )

  const posts = guestMode ? [...localGuestPosts, ...demoPosts] : livePosts
  const displayError = guestMode ? null : error
  const displayLoading = guestMode ? false : feedLoading

  const filteredPosts = useMemo(() => {
    if (activeTypes.length === 0) return posts
    return posts.filter((post) => activeTypes.includes(post.post_type))
  }, [activeTypes, posts])

  useEffect(() => {
    if (!map || !profile.profile?.zip_lat || !profile.profile?.zip_lng) return
    map.easeTo({
      center: [profile.profile.zip_lng, profile.profile.zip_lat],
      zoom: 12,
      duration: 1200
    })
  }, [map, profile.profile?.zip_lat, profile.profile?.zip_lng])

  useEffect(() => {
    if (!map) return
    const sourceId = 'block-claims'
    const layerId = 'block-claims-layer'

    const features = claims.claims
      .filter((claim) => claim.active)
      .map((claim) => {
        const coords = parsePoint(claim.center)
        if (!coords) return null
        return createCircleFeature(coords, claim.radius_miles)
      })
      .filter(Boolean)

    const data = {
      type: 'FeatureCollection',
      features
    } as GeoJSON.FeatureCollection

    const applyLayer = () => {
      const existing = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined
      if (existing) {
        existing.setData(data)
        return
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data
      })
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#3a7f6b',
          'fill-opacity': 0.15
        }
      })
      map.addLayer({
        id: `${layerId}-outline`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#2f6b5a',
          'line-width': 2
        }
      })
    }

    if (!map.isStyleLoaded()) {
      map.once('load', applyLayer)
      return
    }

    applyLayer()
  }, [claims.claims, map])

  const handleCreateClaim = async (radius: number) => {
    if (!map) throw new Error('Map not ready')
    const center = map.getCenter()
    await claims.createClaim(`SRID=4326;POINT(${center.lng} ${center.lat})`, radius)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setGuestMode(false)
    setSettingsOpen(false)
  }

  return (
    <div className="app-shell">
      <div className="map-shell">
        <MapView
          onMapReady={setMap}
          onBoundsChange={setBounds}
          disabled={!user && !guestMode}
        >
          <div className="map-top-left">
            <button className="settings-button" onClick={() => setSettingsOpen(true)}>
              Settings
            </button>
            <CategoryFilters
              activeTypes={activeTypes}
              onChange={setActiveTypes}
            />
          </div>
          <MapPins
            map={map}
            posts={filteredPosts}
            selectedPostId={selectedPostId}
            onSelect={setSelectedPostId}
          />
        </MapView>
        {!loading && !user && !guestMode ? <AuthPanel onGuest={() => setGuestMode(true)} /> : null}
        {!user && !guestMode ? (
          <div className="map-overlay notice">Sign in to load local posts.</div>
        ) : null}
        {guestMode ? (
          <div className="map-overlay notice guest">
            Guest mode (demo posts).{' '}
            <button onClick={() => setGuestMode(false)}>Exit</button>
          </div>
        ) : null}
      </div>
      <PostsPanel
        posts={filteredPosts}
        selectedPostId={selectedPostId}
        onSelect={setSelectedPostId}
        loading={displayLoading}
        error={displayError}
        map={map}
        onCreated={() => setRefreshToken((value) => value + 1)}
        canPost={!!user && !guestMode}
        isGuest={guestMode}
        onGuestPost={(post) => setLocalGuestPosts((prev) => [post, ...prev])}
        hasClaim={!!activeClaim}
        claimCenter={claimCenter}
        claimRadiusMiles={claimRadiusMiles}
        claimLoading={claims.loading}
        claimError={claims.error}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        profile={profile.profile}
        profileLoading={profile.loading}
        profileError={profile.error}
        onUpdateZip={profile.updateZip}
        claims={claims.claims}
        claimsLoading={claims.loading}
        claimsError={claims.error}
        onCreateClaim={handleCreateClaim}
        onDeactivateClaim={claims.deactivateClaim}
        onSignOut={handleSignOut}
      />
    </div>
  )
}

function parsePoint(geometry: string) {
  const match = geometry.match(/POINT\((-?\d+\.?\d*)\s+(-?\d+\.?\d*)\)/i)
  if (!match) return null
  return { lng: Number(match[1]), lat: Number(match[2]) }
}

function createCircleFeature(center: { lng: number; lat: number }, radiusMiles: number) {
  const steps = 64
  const coords: [number, number][] = []
  const radiusKm = radiusMiles * 1.60934
  const lat = (center.lat * Math.PI) / 180
  const lng = (center.lng * Math.PI) / 180
  const angularDistance = radiusKm / 6371

  for (let i = 0; i <= steps; i += 1) {
    const bearing = (2 * Math.PI * i) / steps
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(angularDistance) +
        Math.cos(lat) * Math.sin(angularDistance) * Math.cos(bearing)
    )
    const lng2 =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat),
        Math.cos(angularDistance) - Math.sin(lat) * Math.sin(lat2)
      )

    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI])
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    },
    properties: {}
  } as GeoJSON.Feature
}

export default App
