import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type AuthPanelProps = {
  onGuest?: () => void
}

export function AuthPanel({ onGuest }: AuthPanelProps) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const signInWithGoogle = async () => {
    setLoading(true)
    setStatus(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    })
    if (error) setStatus(error.message)
    setLoading(false)
  }

  const signInWithEmail = async () => {
    setLoading(true)
    setStatus(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setStatus(error.message)
    else setStatus('Magic link sent.')
    setLoading(false)
  }

  const signInWithPhone = async () => {
    setLoading(true)
    setStatus(null)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) setStatus(error.message)
    else setStatus('OTP sent.')
    setLoading(false)
  }

  return (
    <div className="auth-panel">
      <div className="auth-panel__header">
        <h3>Sign in</h3>
        <p>Access local posts with Google, email, or phone.</p>
      </div>
      <div className="auth-panel__actions">
        <button onClick={signInWithGoogle} disabled={loading}>
          Continue with Google
        </button>
        {onGuest ? (
          <button className="auth-panel__ghost" onClick={onGuest} disabled={loading}>
            Continue as guest
          </button>
        ) : null}
      </div>
      <div className="auth-panel__fields">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <button onClick={signInWithEmail} disabled={loading || !email}>
            Send magic link
          </button>
        </label>
        <label>
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+1 555 0100"
          />
          <button onClick={signInWithPhone} disabled={loading || !phone}>
            Send OTP
          </button>
        </label>
      </div>
      {status ? <div className="auth-panel__status">{status}</div> : null}
    </div>
  )
}
