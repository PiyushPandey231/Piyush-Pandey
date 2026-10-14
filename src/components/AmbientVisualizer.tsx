import React, { useEffect, useRef } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { VisualizerMode } from '../types';

interface Props {
  mode: VisualizerMode;
  isActive: boolean;
  className?: string;
}

export const AmbientVisualizer: React.FC<Props> = ({ mode, isActive, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Handle high DPI
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Particle state for 'particles' mode
    const numParticles = 45;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 400,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 1.2 + Math.random() * 2.2,
      baseAlpha: 0.2 + Math.random() * 0.4,
    }));

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      time += 0.015;

      const analyser = soundEngine.getAnalyser();
      let energy = 0.05;

      if (analyser && isActive) {
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        energy = Math.max(0.05, sum / (buffer.length * 255));
      }

      if (mode === 'waves') {
        // Multi-layered subtle harmonic waves
        const layers = [
          { freq: 0.008, speed: 1.0, amp: 22 * (1 + energy * 2), color: 'rgba(217, 119, 6, 0.18)' },
          { freq: 0.012, speed: -0.7, amp: 16 * (1 + energy * 2.5), color: 'rgba(251, 191, 36, 0.12)' },
          { freq: 0.005, speed: 0.5, amp: 30 * (1 + energy * 1.8), color: 'rgba(245, 158, 11, 0.08)' },
        ];

        layers.forEach((layer) => {
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          for (let x = 0; x <= w; x += 4) {
            const y =
              h / 2 +
              Math.sin(x * layer.freq + time * layer.speed) * layer.amp +
              Math.cos(x * 0.003 - time * 0.4) * (layer.amp * 0.5);
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = layer.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      } else if (mode === 'particles') {
        // Floating cosmic dust reacting to sound
        particles.forEach((p) => {
          p.x += p.vx * (1 + energy * 3);
          p.y += p.vy * (1 + energy * 3);

          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          ctx.beginPath();
          const r = p.radius * (1 + energy * 1.5);
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 191, 36, ${Math.min(0.8, p.baseAlpha + energy * 0.5)})`;
          ctx.fill();
        });

        // Soft connective lines
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 75) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(245, 158, 11, ${(1 - dist / 75) * 0.12 * (1 + energy)})`;
              ctx.lineWidth = 0.75;
              ctx.stroke();
            }
          }
        }
      } else if (mode === 'zen_ripples') {
        // Concentric breathing ripples
        const maxRadius = Math.min(w, h) * 0.45;
        const numRings = 5;
        for (let i = 0; i < numRings; i++) {
          const progress = (time * 0.2 + i / numRings) % 1;
          const r = progress * maxRadius * (1 + energy * 0.6);
          const alpha = (1 - progress) * (0.15 + energy * 0.35);

          ctx.beginPath();
          ctx.arc(w / 2, h / 2, Math.max(0, r), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(217, 119, 6, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      } else if (mode === 'spectrum') {
        // Minimal vertical bar spectrum
        const analyser = soundEngine.getAnalyser();
        const numBars = 32;
        const barWidth = 3;
        const totalWidth = numBars * 8;
        const startX = (w - totalWidth) / 2;

        let freqData = new Uint8Array(numBars);
        if (analyser && isActive) {
          const fullData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(fullData);
          for (let i = 0; i < numBars; i++) {
            freqData[i] = fullData[i * 2] || 0;
          }
        } else {
          for (let i = 0; i < numBars; i++) {
            freqData[i] = (Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5) * 40;
          }
        }

        for (let i = 0; i < numBars; i++) {
          const val = freqData[i] / 255;
          const barHeight = Math.max(4, val * (h * 0.6));
          const x = startX + i * 8;
          const y = (h - barHeight) / 2;

          ctx.fillStyle = `rgba(245, 158, 11, ${0.2 + val * 0.7})`;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [mode, isActive]);

  return <canvas ref={canvasRef} className={`w-full h-full pointer-events-none ${className}`} />;
};
