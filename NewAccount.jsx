import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateAccountMap } from '../lib/mapper'
import { saveAccountMap } from '../lib/drive'

const STEPS = [
  'Checking Salesforce history...',
  'Pulling ZoomInfo intent signals...',
  'Fetching recent scoops...',
  'Searching contacts (Marketing + IT)...',
  'Scoring buying committee...',
  'Building account map...',
  'Saving to Google Drive...'
]

export default function NewAccount() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function cleanDomain(input) {
    return input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase()
  }

  async function generate() {
    const d = cleanDomain(domain)
    if (!d) { setError('Enter a company domain'); return }

    const apiKey = localStorage.getItem('anthropic_key')
    if (!apiKey) { setError('Anthropic API key not set — go back to settings'); return }

    setLoading(true)
    setError('')
    setStep(0)

    // Cycle through status steps for UX feedback
    const stepInterval = setInterval(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 2))
    }, 4000)

    try {
      const mapData = await generateAccountMap(d, apiKey)
      clearInterval(stepInterval)
      setStep(STEPS.length - 1)
      const fileId = await saveAccountMap({ ...mapData, domain: d })
      navigate(`/map/${fileId}`)
    } catch (e) {
      clearInterval(stepInterval)
      setError(e.message || 'Something went wrong. Check your API key and try again.')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.back} onClick={() => navigate('/')}>← Back</div>

      <div style={styles.card}>
        <div style={styles.label}>Generate account map</div>
        <h1 style={styles.title}>New account</h1>
        <p style={styles.hint}>Paste a company URL or domain. Claude will pull Salesforce history, ZoomInfo intent signals, scoops, and contacts — then score and tier the full buying committee.</p>

        <input
          style={styles.input}
          placeholder="bakerroofing.com"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && generate()}
          disabled={loading}
          autoFocus
        />

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.progress}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ ...styles.progressStep, ...(i < step ? styles.done : i === step ? styles.active : styles.pending) }}>
                <span style={styles.dot}>{i < step ? '✓' : i === step ? '·' : '○'}</span>
                {s}
              </div>
            ))}
          </div>
        ) : (
          <button style={styles.btn} onClick={generate} disabled={!domain.trim()}>
            Generate map →
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' },
  back: { alignSelf: 'flex-start', maxWidth: '500px', width: '100%', marginBottom: '24px', fontSize: '13px', color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'var(--mono)' },
  card: { background: 'var(--white)', border: '0.5px solid var(--border-strong)', borderRadius: '8px', padding: '40px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' },
  label: { fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', background: 'var(--black)', padding: '3px 8px', borderRadius: '3px', width: 'fit-content' },
  title: { fontSize: '22px', fontWeight: '500' },
  hint: { fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.7', marginTop: '-4px' },
  input: { padding: '12px 14px', border: '0.5px solid var(--border-strong)', borderRadius: '6px', fontSize: '14px', fontFamily: 'var(--mono)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', width: '100%' },
  btn: { padding: '13px', background: 'var(--black)', color: 'var(--gold)', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', fontFamily: 'var(--mono)', letterSpacing: '0.04em', cursor: 'pointer' },
  error: { fontSize: '12px', color: '#A32D2D', background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: '5px', padding: '10px 12px' },
  progress: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0' },
  progressStep: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontFamily: 'var(--mono)' },
  dot: { width: '18px', textAlign: 'center', flexShrink: 0 },
  done: { color: 'var(--text-3)', opacity: 0.6 },
  active: { color: 'var(--gold-dark)', fontWeight: '500' },
  pending: { color: 'var(--text-3)', opacity: 0.35 }
}
