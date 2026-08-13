# Chinese / English Language Switching — Design Spec

**Date**: 2026-08-13
**Status**: Approved
**Scope**: Add a UI language switcher (中文 / EN) to the client. Translate **all user-visible static UI strings** only. Domain data (hazard categories, observation statuses, department/area names, observation descriptions) is left as-is.

---

## 1. Motivation

The client is currently a mixed-language UI: most chrome labels are English (Overview, Analytics, Total Records…) while many section titles and labels are hardcoded Chinese (隐患类型分布, 观察项状态, 待整改观察项, 加班申请系统…). There is no way to switch languages, and strings are scattered as literals across ~40 component files. This adds a lightweight, zero-dependency language system so the UI renders consistently in Chinese or English, with the choice persisted across sessions.

## 2. Scope

**In scope (UI chrome — static strings):**
- Sidebar nav labels, brand subtitle, theme/language toggle labels
- Toolbar titles/subtitles and date-range labels (从 / 至)
- Page section titles (隐患类型分布, 观察项状态, 本周提交最多, 待整改观察项, 显示:, 全部 …)
- KPI card labels (Total Records, Open Observations, Closed This Month, Active Work Areas)
- Table column headers, pagination, empty states
- Chart legends and empty-data hints
- Search placeholders, tab labels, buttons, dialog/modal text, form labels

**Out of scope (domain data — left untouched):**
- `src/config.js` — hazard classification keywords + `cn` field, Excel column-key mappings, status-color map. These are data, not UI chrome.
- Any string returned from the backend (hazard names, statuses, departments, areas, descriptions).
- Server-side changes. This is a frontend-only feature.

## 3. Architecture

Mirror the existing `ThemeContext` pattern ([`src/context/ThemeContext.jsx`](../../client/src/context/ThemeContext.jsx)).

### 3.1 New files

- **`src/context/LanguageContext.jsx`** — `LanguageProvider` + `useLanguage()` hook returning `{ lang, setLang, t }`.
  - `lang`: `'zh' | 'en'`.
  - Initial value resolution order:
    1. `localStorage.getItem('hse-lang')` if present and valid.
    2. Otherwise `navigator.language` starting with `zh` → `'zh'`, everything else → `'en'`.
    3. Wrap reads in try/catch (localStorage may be blocked).
  - `setLang(lang)`: sets state, writes `localStorage['hse-lang']`, and sets `document.documentElement.lang` to `'zh-CN'` / `'en'` (accessibility nicety).
  - `t(key, vars?)`: dictionary lookup with dot-path resolution and `{n}`-style interpolation (see §5).

- **`src/i18n/en.js`** — English dictionary (nested object).
- **`src/i18n/zh.js`** — Chinese dictionary (identical shape to `en.js`).

### 3.2 Provider wiring

`src/App.jsx` — wrap the existing tree with `LanguageProvider` (no dependency on `ThemeProvider`, so order is irrelevant; nest it as the outermost provider):

```
<LanguageProvider>
  <ThemeProvider>
    <ErrorBoundary>…</ErrorBoundary>
  </ThemeProvider>
</LanguageProvider>
```

`main.jsx` is unchanged.

### 3.3 Language toggle UI

In `Sidebar.jsx`, in the bottom block next to the existing 外观 (theme) toggle, add a same-styled 中文/EN switch reusing the macOS Control Center slider pattern already in place. The toggle renders the two labels 中文 and EN; clicking the inactive side calls `setLang`.

## 4. Default Language & Persistence

- First open: follow browser language (`navigator.language`).
- Manual toggle: persisted to `localStorage['hse-lang']`, survives reload and remount.
- No backend involvement; language is a per-browser local preference.

## 5. Dictionary Shape, Key Naming & Helpers

Dictionaries are nested objects resolved by dot path, e.g.:

```js
// en.js
export default {
  nav: { overview: 'Overview', analytics: 'Analytics', observations: 'Observations' },
  overview: {
    title: 'Overview',
    subtitle: '30-second safety status snapshot',
    kpi: { total: 'Total Records', open: 'Open Observations', … },
    sections: { hazardDist: 'Hazard Type Distribution', … },
  },
  // …
};
```

