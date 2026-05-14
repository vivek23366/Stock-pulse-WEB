/**
 * LoadingSpinner — stock-themed.
 *
 * Renders a row of candlestick wicks that rise and fall, evoking a price
 * chart loading. Falls back to a chart-line SVG sweep when `variant="line"`.
 *
 * Props:
 *   size:    overall width in px (default 28)
 *   color:   bull/teal accent color (default #00d4aa)
 *   variant: 'candles' | 'line' | 'ring'   (default 'candles')
 */
export default function LoadingSpinner({ size = 28, color = '#00d4aa', variant }) {
  // Small inline contexts (button labels) look best as a clean ring;
  // larger contexts get the candlestick animation by default.
  const v = variant || (size <= 20 ? 'ring' : 'candles')
  if (v === 'ring') {
    return (
      <div style={{
        width: size, height: size,
        border: '2px solid rgba(255,255,255,0.08)',
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }} />
    )
  }

  if (v === 'line') {
    const w = size * 2.2
    const h = size
    return (
      <svg width={w} height={h} viewBox="0 0 100 40" style={{ display: 'inline-block' }}>
        <polyline
          points="0,28 12,22 22,30 34,18 46,24 58,10 70,16 82,6 100,12"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 200,
            animation: 'chartDraw 1.6s ease-in-out infinite',
          }}
        />
        <circle cx="100" cy="12" r="2.6" fill={color}
          style={{ animation: 'chartDot 1.6s ease-in-out infinite' }} />
      </svg>
    )
  }

  // 'candles' variant — five mini candlesticks pulsing like a chart
  const candleCount = 5
  const barWidth = size / (candleCount * 1.8)
  return (
    <div
      role="status"
      aria-label="Loading market data"
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: barWidth * 0.7,
        height: size,
        width: size * 1.4,
      }}
    >
      {Array.from({ length: candleCount }).map((_, i) => (
        <span
          key={i}
          style={{
            width: barWidth,
            height: '100%',
            position: 'relative',
            color: i % 2 === 0 ? color : '#ff4d6d',
          }}
        >
          {/* wick */}
          <span style={{
            position: 'absolute',
            left: '50%',
            top: 0, bottom: 0,
            width: 1.2,
            transform: 'translateX(-50%)',
            background: 'currentColor',
            opacity: 0.45,
          }} />
          {/* body */}
          <span style={{
            position: 'absolute',
            left: 0, right: 0,
            background: 'currentColor',
            borderRadius: 1,
            animation: `candleBeat 1.1s ease-in-out infinite`,
            animationDelay: `${i * 0.12}s`,
          }} />
        </span>
      ))}
      <style>{`
        @keyframes candleBeat {
          0%, 100% { top: 30%; bottom: 30%; opacity: 0.55; }
          50%      { top: 8%;  bottom: 8%;  opacity: 1; }
        }
      `}</style>
    </div>
  )
}
