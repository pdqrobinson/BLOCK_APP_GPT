import { useState } from 'react'
import type { Post } from '../../types'
import { ConnectionTest } from '../feed/ConnectionTest'
import { PostComposer } from './PostComposer'
import mapboxgl from 'mapbox-gl'
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
  hasClaim: boolean
  claimCenter: { lng: number; lat: number } | null
  claimRadiusMiles: number | null
  claimLoading: boolean
  claimError: string | null
  onOpenSettings: () => void
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
  hasClaim,
  claimCenter,
  claimRadiusMiles,
  claimLoading,
  claimError,
  onOpenSettings
}: PostsPanelProps) {
  const [composerMode, setComposerMode] = useState<'local' | 'trust'>('local')
  return (
    <aside className="posts-panel">
      <div className="posts-panel__header">
        <h2>Nearby</h2>
        <span>{posts.length} posts</span>
      </div>
      {isGuest ? <div className="posts-panel__guest">Guest mode</div> : null}
      <ConnectionTest />
      {canPost && !isGuest && hasClaim ? (
        <div className="posts-panel__tabs">
          <button
            className={composerMode === 'local' ? 'is-active' : ''}
            onClick={() => setComposerMode('local')}
          >
            Status / Ask
          </button>
          <button
            className={composerMode === 'trust' ? 'is-active' : ''}
            onClick={() => setComposerMode('trust')}
          >
            Activity / Item
          </button>
        </div>
      ) : null}
      {canPost ? (
        (!hasClaim || composerMode === 'local') ? (
          <PostComposer
            map={map}
            onCreated={onCreated}
            mode="auth"
            hasClaim={hasClaim}
            claimCenter={claimCenter}
            claimRadiusMiles={claimRadiusMiles}
          />
        ) : null
      ) : null}
      {isGuest ? (
        <PostComposer
          map={map}
          onCreated={onCreated}
          mode="guest"
          onLocalCreate={onGuestPost}
          hasClaim={false}
        />
      ) : null}
      {!isGuest && canPost ? (
        hasClaim ? (
          composerMode === 'trust' ? (
            <TrustPostComposer
              map={map}
              onCreated={onCreated}
              claimCenter={claimCenter}
              claimRadiusMiles={claimRadiusMiles}
            />
          ) : null
        ) : (
          <div className="posts-panel__state">
            You need a block claim to post Activity or Item.
            <button onClick={onOpenSettings}>Claim a block</button>
          </div>
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
              {post.expires_at ? (
                <span className="pill muted">{formatTimeRemaining(post.expires_at)}</span>
              ) : null}
            </div>
            <p>{post.content}</p>
          </button>
        ))}
      </div>
    </aside>
  )
}

function formatTimeRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'expired'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m left`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h left`
  const days = Math.floor(hours / 24)
  return `${days}d left`
}
