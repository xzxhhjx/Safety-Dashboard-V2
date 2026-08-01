# Apple Enterprise HSE Safety Platform — Design Spec

**Date**: 2026-08-01  
**Status**: Approved  
**Scope**: Full refactor from single-page dashboard to multi-page Apple Enterprise platform

---

## 1. Motivation

The current single-page dashboard stacks all charts vertically, causing:
- Heavy initial render (all charts mount at once)
- Cognitive overload (no progressive disclosure)
- No deep-linking (single URL)
- Poor task separation (filtering + analysis + browsing conflated)

The refactor adopts a multi-page architecture with persistent sidebar navigation, each page serving one clear job.

## 2. Information Architecture

```
HSE Safety Platform
├── Overview           — 30-second status snapshot (1–1.5 screens)
├── Observations       — Full observation management (table + filters)
├── Analytics          — Tabbed deep-dive (Risk / Trends / Areas / Depts / Submitters)
├── Work Areas         — Area-centric analysis
├── People & Teams     — Department + contributor performance
└── Settings           — Minimal placeholder (v1)
```

## 3. Layout Shell

- **Sidebar**: 248px fixed, `rgba(10,75,196,0.92)` + `backdrop-filter: blur(20px) saturate(180%)`, 6 nav items with Lucide icons
- **Toolbar**: Per-page, breadcrumb + contextual actions
- **Content**: Scrollable, max-width 1440px, 12-column grid

## 4. Page Specifications

### 4.1 Overview
- 4 KPI cards (Total Records, Open Observations, Closed This Month, Active Work Areas)
- Safety Trend (line chart, 2px blue, 8% area fill, summary stats)
- Status Ring (Closed/Open/Overdue/Remaining, center closed-rate text)
- Top 5 Risk Categories (horizontal bars)
- Recent 5 Observations (compact table)

### 4.2 Observations
- Advanced filters: date range, status, area, risk category, keyword search
- Full data table: Photo (40×40), ID, Hazard, Risk Category, Status (capsule), Area, Dept, Description, Submitter, Date, Actions
- Row height: 64px, sticky header, hover highlight, keyboard navigation
- Pagination with page size selector
- CSV/Excel export
- Batch status update (checkbox selection)

### 4.3 Analytics
Tabs: Risk | Trends | Areas | Departments | Submitters
- Risk: Donut chart + Top Risk horizontal bars
- Trends: Monthly trend line + Open vs Closed overlay
- Areas: Top 10 horizontal bars + high-risk area flags
- Departments: Observation count bars + close rate
- Submitters: Top submitters + frequency trend

### 4.4 Work Areas
- Area search input
- Risk heat (horizontal bars by area)
- Area status cards
- Recent observations filtered by area

### 4.5 People & Teams
- Department performance horizontal bars (HSE 88%, Construction 72%, etc.)
- Top Contributors table (avatar initials, name, count, last active)
- Team Insights stat tiles (avg close time, observations per person, activity trend)

### 4.6 Settings
- Minimal placeholder page
- Future: user management, risk category config, area config, notification rules, export settings, dark mode toggle

## 5. Component Architecture

### Layout Components
- `AppShell` — Sidebar + content area wrapper
- `Sidebar` — Nav items, logo, user section
- `Toolbar` — Per-page title + actions

### Shared Components (extracted from existing)
- `KPICards` / `StatCard` — Configurable metric grid
- `DataTable` — Enhanced with selection, 64px rows, sticky header
- `FilterBar` — Extended filter types
- `BaseChart` — Unchanged ECharts wrapper
- `DonutChart` — Generalized from HazardChart
- `StatusRing` — From StatusPie
- `TrendChart` — From MonthlyTrendChart, multi-series support
- `HorizontalBars` — From TopRiskBars
- `Badge` — Status capsule
- `TabBar` — For Analytics page

## 6. Design Tokens

### Colors
- Primary Blue: `#007AFF`
- Success Green: `#34C759`
- Warning Orange: `#FF9F0A`
- Critical Red: `#FF453A`
- Secondary Gray: `#8E8E93`
- Divider: `#E5E5EA`
- Text Primary: `#1D1D1F`
- Text Secondary: `#6E6E73`

### Surfaces
- Body: `linear-gradient(180deg, #EEF2FF 0%, #F5F5F7 180px, #F5F5F7 100%)`
- Card: `rgba(255,255,255,0.82)` + `backdrop-filter: blur(20px)`
- Sidebar: `rgba(10,75,196,0.92)` + blur

### Typography
- Family: SF Pro Display, SF Pro Text, PingFang SC, sans-serif
- Scale: 11/13/15/17/20/24/28

### Spacing
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Radius
- Scale: 6, 8, 12, 16, 18, 24

### Shadows
- `elevation-1`: `0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)`
- `elevation-2`: `0 2px 4px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)`
- `elevation-3`: `0 4px 8px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.12)`

## 7. ECharts Theme

Single `registerTheme('apple-enterprise', {...})`:
- All text: SF Pro, `#1D1D1F` / `#6E6E73`
- Grid lines: `#E5E5EA`, dashed on value axis
- Tooltip: frosted glass, no border
- 16-color Apple palette registered
- Category axis: no ticks, bottom line only
- Series defaults: 2px line, 8% area, 4px radius markers

## 8. File Changes

### New Files
- `components/layout/AppShell.jsx`
- `components/layout/Sidebar.jsx`
- `components/layout/Toolbar.jsx`
- `components/cards/KPICards.jsx`
- `components/cards/StatCard.jsx`
- `components/ui/Badge.jsx`
- `components/ui/TabBar.jsx`
- `components/ui/EmptyState.jsx`
- `pages/Overview.jsx`
- `pages/Observations.jsx`
- `pages/Analytics.jsx`
- `pages/WorkAreas.jsx`
- `pages/PeopleTeams.jsx`
- `pages/Settings.jsx`
- `styles/echarts-theme.js`

### Modified Files
- `App.jsx` — Add AppShell wrapper, new routes
- `styles/index.css` — Full design token rewrite
- `components/DataTable.jsx` — 64px rows, selection, export

### Removed Files
- `pages/Dashboard.jsx` — Replaced by Overview + Observations + Analytics

## 9. Non-Goals (v1)
- Backend user management
- Real notification system
- Dark mode toggle (CSS vars prepared, toggle deferred)
- Real-time WebSocket updates
- Mobile-native app
