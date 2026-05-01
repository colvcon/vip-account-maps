import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAccountMaps, isAuthenticated, clearToken } from '../lib/drive'
import AuthGate, { OAuthCallback } from '../components/AuthGate'

export default function Home() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [maps, setMaps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  // Handle OAuth callback
  if (window.location.hash.includes('access_token')) {
    return <OAuthCallback onAuth={() => { setAuthed(true); window.location.hash = '' }} />
  }

  if (!authed) {
    return <AuthGate onAuth={() => setAuthed(true)} />
  }

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listAccountMaps()
      // Sort by intent score desc
      data.sort((a, b) => (b.intentScore || 0) - (a.intentScore || 0))
      setMaps(data)
    } catch (e) {
      if (e.message === 'AUTH_EXPIRED') { clearToken(); setAuthed(false); return }
      setError('Could not load maps from Drive. ' + e.message)
    }
    setLoading(false)
  }

  const filtered = maps.filter(m =>
    !search || m.company?.toLowerCase().includes(search.toLowerCase()) || m.domain?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.wordmark}>
            <span style={styles.vip}>VIP</span>
            <span style={styles.headerTitle}>Account Maps</span>
          </div>
          <div style={styles.headerRight}>
            <input
              style={styles.search}
              placeholder="Search accounts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button style={styles.newBtn} onClick={() => navigate('/new')}>
              + New Map
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {loading && (
          <div style={styles.status}>
            <span style={styles.spinner} /> Loading maps from Drive...
          </div>
        )}
        {error && <div style={styles.errorBox}>{error}</div>}

        {!loading && !error && maps.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>No account maps yet</p>
            <p style={styles.emptyHint}>Click "New Map" to generate your first one, or run the account mapper in Claude and it will appear here automatically.</p>
            <button style={styles.emptyBtn} onClick={() => navigate('/new')}>Generate first map</button>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={styles.grid}>
            {filtered.map((map, i) => (
              <AccountCard key={i} map={map} onClick={() => navigate(`/map/${map.fileId}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function AccountCard({ map, onClick }) {
  const tier = map.intentTier || 'COLD'
  const score = map.intentScore || 0
  const t1 = (map.contacts || []).filter(c => c.tier === '1').length

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardTop}>
        <div>
          <p style={styles.cardCompany}>{map.company || map.domain}</p>
          <p style={styles.cardDomain}>{map.domain}</p>
        </div>
        <IntentBadge tier={tier} score={score} />
      </div>

      <div style={styles.cardMeta}>
        <MetaPill label="Industry" value={map.industry || '—'} />
        <MetaPill label="Revenue" value={map.revenue || '—'} />
        <MetaPill label="T1 contacts" value={t1} />
      </div>

      {map.compoundAlert && (
        <div style={styles.cardAlert}>
          <span style={styles.alertStar}>&#9733;</span>
          <span style={styles.alertText}>{map.compoundAlert}</span>
        </div>
      )}

      <div style={styles.cardFooter}>
        <span style={styles.cardDate}>
          {map.savedAt ? new Date(map.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
        </span>
        <span style={styles.cardArrow}>View map →</span>
      </div>
    </div>
  )
}

function IntentBadge({ tier, score }) {
  const colors = {
    HOT: { bg: '#FFF0D4', color: '#633806', border: '#FAC775' },
    WARM: { bg: '#EAF3DE', color: '#27500A', border: '#C0DD97' },
    COLD: { bg: 'var(--surface-2)', color: 'var(--text-3)', border: 'var(--border)' }
  }
  const c = colors[tier] || colors.COLD
  return (
    <div style={{ ...styles.badge, background: c.bg, color: c.color, border: `0.5px solid ${c.border}` }}>
      {tier === 'HOT' && '★ '}{tier} {score ? score : ''}
    </div>
  )
}

function MetaPill({ label, value }) {
  return (
    <div style={styles.pill}>
      <span style={styles.pillLabel}>{label}</span>
      <span style={styles.pillValue}>{value}</span>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--surface)' },
  header: { background: 'var(--black)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: '1100px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
  wordmark: { display: 'flex', alignItems: 'center', gap: '12px' },
  vip: { fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.12em', color: 'var(--gold)', background: 'rgba(216,164,95,0.15)', padding: '3px 8px', borderRadius: '3px', border: '0.5px solid rgba(216,164,95,0.3)' },
  headerTitle: { color: '#fff', fontSize: '15px', fontWeight: '500' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  search: { padding: '8px 12px', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', fontFamily: 'var(--sans)', width: '200px', outline: 'none' },
  newBtn: { padding: '8px 16px', background: 'var(--gold)', color: 'var(--black)', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: '500', fontFamily: 'var(--mono)', letterSpacing: '0.03em', whiteSpace: 'nowrap' },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },
  status: { display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-3)', fontSize: '13px', padding: '40px 0', justifyContent: 'center' },
  spinner: { display: 'inline-block', width: '14px', height: '14px', border: '2px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  errorBox: { background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#791F1F', marginBottom: '20px' },
  empty: { textAlign: 'center', padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  emptyTitle: { fontSize: '18px', fontWeight: '500', color: 'var(--text)' },
  emptyHint: { fontSize: '13px', color: 'var(--text-3)', maxWidth: '420px', lineHeight: '1.7' },
  emptyBtn: { marginTop: '8px', padding: '10px 20px', background: 'var(--black)', color: 'var(--gold)', border: 'none', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--mono)', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
  card: { background: 'var(--white)', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '14px', transition: 'border-color 0.15s, box-shadow 0.15s' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  cardCompany: { fontSize: '15px', fontWeight: '500', color: 'var(--text)', lineHeight: '1.3' },
  cardDomain: { fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: '2px' },
  badge: { padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', flexShrink: 0 },
  cardMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  pill: { display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '4px', padding: '4px 8px', minWidth: '70px' },
  pillLabel: { fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  pillValue: { fontSize: '12px', fontWeight: '500', color: 'var(--text)', marginTop: '1px' },
  cardAlert: { display: 'flex', alignItems: 'flex-start', gap: '6px', background: '#FFF8EC', border: '0.5px solid #FAC775', borderRadius: '4px', padding: '7px 10px' },
  alertStar: { color: 'var(--gold)', fontSize: '12px', flexShrink: 0, marginTop: '1px' },
  alertText: { fontSize: '12px', color: 'var(--gold-dark)', lineHeight: '1.5' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '0.5px solid var(--border)' },
  cardDate: { fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--mono)' },
  cardArrow: { fontSize: '12px', color: 'var(--gold-dark)', fontFamily: 'var(--mono)' }
}
