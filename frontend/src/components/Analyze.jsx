import { useState, useRef, useEffect, useCallback } from 'react'
import { getMarketPulse, searchTickers } from '../api/stockApi'
import LoadingSpinner from './LoadingSpinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

/* ─── Defaults ────────────────────────────────────────────── */
const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA']
const MAX_TICKERS = 10
const PALETTE = ['#00d4aa', '#6366f1', '#f59e0b', '#ff4d6d', '#3b82f6', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#22d3ee']

/* ─── Formatters ──────────────────────────────────────────── */
function fmtVol(n) {
  const v = Number(n ?? 0)
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return v.toLocaleString()
}
function fmtCap(n) {
  const v = Number(n ?? 0)
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}
function pct(n, bold = false) {
  const v = Number(n ?? 0)
  const color = v >= 0 ? '#00d4aa' : '#ff4d6d'
  return (
    <span style={{ color, fontWeight: bold ? 700 : 600, fontFamily: 'JetBrains Mono,monospace' }}>
      {v >= 0 ? '+' : ''}{v.toFixed(2)}%
    </span>
  )
}

/* ─── Badges ──────────────────────────────────────────────── */
const RISK_COLOR = { Low: '#00d4aa', Medium: '#f59e0b', High: '#ff4d6d', Extreme: '#a78bfa' }
function RiskBadge({ level }) {
  const c = RISK_COLOR[level] || '#64748b'
  return (
    <span style={{
      background: `${c}18`, border: `1px solid ${c}50`,
      color: c, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
    }}>{level || '—'}</span>
  )
}
function TrendBadge({ trend }) {
  if (!trend || trend === 'unknown') return <span className="badge-neutral">—</span>
  if (trend === 'bullish') return <span className="badge-bullish">▲ Bullish</span>
  if (trend === 'bearish') return <span className="badge-bearish">▼ Bearish</span>
  return <span className="badge-neutral">◆ Neutral</span>
}

/* ─── Sentiment banner ────────────────────────────────────── */
function SentimentBanner({ sentiment, count }) {
  const isBull = sentiment === 'bullish'
  const isBear = sentiment === 'bearish'
  const color  = isBull ? '#00d4aa' : isBear ? '#ff4d6d' : '#f59e0b'
  const bg     = isBull ? 'rgba(0,212,170,0.08)' : isBear ? 'rgba(255,77,109,0.08)' : 'rgba(245,158,11,0.08)'
  const label  = isBull ? 'BULLISH MARKET' : isBear ? 'BEARISH MARKET' : 'MIXED MARKET'
  const tag    = isBull ? 'LONG' : isBear ? 'SHORT' : 'MIXED'
  return (
    <div style={{
      background: bg, border: `1px solid ${color}30`, borderRadius: 14,
      padding: '20px 28px', textAlign: 'center', marginBottom: 20,
    }}>
      <div style={{
        display: 'inline-block', fontSize: 11, fontWeight: 800, color,
        border: `1px solid ${color}55`, borderRadius: 4, padding: '3px 10px',
        marginBottom: 10, letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace',
      }}>{tag}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.01em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>Based on {count} stock{count !== 1 ? 's' : ''}</div>
    </div>
  )
}

/* ─── Metric card ─────────────────────────────────────────── */
function MetricCard({ label, value, sub, color }) {
  return (
    <div className="glass-card" style={{ padding: '18px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || '#e2e8f0', fontFamily: 'JetBrains Mono,monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

/* ─── Section divider ─────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: '#94a3b8',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      margin: '8px 0 16px', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      {children}
      <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

/* ─── Chart tooltip ───────────────────────────────────────── */
function ChartTip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(10,12,28,0.97)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#e2e8f0',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#94a3b8' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill, fontFamily: 'JetBrains Mono,monospace' }}>
          {p.name}: {fmt ? fmt(p.value, p.name) : p.value}
        </div>
      ))}
    </div>
  )
}

/* ─── Active pie shape ────────────────────────────────────── */
function ActivePieShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#e2e8f0" fontSize={15} fontWeight={700}>{payload.name}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={12}>{(percent * 100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  )
}

