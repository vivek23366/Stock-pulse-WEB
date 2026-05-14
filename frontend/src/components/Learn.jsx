import { useState, useMemo } from 'react'

/* ─── Categories ──────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',     label: 'All',          color: '#94a3b8' },
  { id: 'pricing', label: 'Price & Quote', color: '#00d4aa' },
  { id: 'volume',  label: 'Volume & Size', color: '#a78bfa' },
  { id: 'risk',    label: 'Risk & Volatility', color: '#ff4d6d' },
  { id: 'trend',   label: 'Trend & Sentiment', color: '#6366f1' },
  { id: 'trading', label: 'Trading',      color: '#f59e0b' },
]
const CAT_COLOR = Object.fromEntries(CATEGORIES.map(c => [c.id, c.color]))

/* ─── Glossary content ────────────────────────────────────────
   Every term shown anywhere in the app, with a plain-English
   definition, one concrete example, and a back-link to the tab
   that uses it. */
const GLOSSARY = [
  // ── Pricing ────────────────────────────────────────────────
  {
    term: 'Ticker / Symbol',
    cat: 'pricing',
    def: 'A short code (1–5 letters) that uniquely identifies a publicly traded company on an exchange.',
    example: 'AAPL = Apple, MSFT = Microsoft, BRK.B = Berkshire Hathaway Class B.',
    where: 'search',
  },
  {
    term: 'Price',
    cat: 'pricing',
    def: 'The most recent transaction price for one share. Updates throughout the trading day; “last price” outside market hours.',
    example: 'AAPL @ $273.76 means the last trade happened at that price.',
    where: 'search',
  },
  {
    term: 'Change % (Daily)',
    cat: 'pricing',
    def: 'How much the stock moved today vs. yesterday’s close, in percent. Green = up, red = down.',
    example: '+0.13% means today’s price is 0.13% higher than yesterday’s closing price.',
    where: 'analyze',
  },
  {
    term: '30-day Δ (Period Change)',
    cat: 'pricing',
    def: 'The percent change over roughly the last month of trading. Smooths out single-day noise to show a trend.',
    example: '–3.30% means the stock is 3.3% lower than it was ~30 trading days ago.',
    where: 'analyze',
  },
  {
    term: 'Day Range',
    cat: 'pricing',
    def: 'The lowest and highest price the stock traded at during today’s session. A wide range = volatile day.',
    example: '$272.35 – $274.36 means the stock swung within that band today.',
    where: 'search',
  },
  {
    term: '52-Week Range',
    cat: 'pricing',
    def: 'The lowest and highest price over the last 12 months. Useful for spotting whether you’re near long-term highs or lows.',
    example: '$169.21 – $288.62: today’s $273.76 is near the upper end of the year.',
    where: 'search',
  },

  // ── Volume / Size ──────────────────────────────────────────
  {
    term: 'Volume',
    cat: 'volume',
    def: 'How many shares changed hands today. Higher volume = more liquidity, easier to enter and exit.',
    example: '23.40M means 23.4 million shares were traded today.',
    where: 'analyze',
  },
  {
    term: 'Market Cap',
    cat: 'volume',
    def: 'Total value of all the company’s shares (price × shares outstanding). A rough size-of-company yardstick.',
    example: '$3.5T (Apple) is “mega-cap”; under $2B is “small-cap”.',
    where: 'analyze',
  },

  // ── Risk / Volatility ──────────────────────────────────────
  {
    term: 'Volatility (Daily)',
    cat: 'risk',
    def: 'Average size of daily price swings, in percent. Higher = bumpier ride. Calculated as the standard deviation of daily returns.',
    example: '0.70% daily vol ≈ on a typical day, the stock moves about 0.7% in either direction.',
    where: 'analyze',
  },
  {
    term: 'Annual Volatility',
    cat: 'risk',
    def: 'Daily volatility scaled to a one-year horizon (≈ daily vol × √252). The standard way pros quote risk.',
    example: '11% annual vol = relatively calm. 50%+ = highly speculative.',
    where: 'analyze',
  },
  {
    term: 'Max Gain (30d)',
    cat: 'risk',
    def: 'The single biggest one-day jump up over the lookback period. Shows the upside surprise potential.',
    example: '+1.09% means the best day in the last month was a 1.09% gain.',
    where: 'analyze',
  },
  {
    term: 'Max Loss (30d)',
    cat: 'risk',
    def: 'The single biggest one-day drop over the lookback period. Shows worst-case downside seen recently.',
    example: '–1.50% means the worst day in the last month was a 1.50% loss.',
    where: 'analyze',
  },
  {
    term: 'Risk Level',
    cat: 'risk',
    def: 'A simple Low / Medium / High / Extreme bucket based on annual volatility. Lets you compare risk at a glance.',
    example: 'Utility stock = Low. Crypto-adjacent or biotech = often Extreme.',
    where: 'analyze',
  },

  // ── Trend / Sentiment ──────────────────────────────────────
  {
    term: 'Trend',
    cat: 'trend',
    def: 'The direction the stock has been moving over the lookback window. Computed from the slope of recent prices.',
    example: '▲ Bullish = trending up. ▼ Bearish = trending down. ◆ Neutral = sideways.',
    where: 'analyze',
  },
  {
    term: 'Bullish / Bearish',
    cat: 'trend',
    def: 'Bullish = expecting price to rise (named after a bull’s upward horn-thrust). Bearish = expecting price to fall (a bear swipes downward).',
    example: 'A “bullish market” means most stocks are up; a “bearish market” means most are down.',
    where: 'analyze',
  },
  {
    term: 'Sentiment (Market Pulse)',
    cat: 'trend',
    def: 'An aggregate read across your basket: are most stocks green or red right now? Calculated from the gainers-vs-losers ratio.',
    example: '6 of 8 tickers up → BULLISH MARKET banner. Mostly down → BEARISH.',
    where: 'analyze',
  },
  {
    term: 'Sparkline',
    cat: 'trend',
    def: 'A tiny inline chart showing recent price movement at a glance, without axes or labels. Used to spot a trend in a single glyph.',
    example: '▆█▆▅▄▃▃▄▃▃▁▁ — visible decline from left to right.',
    where: 'search',
  },
  {
    term: 'Support & Resistance',
    cat: 'trend',
    def: 'Support = a price level the stock has bounced off of (acts like a floor). Resistance = a level it has struggled to break above (acts like a ceiling).',
    example: 'Support $270.97 / Resistance $286.19 — until broken, expect the stock to stay in that band.',
    where: 'search',
  },

  // ── Trading ────────────────────────────────────────────────
  {
    term: 'Watchlist',
    cat: 'trading',
    def: 'A personal list of tickers you’re tracking, without owning them. Just for monitoring price and signals.',
    example: 'Add NVDA to your watchlist before deciding whether to buy.',
    where: 'watch',
  },
  {
    term: 'Portfolio (Paper Trading)',
    cat: 'trading',
    def: 'A simulated portfolio with fake money, so you can practice buying and selling without real-world risk.',
    example: 'Start with $100,000 paper cash, place a few trades, see how you do over a month.',
    where: 'trade',
  },
  {
    term: 'Cost Basis (Average Cost)',
    cat: 'trading',
    def: 'The average price you paid per share, weighted by quantity. The number your P&L is measured against.',
    example: 'Buy 10 @ $100 then 10 @ $120 → cost basis = $110/share.',
    where: 'trade',
  },
  {
    term: 'P&L (Profit & Loss)',
    cat: 'trading',
    def: 'How much money you’ve made or lost on a position. Unrealized = on paper (still holding); realized = locked in (after selling).',
    example: 'Cost basis $110, current price $130, 10 shares → unrealized P&L = +$200.',
    where: 'trade',
  },
  {
    term: 'Position',
    cat: 'trading',
    def: 'A holding in a specific ticker — the quantity you own and what you paid. Your portfolio is a collection of positions.',
    example: '“My AAPL position is 25 shares at $260 average cost.”',
    where: 'trade',
  },
  {
    term: 'Long vs. Short',
    cat: 'trading',
    def: 'Long = you own the shares and profit when price goes up. Short = you’ve borrowed shares hoping to buy back lower.',
    example: 'This app only supports long positions (paper buying & selling).',
    where: 'trade',
  },
]

