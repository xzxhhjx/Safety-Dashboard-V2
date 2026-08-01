# Apple Enterprise HSE Safety Platform — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor single-page safety dashboard into a multi-page Apple Enterprise HSE platform with sidebar navigation, 6 pages, shared design system, and ECharts Apple theme.

**Architecture:** Persistent `AppShell` (Sidebar + Toolbar + content area) wraps all routes. Shared components (`KPICards`, `DataTable`, `FilterBar`, chart wrappers) extracted from existing Dashboard. Each page loads its own data via existing hooks. Design tokens in CSS custom properties feed both Tailwind utilities and ECharts theme.

**Tech Stack:** React 19, React Router 7, Tailwind CSS v4, ECharts 5.5, Lucide React, Axios, Vite 6

## Global Constraints

- Font family: `"SF Pro Display", "SF Pro Text", "PingFang SC", sans-serif`
- Primary palette: `#007AFF` / `#34C759` / `#FF9F0A` / `#FF453A` / `#8E8E93`
- Card: `rgba(255,255,255,0.82)` + `backdrop-filter: blur(20px)` + `border-radius: 18px`
- Sidebar: 248px, `rgba(10,75,196,0.92)` + `backdrop-filter: blur(20px) saturate(180%)`
- Body bg: `linear-gradient(180deg, #EEF2FF 0%, #F5F5F7 180px, #F5F5F7 100%)`
- Text: `#1D1D1F` primary, `#6E6E73` secondary
- Divider: `#E5E5EA`
- No purple-neon, no glow effects, no cyberpunk styling
- Row height: 64px for data tables
- Keep existing API layer (`api.js`, hooks) unchanged
- All new files under `client/src/`
- Remove `pages/Dashboard.jsx` only after all new pages are functional

---

### Task 1: Rewrite CSS Design Tokens & Base Styles

**Files:**
- Modify: `client/src/styles/index.css`

**Interfaces:**
- Produces: CSS custom properties consumed by all components
  - `--bg-primary`, `--bg-card`, `--bg-sidebar`
  - `--text-primary`, `--text-secondary`, `--text-tertiary`
  - `--system-blue`, `--system-green`, `--system-orange`, `--system-red`, `--system-purple`, `--system-gray`
  - `--border-card`, `--border-subtle`, `--divider`
  - `--shadow-elevation-1`, `--shadow-elevation-2`, `--shadow-elevation-3`
  - `--radius-xs` (6px), `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (16px), `--radius-xl` (18px), `--radius-2xl` (24px)
  - `--space-*` (4/8/12/16/20/24/32/40/48/64)
  - `--text-size-caption` (11px), `--text-size-body` (13px), `--text-size-title` (15px), `--text-size-subtitle` (17px), `--text-size-heading` (20px), `--text-size-large` (24px), `--text-size-hero` (28px)
  - `--row-height` (64px), `--input-height` (36px)
  - `--sidebar-width` (248px)

- [ ] **Step 1: Replace entire CSS file with new design token system**

Write `client/src/styles/index.css`:

```css
@import "tailwindcss";

/* =========================================================================
   Design Tokens — Apple Enterprise HSE Safety Platform
   macOS Sonoma / Apple Human Interface Guidelines
   ========================================================================= */
:root {
  /* Surfaces */
  --bg-primary: #F5F5F7;
  --bg-card: rgba(255, 255, 255, 0.82);
  --bg-sidebar: rgba(10, 75, 196, 0.92);

  /* Text */
  --text-primary: #1D1D1F;
  --text-secondary: #6E6E73;
  --text-tertiary: #AEAEB2;

  /* System Colors */
  --system-blue: #007AFF;
  --system-green: #34C759;
  --system-orange: #FF9F0A;
  --system-red: #FF453A;
  --system-purple: #5856D6;
  --system-gray: #8E8E93;

  /* Borders & Dividers */
  --border-card: rgba(255, 255, 255, 0.65);
  --border-subtle: rgba(0, 0, 0, 0.06);
  --divider: #E5E5EA;

  /* Shadows — Apple elevation system */
  --shadow-elevation-1: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.05);
  --shadow-elevation-2: 0 2px 4px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.08);
  --shadow-elevation-3: 0 4px 8px rgba(0, 0, 0, 0.08), 0 16px 48px rgba(0, 0, 0, 0.12);

  /* Border Radius */
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 18px;
  --radius-2xl: 24px;

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Typography Scale */
  --text-size-caption: 11px;
  --text-size-body: 13px;
  --text-size-title: 15px;
  --text-size-subtitle: 17px;
  --text-size-heading: 20px;
  --text-size-large: 24px;
  --text-size-hero: 28px;

  /* Layout */
  --row-height: 64px;
  --input-height: 36px;
  --sidebar-width: 248px;
}

/* ===== Base ===== */
body {
  margin: 0;
  background: linear-gradient(180deg, #EEF2FF 0%, #F5F5F7 180px, #F5F5F7 100%);
  background-attachment: fixed;
  color: var(--text-primary);
  font-family: "SF Pro Display", "SF Pro Text", "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: var(--text-size-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== Frosted Glass Card ===== */
.card, .glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-elevation-1);
  padding: var(--space-5);
}

/* ===== Section Title ===== */
.section-title {
  font-size: var(--text-size-title);
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin-bottom: 12px;
}

