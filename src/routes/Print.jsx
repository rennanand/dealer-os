import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../state/supabase.js';

// /print/<ro id>: the receipt / invoice as a clean page for the office printer or "Save as PDF".
export function PrintRoute() {
  const { id } = useParams();
  const [html, setHtml] = React.useState('');
  const [err, setErr] = React.useState('');
  React.useEffect(() => {
    if (!supabase) { setHtml('<div style="font-family:Helvetica,Arial,sans-serif;padding:40px">Preview build — the receipt prints from the live site.</div>'); return; }
    supabase.rpc('receipt_html', { p_ro: id }).then(({ data, error }) => { if (error || !data) setErr((error && error.message) || 'Not found.'); else setHtml(data); });
  }, [id]);
  React.useEffect(() => { if (html && /[?&]auto=1/.test(window.location.search)) setTimeout(() => window.print(), 400); }, [html]);
  if (err) return <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', padding: 40 }}>{err}</div>;
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <style>{'@media print { .no-print { display: none } } body { background: #fff }'}</style>
      <div className="no-print" style={{ position: 'fixed', top: 12, right: 12, display: 'flex', gap: 8 }}>
        <div onClick={() => window.print()} style={{ padding: '10px 16px', borderRadius: 10, background: '#111', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Helvetica, Arial, sans-serif' }}>Print / Save as PDF</div>
      </div>
      <iframe title="receipt" srcDoc={html} style={{ width: '100%', height: '100vh', border: 0 }} onLoad={(e) => { try { const d = e.target.contentDocument; e.target.style.height = d.body.scrollHeight + 40 + 'px'; } catch (x) {} }} />
    </div>
  );
}