/* ─── Curated learning resources (channel-level, no fragile video IDs) ─── */
const RESOURCES = [
  {
    title: 'Khan Academy — Stocks & Bonds',
    by: 'Khan Academy',
    desc: 'Free, foundational explainers on what stocks are, how exchanges work, and why prices move.',
    url: 'https://www.khanacademy.org/economics-finance-domain/core-finance/stock-and-bonds',
    tone: '#00d4aa',
  },
  {
    title: 'Investopedia — Stock Market Basics',
    by: 'Investopedia',
    desc: 'Reference-style articles on every term in the glossary, plus deeper dives on volatility, valuation, and analysis.',
    url: 'https://www.investopedia.com/terms/s/stockmarket.asp',
    tone: '#6366f1',
  },
  {
    title: 'Ben Felix — Common Sense Investing',
    by: 'YouTube',
    desc: 'Evidence-based videos on long-term investing, risk, diversification, and what actually drives returns.',
    url: 'https://www.youtube.com/@BenFelixCSI',
    tone: '#a78bfa',
  },
  {
    title: 'The Plain Bagel',
    by: 'YouTube',
    desc: 'Approachable finance explainers — “What is volatility?”, “How short selling works”, and similar primers.',
    url: 'https://www.youtube.com/@ThePlainBagel',
    tone: '#f59e0b',
  },
  {
    title: 'Yahoo Finance Glossary',
    by: 'Yahoo',
    desc: 'Same data source this app pulls from — useful when a number on a chart doesn’t match what you expected.',
    url: 'https://finance.yahoo.com/lookup',
    tone: '#3b82f6',
  },
  {
    title: 'CFA Institute — Investor Resources',
    by: 'CFA Institute',
    desc: 'More advanced material once you’ve outgrown the basics — risk-adjusted returns, portfolio theory, ratios.',
    url: 'https://www.cfainstitute.org/insights',
    tone: '#34d399',
  },
]

