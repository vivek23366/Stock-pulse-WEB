import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import StockSearch from './components/StockSearch'
import Analyze from './components/Analyze'
import WatchMode from './components/WatchMode'
import PaperTrading from './components/PaperTrading'
import Learn from './components/Learn'
import Toast from './components/Toast'
import LoginPage, { saveSession, clearSession } from './components/LoginPage'

const TABS = [
  { id: 'search',  label: 'Quote' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'watch',   label: 'Watchlist' },
  { id: 'trade',   label: 'Portfolio' },
  { id: 'learn',   label: 'Learn' },
]

/* ─── User avatar pill ─────────────────────────────────────── */
function UserPill({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.22)',
          borderRadius: 24, padding: '5px 14px 5px 8px',
          cursor: 'pointer', color: '#e2e8f0', fontSize: 13, fontWeight: 600,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.5)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.22)'}
      >
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(0,212,170,0.18)',
          border: '1px solid rgba(0,212,170,0.4)',
          color: '#00d4aa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.02em',
        }}>{(user.name || user.username || '?').slice(0, 2).toUpperCase()}</span>
        {user.name}
        <span style={{ color: '#64748b', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'rgba(12,15,30,0.98)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, overflow: 'hidden', minWidth: 180,
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)', zIndex: 999,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono,monospace' }}>@{user.username}</div>
          </div>
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '11px 16px', background: 'none', border: 'none',
            color: '#ff4d6d', fontSize: 13, cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,109,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Session helpers ────────────────────────── */
const API = 'http://localhost:8000'

async function verifyToken(token) {
  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return await res.json()  // returns user object
  } catch {
    return null
  }
}

/* ═══════════════════════════════════════════════════════════ */
export default function App() {
  const [user, setUser]         = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [activeTab, setActiveTab] = useState('search')
  const [autoLoad, setAutoLoad]   = useState(false)   // true when tab was reached via a Learn deep-link
  const [toast, setToast]       = useState(null)

  /* Plain navbar click — switch tabs but don't trigger auto-fetch */
  const switchTab = useCallback((tabId) => {
    setActiveTab(tabId)
    setAutoLoad(false)
  }, [])

  /* Deep-link from the Learn tab — switch + ask destination to auto-fetch its default view */
  const jumpToTab = useCallback((tabId) => {
    setActiveTab(tabId)
    setAutoLoad(true)
  }, [])

  /* Restore session on mount — verify JWT with backend */
  useEffect(() => {
    const token = localStorage.getItem('sp_token')
    if (!token) { setAuthReady(true); return }
    verifyToken(token).then(user => {
      if (user) setUser(user)
      else clearSession()
      setAuthReady(true)
    })
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const handleLogin = (userData) => {
    setUser(userData)
    showToast(`Signed in as ${userData.name}`, 'success')
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
    setActiveTab('search')
    setAutoLoad(false)
    setToast(null)
  }

  /* Show nothing until auth state is resolved (avoids flash) */
  if (!authReady) return null

  /* Show login page if not authenticated */
  if (!user) return <LoginPage onLogin={handleLogin} />

  return (
    <div className="min-h-screen chart-grid-bg">
      {/* Navbar with user pill injected */}
      <div style={{ position: 'relative' }}>
        <Navbar activeTab={activeTab} onTabChange={switchTab} tabs={TABS} />
        {/* User pill — absolutely positioned in top-right of navbar */}
        <div style={{ position: 'absolute', top: '50%', right: 20, transform: 'translateY(-50%)', zIndex: 100 }}>
          <UserPill user={user} onLogout={handleLogout} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === 'search'  && <StockSearch showToast={showToast} autoLoad={autoLoad} />}
          {activeTab === 'analyze' && <Analyze showToast={showToast} autoLoad={autoLoad} />}
          {activeTab === 'watch'   && <WatchMode showToast={showToast} autoLoad={autoLoad} />}
          {activeTab === 'trade'   && <PaperTrading showToast={showToast} />}
          {activeTab === 'learn'   && <Learn onTabChange={jumpToTab} />}
        </div>
      </main>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} />}
    </div>
  )
}
