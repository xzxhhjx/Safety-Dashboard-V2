export default function StatCard({ label, value, icon, color, subtitle }) {
  return (
    <div className="card" style={{ padding: '18px 22px' }}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon && <span style={{ color: color || 'var(--system-blue)' }}>{icon}</span>}
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</div>
      )}
    </div>
  );
}