/* ─── Sub-components ──────────────────────────────────────── */
function CategoryPill({ cat, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 999,
        border: `1px solid ${active ? cat.color + '55' : 'rgba(255,255,255,0.08)'}`,
        background: active ? cat.color + '14' : 'rgba(255,255,255,0.02)',
        color: active ? cat.color : '#94a3b8',
        fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
        cursor: 'pointer', transition: 'all 0.18s',
        display: 'inline-flex', alignItems: 'center', gap: 7,
      }}
    >
      {cat.label}
      {count != null && (
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 999,
          background: active ? cat.color + '22' : 'rgba(255,255,255,0.05)',
          color: active ? cat.color : '#64748b',
          fontFamily: 'JetBrains Mono,monospace',
        }}>{count}</span>
      )}
    </button>
  )
}

function GlossaryCard({ entry, onJump }) {
  const color = CAT_COLOR[entry.cat] || '#94a3b8'
  const tabLabel = {
    search: 'Quote tab', analyze: 'Analyze tab',
    watch: 'Watchlist tab', trade: 'Portfolio tab',
  }[entry.where] || 'this app'
  return (
    <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
          {entry.term}
        </h3>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          color, background: `${color}14`, border: `1px solid ${color}33`,
          padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
          whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono,monospace',
        }}>{entry.cat}</span>
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.55, color: '#cbd5e1' }}>{entry.def}</p>

      <div style={{
        fontSize: 12, color: '#94a3b8',
        background: 'rgba(255,255,255,0.025)', borderLeft: `2px solid ${color}66`,
        padding: '8px 12px', borderRadius: '0 6px 6px 0',
        fontFamily: 'JetBrains Mono,monospace', lineHeight: 1.5,
      }}>
        <span style={{ color: '#64748b', fontWeight: 700, marginRight: 6 }}>EX:</span>
        {entry.example}
      </div>

      <button
        onClick={() => onJump?.(entry.where)}
        style={{
          marginTop: 'auto', alignSelf: 'flex-start',
          background: 'none', border: 'none', cursor: 'pointer',
          color: color, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
          padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
        onMouseLeave={e => e.currentTarget.style.opacity = 1}
      >
        See it on the {tabLabel} →
      </button>
    </div>
  )
}

