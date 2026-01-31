import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type ConnectionState = 'idle' | 'checking' | 'ok' | 'blocked' | 'error'

export function ConnectionTest() {
  const [state, setState] = useState<ConnectionState>('idle')
  const [message, setMessage] = useState<string>('')

  const runTest = async () => {
    setState('checking')
    setMessage('Checking connection...')

    const { error } = await supabase.from('posts').select('id').limit(1)

    if (!error) {
      setState('ok')
      setMessage('Connected to Supabase.')
      return
    }

    const lowered = error.message.toLowerCase()
    if (lowered.includes('permission') || lowered.includes('rls') || lowered.includes('not allowed')) {
      setState('blocked')
      setMessage('Connected, but blocked by RLS (expected until signed in).')
      return
    }

    setState('error')
    setMessage(error.message)
  }

  return (
    <div className={`connection-test connection-test--${state}`}>
      <button onClick={runTest} disabled={state === 'checking'}>
        {state === 'checking' ? 'Testing…' : 'Test DB Connection'}
      </button>
      <span>{message}</span>
    </div>
  )
}
