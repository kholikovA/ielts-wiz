import React, { useRef, useEffect, useState } from 'react';
import './securedImage.css';

// Draws a repeating, low-opacity diagonal watermark across the whole canvas.
function drawWatermark(ctx, w, h, text) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#888';
  ctx.font = '600 16px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const step = 190;
  for (let y = -step; y < h + step; y += step) {
    for (let x = -step; x < w + step; x += step) {
      ctx.save();
      ctx.translate(x + step / 2, y + step / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

// Renders an image into a <canvas> instead of an <img>, so there's no element with
// a grabbable `src`, no one-click "Save image", and no drag-out. Right-click and
// drag are also blocked, and an optional watermark is baked into the pixels.
//
// Honest caveat: this raises the bar (no trivial extraction, no source URL in the
// DOM) but cannot defeat a screenshot — nothing rendered client-side can. The real
// protection is rights + the baked-in watermark.
//
// We deliberately do NOT set crossOrigin: that lets the image load from hosts
// without CORS headers, and the resulting "tainted" canvas can't be exported via
// toDataURL — which is exactly the behaviour we want here.
export default function SecuredImage({ src, alt = '', width, height, watermark }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = width || img.naturalWidth || 600;
      const h = height || img.naturalHeight || 400;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) { setStatus('error'); return; }
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0, w, h);
      if (watermark) drawWatermark(ctx, w, h, watermark);
      setStatus('ready');
    };
    img.onerror = () => { if (!cancelled) setStatus('error'); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src, width, height, watermark]);

  const block = (e) => e.preventDefault();

  return (
    <div className="simg" role="img" aria-label={alt}>
      <canvas ref={canvasRef} className="simg-canvas" onContextMenu={block} onDragStart={block} />
      {status === 'loading' && <div className="simg-state">Loading…</div>}
      {status === 'error' && <div className="simg-state">Image unavailable</div>}
    </div>
  );
}
