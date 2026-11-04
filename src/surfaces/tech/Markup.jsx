import React from 'react';
import { css } from '../../runtime/tpl.js';

// Mark up a photo before it goes to the customer: a circle around the worn part, an arrow, a scribble.
// Draws onto a canvas the size of the photo (capped at 1600px) and hands back a JPEG.
const RED = '#e0312b';
export function Markup({ file, onDone, onCancel }) {
  const canvasRef = React.useRef(null), imgRef = React.useRef(null);
  const [tool, setTool] = React.useState('circle');
  const [shapes, setShapes] = React.useState([]);
  const [cur, setCur] = React.useState(null);
  const [size, setSize] = React.useState(null);
  React.useEffect(() => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)); imgRef.current = img; setSize({ w: Math.round(img.width * k), h: Math.round(img.height * k) }); URL.revokeObjectURL(url); };
    img.src = url;
  }, [file]);
  React.useEffect(() => {
    const c = canvasRef.current; if (!c || !size || !imgRef.current) return;
    const g = c.getContext('2d'); g.drawImage(imgRef.current, 0, 0, size.w, size.h);
    g.lineWidth = Math.max(4, size.w / 160); g.strokeStyle = RED; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 4;
    for (const s of shapes.concat(cur ? [cur] : [])) draw(g, s);
  }, [size, shapes, cur]);
  const pt = (e) => { const c = canvasRef.current, r = c.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * size.w, ((e.clientY - r.top) / r.height) * size.h]; };
  const down = (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} const p = pt(e); setCur({ tool, pts: [p, p] }); };
  const move = (e) => { if (!cur) return; const p = pt(e); setCur(tool === 'pen' ? { ...cur, pts: cur.pts.concat([p]) } : { ...cur, pts: [cur.pts[0], p] }); };
  const up = () => { if (!cur) return; setShapes(shapes.concat(cur)); setCur(null); };
  const done = () => { canvasRef.current.toBlob((b) => onDone(new File([b], 'photo.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.86); };
  const T = (k, l) => <div onClick={() => setTool(k)} style={css('padding:9px 14px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;' + (tool === k ? 'background:#fff;color:#000' : 'background:rgba(255,255,255,.1);color:#fff'))}>{l}</div>;
  return (
    <div style={css('position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:14px')}>
      <div style={css('display:flex;gap:8px;align-items:center')}>{T('circle', 'Circle')}{T('arrow', 'Arrow')}{T('pen', 'Pen')}<div onClick={() => setShapes(shapes.slice(0, -1))} style={css('padding:9px 14px;border-radius:10px;font-size:13px;color:rgba(235,235,245,.7);cursor:pointer')}>Undo</div></div>
      {size ? <canvas ref={canvasRef} width={size.w} height={size.h} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={css('max-width:100%;max-height:70vh;border-radius:12px;touch-action:none;cursor:crosshair;background:#111')} /> : <div style={css('color:rgba(235,235,245,.5)')}>Loading photo…</div>}
      <div style={css('display:flex;gap:8px')}>
        <div onClick={size ? done : null} style={css('padding:12px 22px;border-radius:12px;background:#fff;color:#000;font-size:14px;font-weight:600;cursor:pointer')}>{shapes.length ? 'Use marked-up photo' : 'Use photo'}</div>
        <div onClick={onCancel} style={css('padding:12px 22px;border-radius:12px;background:rgba(255,255,255,.1);color:#fff;font-size:14px;font-weight:500;cursor:pointer')}>Cancel</div>
      </div>
    </div>
  );
}
function draw(g, s) {
  const [a, b] = [s.pts[0], s.pts[s.pts.length - 1]];
  g.beginPath();
  if (s.tool === 'pen') { g.moveTo(s.pts[0][0], s.pts[0][1]); for (const p of s.pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); return; }
  if (s.tool === 'circle') { const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, rx = Math.abs(b[0] - a[0]) / 2, ry = Math.abs(b[1] - a[1]) / 2; g.ellipse(cx, cy, Math.max(6, rx), Math.max(6, ry), 0, 0, Math.PI * 2); g.stroke(); return; }
  g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = g.lineWidth * 4;
  g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[0] - h * Math.cos(ang - 0.5), b[1] - h * Math.sin(ang - 0.5)); g.moveTo(b[0], b[1]); g.lineTo(b[0] - h * Math.cos(ang + 0.5), b[1] - h * Math.sin(ang + 0.5)); g.stroke();
}