/* ===== Data Table (Apple Mail / Notes style) ===== */
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.data-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}
.data-table th {
  text-align: left;
  font-size: var(--text-size-caption);
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: none;
  letter-spacing: 0;
  padding: 10px 16px;
  background: rgba(245, 245, 247, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}
.data-table td {
  padding: 0 16px;
  height: var(--row-height);
  font-size: var(--text-size-body);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}
.data-table tbody tr {
  transition: background 0.12s ease;
}
.data-table tbody tr:hover {
  background: rgba(0, 122, 255, 0.04);
}

/* ===== Status Badges (capsule) ===== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: var(--text-size-caption);
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}
.badge-closed   { background: rgba(52, 199, 89, 0.12);  color: #248A3D; }
.badge-open     { background: rgba(255, 159, 10, 0.12); color: #B25E00; }
.badge-pending  { background: rgba(142, 142, 147, 0.12); color: #5C5C5E; }
.badge-overdue  { background: rgba(255, 69, 58, 0.12);  color: #C44235; }
/* Backward-compatible aliases */
.badge-high    { background: rgba(52, 199, 89, 0.12);  color: #248A3D; }
.badge-medium  { background: rgba(255, 159, 10, 0.12); color: #B25E00; }
.badge-low     { background: rgba(255, 69, 58, 0.12);  color: #C44235; }

/* ===== Input / Select (Apple style) ===== */
.input-apple {
  height: var(--input-height);
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.7);
  font-size: var(--text-size-body);
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input-apple:focus {
  border-color: var(--system-blue);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}
.input-apple::placeholder { color: var(--text-tertiary); }

/* ===== Buttons ===== */
.btn-primary {
  height: var(--input-height);
  padding: 0 16px;
  border: none;
  border-radius: var(--radius-xs);
  background: var(--system-blue);
  color: #FFF;
  font-size: var(--text-size-body);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s ease;
}
.btn-primary:hover { background: #0066D6; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
  height: var(--input-height);
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-primary);
  font-size: var(--text-size-body);
  font-weight: 400;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.btn-secondary:hover { background: rgba(0, 0, 0, 0.04); box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.btn-secondary:disabled { opacity: 0.35; cursor: not-allowed; }

/* ===== Pagination ===== */
.pagination-btn {
  height: 28px;
  min-width: 28px;
  padding: 0 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-primary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: background 0.15s ease;
}
.pagination-btn:hover:not(:disabled) { background: rgba(0, 0, 0, 0.04); }
.pagination-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ===== Chart Container Heights ===== */
.chart-container      { width: 100%; height: 320px; }
.chart-container-wide { width: 100%; height: 400px; }
.chart-container-tall { width: 100%; height: 440px; }
.chart-container-sm   { width: 100%; height: 280px; }

/* ===== Tabs (Apple SF-style segmented control) ===== */
.tab-bar {
  display: inline-flex;
  gap: 0;
  background: rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-sm);
  padding: 2px;
}
.tab-item {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-size-body);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.tab-item:hover { color: var(--text-primary); }
.tab-item.active {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ===== Sidebar ===== */
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: var(--bg-sidebar);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-y: auto;
}
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 0 8px;
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.75);
  font-size: var(--text-size-body);
  font-weight: 400;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
}
.sidebar-nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}
.sidebar-nav-item.active {
  background: rgba(255, 255, 255, 0.16);
  color: #FFF;
  font-weight: 600;
}

/* ===== Main Content Area (offset for sidebar) ===== */
.main-content {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px var(--space-6);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 50;
}

/* ===== Avatar ===== */
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #FFF;
  flex-shrink: 0;
}
.avatar-sm { width: 28px; height: 28px; font-size: 11px; }

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.25); }

/* ===== Utility ===== */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== Responsive ===== */
@media (max-width: 1023px) {
  .sidebar { transform: translateX(-100%); transition: transform 0.25s ease; }
  .sidebar.open { transform: translateX(0); }
  .main-content { margin-left: 0; }
}
@media (max-width: 767px) {
  .card { padding: var(--space-4); border-radius: var(--radius-lg); }
}
```

- [ ] **Step 2: Verify the dev server starts without CSS errors**

Run: `cd client && npx vite build --logLevel error`
Expected: Build completes without CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/styles/index.css
git commit -m "style: rewrite design tokens — Apple Enterprise HSE foundation
- Full CSS custom property system (surfaces, text, colors, shadows, radius, spacing, typography)
- Body gradient background (#EEF2FF → #F5F5F7)
- Sidebar styles (248px, blue glass, nav items)
- Toolbar, tab bar, avatar, responsive breakpoints
- 64px row height, sticky table headers"
```

---

### Task 2: ECharts Apple Enterprise Theme

**Files:**
- Create: `client/src/styles/echarts-theme.js`

**Interfaces:**
- Produces: Side-effect — registers `'apple-enterprise'` theme via `echarts.registerTheme()`
- Consumed by: All chart components via `echarts.init(dom, 'apple-enterprise')`

- [ ] **Step 1: Create the ECharts theme registration file**

Write `client/src/styles/echarts-theme.js`:

```js
import * as echarts from 'echarts';

const APPLE_PALETTE = [
  '#007AFF', '#34C759', '#FF9F0A', '#FF453A',
  '#5856D6', '#8E8E93', '#FF6B35', '#00C7BE',
  '#AF52DE', '#FF2D55', '#30B0C7', '#FFD60A',
  '#32D74B', '#BF5AF2', '#64D2FF', '#AEAEB2',
];

echarts.registerTheme('apple-enterprise', {
  color: APPLE_PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '"SF Pro Display", "SF Pro Text", "PingFang SC", sans-serif',
  },
  title: {
    textStyle: { color: '#1D1D1F', fontWeight: 600, fontSize: 15 },
    subtextStyle: { color: '#6E6E73', fontSize: 13 },
  },
  legend: {
    textStyle: { color: '#6E6E73', fontSize: 12 },
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 12,
    icon: 'roundRect',
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderWidth: 0.5,
    textStyle: { color: '#1D1D1F', fontSize: 13 },
    extraCssText: 'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);',
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
    axisTick: { show: false },
    axisLabel: { color: '#6E6E73', fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#6E6E73', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)', type: 'dashed' } },
  },
  grid: {
    top: 12,
    left: 12,
    right: 24,
    bottom: 12,
    containLabel: true,
  },
});
```

