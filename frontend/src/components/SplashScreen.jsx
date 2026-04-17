import React, { useEffect, useState, useRef } from 'react';

// Generates stable bubble configs
function generateBubbles(count) {
  const bubbles = [];
  for (let i = 0; i < count; i++) {
    bubbles.push({
      id: i,
      size: Math.random() * 80 + 20,
      x: Math.random() * 100,
      delay: Math.random() * 8,
      duration: Math.random() * 12 + 8,
      opacity: Math.random() * 0.18 + 0.04,
      color: ['#34D399', '#22D3EE', '#4F46E5', '#10B981', '#7C3AED'][Math.floor(Math.random() * 5)],
    });
  }
  return bubbles;
}

const BUBBLES = generateBubbles(30);

export function BubbleBackground() {
  return (
    <div className="bubble-bg" aria-hidden="true">
      {BUBBLES.map((b) => (
        <div
          key={b.id}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.x}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            background: `radial-gradient(circle at 30% 30%, ${b.color}40, ${b.color}08)`,
            border: `1px solid ${b.color}25`,
            opacity: b.opacity,
          }}
        />
      ))}
      {/* Mesh gradient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0); // 0=enter, 1=hold, 2=exit
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Progress bar animation
  useEffect(() => {
    let start = null;
    const duration = 2400;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      // Ease out cubic
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Phase timing
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2600);
    const t3 = setTimeout(() => onDone?.(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  // 3D canvas DNA helix / particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      t += 0.015;

      const cx = W / 2;
      const cy = H / 2;
      const nodes = 60;

      // Draw orbital rings
      for (let ring = 0; ring < 3; ring++) {
        const rx = 90 + ring * 30;
        const ry = 28 + ring * 10;
        const rot = t * (0.4 + ring * 0.2) + ring * 1.2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        const ringAlpha = 0.06 + ring * 0.03;
        ctx.strokeStyle = `rgba(99,102,241,${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Particles on ring
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2 + rot;
          const px = cx + Math.cos(angle) * rx;
          const py = cy + Math.sin(angle) * ry;
          const depth = Math.sin(angle);
          const size = 2.5 + depth * 1.5;
          const alpha = 0.3 + depth * 0.4;
const colors = ['37,99,235', '59,130,246', '16,185,129', '147,51,234'];
          ctx.beginPath();
          ctx.arc(px, py, Math.max(size, 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${colors[ring % colors.length]},${alpha})`;
          ctx.fill();
        }
      }

      // Central 3D sphere shimmer
      const pulse = 0.8 + Math.sin(t * 2) * 0.1;
      const grad = ctx.createRadialGradient(cx - 12, cy - 12, 0, cx, cy, 44 * pulse);
      grad.addColorStop(0, 'rgba(139,92,246,0.6)');
      grad.addColorStop(0.5, 'rgba(99,102,241,0.3)');
      grad.addColorStop(1, 'rgba(16,185,129,0.05)');
      ctx.beginPath();
      ctx.arc(cx, cy, 44 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Gloss
      const gloss = ctx.createRadialGradient(cx - 14, cy - 14, 0, cx - 8, cy - 8, 22);
      gloss.addColorStop(0, 'rgba(255,255,255,0.25)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 44 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = gloss;
      ctx.fill();

      // Floating particles
      for (let i = 0; i < nodes; i++) {
        const angle = (i / nodes) * Math.PI * 2 + t * 0.1;
        const r = 140 + Math.sin(t * 0.5 + i) * 30;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r * 0.35;
        const z = Math.sin(angle + t);
        const s = 1 + z * 1.2;
        const a = 0.08 + z * 0.15;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(s, 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${a})`;
        ctx.fill();

        // Connecting lines to nearby particles
        if (i % 4 === 0) {
          const ni = (i + 4) % nodes;
          const na = (ni / nodes) * Math.PI * 2 + t * 0.1;
          const nr = 140 + Math.sin(t * 0.5 + ni) * 30;
          const nx = cx + Math.cos(na) * nr;
          const ny = cy + Math.sin(na) * nr * 0.35;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(nx, ny);
          ctx.strokeStyle = `rgba(99,102,241,${a * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div
      className="splash-screen"
      style={{
        opacity: phase === 2 ? 0 : 1,
        transform: phase === 2 ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <BubbleBackground />

      {/* Canvas 3D scene */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          opacity: 0.7,
        }}
      />

      {/* Content */}
      <div
        className="splash-content"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Logo */}
        <div className="splash-logo">
          <div className="splash-logo-ring splash-logo-ring-1" />
          <div className="splash-logo-ring splash-logo-ring-2" />
          <div className="splash-logo-icon">🎓</div>
        </div>

        <div className="splash-title">NSMP</div>
        <div className="splash-subtitle">National Scholarship Management Portal</div>

        <div className="splash-tagline">
          <span className="splash-tag-word">Empowering</span>{' '}
          <span className="splash-tag-word" style={{ color: 'var(--emerald)' }}>Students</span>{' '}
          <span className="splash-tag-word">Across India</span>
        </div>

        {/* Progress */}
        <div className="splash-progress-wrap">
          <div className="splash-progress-bar">
            <div
              className="splash-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
            <div
              className="splash-progress-glow"
              style={{ left: `${progress * 100}%` }}
            />
          </div>
          <div className="splash-progress-text">{Math.round(progress * 100)}%</div>
        </div>

        <div className="splash-loading-text">
          {progress < 0.4 ? 'Initializing systems...'
          : progress < 0.7 ? 'Loading scholarship data...'
          : progress < 0.95 ? 'Preparing your portal...'
          : 'Welcome! 🎉'}
        </div>
      </div>
    </div>
  );
}