/* ─── Highlight match ─────────────────────────────────────── */
function Highlight({ text, query }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#00d4aa', fontWeight: 700 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

/* ─── Ticker chip ─────────────────────────────────────────── */
function TickerTag({ symbol, color, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: 8, padding: '3px 10px',
      fontSize: 12, fontWeight: 700, color,
      fontFamily: 'JetBrains Mono,monospace',
    }}>
      {symbol}
      <button
        type="button"
        onClick={() => onRemove(symbol)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, lineHeight: 1, padding: '0 1px', opacity: 0.7 }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
      >×</button>
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function Analyze({ showToast, autoLoad }) {
  const [tags, setTags]           = useState([...DEFAULT_TICKERS])
  const [inputVal, setInputVal]   = useState('')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [fetched, setFetched]     = useState(false)
  const [expanded, setExpanded]   = useState(false)        // progressive disclosure
  const [activePieIdx, setActivePieIdx] = useState(0)
  const [suggestions, setSuggestions]   = useState([])
  const [showDrop, setShowDrop]   = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)
  const debounce = useRef(null)

  /* Close dropdown on outside click */
  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])


  /* Autocomplete (debounced) */
  const fetchSugg = useCallback(q => {
    clearTimeout(debounce.current)
    if (!q.trim()) { setSuggestions([]); setShowDrop(false); return }
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchTickers(q.trim())
        setSuggestions(res.data.results || [])
        setShowDrop(true)
        setActiveIdx(-1)
      } catch { /* silent */ } finally { setSearching(false) }
    }, 180)
  }, [])

  const addTag = sym => {
    const s = sym.trim().toUpperCase().replace(/[^A-Z.]/g, '')
    if (!s) return
    if (tags.includes(s)) { showToast(`${s} is already in the list`, 'error'); setInputVal(''); return }
    if (tags.length >= MAX_TICKERS) { showToast(`Max ${MAX_TICKERS} tickers`, 'error'); return }
    setTags(prev => [...prev, s])
    setInputVal(''); setSuggestions([]); setShowDrop(false)
  }

  const removeTag = sym => setTags(prev => prev.filter(t => t !== sym))
  const resetToDefault = () => { setTags([...DEFAULT_TICKERS]); setData(null); setFetched(false) }

  const handleInputChange = e => {
    const v = e.target.value.toUpperCase()
    setInputVal(v)
    if (v.endsWith(',')) { addTag(v.slice(0, -1)); return }
    fetchSugg(v)
  }

  const handleKeyDown = e => {
    if (showDrop && suggestions.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); return }
      if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); addTag(suggestions[activeIdx].symbol); return }
      if (e.key === 'Escape')    { setShowDrop(false); return }
    }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addTag(inputVal); return }
    if (e.key === 'Backspace' && inputVal === '' && tags.length) setTags(prev => prev.slice(0, -1))
  }

  const run = async (e) => {
    e?.preventDefault()
    const tickers = tags.filter(Boolean)
    if (!tickers.length) { showToast('Add at least one ticker', 'error'); return }
    setLoading(true); setFetched(false)
    try {
      const res = await getMarketPulse(tickers)
      setData(res.data)
      setFetched(true)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Analysis failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  /* Deep-link from Learn tab — auto-fetch the default basket so the user lands on real data.
     Intentionally fires only once on mount; the setState chain inside `run` is the desired effect. */
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { if (autoLoad) run() }, [])

  /* ── Derived chart data ───────────────────────────────────── */
  const stocks = data?.stocks ?? []

  const barPriceData  = stocks.map(s => ({ name: s.symbol, Price: +(s.price ?? 0).toFixed(2) }))
  const barChangeData = stocks.map(s => ({
    name: s.symbol,
    'Change %': +(s.change_percent ?? 0).toFixed(2),
    '30d Δ':    +(s.period_change   ?? 0).toFixed(2),
  }))
  const barVolumeData = stocks.map(s => ({ name: s.symbol, Volume: +(s.volume ?? 0) }))
  const barRiskData   = stocks.map(s => ({
    name: s.symbol,
    'Ann. Vol %': +(s.annual_volatility ?? 0).toFixed(2),
    'Max Gain %': +(s.max_gain ?? 0).toFixed(2),
    'Max Loss %': Math.abs(+(s.max_loss ?? 0)).toFixed(2),
  }))
  const pieCapData = stocks
    .filter(s => (s.market_cap ?? 0) > 0)
    .map((s, i) => ({ name: s.symbol, value: s.market_cap, color: PALETTE[i % PALETTE.length] }))
  const radarData = stocks.map((s, i) => ({
    symbol: s.symbol,
    Volatility: +(s.volatility ?? 0).toFixed(2),
    'Max Gain':  Math.abs(+(s.max_gain ?? 0)).toFixed(2),
    'Max Loss':  Math.abs(+(s.max_loss ?? 0)).toFixed(2),
    'Ann Vol':   +(s.annual_volatility ?? 0).toFixed(2),
    fill: PALETTE[i % PALETTE.length],
  }))

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
          Stock Analysis
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Compare a basket of tickers side-by-side. Toggle full analysis for sentiment, risk &amp; volatility metrics.
        </p>
      </div>

      {/* ── Ticker input with autocomplete ─────────────────────── */}
      <form onSubmit={run} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Tickers ({tags.length}/{MAX_TICKERS})
          </div>
          <button
            type="button"
            onClick={resetToDefault}
            style={{
              background: 'none', border: '1px solid rgba(100,116,139,0.3)',
              borderRadius: 6, padding: '4px 12px', fontSize: 11, color: '#64748b', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.4)'; e.currentTarget.style.color = '#00d4aa' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(100,116,139,0.3)'; e.currentTarget.style.color = '#64748b' }}
          >↺ Reset</button>
        </div>

        <div ref={wrapRef} style={{ position: 'relative' }}>
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
              minHeight: 48, padding: '8px 12px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, cursor: 'text',
              transition: 'border-color 0.2s',
            }}
          >
            {tags.map((sym, i) => (
              <TickerTag key={sym} symbol={sym} color={PALETTE[i % PALETTE.length]} onRemove={removeTag} />
            ))}
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <input
                ref={inputRef}
                id="analyze-tickers-input"
                value={inputVal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length && setShowDrop(true)}
                placeholder={tags.length === 0 ? 'Type ticker or company name…' : 'Add more…'}
                autoComplete="off"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: '#e2e8f0', fontSize: 13, fontFamily: 'JetBrains Mono,monospace',
                  fontWeight: 600, width: '100%', padding: '2px 4px',
                }}
              />
              {searching && (
                <div style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}>
                  <LoadingSpinner size={12} color="#00d4aa" />
                </div>
              )}
            </div>
          </div>

          {/* Autocomplete dropdown */}
          {showDrop && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'rgba(10,12,28,0.97)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)', zIndex: 999,
            }}>
              <div style={{
                padding: '7px 14px 5px', fontSize: 10, color: '#334155',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                {suggestions.length} match{suggestions.length !== 1 ? 'es' : ''} · ↑↓ navigate · Enter to add
              </div>
              {suggestions.map((s, i) => (
                <div
                  key={s.symbol}
                  onMouseDown={() => addTag(s.symbol)}
                  onMouseEnter={() => setActiveIdx(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', cursor: 'pointer',
                    background: i === activeIdx ? 'rgba(0,212,170,0.08)' : 'transparent',
                    borderLeft: i === activeIdx ? '2px solid #00d4aa' : '2px solid transparent',
                    transition: 'background 0.12s',
                    opacity: tags.includes(s.symbol) ? 0.4 : 1,
                  }}
                >
                  <span style={{
                    fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: 13,
                    color: i === activeIdx ? '#00d4aa' : '#e2e8f0', minWidth: 58,
                  }}>
                    <Highlight text={s.symbol} query={inputVal} />
                  </span>
                  <span style={{ color: '#1e293b', fontSize: 18 }}>·</span>
                  <span style={{ color: '#64748b', fontSize: 13, flex: 1 }}>
                    <Highlight text={s.name} query={inputVal.toLowerCase()} />
                  </span>
                  {tags.includes(s.symbol) && <span style={{ fontSize: 10, color: '#334155' }}>already added</span>}
                  {i === activeIdx && !tags.includes(s.symbol) && <span style={{ color: '#00d4aa', fontSize: 11 }}>↵ add</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#334155' }}>
            Press <kbd style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px', fontFamily: 'inherit' }}>Space</kbd> or{' '}
            <kbd style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px', fontFamily: 'inherit' }}>,</kbd> to add ·{' '}
            <kbd style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px', fontFamily: 'inherit' }}>Backspace</kbd> to remove last
          </div>
          <button
            id="analyze-btn"
            type="submit"
            className="btn-primary"
            disabled={loading || tags.length === 0}
            style={{ minWidth: 140, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
          >
            {loading && <LoadingSpinner size={14} color="#080810" />}
            {loading ? 'Analyzing…' : `Analyze ${tags.length || ''} Stock${tags.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </form>

      {/* ── Results ────────────────────────────────────────────── */}
      {fetched && stocks.length > 0 && data && (
        <>
          {/* Sentiment */}
          <SentimentBanner sentiment={data.sentiment} count={data.tickers_analyzed?.length ?? stocks.length} />

          {/* Summary metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
            <MetricCard
              label="Best Performer"
              value={stocks[0]?.symbol || '—'}
              sub={`${pctSimple(stocks[0]?.change_percent)}`}
              color="#00d4aa"
            />
            <MetricCard
              label="Worst Performer"
              value={stocks[stocks.length - 1]?.symbol || '—'}
              sub={`${pctSimple(stocks[stocks.length - 1]?.change_percent)}`}
              color="#ff4d6d"
            />
            <MetricCard
              label="Avg Change"
              value={`${Number(data.average_change ?? 0) >= 0 ? '+' : ''}${Number(data.average_change ?? 0).toFixed(2)}%`}
              sub="across selection"
              color={Number(data.average_change ?? 0) >= 0 ? '#00d4aa' : '#ff4d6d'}
            />
            <MetricCard
              label="Total Mkt Cap"
              value={fmtCap(stocks.reduce((a, s) => a + (s.market_cap ?? 0), 0))}
              sub="combined"
              color="#6366f1"
            />
            {expanded && <>
              <MetricCard label="Gainers"   value={data.gainers}   sub="stocks up"   color="#00d4aa" />
              <MetricCard label="Losers"    value={data.losers}    sub="stocks down" color="#ff4d6d" />
              <MetricCard label="Unchanged" value={data.unchanged} sub="flat"        color="#f59e0b" />
              <MetricCard
                label="Total Volume"
                value={fmtVol(stocks.reduce((a, s) => a + (s.volume ?? 0), 0))}
                sub="today"
                color="#a78bfa"
              />
            </>}
          </div>

          {/* Data table */}
          <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Change %</th>
                    <th>30d Δ</th>
                    <th>Volume</th>
                    <th>Market Cap</th>
                    <th>Trend</th>
                    <th>Volatility</th>
                    {expanded && <>
                      <th>Max Gain</th>
                      <th>Max Loss</th>
                      <th>Ann. Vol</th>
                      <th>Risk</th>
                      <th>Day Range</th>
                      <th>52W Range</th>
                    </>}
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s, i) => (
                    <tr key={s.symbol}>
                      <td style={{ color: '#334155', fontWeight: 600 }}>{i + 1}</td>
                      <td>
                        <span style={{
                          fontFamily: 'JetBrains Mono,monospace', fontWeight: 700,
                          color: PALETTE[i % PALETTE.length], fontSize: 13,
                        }}>{s.symbol}</span>
                      </td>
                      <td style={{ color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.name}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', color: '#e2e8f0', fontWeight: 600 }}>
                          ${Number(s.price ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td>{pct(s.change_percent)}</td>
                      <td>{pct(s.period_change)}</td>
                      <td style={{ fontFamily: 'JetBrains Mono,monospace', color: '#94a3b8', fontSize: 12 }}>
                        {fmtVol(s.volume)}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono,monospace', color: '#94a3b8', fontSize: 12 }}>
                        {fmtCap(s.market_cap)}
                      </td>
                      <td><TrendBadge trend={s.trend} /></td>
                      <td style={{ fontFamily: 'JetBrains Mono,monospace', color: '#64748b' }}>
                        {Number(s.volatility ?? 0).toFixed(2)}%
                      </td>
                      {expanded && <>
                        <td style={{ fontFamily: 'JetBrains Mono,monospace', color: '#00d4aa', fontSize: 12 }}>
                          +{Number(s.max_gain ?? 0).toFixed(2)}%
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono,monospace', color: '#ff4d6d', fontSize: 12 }}>
                          {Number(s.max_loss ?? 0).toFixed(2)}%
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono,monospace', color: '#64748b', fontSize: 12 }}>
                          {Number(s.annual_volatility ?? 0).toFixed(1)}%
                        </td>
                        <td><RiskBadge level={s.risk_level} /></td>
                        <td style={{ fontFamily: 'JetBrains Mono,monospace', color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>
                          {s.day_range || '—'}
                        </td>
                        <td style={{ fontFamily: 'JetBrains Mono,monospace', color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>
                          {s.week52_range || '—'}
                        </td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Charts ────────────────────────────────────────── */}
          <SectionLabel>Visual Comparison</SectionLabel>

          {/* Row 1: always shown — Price + Change % */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 20, marginBottom: 20 }}>
            <div className="glass-card" style={{ padding: '20px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>
                Stock Price Comparison
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barPriceData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v}`} width={55} />
                  <Tooltip content={<ChartTip fmt={v => `$${v.toLocaleString()}`} />} />
                  <Bar dataKey="Price" radius={[4, 4, 0, 0]}>
                    {barPriceData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: '20px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>
                Change % vs 30-Day Δ
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barChangeData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} width={48} />
                  <Tooltip content={<ChartTip fmt={v => `${v > 0 ? '+' : ''}${v}%`} />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Bar dataKey="Change %" radius={[4, 4, 0, 0]} fill="#00d4aa" fillOpacity={0.85} />
                  <Bar dataKey="30d Δ"   radius={[4, 4, 0, 0]} fill="#6366f1" fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Toggle for full analysis */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 24px' }}>
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              style={{
                background: expanded ? 'rgba(0,212,170,0.10)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${expanded ? 'rgba(0,212,170,0.35)' : 'rgba(255,255,255,0.10)'}`,
                color: expanded ? '#00d4aa' : '#94a3b8',
                borderRadius: 8, padding: '9px 20px',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {expanded ? '▴ Hide Full Analysis' : '▾ Show Full Analysis (Risk · Volume · Radar)'}
            </button>
          </div>

          {/* Row 2: only when expanded — Volume + Risk grouped bar */}
          {expanded && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 20, marginBottom: 20 }}>
                <div className="glass-card" style={{ padding: '20px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>
                    Daily Volume Comparison
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barVolumeData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => fmtVol(v)} width={52} />
                      <Tooltip content={<ChartTip fmt={v => fmtVol(v)} />} />
                      <Bar dataKey="Volume" radius={[4, 4, 0, 0]}>
                        {barVolumeData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card" style={{ padding: '20px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>
                    Risk — Ann. Vol, Max Gain &amp; Max Loss
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barRiskData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => `${v}%`} width={46} />
                      <Tooltip content={<ChartTip fmt={v => `${v}%`} />} />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                      <Bar dataKey="Ann. Vol %" radius={[4, 4, 0, 0]} fill="#6366f1" fillOpacity={0.85} />
                      <Bar dataKey="Max Gain %" radius={[4, 4, 0, 0]} fill="#00d4aa" fillOpacity={0.85} />
                      <Bar dataKey="Max Loss %" radius={[4, 4, 0, 0]} fill="#ff4d6d" fillOpacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 3: Market Cap pie + (optional) radar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 20, marginBottom: 20 }}>
                {pieCapData.length > 0 && (
                  <div className="glass-card" style={{ padding: '20px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>
                      Market Cap Distribution
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          activeIndex={activePieIdx}
                          activeShape={ActivePieShape}
                          data={pieCapData}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={85}
                          dataKey="value"
                          onMouseEnter={(_, idx) => setActivePieIdx(idx)}
                        >
                          {pieCapData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div style={{
                                background: 'rgba(10,12,28,0.97)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#e2e8f0',
                              }}>
                                <div style={{ fontWeight: 700, color: d.color }}>{d.name}</div>
                                <div style={{ fontFamily: 'JetBrains Mono,monospace', marginTop: 4 }}>{fmtCap(d.value)}</div>
                              </div>
                            )
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', marginTop: 4 }}>
                      {pieCapData.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                          <span style={{ color: '#94a3b8' }}>{d.name}</span>
                          <span style={{ color: '#64748b', fontFamily: 'JetBrains Mono,monospace' }}>{fmtCap(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {radarData.length >= 3 && (
                  <div className="glass-card" style={{ padding: '20px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>
                      Risk Profile Radar
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.07)" />
                        <PolarAngleAxis dataKey="symbol" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} tick={{ fill: '#334155', fontSize: 10 }} />
                        <Radar name="Volatility" dataKey="Volatility" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.15} />
                        <Radar name="Max Gain"   dataKey="Max Gain"   stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                        <Radar name="Max Loss"   dataKey="Max Loss"   stroke="#ff4d6d" fill="#ff4d6d" fillOpacity={0.15} />
                        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                        <Tooltip content={<ChartTip fmt={v => `${v}%`} />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {fetched && stocks.length === 0 && (
        <div style={{
          color: '#ff4d6d', background: 'rgba(255,77,109,0.08)',
          border: '1px solid rgba(255,77,109,0.2)', borderRadius: 10,
          padding: '12px 16px', fontSize: 13,
        }}>
          ⚠ No data returned. Check your ticker symbols.
        </div>
      )}
    </div>
  )
}

/* Plain-text % helper used inside metric card subtitles */
function pctSimple(n) {
  const v = Number(n ?? 0)
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}
