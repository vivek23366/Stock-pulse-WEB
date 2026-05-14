import { useState, useEffect } from 'react'

/* Live local clock + market open/close indicator */
function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#475569', letterSpacing: '0.04em' }}>
      {time}
    </span>
  )
}

/* Stylised candlestick logo — wick + body, two of them clustered */
function CandleLogo() {
  return (
    <div style={{
      width: 34, height: 34,
      background: 'rgba(15,17,28,0.9)',
      borderRadius: 7,
      border: '1px solid rgba(0,212,170,0.20)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 3,
      padding: '4px 6px',
    }}>
      {/* bull candle */}
      <span style={{ position: 'relative', width: 5, height: '78%' }}>
        <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1.2, transform: 'translateX(-50%)', background: '#00d4aa', opacity: 0.55 }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top: '20%', bottom: '15%', background: '#00d4aa', borderRadius: 1 }} />
      </span>
      {/* bear candle */}
      <span style={{ position: 'relative', width: 5, height: '60%' }}>
        <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1.2, transform: 'translateX(-50%)', background: '#ff4d6d', opacity: 0.55 }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top: '15%', bottom: '25%', background: '#ff4d6d', borderRadius: 1 }} />
      </span>
      {/* tall bull candle */}
      <span style={{ position: 'relative', width: 5, height: '92%' }}>
        <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1.2, transform: 'translateX(-50%)', background: '#00d4aa', opacity: 0.55 }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top: '8%', bottom: '12%', background: '#00d4aa', borderRadius: 1 }} />
      </span>
    </div>
  )
}

/* Determine if NYSE is open right now (rough heuristic, no holidays).
   Used purely as a visual state — not as financial logic. */
function getMarketStatus() {
  const now = new Date()
  const utc = now.getUTCHours() * 60 + now.getUTCMinutes()
  const day = now.getUTCDay() // 0=Sun, 6=Sat
  // NYSE roughly 14:30–21:00 UTC on weekdays
  const isWeekday = day >= 1 && day <= 5
  const isOpen = isWeekday && utc >= 14 * 60 + 30 && utc < 21 * 60
  return isOpen ? 'open' : 'closed'
}

function MarketStatus() {
  const [status, setStatus] = useState(getMarketStatus())
  useEffect(() => {
    const id = setInterval(() => setStatus(getMarketStatus()), 30_000)
    return () => clearInterval(id)
  }, [])
  const isOpen = status === 'open'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px',
      borderRadius: 999,
      background: isOpen ? 'rgba(0,212,170,0.10)' : 'rgba(245,158,11,0.10)',
      border: `1px solid ${isOpen ? 'rgba(0,212,170,0.25)' : 'rgba(245,158,11,0.25)'}`,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      color: isOpen ? '#00d4aa' : '#f59e0b',
      textTransform: 'uppercase',
    }}>
      <span className={isOpen ? 'market-dot' : ''} style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isOpen ? '#00d4aa' : '#f59e0b',
      }} />
      {isOpen ? 'Market Open' : 'After Hours'}
    </span>
  )
}

/* Scrolling ticker tape — each item shows symbol, price, % change.
   Mock data is fine here: this strip is decorative. We render the list
   twice back-to-back so the scroll loop is seamless. */
const TICKERS = [
  { sym: 'AAPL',  px: '273.76', chg: '+0.13%', dir: 'up' },
  { sym: 'GOOGL', px: '313.56', chg: '+0.02%', dir: 'up' },
  { sym: 'MSFT',  px: '487.10', chg: '-0.13%', dir: 'down' },
  { sym: 'TSLA',  px: '459.64', chg: '-3.27%', dir: 'down' },
  { sym: 'NVDA',  px: '142.18', chg: '+1.84%', dir: 'up' },
  { sym: 'AMZN',  px: '218.45', chg: '+0.42%', dir: 'up' },
  { sym: 'META',  px: '602.10', chg: '-0.88%', dir: 'down' },
  { sym: 'NFLX',  px: '785.32', chg: '+2.11%', dir: 'up' },
  { sym: 'AMD',   px: '128.94', chg: '-1.15%', dir: 'down' },
  { sym: 'INTC',  px: '23.60',  chg: '+0.71%', dir: 'up' },
  { sym: 'BTC',   px: '94,210', chg: '+1.92%', dir: 'up' },
  { sym: 'ETH',   px: '3,212',  chg: '-0.34%', dir: 'down' },
]

function TickerTape() {
  const items = [...TICKERS, ...TICKERS] // duplicate for seamless loop
  return (
    <div className="ticker-strip" aria-hidden="true">
      <div className="ticker-track">
        {items.map((t, i) => (
          <span key={i} className={`ticker-item ${t.dir}`}>
            <span className="sym">{t.sym}</span>
            <span className="px">{t.px}</span>
            <span className="chg">
              <span className="arrow">{t.dir === 'up' ? '▲' : '▼'}</span> {t.chg}
            </span>
            <span className="sep">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Navbar({ activeTab, onTabChange, tabs }) {
  return (
    <header style={{
      background: 'rgba(8,8,16,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,212,170,0.10)',
      position: 'sticky', top: 0, zIndex: 40,
      boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
    }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <CandleLogo />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="gradient-text" style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
              StockPulse
            </span>
            <span style={{ fontSize: 9, color: '#475569', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Live Markets · NYSE
            </span>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 500,
                  fontFamily: 'Inter,sans-serif', transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                  background: active ? 'rgba(0,212,170,0.10)' : 'transparent',
                  color: active ? '#00d4aa' : '#64748b',
                  boxShadow: active ? 'inset 0 -2px 0 #00d4aa' : 'none',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Right: market status + clock */}
        <div className="flex items-center gap-3 shrink-0">
          <MarketStatus />
          <LiveClock />
        </div>
      </div>

      {/* Scrolling ticker tape */}
      <TickerTape />
    </header>
  )
}
