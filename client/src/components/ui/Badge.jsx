const STATUS_MAP = {
  closed: 'badge-closed',
  open: 'badge-open',
  pending: 'badge-pending',
  overdue: 'badge-overdue',
};

export default function Badge({ status, children }) {
  const cls = STATUS_MAP[status?.toLowerCase()] || 'badge-pending';
  return <span className={`badge ${cls}`}>{children || status || '—'}</span>;
}
