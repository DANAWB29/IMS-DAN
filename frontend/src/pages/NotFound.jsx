import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, color: 'var(--ink-200)' }}>404</div>
      <h2 style={{ marginTop: 8 }}>Page not found</h2>
      <p className="text-muted" style={{ marginTop: 6, marginBottom: 20 }}>That page doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-accent">Back to dashboard</Link>
    </div>
  );
}
