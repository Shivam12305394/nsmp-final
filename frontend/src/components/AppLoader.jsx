import React from 'react';

export default function AppLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5, 8, 22, 0.72)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      animation: 'fadeIn 0.3s ease both',
    }}>
      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.12), transparent 70%)', top: '10%', left: '20%', filter: 'blur(80px)', animation: 'orbFloat 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.1), transparent 70%)', bottom: '10%', right: '15%', filter: 'blur(80px)', animation: 'orbFloat 22s ease-in-out infinite reverse' }} />
      </div>

      {/* Glass card */}
      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        padding: '40px 48px',
        borderRadius: 28,
        background: 'linear-gradient(180deg, rgba(13,23,42,0.72) 0%, rgba(8,16,31,0.64) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'modalIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Top shimmer line */}
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.7), rgba(34,211,238,0.7), transparent)', borderRadius: 99 }} />

        {/* Logo with spinning rings */}
        <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--primary)',
            borderRightColor: 'var(--primary)',
            animation: 'spin 1.4s linear infinite',
            boxShadow: '0 0 18px rgba(52,211,153,0.2)',
          }} />
          {/* Inner ring */}
          <div style={{
            position: 'absolute', inset: 10, borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: 'var(--teal)',
            borderLeftColor: 'var(--teal)',
            animation: 'spin 1s linear infinite reverse',
          }} />
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--teal) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 8px 24px rgba(52,211,153,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            animation: 'logoFloat 3s ease-in-out infinite',
          }}>🎓</div>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text1)', letterSpacing: -0.3 }}>NSMP</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, letterSpacing: 0.3 }}>Loading your portal...</div>
        </div>

        {/* Animated dots */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--primary)',
              opacity: 0.3,
              animation: `dotBounce 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
              boxShadow: '0 0 8px rgba(52,211,153,0.4)',
            }} />
          ))}
        </div>

        {/* Bottom shimmer line */}
        <div style={{ position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)', borderRadius: 99 }} />
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