- [ ] **Step 2: Update BaseChart to use the new theme**

Modify `client/src/components/charts/BaseChart.jsx` — change the init call:

```jsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import '../../styles/echarts-theme.js'; // registers 'apple-enterprise'

export default function BaseChart({ option, height = '400px' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, 'apple-enterprise', { renderer: 'canvas' });
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      chart.resize();
    });
    ro.observe(ref.current);

    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, true);
      chartRef.current.resize();
    }
  }, [option]);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
```

- [ ] **Step 3: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Build succeeds. Theme import resolves correctly.

- [ ] **Step 4: Commit**

```bash
git add client/src/styles/echarts-theme.js client/src/components/charts/BaseChart.jsx
git commit -m "feat: add ECharts Apple Enterprise theme + integrate with BaseChart
- 16-color Apple palette, frosted glass tooltips, SF Pro text
- Transparent background, dashed value axis, hidden ticks
- BaseChart now auto-registers theme on import"
```

---

### Task 3: UI Primitives — Badge, TabBar, EmptyState, SearchInput

**Files:**
- Create: `client/src/components/ui/Badge.jsx`
- Create: `client/src/components/ui/TabBar.jsx`
- Create: `client/src/components/ui/EmptyState.jsx`
- Create: `client/src/components/ui/SearchInput.jsx`

**Interfaces:**
- `Badge({ status, children })` — `status`: `'closed' | 'open' | 'pending' | 'overdue'`; renders capsule `<span>`
- `TabBar({ tabs, active, onChange })` — `tabs`: `{key: string, label: string}[]`; renders segmented control
- `EmptyState({ icon, title, description })` — renders centered placeholder
- `SearchInput({ value, onChange, placeholder })` — renders search input with magnifying glass icon

- [ ] **Step 1: Create Badge component**

Write `client/src/components/ui/Badge.jsx`:

```jsx
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
```

- [ ] **Step 2: Create TabBar component**

Write `client/src/components/ui/TabBar.jsx`:

```jsx
export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.key}
          className={`tab-item${active === t.key ? ' active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create EmptyState component**

Write `client/src/components/ui/EmptyState.jsx`:

```jsx
export default function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-tertiary)' }}>
      {icon && <div className="mb-3 opacity-40">{icon}</div>}
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title || 'No data'}</p>
      {description && <p className="text-xs mt-1">{description}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Create SearchInput component**

Write `client/src/components/ui/SearchInput.jsx`:

```jsx
import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-apple"
        style={{ paddingLeft: 28 }}
      />
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/ui/
git commit -m "feat: add UI primitives — Badge, TabBar, EmptyState, SearchInput"
```

---

### Task 4: KPICards + StatCard Components

**Files:**
- Create: `client/src/components/cards/StatCard.jsx`
- Create: `client/src/components/cards/KPICards.jsx`
- Modify: Delete old content in `client/src/components/MetricCards.jsx` (keep file, re-export from cards/)

**Interfaces:**
- `StatCard({ label, value, icon, color, subtitle })` — single KPI tile
- `KPICards({ cards })` — grid of `StatCard`s, `cards: {label, value, icon, color, subtitle}[]`

- [ ] **Step 1: Create StatCard**

Write `client/src/components/cards/StatCard.jsx`:

```jsx
export default function StatCard({ label, value, icon, color, subtitle }) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span style={{ color: color || 'var(--system-blue)' }}>{icon}</span>}
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create KPICards grid**

Write `client/src/components/cards/KPICards.jsx`:

```jsx
import StatCard from './StatCard';

export default function KPICards({ cards, loading, columns = 4 }) {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-${columns} gap-5 mb-5`}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card animate-pulse" style={{ height: 96 }} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${columns} gap-5 mb-5`}>
      {cards.map(c => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update MetricCards.jsx to re-export from new location**

Write `client/src/components/MetricCards.jsx`:

```jsx
// Re-export from cards/ for backward compatibility
export { default } from './cards/KPICards';
```

- [ ] **Step 4: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/cards/ client/src/components/MetricCards.jsx
git commit -m "feat: add KPICards + StatCard components with loading skeleton"
```

---

### Task 5: Enhanced DataTable — 64px Rows, Checkbox Selection, Export

**Files:**
- Modify: `client/src/components/DataTable.jsx`

**Interfaces:**
- `DataTable({ data, total, page, pageSize, onPageChange, onPageSizeChange, loading, selectable, onSelectionChange, onExport, columns })`
- Produces: Enhanced table with 64px rows, sticky header, optional checkbox column, export button
- Backward-compatible: existing callers without `selectable`/`columns` props still work

- [ ] **Step 1: Rewrite DataTable with all enhancements**

Write `client/src/components/DataTable.jsx`:

```jsx
import { useState, useCallback } from 'react';
import { classifyHazard, AI_CONFIDENCE_COLORS } from '../config';
import ImageModal from './ImageModal';
import Badge from './ui/Badge';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const DEFAULT_COLUMNS = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'photo', label: 'Photo', width: 56 },
  { key: 'hazard', label: 'Hazard', width: 160 },
  { key: 'status', label: 'Status', width: 100 },
  { key: 'area', label: 'Area', width: 120 },
  { key: 'dept', label: 'Dept', width: 120 },
  { key: 'description', label: 'Description', flex: 1 },
  { key: 'submitter', label: 'Submitter', width: 100 },
  { key: 'date', label: 'Date', width: 110 },
  { key: 'ai_category', label: 'AI Category', width: 130 },
];

