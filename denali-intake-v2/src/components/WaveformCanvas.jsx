import { useRef, useEffect } from 'react';

const WAVES = [
  { freq: 1.8, amp: 55, speed: 0.7, color: [58, 220, 240], width: 2.5, offset: 0 },
  { freq: 2.4, amp: 40, speed: 1.0, color: [80, 180, 255], width: 2.0, offset: 0.4 },
  { freq: 1.2, amp: 70, speed: 0.5, color: [40, 200, 220], width: 3.0, offset: 0.8 },
  { freq: 3.0, amp: 30, speed: 1.3, color: [100, 220, 255], width: 1.5, offset: 1.2 },
  { freq: 0.8, amp: 85, speed: 0.35, color: [30, 180, 200], width: 3.5, offset: 1.6 },
  { freq: 2.0, amp: 45, speed: 0.9, color: [255, 190, 80], width: 1.8, offset: 2.0 },
  { freq: 1.5, amp: 60, speed: 0.6, color: [50, 240, 230], width: 2.2, offset: 2.4 },
];

const PARTICLES_COUNT = 60;

/**
 * Canvas waveform renderer for the Echo Orb.
 * Props: size (px), energy (0-1 target), className
 */
export default function WaveformCanvas({ size = 600, energy = 0.15, className = '' }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ time: 0, currentEnergy: 0.15, particles: [] });

  // Init particles once
  useEffect(() => {
    const s = stateRef.current;
    if (s.particles.length === 0) {
      for (let i = 0; i < PARTICLES_COUNT; i++) {
        s.particles.push({
          x: Math.random() * size, y: Math.random() * size,
          r: Math.random() * 1.5 + 0.3,
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.4 + 0.1,
        });
      }
    }
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = size, H = size, CX = W / 2, CY = H / 2;
    let raf;

    function draw() {
      const s = stateRef.current;
      s.time += 0.012;
      s.currentEnergy += (energy - s.currentEnergy) * 0.04;
      const e = s.currentEnergy;

      ctx.clearRect(0, 0, W, H);

      // Gold glow
      const gi = 0.08 + e * 0.18;
      const g = ctx.createRadialGradient(CX * 0.75, CY, 0, CX * 0.75, CY, W * 0.35);
      g.addColorStop(0, `rgba(255,180,60,${gi})`);
      g.addColorStop(0.4, `rgba(255,140,40,${gi * 0.4})`);
      g.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Vertical accent lines
      ctx.save();
      ctx.globalAlpha = 0.04 + e * 0.06;
      ctx.strokeStyle = '#3af0f0';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 12; i++) {
        const x = CX + (i - 5.5) * 28;
        ctx.beginPath(); ctx.moveTo(x, CY - 180); ctx.lineTo(x, CY + 180); ctx.stroke();
      }
      ctx.restore();

      // Sine waves
      WAVES.forEach((w) => {
        const amp = w.amp * (0.2 + e * 0.8);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${w.color[0]},${w.color[1]},${w.color[2]},${0.15 + e * 0.55})`;
        ctx.lineWidth = w.width;
        ctx.shadowColor = `rgba(${w.color[0]},${w.color[1]},${w.color[2]},${e * 0.3})`;
        ctx.shadowBlur = 12 + e * 20;
        for (let x = 0; x <= W; x += 2) {
          const nx = (x / W) * Math.PI * 2 * w.freq;
          const env = Math.sin((x / W) * Math.PI);
          const y = CY + Math.sin(nx + s.time * w.speed * 4 + w.offset) * amp * env
                       + Math.sin(nx * 0.5 + s.time * w.speed * 2) * amp * 0.3 * env;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Bright core pass
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      [WAVES[0], WAVES[2], WAVES[4]].forEach((w) => {
        const amp = w.amp * (0.2 + e * 0.8);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${Math.min(w.color[0]+80,255)},${Math.min(w.color[1]+60,255)},255,${e * 0.3})`;
        ctx.lineWidth = w.width * 0.5;
        for (let x = 0; x <= W; x += 2) {
          const nx = (x / W) * Math.PI * 2 * w.freq;
          const env = Math.sin((x / W) * Math.PI);
          const y = CY + Math.sin(nx + s.time * w.speed * 4 + w.offset) * amp * env
                       + Math.sin(nx * 0.5 + s.time * w.speed * 2) * amp * 0.3 * env;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.restore();

      // Particles
      ctx.save();
      s.particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const dx = p.x - CX, dy = p.y - CY;
        if (dx * dx + dy * dy > (W * 0.48) ** 2) return;
        const flicker = 0.7 + Math.sin(s.time * 3 + p.x * 0.01) * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,220,255,${p.alpha * flicker * (0.5 + e)})`;
        ctx.fill();
      });
      ctx.restore();

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, energy]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
    />
  );
}
