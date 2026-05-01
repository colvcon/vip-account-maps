import React, { useState } from 'react'
import { setToken } from '../lib/drive'

const CLIENT_ID = '846154958765-p331pi0jr1fob837k09npssjte6l9uvd.apps.googleusercontent.com'

export default function AuthGate({ onAuth }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_key') || '')
  const [step, setStep] = useState(
    localStorage.getItem('anthropic_key') ? 'google' : 'apikey'
  )
  const [error, setError] = useState('')

  function saveApiKey() {
    if (!apiKey.trim().startsWith('sk-')) {
      setError('Paste your Anthropic API key — starts with sk-ant-...')
      return
    }
    localStorage.setItem('anthropic_key', apiKey.trim())
    setStep('google')
    setError('')
  }

  function connectGoogle() {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: window.location.origin + '/oauth',
      response_type: 'token',
      scope: 'https://www.googleapis.com/auth/drive.file',
      prompt: 'consent'
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>VIP</div>
        <h1 style={styles.title}>Account Maps</h1>
        <p style={styles.sub}>WordPress VIP sales intelligence</p>

        {step === 'apikey' && (
          <>
            <p style={styles.label}>Anthropic API key</p>
            <p style={styles.hint}>Used to run account mapping via Claude. Stored locally, never sent to our servers.</p>
            <input
              style={styles.input}
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveApiKey()}
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.btn} onClick={saveApiKey}>Continue</button>
          </>
        )}

        {step === 'google' && (
          <>
            <p style={styles.label}>Connect Google Drive</p>
            <p style={styles.hint}>Account maps are saved as JSON files in a Drive folder called "VIP Account Maps". Only your maps — no other Drive access.</p>
            <button style={styles.btn} onClick={connectGoogle}>
              Connect Google Drive
            </button>
            <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setStep('apikey')}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// OAuth callback handler — put this in your router at /oauth
export function OAuthCallback({ onAuth }) {
  React.useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const token = hash.get('access_token')
    if (token) {
      setToken(token)
      onAuth()
      window.history.replaceState({}, '', '/')
    }
  }, [])
  return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)' }}>Connecting...</div>
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--surface)'
  },
  card: {
    background: 'var(--white)',
    border: '0.5px solid var(--border-strong)',
    borderRadius: '8px',
    padding: '40px',
    width: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  logo: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    letterSpacing: '0.12em',
    color: 'var(--gold)',
    background: 'var(--black)',
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '3px',
    width: 'fit-content'
  },
  title: {
    fontSize: '22px',
    fontWeight: '500',
    color: 'var(--text)',
    marginTop: '4px'
  },
  sub: {
    fontSize: '13px',
    color: 'var(--text-3)',
    marginBottom: '8px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text)'
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-3)',
    lineHeight: '1.6',
    marginTop: '-4px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '0.5px solid var(--border-strong)',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'var(--mono)',
    background: 'var(--surface)',
    color: 'var(--text)',
    outline: 'none'
  },
  btn: {
    width: '100%',
    padding: '11px',
    background: 'var(--black)',
    color: 'var(--gold)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'var(--mono)',
    letterSpacing: '0.04em'
  },
  btnSecondary: {
    background: 'transparent',
    color: 'var(--text-3)',
    border: '0.5px solid var(--border)',
    marginTop: '-4px'
  },
  error: {
    fontSize: '12px',
    color: '#A32D2D',
    marginTop: '-4px'
  }
}
