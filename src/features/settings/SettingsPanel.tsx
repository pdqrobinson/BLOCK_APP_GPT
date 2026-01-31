import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { BlockClaim } from './useBlockClaims'
import type { Profile } from './useProfile'

type SettingsPanelProps = {
  open: boolean
  onClose: () => void
  user: User | null
  profile: Profile | null
  profileLoading: boolean
  profileError: string | null
  onUpdateZip: (zip: string) => Promise<void>
  claims: BlockClaim[]
  claimsLoading: boolean
  claimsError: string | null
  onCreateClaim: (radius: number) => Promise<void>
  onDeactivateClaim: (id: string) => Promise<void>
  onSignOut: () => Promise<void>
}

export function SettingsPanel({
  open,
  onClose,
  user,
  profile,
  profileLoading,
  profileError,
  onUpdateZip,
  claims,
  claimsLoading,
  claimsError,
  onCreateClaim,
  onDeactivateClaim,
  onSignOut
}: SettingsPanelProps) {
  const [radius, setRadius] = useState(1)
  const [claimStatus, setClaimStatus] = useState<string | null>(null)
  if (!open) return null

  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <h2>Account Settings</h2>
        <button onClick={onClose}>Close</button>
      </div>

      <section>
        <h3>ZIP code</h3>
        <p>Used for discovery and initial map centering (not for posting).</p>
        <ZipForm
          loading={profileLoading}
          error={profileError}
          zip={profile?.zip_code ?? ''}
          onSubmit={onUpdateZip}
        />
      </section>

      <section>
        <h3>Block claims</h3>
        <p>Up to 3 active claims. You can change claims 3 times per year.</p>
        {claimsLoading ? <div className="settings-panel__state">Loading claims…</div> : null}
        {claimsError ? <div className="settings-panel__state error">{claimsError}</div> : null}
        <div className="settings-panel__claims">
          {claims.map((claim) => (
            <div key={claim.id} className="settings-panel__claim">
              <div>
                <strong>{claim.radius_miles} miles</strong>
                <span>{claim.active ? 'Active' : 'Inactive'}</span>
              </div>
              {claim.active ? (
                <button onClick={() => onDeactivateClaim(claim.id)}>Release</button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="settings-panel__actions">
          <label className="settings-panel__radius">
            Radius
            <input
              type="range"
              min={1}
              max={3}
              step={0.5}
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
            />
            <span>{radius.toFixed(1)} miles</span>
          </label>
          <button
            onClick={async () => {
              setClaimStatus(null)
              try {
                await onCreateClaim(radius)
                setClaimStatus('Claim created.')
              } catch (err) {
                setClaimStatus(err instanceof Error ? err.message : 'Claim failed')
              }
            }}
          >
            Create claim at map center
          </button>
          <span>Pan the map to set the claim center.</span>
          {claimStatus ? <div className="settings-panel__state">{claimStatus}</div> : null}
        </div>
      </section>

      <section>
        <h3>Account</h3>
        <p>{user?.email ?? 'Signed in'}</p>
        <button onClick={onSignOut}>Log out</button>
      </section>
    </div>
  )
}

type ZipFormProps = {
  zip: string
  loading: boolean
  error: string | null
  onSubmit: (zip: string) => Promise<void>
}

function ZipForm({ zip, loading, error, onSubmit }: ZipFormProps) {
  const [value, setValue] = useState(zip)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => setValue(zip), [zip])

  const submit = async () => {
    setStatus(null)
    try {
      await onSubmit(value)
      setStatus('ZIP updated.')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to update ZIP')
    }
  }

  return (
    <div className="settings-panel__zip">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="ZIP code"
      />
      <button onClick={submit} disabled={loading || !value.trim()}>
        {loading ? 'Saving…' : 'Save'}
      </button>
      {error ? <div className="settings-panel__state error">{error}</div> : null}
      {status ? <div className="settings-panel__state">{status}</div> : null}
    </div>
  )
}
