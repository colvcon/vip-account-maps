import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAccountMap } from '../lib/drive'

export default function AccountMap() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [map, setMap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const data = await getAccountMap(id)
      setMap(data)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  function exportCSV() {
    const headers = ['Name', 'Title', 'Tier', 'Score', 'Key Signal', 'First-Touch Angle', 'Status']
    const rows = (map.contacts || []).map(c => [
      c.name, c.title, 'T' + c.tier, c.score,
      c.signal, c.angle || '', c.status
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(map.domain || 'account').replace(/\./g, '-')}-map.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div style={styles.loading}>Loading map...</div>
  if (error) return <div style={styles.loading}>Error: {error}</div>
  if (!map) return null

  const contacts = (map.contacts || []).filter(c =>
    filter === 'all' || c.tier === filter
  )

  const intentColors = {
    HOT: { bg: '#FFF0D4', color: '#633806', border: '#FAC775' },
    WARM: { bg: '#EAF3DE', color: '#27500A', border: '#C0DD97' },
    COLD: { bg: 'var(--surface-2)', color: 'var(--text-3)', border: 'var(--border)' }
  }
  const ic = intentColors[map.intentTier] || intentColors.COLD

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <span style={styles.back} onClick={() => navigate('/')}>←</span>
            <div>
              <div style={styles.headerLabel}>Account Map</div>
              <div style={styles.headerCompany}>{map.company || map.domain}</div>
            </div>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.headerDate}>{map.savedAt ? new Date(map.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
          </div>
        </div>
      </div>

      <div style={styles.body}>
        {/* Meta bar */}
        <div style={styles.metaBar}>
          <div style={{ ...styles.intentBadge, background: ic.bg, color: ic.color, border: `0.5px solid ${ic.border}` }}>
            {map.intentTier === 'HOT' ? '★ ' : ''}{map.intentTier} — CMS Intent Score {map.intentScore}
          </div>
          <MetaPill label="SF Status" value={map.sfStage || '—'} />
          <MetaPill label="Last Activity" value={map.sfLastActivity || '—'} />
          {map.priorOpp && <MetaPill label="Prior Opp" value={map.priorOpp} />}
          <MetaPill label="Revenue" value={map.revenue || '—'} />
        </div>

        {/* Two column snapshot */}
        <div style={styles.twoCol}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Account snapshot</div>
            <ul style={styles.ul}>
              {(map.snapshot || []).map((s, i) => <li key={i} style={styles.li}>{s}</li>)}
            </ul>
          </div>
          <div style={{ ...styles.panel, borderLeft: '0.5px solid var(--border)' }}>
            <div style={styles.panelTitle}>Active signals</div>
            <ul style={styles.ul}>
              {(map.signals || []).map((s, i) => <li key={i} style={styles.li}>{s}</li>)}
            </ul>
          </div>
        </div>

        {/* Compound alert */}
        {map.compoundAlert && (
          <div style={styles.compoundBar}>
            <span style={styles.star}>★</span>
            <span style={styles.compoundText}><strong>Compound signal:</strong> {map.compoundAlert}</span>
          </div>
        )}

        {/* Filter tabs + export */}
        <div style={styles.filterRow}>
          <div style={styles.tabs}>
            {['all', '1', '2', '3'].map(t => (
              <button
                key={t}
                style={{ ...styles.tab, ...(filter === t ? styles.tabActive : {}) }}
                onClick={() => setFilter(t)}
              >
                {t === 'all' ? 'All' : `Tier ${t}`}
              </button>
            ))}
          </div>
          <div style={styles.actions}>
            <button style={styles.actionBtn} onClick={copyLink}>{copied ? 'Copied!' : 'Copy link'}</button>
            <button style={styles.actionBtn} onClick={exportCSV}>Export CSV ↓</button>
          </div>
        </div>

        {/* Contact table */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Title', 'Tier', 'Score', 'Key signal', 'First-touch angle', 'Status'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => {
                const borderColor = c.tier === '1' ? '#D8A45F' : c.tier === '2' ? '#888780' : '#D3D1C7'
                const dimmed = c.tier === '3'
                return (
                  <tr key={i} style={{ opacity: dimmed ? 0.65 : 1 }}>
                    <td style={{ ...styles.td, borderLeft: `3px solid ${borderColor}`, fontWeight: '500' }}>{c.name}</td>
                    <td style={styles.td}>{c.title}</td>
                    <td style={styles.td}><TierBadge tier={c.tier} /></td>
                    <td style={styles.td}>
                      <div style={styles.scoreWrap}>
                        <span style={styles.scoreNum}>{c.score}</span>
                        <div style={styles.scoreTrack}>
                          <div style={{ ...styles.scoreFill, width: `${Math.round(c.score / 100 * 40)}px` }} />
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{c.signal}</td>
                    <td style={{ ...styles.td, fontSize: '12px', color: 'var(--text-2)', lineHeight: '1.5' }}>
                      {c.angle || <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={styles.td}>
                      {c.status}
                      {c.status === 'Known' && <span style={styles.knownBadge}>Known</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function TierBadge({ tier }) {
  const cfg = {
    '1': { bg: '#FFF0D4', color: '#633806' },
    '2': { bg: 'var(--surface-2)', color: 'var(--text-2)' },
    '3': { bg: 'var(--surface-2)', color: 'var(--text-3)' }
  }[tier] || {}
  return <span style={{ ...styles.tierBadge, background: cfg.bg, color: cfg.color }}>T{tier}</span>
}

function MetaPill({ label, value }) {
  return (
    <span style={styles.metaPill}>
      <span style={styles.metaPillLabel}>{label}:</span> <strong>{value}</strong>
    </span>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--surface)' },
  loading: { padding: '60px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: '13px' },
  header: { background: 'var(--black)', position: 'sticky', top: 0, zIndex: 10 },
  headerInner: { maxWidth: '1200px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  back: { color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer', padding: '4px' },
  headerLabel: { fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.7 },
  headerCompany: { color: '#fff', fontSize: '17px', fontWeight: '500' },
  headerRight: {},
  headerDate: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'rgba(255,255,255,0.35)' },
  body: { maxWidth: '1200px', margin: '0 auto', border: '0.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden', background: 'var(--white)' },
  metaBar: { display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 20px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', flexWrap: 'wrap' },
  intentBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', fontFamily: 'var(--mono)' },
  metaPill: { fontSize: '12px', color: 'var(--text-2)' },
  metaPillLabel: { color: 'var(--text-3)' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '0.5px solid var(--border)' },
  panel: { padding: '16px 20px' },
  panelTitle: { fontFamily: 'var(--mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: '10px' },
  ul: { listStyle: 'none', padding: 0 },
  li: { fontSize: '13px', padding: '3px 0 3px 14px', position: 'relative', lineHeight: '1.55', color: 'var(--text)', '::before': { content: '""' } },
  compoundBar: { display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 20px', background: '#FFF8EC', borderBottom: '0.5px solid #FAC775' },
  star: { color: '#D8A45F', flexShrink: 0, marginTop: '1px' },
  compoundText: { fontSize: '13px', color: '#633806', lineHeight: '1.5' },
  filterRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--border)', padding: '0 8px 0 0' },
  tabs: { display: 'flex' },
  tab: { padding: '9px 18px', fontSize: '13px', background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--text-3)', cursor: 'pointer' },
  tabActive: { color: '#D8A45F', borderBottomColor: '#D8A45F', fontWeight: '500' },
  actions: { display: 'flex', gap: '8px' },
  actionBtn: { padding: '6px 12px', fontSize: '12px', background: 'none', border: '0.5px solid var(--border-strong)', borderRadius: '5px', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--mono)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: '10px', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', fontWeight: '400' },
  td: { padding: '10px 12px', borderBottom: '0.5px solid var(--border)', verticalAlign: 'top', lineHeight: '1.45', color: 'var(--text)' },
  tierBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '500', fontFamily: 'var(--mono)' },
  scoreWrap: { display: 'flex', alignItems: 'center', gap: '6px' },
  scoreNum: { fontFamily: 'var(--mono)', fontWeight: '500', fontSize: '13px' },
  scoreTrack: { width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', display: 'inline-block' },
  scoreFill: { height: '4px', borderRadius: '2px', background: '#D8A45F' },
  knownBadge: { display: 'inline-block', marginLeft: '5px', padding: '1px 5px', borderRadius: '3px', fontSize: '10px', background: '#E6F1FB', color: '#0C447C', fontFamily: 'var(--mono)' }
}
