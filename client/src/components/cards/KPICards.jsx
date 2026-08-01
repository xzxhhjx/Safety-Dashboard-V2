import StatCard from './StatCard';

// Tailwind v4 compiles only complete class strings found in source — a
// template literal like `lg:grid-cols-${columns}` is never generated.
// Keep each supported column value as a literal so the utilities exist.
const GRID_COLUMNS = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

function gridClass(columns) {
  const lg = GRID_COLUMNS[columns] || GRID_COLUMNS[4];
  return `grid grid-cols-2 ${lg} gap-5 mb-5`;
}

export default function KPICards({ cards, loading, columns = 4 }) {
  const cls = gridClass(columns);

  if (loading) {
    return (
      <div className={cls}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card animate-pulse" style={{ height: 96 }} />
        ))}
      </div>
    );
  }

  return (
    <div className={cls}>
      {cards.map(c => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}