- `t('nav.overview')` → splits on `.` and walks the current language's dictionary.
- **Fallback**: on missing key, fall back to the English dictionary, then to the raw key string (never throw, never blank).
- **Interpolation**: minimal `{name}` replacement — `t('toolbar.showing', { n: 5 })` replaces `{n}`. No ICU/plurals — dynamic values are counts, dates, and percentages that render identically in both languages.

Key naming convention: grouped by page/component, lowerCamelCase dot paths (`nav.*`, `overview.*`, `observations.*`, `analytics.*`, `common.*`, `table.*`, `charts.*`).

## 6. Migration Scope

Replace every user-visible literal with `t('…')`. Representative categories and the files they live in:

| Category | Example strings | Files |
|----------|-----------------|-------|
| Sidebar nav & footer | Overview / Analytics / Observations / 加班申请系统 / 施工日报系统 / 外观 / 日间/夜间模式 | `components/layout/Sidebar.jsx` |
| Toolbar | 从 / 至, per-page title/subtitle | `components/layout/Toolbar.jsx`, each page |
| KPI cards | Total Records, Open Observations, Closed This Month, Active Work Areas | `components/cards/KPICards.jsx`, `components/cards/StatCard.jsx`, `pages/Overview.jsx` |
| Section titles & controls | 隐患类型分布 / 观察项状态 / 本周提交最多 / 待整改观察项 / 显示: / 全部 | `pages/Overview.jsx`, `pages/Analytics.jsx`, `pages/PeopleTeams.jsx`, `pages/WorkAreas.jsx` |
| Table | column headers, empty state, pagination | `components/DataTable.jsx`, `components/ui/EmptyState.jsx` |
| Charts | legends (已关闭/未关闭), empty hints | `components/charts/StatusPie.jsx`, `components/charts/HazardList.jsx`, other `components/charts/*` |
| Filters / search | placeholders, filter labels | `components/FilterBar.jsx`, `components/ui/SearchInput.jsx`, `components/ui/TabBar.jsx`, `components/ui/Badge.jsx` |
| Admin / upload / dialogs | form labels, buttons, modal text | `pages/Admin.jsx`, `components/AdminLogin.jsx`, `components/ExcelUpload.jsx`, `components/AwardsManager.jsx`, `components/AIClassifyPanel.jsx`, `components/ImageModal.jsx`, `pages/EmbeddedApp.jsx`, `pages/Settings.jsx`, `pages/Observations.jsx` |

`src/config.js`, `src/styles/*`, `src/hooks/*`, `src/api.js` are **not** touched. ECharts tooltips/labels built from data are data, not static chrome, and remain as-is.

## 7. Non-Goals (v1)

- No translation of backend/DB data (hazards, statuses, departments, areas, descriptions).
- No ICU message format, plurals, or number/date localization.
- No server-side locale or per-user saved preference.
- No right-to-left support or languages beyond zh/en.
- No automatic AI-based translation of free-text data.

## 8. File Changes

### New Files
- `src/context/LanguageContext.jsx`
- `src/i18n/en.js`
- `src/i18n/zh.js`

### Modified Files
- `src/App.jsx` — wrap providers
- `src/components/layout/Sidebar.jsx` — language toggle + translated nav/brand
- `src/components/layout/Toolbar.jsx` — date labels
- All page and component files containing user-visible strings, enumerated in §6 (`pages/*`, `components/cards/*`, `components/charts/*`, `components/ui/*`, `components/*`).

## 9. Verification

1. `npm run dev` (in `client/`) — manually verify:
   - Toggle 中文/EN flips every page and section instantly.
   - Reload preserves the chosen language (`localStorage['hse-lang']`).
   - Clearing storage + non-Chinese browser locale → English default; `zh` locale → Chinese default.
   - No hardcoded Chinese/English literals remain in the UI (grep for CJK + review).
   - Dynamic values (counts, %, dates) render correctly in both languages.
   - Missing-key fallback does not crash or blank any label.
2. `npm run build` — confirm no compile errors.