function ResourceCard({ res }) {
  return (
    <a
      href={res.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card"
      style={{
        padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
        textDecoration: 'none', cursor: 'pointer',
        transition: 'transform 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = `${res.tone}40`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          color: res.tone, textTransform: 'uppercase',
          fontFamily: 'JetBrains Mono,monospace',
        }}>{res.by}</span>
        <span style={{ color: res.tone, fontSize: 14 }}>↗</span>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>{res.title}</h3>
      <p style={{ fontSize: 12, lineHeight: 1.55, color: '#94a3b8' }}>{res.desc}</p>
    </a>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function Learn({ onTabChange }) {
  const [query, setQuery]   = useState('')
  const [activeCat, setCat] = useState('all')

  /* Per-category counts (ignoring search, so the pills always show totals) */
  const counts = useMemo(() => {
    const c = { all: GLOSSARY.length }
    for (const cat of CATEGORIES) if (cat.id !== 'all') c[cat.id] = 0
    for (const g of GLOSSARY) c[g.cat] = (c[g.cat] || 0) + 1
    return c
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return GLOSSARY.filter(g => {
      if (activeCat !== 'all' && g.cat !== activeCat) return false
      if (!q) return true
      return (
        g.term.toLowerCase().includes(q) ||
        g.def.toLowerCase().includes(q)  ||
        g.example.toLowerCase().includes(q)
      )
    })
  }, [query, activeCat])

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
          Learn
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Plain-English definitions for every metric in StockPulse — plus links to deeper learning.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          id="learn-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search terms — e.g. volatility, market cap, P&L…"
          style={{
            width: '100%', padding: '12px 16px 12px 40px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, outline: 'none',
            color: '#e2e8f0', fontSize: 13, fontFamily: 'Inter,sans-serif',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.4)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: '#475569', fontSize: 14,
        }}>⌕</span>
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16,
            }}
          >×</button>
        )}
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <CategoryPill
            key={c.id}
            cat={c}
            active={activeCat === c.id}
            count={counts[c.id]}
            onClick={() => setCat(c.id)}
          />
        ))}
      </div>

      {/* Glossary grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16, marginBottom: 36,
        }}>
          {filtered.map(g => (
            <GlossaryCard key={g.term} entry={g} onJump={onTabChange} />
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{
          padding: '40px 20px', textAlign: 'center',
          color: '#64748b', fontSize: 13, marginBottom: 36,
        }}>
          No terms match <span style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono,monospace' }}>“{query}”</span>.
          <br/>
          <button
            onClick={() => { setQuery(''); setCat('all') }}
            style={{
              marginTop: 12, background: 'none', border: '1px solid rgba(0,212,170,0.3)',
              color: '#00d4aa', borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer',
            }}
          >Clear filters</button>
        </div>
      )}

      {/* ── Resources ────────────────────────────────────────── */}
      <div style={{
        fontSize: 13, fontWeight: 700, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        Go Deeper
        <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
        Free educational channels and references — open in a new tab.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        {RESOURCES.map(r => <ResourceCard key={r.url} res={r} />)}
      </div>

      <div style={{
        fontSize: 11, color: '#475569', textAlign: 'center', padding: '16px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        Educational content only — not investment advice. Past performance ≠ future results.
      </div>
    </div>
  )
}