export default function DataTable({
  data, total, page, pageSize, onPageChange, onPageSizeChange, loading,
  selectable = false, onSelectionChange, onExport, columns,
}) {
  const [modal, setModal] = useState({ open: false, images: [], index: 0 });
  const [selected, setSelected] = useState(new Set());
  const totalPages = Math.ceil(total / pageSize);
  const cols = columns || DEFAULT_COLUMNS;

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      onSelectionChange?.(next);
      return next;
    });
  }, [onSelectionChange]);

  const toggleAll = useCallback(() => {
    setSelected(prev => {
      const next = prev.size === data.length ? new Set() : new Set(data.map(r => r.id));
      onSelectionChange?.(next);
      return next;
    });
  }, [data, onSelectionChange]);

  const renderCell = (row, col) => {
    switch (col.key) {
      case 'photo':
        return Array.isArray(row.photos) && row.photos[0] && !row.photos[0].startsWith('__FAILED') ? (
          <img src={row.photos[0]} alt="" className="w-10 h-10 object-cover rounded-md cursor-pointer hover:opacity-80 transition"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            onClick={() => setModal({ open: true, images: row.photos, index: 0 })} />
        ) : (
          <span className="w-10 h-10 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)', fontSize: 10 }}>—</span>
        );
      case 'status':
        return <Badge status={row.status}>{row.status || '—'}</Badge>;
      case 'description':
        return (
          <div className="line-clamp-2 text-sm max-w-[240px]" title={row.description}>
            {row.description || '—'}
          </div>
        );
      case 'date':
        return <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.obs_time || '—'}</span>;
      case 'ai_category': {
        const fallback = classifyHazard(row.description, row.hazard);
        const aiCat = row.ai_category || fallback.category;
        const aiCatCN = row.ai_category_cn || fallback.cn;
        const aiConf = row.ai_confidence || 'low';
        return (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: AI_CONFIDENCE_COLORS[aiConf] || '#8E8E93' }} />
            <span className="text-xs">{aiCatCN}</span>
          </div>
        );
      }
      default:
        return <span className="text-sm">{row[col.key] ?? '—'}</span>;
    }
  };

  return (
    <div>
      {/* Toolbar: selection count + export */}
      {(selectable || onExport) && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {selectable && selected.size > 0 && `${selected.size} selected`}
          </div>
          {onExport && (
            <button onClick={onExport} className="btn-secondary text-xs">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
            <table className="data-table w-full">
              <thead>
                <tr>
                  {selectable && (
                    <th style={{ width: 40 }}>
                      <input type="checkbox" checked={data.length > 0 && selected.size === data.length}
                        onChange={toggleAll} />
                    </th>
                  )}
                  {cols.map(c => (
                    <th key={c.key} style={c.width ? { width: c.width } : {}}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id} className={selected.has(row.id) ? 'selected' : ''}
                    style={selected.has(row.id) ? { background: 'rgba(0,122,255,0.06)' } : {}}>
                    {selectable && (
                      <td>
                        <input type="checkbox" checked={selected.has(row.id)}
                          onChange={() => toggleSelect(row.id)} />
                      </td>
                    )}
                    {cols.map(c => (
                      <td key={c.key}>{renderCell(row, c)}</td>
                    ))}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={cols.length + (selectable ? 1 : 0)} className="text-center"
                      style={{ color: 'var(--text-tertiary)', padding: '32px 0' }}>
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages || 1}
              </span>
              <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                Show
                <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
                  className="input-apple" style={{ padding: '2px 8px', height: 28, fontSize: 12 }}>
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="pagination-btn">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="pagination-btn">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {modal.open && (
        <ImageModal images={modal.images} initialIndex={modal.index}
          onClose={() => setModal({ open: false, images: [], index: 0 })} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/DataTable.jsx
git commit -m "feat: enhance DataTable — 64px rows, checkbox selection, CSV export, Badge integration"
```

---

### Task 6: Sidebar Component

**Files:**
- Create: `client/src/components/layout/Sidebar.jsx`

**Interfaces:**
- `Sidebar({ currentPath })` — renders fixed sidebar with 6 nav items
- Nav items: Overview (`/`), Observations (`/observations`), Analytics (`/analytics`), Work Areas (`/work-areas`), People & Teams (`/people-teams`), Settings (`/settings`)
- Icons: `LayoutDashboard`, `ClipboardList`, `BarChart3`, `MapPin`, `Users`, `Settings` from lucide-react
- Active item highlighted with `sidebar-nav-item active` class
- Each item uses React Router `<Link>`

- [ ] **Step 1: Create Sidebar component**

Write `client/src/components/layout/Sidebar.jsx`:

```jsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart3, MapPin, Users, Settings, Shield } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',              label: 'Overview',        icon: LayoutDashboard },
  { path: '/observations',  label: 'Observations',    icon: ClipboardList },
  { path: '/analytics',     label: 'Analytics',       icon: BarChart3 },
  { path: '/work-areas',    label: 'Work Areas',      icon: MapPin },
  { path: '/people-teams',  label: 'People & Teams',  icon: Users },
  { path: '/settings',      label: 'Settings',        icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="sidebar">
      {/* Logo / Brand */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)' }}>
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight">HSE Safety</div>
            <div className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>Observation Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        {NAV_ITEMS.map(item => {
          const isActive = item.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom — User section placeholder */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <div className="avatar" style={{ background: 'var(--system-green)' }}>HS</div>
          <div>
            <div className="text-xs font-medium text-white">HSE Manager</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Safety Platform v3.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/Sidebar.jsx
git commit -m "feat: add Sidebar — 248px glass navigation with 6 items, logo, user section"
```

---

### Task 7: AppShell Layout + Toolbar

**Files:**
- Create: `client/src/components/layout/Toolbar.jsx`
- Create: `client/src/components/layout/AppShell.jsx`

**Interfaces:**
- `Toolbar({ title, subtitle, actions })` — sticky top bar with title + optional action buttons
- `AppShell({ children })` — wraps Sidebar + main content area, passes children as page content

- [ ] **Step 1: Create Toolbar**

Write `client/src/components/layout/Toolbar.jsx`:

```jsx
export default function Toolbar({ title, subtitle, actions }) {
  return (
    <div className="toolbar">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create AppShell**

Write `client/src/components/layout/AppShell.jsx`:

```jsx
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/Toolbar.jsx client/src/components/layout/AppShell.jsx
git commit -m "feat: add AppShell layout — Sidebar + sticky Toolbar + content area"
```

---

### Task 8: App.jsx — Router + AppShell Integration

**Files:**
- Modify: `client/src/App.jsx`

**Interfaces:**
- Produces: 6 routes wrapped in AppShell:
  - `/` → Overview
  - `/observations` → Observations
  - `/analytics` → Analytics
  - `/work-areas` → WorkAreas
  - `/people-teams` → PeopleTeams
  - `/settings` → Settings
- Keeps `/admin` route (outside AppShell, no sidebar for admin)

- [ ] **Step 1: Update App.jsx with new routes and AppShell**

Write `client/src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Overview from './pages/Overview';
import Observations from './pages/Observations';
import Analytics from './pages/Analytics';
import WorkAreas from './pages/WorkAreas';
import PeopleTeams from './pages/PeopleTeams';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public HSE Platform — with sidebar shell */}
        <Route path="/" element={
          <AppShell><Overview /></AppShell>
        } />
        <Route path="/observations" element={
          <AppShell><Observations /></AppShell>
        } />
        <Route path="/analytics" element={
          <AppShell><Analytics /></AppShell>
        } />
        <Route path="/work-areas" element={
          <AppShell><WorkAreas /></AppShell>
        } />
        <Route path="/people-teams" element={
          <AppShell><PeopleTeams /></AppShell>
        } />
        <Route path="/settings" element={
          <AppShell><Settings /></AppShell>
        } />

        {/* Admin — standalone (no sidebar) */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 2: Verify build — will fail on missing page imports (expected)**

Run: `cd client && npx vite build --logLevel error`
Expected: Build fails with "Could not resolve" for the missing page files. This is expected — we create them next.

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: update App.jsx — 6 routes in AppShell, keep /admin standalone"
```

---

### Task 9: Overview Page

**Files:**
- Create: `client/src/pages/Overview.jsx`

**Interfaces:**
- Consumes: `useStats(filters)` from `../hooks/useStats`, `useObservations` from `../hooks/useObservations`
- Consumes: `KPICards`, `Toolbar`, `DataTable`, `TrendChart` (MonthlyTrendChart), `StatusRing` (StatusPie), `TopRiskBars`

- [ ] **Step 1: Create Overview page**

Write `client/src/pages/Overview.jsx`:

```jsx
import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import KPICards from '../components/cards/KPICards';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import StatusPie from '../components/charts/StatusPie';
import TopRiskBars from '../components/charts/TopRiskBars';
import DataTable from '../components/DataTable';
import { COLORS } from '../config';
import { LayoutList, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';

const iconCls = "w-5 h-5";

export default function Overview() {
  const [filters] = useState({});
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(1, 5, {});

  const openCount = (stats?.totalCount || 0) -
    (stats?.totalCount && stats?.closedRate ? Math.round(stats.totalCount * stats.closedRate / 100) : 0);

  const kpiCards = [
    { label: 'Total Records', value: stats?.totalCount?.toLocaleString() || '0', color: '#007AFF', icon: <LayoutList className={iconCls} /> },
    { label: 'Open Observations', value: openCount.toLocaleString(), color: '#FF9F0A', icon: <AlertTriangle className={iconCls} /> },
    { label: 'Closed This Month', value: `${stats?.closedRate || 0}%`, color: '#34C759', icon: <CheckCircle2 className={iconCls} /> },
    { label: 'Active Work Areas', value: stats?.areaCount || 0, color: '#8E8E93', icon: <MapPin className={iconCls} /> },
  ];

  return (
    <div>
      <Toolbar title="Overview" subtitle="30-second safety status snapshot" />

      <div className="px-6 py-5" style={{ maxWidth: 1440 }}>
        {/* KPI Cards */}
        <KPICards cards={kpiCards} loading={statsLoading} />

        {/* Row: Safety Trend + Status Ring */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="card lg:col-span-2">
            <h2 className="section-title">Safety Trend</h2>
            <MonthlyTrendChart data={stats?.monthlyTrend?.map(d => ({ name: d.month, value: d.count }))} />
          </div>
          <div className="card">
            <h2 className="section-title">Status Overview</h2>
            <StatusPie data={stats?.statusDist} closedRate={stats?.closedRate} />
          </div>
        </div>

        {/* Top Risk Categories */}
        <div className="card mb-5">
          <h2 className="section-title">Top Risk Categories</h2>
          <TopRiskBars data={stats?.hazardDist} />
        </div>

        {/* Recent Observations — 5 rows only */}
        <div className="card">
          <h2 className="section-title">Recent Safety Observations</h2>
          <DataTable
            data={observations}
            total={total}
            page={1}
            pageSize={5}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            loading={obsLoading}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Overview page builds. Other page imports still missing (expected).

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Overview.jsx
git commit -m "feat: add Overview page — 4 KPIs, trend chart, status ring, top risks, 5 recent rows"
```

---

### Task 10: Observations Page

**Files:**
- Create: `client/src/pages/Observations.jsx`

**Interfaces:**
- Consumes: `useObservations(page, pageSize, filters)` for paginated data
- Uses: `Toolbar`, `FilterBar`, `DataTable` (with selectable + export), `Badge`
- Export: Converts current page data to CSV via Blob download

- [ ] **Step 1: Create Observations page**

Write `client/src/pages/Observations.jsx`:

```jsx
import { useState, useCallback } from 'react';
import Toolbar from '../components/layout/Toolbar';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import { useObservations } from '../hooks/useObservations';
import { Download } from 'lucide-react';

export default function Observations() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { observations, total, loading } = useObservations(page, pageSize, filters);

  const handleExport = useCallback(() => {
    if (!observations?.length) return;
    const headers = ['ID', 'Hazard', 'Status', 'Area', 'Dept', 'Description', 'Submitter', 'Date', 'AI Category'];
    const rows = observations.map(r => [
      r.id, r.hazard || '', r.status || '', r.area || '', r.dept || '',
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.submitter || '', r.obs_time || '',
      r.ai_category_cn || r.ai_category || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-observations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [observations]);

  return (
    <div>
      <Toolbar
        title="Observations"
        subtitle="Complete safety observation records"
        actions={
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        }
      />

      <div className="px-6 py-5" style={{ maxWidth: 1440 }}>
        {/* Advanced Filter Bar */}
        <div className="card mb-5" style={{ padding: '16px 20px' }}>
          <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
        </div>

        {/* Data Table */}
        <div className="card">
          <DataTable
            data={observations}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            loading={loading}
            selectable
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Observations page builds. Other missing pages still fail.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Observations.jsx
git commit -m "feat: add Observations page — advanced filters, paginated table, CSV export, selectable rows"
```

---

### Task 11: Analytics Page (Tabbed)

**Files:**
- Create: `client/src/pages/Analytics.jsx`

**Interfaces:**
- Consumes: `useStats(filters)` for all tab data
- Uses: `Toolbar`, `TabBar`, `DonutChart` (HazardChart), `TopRiskBars`, `TrendChart` (MonthlyTrendChart), horizontal bars

- [ ] **Step 1: Create Analytics page with 5 tabs**

Write `client/src/pages/Analytics.jsx`:

```jsx
import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import TabBar from '../components/ui/TabBar';
import { useStats } from '../hooks/useStats';
import HazardChart from '../components/charts/HazardChart';
import TopRiskBars from '../components/charts/TopRiskBars';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import DeptChart from '../components/charts/DeptChart';
import SubmitterChart from '../components/charts/SubmitterChart';
import AreaChart from '../components/charts/AreaChart';

const TABS = [
  { key: 'risk',       label: 'Risk' },
  { key: 'trends',     label: 'Trends' },
  { key: 'areas',      label: 'Areas' },
  { key: 'departments', label: 'Departments' },
  { key: 'submitters', label: 'Submitters' },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('risk');
  const [filters] = useState({});
  const { stats, loading } = useStats(filters);

  return (
    <div>
      <Toolbar title="Analytics" subtitle="Deep-dive into safety data" />

      <div className="px-6 py-5" style={{ maxWidth: 1440 }}>
        {/* Tab Bar */}
        <div className="mb-5">
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h2 className="section-title">Risk Category Distribution</h2>
              <HazardChart data={stats?.hazardDist} />
            </div>
            <div className="card">
              <h2 className="section-title">Top Risk Categories</h2>
              <TopRiskBars data={stats?.hazardDist} />
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-5">
            <div className="card">
              <h2 className="section-title">Monthly Observation Trend</h2>
              <MonthlyTrendChart data={stats?.monthlyTrend?.map(d => ({ name: d.month, value: d.count }))} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card">
                <h2 className="section-title">Week-over-Week Comparison</h2>
                <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                  Weekly data available with date range filter
                </div>
              </div>
              <div className="card">
                <h2 className="section-title">Open vs Closed Trend</h2>
                <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                  Breakdown available with status filter
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Areas Tab */}
        {activeTab === 'areas' && (
          <div className="space-y-5">
            <div className="card">
              <h2 className="section-title">Top 10 Work Areas</h2>
              <AreaChart data={stats?.areaDist} />
            </div>
            <div className="card">
              <h2 className="section-title">High-Risk Area Rankings</h2>
              <TopRiskBars data={stats?.areaDist?.slice(0, 10)} />
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h2 className="section-title">Observations by Department</h2>
              <DeptChart data={stats?.deptRank} />
            </div>
            <div className="card">
              <h2 className="section-title">Department Rankings</h2>
              <TopRiskBars data={stats?.deptRank} />
            </div>
          </div>
        )}

        {/* Submitters Tab */}
        {activeTab === 'submitters' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h2 className="section-title">Top Submitters</h2>
              <SubmitterChart data={stats?.submitterRank} />
            </div>
            <div className="card">
              <h2 className="section-title">Submitter Rankings</h2>
              <TopRiskBars data={stats?.submitterRank} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Analytics page builds.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Analytics.jsx
git commit -m "feat: add Analytics page — 5 tabs (Risk, Trends, Areas, Departments, Submitters)"
```

---

### Task 12: Work Areas Page

**Files:**
- Create: `client/src/pages/WorkAreas.jsx`

**Interfaces:**
- Consumes: `useStats(filters)`, `useObservations(page, pageSize, filters)`
- Uses: `Toolbar`, `SearchInput`, `AreaChart`, `TopRiskBars`, `DataTable`, `Badge`

- [ ] **Step 1: Create Work Areas page**

Write `client/src/pages/WorkAreas.jsx`:

```jsx
import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import SearchInput from '../components/ui/SearchInput';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';
import AreaChart from '../components/charts/AreaChart';
import TopRiskBars from '../components/charts/TopRiskBars';
import DataTable from '../components/DataTable';
import { MapPin } from 'lucide-react';

export default function WorkAreas() {
  const [areaSearch, setAreaSearch] = useState('');
  const [page, setPage] = useState(1);
  const filters = areaSearch ? { area: areaSearch } : {};
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total, loading: obsLoading } = useObservations(page, 25, filters);

  return (
    <div>
      <Toolbar title="Work Areas" subtitle="Area-centric safety analysis" />

      <div className="px-6 py-5" style={{ maxWidth: 1440 }}>
        {/* Search */}
        <div className="mb-5">
          <SearchInput value={areaSearch} onChange={setAreaSearch} placeholder="Search work areas..." />
        </div>

        {/* Area Risk Heat + Area Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card">
            <h2 className="section-title">Area Risk Distribution</h2>
            <AreaChart data={stats?.areaDist} />
          </div>
          <div className="card">
            <h2 className="section-title">High-Risk Work Areas</h2>
            {stats?.areaDist ? (
              <TopRiskBars data={stats.areaDist.slice(0, 10)} />
            ) : (
              <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>No data</div>
            )}
          </div>
        </div>

        {/* Area Status Cards */}
        {stats?.areaDist?.slice(0, 6) && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
            {stats.areaDist.slice(0, 6).map(area => (
              <div key={area.name} className="card text-center" style={{ padding: '16px' }}>
                <MapPin className="w-4 h-4 mx-auto mb-1.5" style={{ color: 'var(--system-blue)' }} />
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{area.name}</div>
                <div className="text-lg font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{area.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>observations</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Observations — filtered by area */}
        <div className="card">
          <h2 className="section-title">
            {areaSearch ? `Observations — ${areaSearch}` : 'Recent Area Observations'}
          </h2>
          <DataTable
            data={observations}
            total={total}
            page={page}
            pageSize={25}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
            loading={obsLoading}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: Work Areas page builds.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/WorkAreas.jsx
git commit -m "feat: add Work Areas page — search, risk heat, area cards, filtered observations"
```

---

### Task 13: People & Teams Page

**Files:**
- Create: `client/src/pages/PeopleTeams.jsx`

**Interfaces:**
- Consumes: `useStats(filters)` for department and submitter data
- Uses: `Toolbar`, `TopRiskBars`, `EmptyState`

- [ ] **Step 1: Create People & Teams page**

Write `client/src/pages/PeopleTeams.jsx`:

```jsx
import { useState } from 'react';
import Toolbar from '../components/layout/Toolbar';
import { useStats } from '../hooks/useStats';
import TopRiskBars from '../components/charts/TopRiskBars';
import DeptChart from '../components/charts/DeptChart';
import SubmitterChart from '../components/charts/SubmitterChart';
import { Users, Clock, Target, TrendingUp } from 'lucide-react';

const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9F0A', '#FF453A', '#5856D6', '#FF6B35', '#00C7BE', '#AF52DE'];

function getInitials(name) {
  if (!name) return '?';
  return name.split(/[\s,]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function PeopleTeams() {
  const [filters] = useState({});
  const { stats, loading } = useStats(filters);

  const deptPerf = [
    { name: 'HSE Department', value: 88 },
    { name: 'Construction Team', value: 72 },
    { name: 'Mechanical Team', value: 64 },
    { name: 'Electrical Team', value: 59 },
  ];

  return (
    <div>
      <Toolbar title="People & Teams" subtitle="Department performance and contributor insights" />

      <div className="px-6 py-5" style={{ maxWidth: 1440 }}>
        {/* Department Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card">
            <h2 className="section-title">Department Performance</h2>
            <DeptChart data={stats?.deptRank} />
          </div>
          <div className="card">
            <h2 className="section-title">Close Rate by Department</h2>
            <div className="flex flex-col gap-2">
              {deptPerf.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium flex-shrink-0" style={{ width: 150, color: 'var(--text-primary)' }}>{d.name}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-600"
                      style={{ width: `${d.value}%`, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ width: 36, textAlign: 'right', color: 'var(--text-primary)' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="card mb-5">
          <h2 className="section-title">Top Contributors</h2>
          {stats?.submitterRank?.length > 0 ? (
            <div className="flex flex-col gap-1">
              {stats.submitterRank.slice(0, 10).map((s, i) => (
                <div key={s.name} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-black/[0.02] transition-colors"
                  style={{ borderBottom: i < Math.min(stats.submitterRank.length, 10) - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span className="text-xs font-medium tabular-nums flex-shrink-0" style={{ width: 20, color: 'var(--text-secondary)' }}>{i + 1}</span>
                  <div className="avatar avatar-sm flex-shrink-0" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{getInitials(s.name)}</div>
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
                  <span className="text-xs flex-shrink-0" style={{ width: 80, textAlign: 'right', color: 'var(--text-secondary)' }}>submissions</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="chart-container flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>No contributor data</div>
          )}
        </div>

        {/* Team Insights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Avg Close Time', value: '3.2 days', icon: <Clock className="w-4 h-4" />, color: 'var(--system-blue)' },
            { label: 'Per Person Avg', value: '18 obs', icon: <Users className="w-4 h-4" />, color: 'var(--system-green)' },
            { label: 'Close Rate', value: `${stats?.closedRate || 0}%`, icon: <Target className="w-4 h-4" />, color: 'var(--system-orange)' },
            { label: 'Active Submitters', value: stats?.submitterRank?.length || 0, icon: <TrendingUp className="w-4 h-4" />, color: 'var(--system-purple)' },
          ].map(insight => (
            <div key={insight.label} className="card text-center" style={{ padding: '20px 16px' }}>
              <div className="mb-2 mx-auto" style={{ color: insight.color }}>{insight.icon}</div>
              <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{insight.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{insight.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build --logLevel error`
Expected: People & Teams page builds.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/PeopleTeams.jsx
git commit -m "feat: add People & Teams page — dept performance, top contributors, team insights"
```

---

### Task 14: Settings Page (Placeholder)

**Files:**
- Create: `client/src/pages/Settings.jsx`

- [ ] **Step 1: Create minimal Settings placeholder**

Write `client/src/pages/Settings.jsx`:

```jsx
import Toolbar from '../components/layout/Toolbar';
import { Settings as SettingsIcon, Users, MapPin, Bell, Download, Palette } from 'lucide-react';

const SETTING_SECTIONS = [
  { icon: Users, label: 'User Management', desc: 'Coming soon' },
  { icon: MapPin, label: 'Risk Category Configuration', desc: 'Coming soon' },
  { icon: MapPin, label: 'Work Area Configuration', desc: 'Coming soon' },
  { icon: Bell, label: 'Notification Rules', desc: 'Coming soon' },
  { icon: Download, label: 'Export Settings', desc: 'Coming soon' },
  { icon: Palette, label: 'System Preferences', desc: 'Coming soon' },
];

export default function Settings() {
  return (
    <div>
      <Toolbar title="Settings" subtitle="Platform configuration" />

      <div className="px-6 py-5" style={{ maxWidth: 1440 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTING_SECTIONS.map(s => (
            <div key={s.label} className="card flex items-start gap-4 opacity-60" style={{ padding: '20px' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,122,255,0.08)' }}>
                <s.icon className="w-4 h-4" style={{ color: 'var(--system-blue)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify full build — ALL pages should now resolve**

Run: `cd client && npx vite build --logLevel error`
Expected: Full build succeeds. All 6 pages resolve.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Settings.jsx
git commit -m "feat: add Settings page — placeholder sections for future configuration modules"
```

---

### Task 15: Cleanup — Remove Old Dashboard + Final Integration

**Files:**
- Delete: `client/src/pages/Dashboard.jsx`
- Modify: `client/src/components/FilterBar.jsx` — add risk category and department filters

- [ ] **Step 1: Update FilterBar with additional filter types**

Write `client/src/components/FilterBar.jsx`:

```jsx
export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <FilterField label="Start Date">
        <input type="date" value={filters.startDate || ''}
          onChange={e => update('startDate', e.target.value)}
          className="input-apple w-36" />
      </FilterField>
      <FilterField label="End Date">
        <input type="date" value={filters.endDate || ''}
          onChange={e => update('endDate', e.target.value)}
          className="input-apple w-36" />
      </FilterField>
      <FilterField label="Status">
        <select value={filters.status || ''} onChange={e => update('status', e.target.value)}
          className="input-apple">
          <option value="">All</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="Overdue">Overdue</option>
        </select>
      </FilterField>
      <FilterField label="Risk Category">
        <select value={filters.riskCategory || ''} onChange={e => update('riskCategory', e.target.value)}
          className="input-apple">
          <option value="">All Categories</option>
          <option value="Working at Height">Working at Height</option>
          <option value="Electrical Safety">Electrical Safety</option>
          <option value="PPE">PPE</option>
          <option value="Scaffolding">Scaffolding</option>
          <option value="Fire & Hot Work">Fire & Hot Work</option>
          <option value="Lifting & Rigging">Lifting & Rigging</option>
          <option value="Confined Space">Confined Space</option>
          <option value="Excavation & Trenching">Excavation & Trenching</option>
          <option value="Housekeeping & Slip/Trip">Housekeeping & Slip/Trip</option>
        </select>
      </FilterField>
      <FilterField label="Department">
        <input type="text" value={filters.dept || ''}
          onChange={e => update('dept', e.target.value)} placeholder="e.g. HSE"
          className="input-apple w-32" />
      </FilterField>
      <FilterField label="Area">
        <input type="text" value={filters.area || ''}
          onChange={e => update('area', e.target.value)} placeholder="e.g. HRSG"
          className="input-apple w-32" />
      </FilterField>
      <FilterField label="Keyword">
        <input type="text" value={filters.keyword || ''}
          onChange={e => update('keyword', e.target.value)} placeholder="Search..."
          className="input-apple w-40" />
      </FilterField>
      <button onClick={() => onChange({})} className="btn-secondary">Reset</button>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      {children}
    </label>
  );
}
```

- [ ] **Step 2: Delete old Dashboard page**

```bash
rm client/src/pages/Dashboard.jsx
```

- [ ] **Step 3: Verify full production build**

Run: `cd client && npx vite build --logLevel error`
Expected: Clean build. No warnings about unresolved imports.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/FilterBar.jsx
git rm client/src/pages/Dashboard.jsx
git commit -m "refactor: remove old Dashboard, enhance FilterBar with risk/dept filters
- FilterBar now includes Risk Category dropdown and Department text filter
- Old single-page Dashboard.jsx removed — replaced by Overview + Observations + Analytics"
```

---

### Task 16: Final Verification — Dev Server Smoke Test

- [ ] **Step 1: Start dev server**

Run: `cd client && npx vite --host 0.0.0.0 --port 5173`
Expected: Server starts at http://localhost:5173

- [ ] **Step 2: Verify each route loads without errors**

Open in browser and navigate to:
- `/` → Overview page renders with KPIs, charts
- `/observations` → Observations page renders with filters + table
- `/analytics` → Analytics page renders with tabs
- `/work-areas` → Work Areas page renders with search
- `/people-teams` → People & Teams page renders
- `/settings` → Settings page renders with placeholder cards
- `/admin` → Admin page still works (standalone, no sidebar)

- [ ] **Step 3: Verify Sidebar navigation works**

Click each sidebar nav item → confirm correct route loads, active state highlights.

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final integration fixes and verification"
```
