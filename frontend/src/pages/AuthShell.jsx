import { IconLayers } from '../components/Icons';

export default function AuthShell({ children, headline, sub }) {
  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <div className="grid-lines" />
        <div className="mark" style={{ position: 'relative' }}>
          <div className="brand-mark">N</div>
          <div className="brand-text">
            <strong style={{ fontSize: 17 }}>Nadi</strong>
            <span>Inventory OS</span>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <IconLayers style={{ width: 30, height: 30, color: 'var(--amber-400)', marginBottom: 18 }} />
          <h2>{headline}</h2>
          <p>{sub}</p>
        </div>
      </div>
      <div className="auth-form-col">{children}</div>
    </div>
  );
}
