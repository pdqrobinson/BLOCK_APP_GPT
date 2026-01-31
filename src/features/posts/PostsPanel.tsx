import type { Post } from '../../types'
import { ConnectionTest } from '../feed/ConnectionTest'
import { PostComposer } from './PostComposer'
import mapboxgl from 'mapbox-gl'
import { AddressClaimPanel } from './AddressClaimPanel'
import { TrustPostComposer } from './TrustPostComposer'

type PostsPanelProps = {
  posts: Post[]
  selectedPostId: string | null
  onSelect: (postId: string) => void
  loading?: boolean
  error?: string | null
  map: mapboxgl.Map | null
  onCreated: () => void
  canPost: boolean
  isGuest: boolean
  onGuestPost: (post: Post) => void
  addressId: string | null
  claimLoading: boolean
  claimError: string | null
  onClaimed: () => void
}

export function PostsPanel({
  posts,
  selectedPostId,
  onSelect,
  loading,
  error,
  map,
  onCreated,
  canPost,
  isGuest,
  onGuestPost,
  addressId,
  claimLoading,
  claimError,
  onClaimed
}: PostsPanelProps) {
  return (
    <aside className="posts-panel">
      <div className="posts-panel__header">
        <h2>Nearby</h2>
        <span>{posts.length} posts</span>
      </div>
      {isGuest ? <div className="posts-panel__guest">Guest mode</div> : null}
      <ConnectionTest />
      {canPost ? (
        <PostComposer map={map} onCreated={onCreated} mode="auth" />
      ) : null}
      {isGuest ? (
        <PostComposer
          map={map}
          onCreated={onCreated}
          mode="guest"
          onLocalCreate={onGuestPost}
        />
      ) : null}
      {!isGuest && canPost ? (
        addressId ? (
          <TrustPostComposer map={map} addressId={addressId} onCreated={onCreated} />
        ) : (
          <AddressClaimPanel map={map} onClaimed={onClaimed} />
        )
      ) : null}
      {claimLoading ? <div className="posts-panel__state">Checking claim…</div> : null}
      {claimError ? <div className="posts-panel__state error">{claimError}</div> : null}
      {loading ? <div className="posts-panel__state">Loading feed…</div> : null}
      {error ? <div className="posts-panel__state error">{error}</div> : null}
      {!loading && !error && posts.length === 0 ? (
        <div className="posts-panel__state">No posts in view.</div>
      ) : null}
      <div className="posts-panel__list">
        {posts.map((post) => (
          <button
            key={post.id}
            className={post.id === selectedPostId ? 'posts-panel__item is-selected' : 'posts-panel__item'}
            onClick={() => onSelect(post.id)}
          >
            <div className="posts-panel__meta">
              <span className="pill">{post.post_type}</span>
            </div>
            <p>{post.content}</p>
          </button>
        ))}
      </div>
    </aside>
  )
}
