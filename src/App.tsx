import { useMemo, useState } from 'react'
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
import type { Post, PostType } from './types'

function App() {
  const { user, loading } = useAuth()
  const [guestMode, setGuestMode] = useState(false)
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

  return (
    <div className="app-shell">
      <div className="map-shell">
        <MapView
          onMapReady={setMap}
          onBoundsChange={setBounds}
          disabled={!user && !guestMode}
        >
          <CategoryFilters
            activeTypes={activeTypes}
            onChange={setActiveTypes}
          />
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
      />
    </div>
  )
}

export default App
