# Chinese / English Language Switching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 中文/EN language switcher to the React client that translates all user-visible static UI strings, persists the choice to localStorage, and defaults to the browser language.

**Architecture:** A lightweight `LanguageContext` (mirroring the existing `ThemeContext`) exposes `{ lang, setLang, t }`. Pure helpers (`resolveKey`, `interpolate`, `detectLang`) live in a React-free module so they are unit-testable. Translations are nested objects in `src/i18n/en.js` and `src/i18n/zh.js`, resolved by dot-path via `t('a.b.c')`.

**Tech Stack:** React 19, Vite 6, Vitest (new dev dependency for the i18n core tests only).

## Global Constraints

- Zero runtime dependencies added. Only `vitest` as a devDependency.
- Translation keys use lowerCamelCase dot paths (`nav.overview`, `overview.kpi.total`).
- `t(key, vars?)` interpolates `{name}` tokens only — no ICU/plurals.
- Domain data is **not** translated: `src/config.js`, filter option *values* (status names, risk-category names), CSV export headers, backend/DB strings, and ECharts series data all stay as-is.
- The em-dash placeholder `—` and the language endonyms `中文`/`EN` are language-neutral and stay literal.
- Both `en.js` and `zh.js` must have identical key structure (no key may exist in only one).

---

## File Structure

**New files:**
- `client/src/i18n/core.js` — pure helpers (resolveKey, interpolate, detectLang)
- `client/src/i18n/core.test.js` — Vitest unit tests
- `client/src/i18n/en.js` — English dictionary
- `client/src/i18n/zh.js` — Chinese dictionary
- `client/src/context/LanguageContext.jsx` — provider + `useLanguage()` hook

**Modified files:** `client/package.json` (vitest + test script), `client/src/App.jsx`, and every component/page with visible strings (enumerated per task below).

---

## Task 1: i18n core helpers + tests

**Files:**
- Create: `client/src/i18n/core.js`
- Create: `client/src/i18n/core.test.js`
- Modify: `client/package.json`

**Interfaces:**
- Produces: `resolveKey(dict, key, fallbackDict) -> string`, `interpolate(str, vars) -> string`, `detectLang(storageGet) -> 'zh' | 'en'` (all named exports from `core.js`).

- [ ] **Step 1: Add vitest devDependency and test script**

Modify `client/package.json` `devDependencies` to include `"vitest": "^2.1.0"` and add a `test` script. The final `scripts` and `devDependencies` blocks:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run"
},
"devDependencies": {
  "@tailwindcss/vite": "^4.0.0",
  "@vitejs/plugin-react": "^4.3.0",
  "tailwindcss": "^4.0.0",
  "vite": "^6.0.0",
  "vitest": "^2.1.0"
}
```

Run: `npm install` (in `client/`)
Expected: installs vitest with no errors.

- [ ] **Step 2: Write the failing tests**

Create `client/src/i18n/core.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { resolveKey, interpolate, detectLang } from './core';

describe('resolveKey', () => {
  const dict = { nav: { overview: '概览' }, count: '总数' };
  const fb = { nav: { overview: 'Overview' }, missing: 'Fallback' };

  it('resolves a nested key from the primary dict', () => {
    expect(resolveKey(dict, 'nav.overview', fb)).toBe('概览');
  });

  it('falls back to the fallback dict when key is missing', () => {
    expect(resolveKey(dict, 'missing', fb)).toBe('Fallback');
  });

  it('returns the raw key when neither dict has it', () => {
    expect(resolveKey(dict, 'nope.nada', fb)).toBe('nope.nada');
  });

  it('handles a null dict gracefully', () => {
    expect(resolveKey(null, 'nav.overview', fb)).toBe('Overview');
  });
});

describe('interpolate', () => {
  it('replaces {name} tokens', () => {
    expect(interpolate('Page {page} of {total}', { page: 2, total: 9 })).toBe('Page 2 of 9');
  });

  it('leaves unknown tokens intact', () => {
    expect(interpolate('Hi {x}', {})).toBe('Hi {x}');
  });

  it('returns the string unchanged when no vars passed', () => {
    expect(interpolate('Hello', undefined)).toBe('Hello');
  });
});

describe('detectLang', () => {
  it('returns stored value when valid', () => {
    expect(detectLang(() => 'zh')).toBe('zh');
    expect(detectLang(() => 'en')).toBe('en');
  });

  it('falls back to "en" when stored value is invalid and navigator absent', () => {
    expect(detectLang(() => 'fr')).toBe('en');
  });

  it('uses navigator.language when nothing stored', () => {
    const orig = globalThis.navigator;
    globalThis.navigator = { language: 'zh-CN' };
    expect(detectLang(() => null)).toBe('zh');
    globalThis.navigator = { language: 'en-US' };
    expect(detectLang(() => null)).toBe('en');
    globalThis.navigator = orig;
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test` (in `client/`)
Expected: FAIL — "Cannot find module './core'".

- [ ] **Step 4: Write the implementation**

Create `client/src/i18n/core.js`:

```js
// Pure i18n helpers — no React, no DOM. Unit-testable in isolation.

// Resolve a dot-path key against a dictionary, falling back to `fallbackDict`
// then to the raw key. Returns a string, never throws.
export function resolveKey(dict, key, fallbackDict) {
  const parts = String(key).split('.');
  let cur = dict;
  let fb = fallbackDict;
  for (const p of parts) {
    cur = cur?.[p];
    fb = fb?.[p];
  }
  if (typeof cur === 'string') return cur;
  if (typeof fb === 'string') return fb;
  return key;
}

// Replace {name} tokens with values from vars. Unknown tokens are left as-is.
export function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

// Resolve initial language: localStorage first, then navigator.language.
// `storageGet` is injected so tests can pass a fake.
export function detectLang(storageGet) {
  const stored = storageGet('hse-lang');
  if (stored === 'zh' || stored === 'en') return stored;
  const nav = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test` (in `client/`)
Expected: PASS — 10 tests.

- [ ] **Step 6: Commit**

```bash
git add client/package.json client/package-lock.json client/src/i18n/core.js client/src/i18n/core.test.js
git commit -m "feat(i18n): add pure i18n helpers (resolveKey, interpolate, detectLang) with tests"
```

---

## Task 2: Dictionaries, LanguageContext, provider wiring, Sidebar toggle

**Files:**
- Create: `client/src/i18n/en.js`
- Create: `client/src/i18n/zh.js`
- Create: `client/src/context/LanguageContext.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/layout/Sidebar.jsx`
- Modify: `client/src/components/layout/Toolbar.jsx`

**Interfaces:**
- Consumes: `resolveKey`, `interpolate`, `detectLang` from `../i18n/core` (Task 1).
- Produces: `useLanguage()` hook → `{ lang, setLang, t }`; `LanguageProvider` component. Dictionaries `en` and `zh` as default exports from `../i18n/en` and `../i18n/zh`.

- [ ] **Step 1: Write the full English dictionary**

Create `client/src/i18n/en.js`:

```js
export default {
  brand: { name: 'HSE Safety', subtitle: 'Observation Platform' },
  language: { label: 'Language' },
  appearance: { label: 'Appearance', mode: 'Appearance mode', light: 'Light mode', dark: 'Dark mode' },
  nav: {
    overview: 'Overview',
    analytics: 'Analytics',
    observations: 'Observations',
    overtime: 'Overtime Application',
    daily: 'Daily Report',
  },
  toolbar: { from: 'From', to: 'To' },
  common: {
    noData: 'No data',
    noRecords: 'No records found',
    loading: 'Loading...',
    prev: 'Prev',
    next: 'Next',
    show: 'Show',
    all: 'All',
    reset: 'Reset',
    exportCsv: 'Export CSV',
    search: 'Search...',
    items: 'items',
  },
  table: {
    col: {
      time: 'Submitted At',
      submitter: 'Submitter',
      dept: 'Department',
      area: 'Area',
      obsType: 'Type',
      hazard: 'Hazard',
      description: 'Description',
      measures: 'Measures',
      status: 'Status',
      photos: 'Photos',
    },
    safe: 'Safe',
    risk: 'Risk',
    viewPhotos: 'View',
    viewPhotosTitle: 'Click to view photos',
    selected: '{n} selected',
    pageOf: 'Page {page} of {total}',
  },
  overview: {
    title: 'Overview',
    subtitle: '30-second safety status snapshot',
    kpi: {
      total: 'Total Records',
      open: 'Open Observations',
      closedMonth: 'Closed This Month',
      activeAreas: 'Active Work Areas',
    },
    hazardDist: 'Hazard Type Distribution',
    show: 'Show:',
    top5: 'Top 5',
    top10: 'Top 10',
    statusOverview: 'Observation Status',
    statusSubtitle: 'Closed / Open',
    weeklyTop: 'Most Submissions This Week',
    weeklyEmpty: 'No submissions in the last week',
    pending: 'Observations Pending Rectification',
    pendingSubtitle: 'Unclosed Observations',
  },
  observations: {
    title: 'Observations',
    subtitle: 'Complete safety observation records',
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'Deep-dive into safety data',
    tab: { risk: 'Risk', trends: 'Trends', areas: 'Areas', people: 'People' },
    heatmap: 'Area-Hazard Heatmap',
    heatmapSubtitle: 'Heatmap Analysis (Areas vs Hazards) — click a cell to drill down',
    clearFilter: 'Clear filter',
    records: 'Records: {area} — {hazard}',
    monthlyTrend: 'Monthly Observation Trend',
    wow: 'Week-over-Week Comparison',
    wowHint: 'Weekly data available with date range filter',
    openVsClosed: 'Open vs Closed Trend',
    breakdownHint: 'Breakdown available with status filter',
    topAreas: 'Top 10 Work Areas',
    highRiskAreas: 'High-Risk Area Rankings',
    submitters: 'Submitters',
    depts: 'Submitter Departments',
    deptsSub: 'Departments',
  },
  peopleTeams: {
    title: 'People & Teams',
    subtitle: 'Department performance and contributor insights',
    deptPerf: 'Department Performance',
    closeRateByDept: 'Close Rate by Department',
    topContributors: 'Top Contributors',
    submissions: 'submissions',
    noContributors: 'No contributor data',
    avgCloseTime: 'Avg Close Time',
    perPersonAvg: 'Per Person Avg',
    closeRate: 'Close Rate',
    activeSubmitters: 'Active Submitters',
  },
  workAreas: {
    title: 'Work Areas',
    subtitle: 'Area-centric safety analysis',
    searchPlaceholder: 'Search work areas...',
    areaRiskDist: 'Area Risk Distribution',
    highRiskAreas: 'High-Risk Work Areas',
    observations: 'observations',
    recent: 'Recent Area Observations',
    observationsArea: 'Observations — {area}',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Platform configuration',
    userManagement: 'User Management',
    riskCategory: 'Risk Category Configuration',
    workArea: 'Work Area Configuration',
    notification: 'Notification Rules',
    export: 'Export Settings',
    preferences: 'System Preferences',
    comingSoon: 'Coming soon',
  },
  admin: { panel: 'Admin Panel', logout: 'Logout' },
  filter: {
    status: 'Status',
    riskCategory: 'Risk Category',
    department: 'Department',
    area: 'Area',
    keyword: 'Keyword',
    all: 'All',
    allCategories: 'All Categories',
    deptPlaceholder: 'e.g. HSE',
    areaPlaceholder: 'e.g. HRSG',
  },
  charts: {
    noHeatmap: 'No heatmap data',
    total: 'Total',
    monthlyAvg: 'Monthly Avg',
    peak: 'Peak',
    closed: 'Closed',
    open: 'Open',
    closeRate: 'Close Rate',
    high: 'High',
    low: 'Low',
    hazardSeries: 'Hazard Categories',
  },
  hazardList: { filterBy: 'Filter by' },
  login: {
    title: 'Admin Login',
    username: 'Username',
    password: 'Password',
    failed: 'Login failed',
    signingIn: 'Signing in...',
    signIn: 'Sign In',
  },
  upload: {
    title: 'Upload Excel Data',
    processing: 'Processing...',
    uploadSync: 'Upload & Sync',
    starting: 'Starting upload: {name}',
    complete: 'Complete! {inserted} new, {updated} status updated, {skipped} skipped, {images} images{errors}',
    errorsSuffix: ', {n} errors',
    failed: 'Upload failed: {msg}',
    error: 'Error: {msg}',
    newN: '{n} new',
    updatedN: '{n} updated',
    skippedN: '{n} skipped',
    imagesN: '{n} images',
    errorsN: '{n} errors',
  },
  ai: {
    title: 'AI Classification',
    provider: 'Provider',
    scope: 'Scope',
    scopeLast50: 'Last 50 Records (Test)',
    scopeUnanalyzed: 'Unanalyzed Records',
    scopeOthers: '"Others" Classification Only',
    scopeAll: 'All Records',
    startNew: 'Start New Run',
    start: 'Start AI Analysis',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    classified: '{done} / {total} classified',
    paused: 'PAUSED',
    errorsN: '{n} errors',
    classifying: 'Classifying {index}/{total}',
    noDescription: 'No description',
    keyMissing: 'API key not configured, using keyword matching (lower accuracy)',
    providerLine: 'Provider: {p}, Scope: {s}, Total: {n} records',
    complete: 'Complete! {done} classified, {skipped} skipped, {errors} errors',
    fatal: 'Fatal error: {msg}',
    connError: 'Connection error: {msg}',
    pausedAt: '⏸ Paused at {done}/{total}',
  },
  awards: {
    title: 'Safety Awards',
    add: '+ Add',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved!',
    errorPrefix: 'Error: ',
    loading: 'Loading awards...',
    team: 'Team',
    score: 'Score',
    level: 'Level',
    gold: 'Gold',
    silver: 'Silver',
    normal: 'Normal',
    teamName: 'Team name:',
  },
  imageModal: {
    loadFailed: 'Image failed to load',
    fileMissing: 'Image file missing or inaccessible',
  },
  errorBoundary: { title: 'Something went wrong', reload: 'Reload' },
  embedded: { openNewTab: 'Open in new tab' },
};
```

- [ ] **Step 2: Write the full Chinese dictionary**

Create `client/src/i18n/zh.js` (identical key structure to `en.js`):

```js
export default {
  brand: { name: 'HSE Safety', subtitle: '观察平台' },
  language: { label: '语言' },
  appearance: { label: '外观', mode: '外观模式', light: '日间模式', dark: '夜间模式' },
  nav: {
    overview: '概览',
    analytics: '分析',
    observations: '观察项',
    overtime: '加班申请系统',
    daily: '施工日报系统',
  },
  toolbar: { from: '从', to: '至' },
  common: {
    noData: '暂无数据',
    noRecords: '未找到记录',
    loading: '加载中...',
    prev: '上一页',
    next: '下一页',
    show: '每页显示',
    all: '全部',
    reset: '重置',
    exportCsv: '导出 CSV',
    search: '搜索...',
    items: '项',
  },
  table: {
    col: {
      time: '提交时间',
      submitter: '提交人',
      dept: '提交人部门',
      area: '隐患所在区域',
      obsType: '属性',
      hazard: '隐患类型',
      description: '描述',
      measures: '采取的措施',
      status: '当前状态',
      photos: '图片',
    },
    safe: '安全',
    risk: '风险',
    viewPhotos: '查看',
    viewPhotosTitle: '点击查看图片',
    selected: '已选 {n} 项',
    pageOf: '第 {page} / {total} 页',
  },
  overview: {
    title: '概览',
    subtitle: '30秒安全状态快照',
    kpi: {
      total: '记录总数',
      open: '未关闭观察项',
      closedMonth: '本月已关闭',
      activeAreas: '活跃工作区域',
    },
    hazardDist: '隐患类型分布',
    show: '显示:',
    top5: '前 5',
    top10: '前 10',
    statusOverview: '观察项状态',
    statusSubtitle: '已关闭 / 未关闭',
    weeklyTop: '本周提交最多',
    weeklyEmpty: '最近一周暂无提交记录',
    pending: '待整改观察项',
    pendingSubtitle: '未关闭观察项',
  },
  observations: {
    title: '观察项',
    subtitle: '完整的观察项记录',
  },
  analytics: {
    title: '分析',
    subtitle: '深入分析安全数据',
    tab: { risk: '风险', trends: '趋势', areas: '区域', people: '人员' },
    heatmap: '区域-隐患热力图',
    heatmapSubtitle: '热力图分析（区域 × 隐患）——点击单元格下钻',
    clearFilter: '清除筛选',
    records: '记录：{area} — {hazard}',
    monthlyTrend: '月度观察趋势',
    wow: '周环比对比',
    wowHint: '使用日期范围筛选可查看周数据',
    openVsClosed: '已关闭 vs 未关闭趋势',
    breakdownHint: '使用状态筛选可查看细分',
    topAreas: '前 10 工作区域',
    highRiskAreas: '高风险区域排行',
    submitters: '提交人',
    depts: '提交人部门',
    deptsSub: '部门',
  },
  peopleTeams: {
    title: '人员与团队',
    subtitle: '部门绩效与贡献者洞察',
    deptPerf: '部门绩效',
    closeRateByDept: '各部门关闭率',
    topContributors: '贡献最多人员',
    submissions: '次提交',
    noContributors: '暂无贡献者数据',
    avgCloseTime: '平均关闭时长',
    perPersonAvg: '人均观察数',
    closeRate: '关闭率',
    activeSubmitters: '活跃提交人',
  },
  workAreas: {
    title: '工作区域',
    subtitle: '以区域为中心的安全分析',
    searchPlaceholder: '搜索工作区域...',
    areaRiskDist: '区域风险分布',
    highRiskAreas: '高风险工作区域',
    observations: '条观察',
    recent: '最近区域观察项',
    observationsArea: '观察项 — {area}',
  },
  settings: {
    title: '设置',
    subtitle: '平台配置',
    userManagement: '用户管理',
    riskCategory: '风险分类配置',
    workArea: '工作区域配置',
    notification: '通知规则',
    export: '导出设置',
    preferences: '系统偏好',
    comingSoon: '即将推出',
  },
  admin: { panel: '管理后台', logout: '退出登录' },
  filter: {
    status: '状态',
    riskCategory: '风险分类',
    department: '部门',
    area: '区域',
    keyword: '关键词',
    all: '全部',
    allCategories: '全部分类',
    deptPlaceholder: '如 HSE',
    areaPlaceholder: '如 HRSG',
  },
  charts: {
    noHeatmap: '暂无热力图数据',
    total: '总数',
    monthlyAvg: '月均',
    peak: '峰值',
    closed: '已关闭',
    open: '未关闭',
    closeRate: '关闭率',
    high: '高',
    low: '低',
    hazardSeries: '隐患分类',
  },
  hazardList: { filterBy: '点击筛选' },
  login: {
    title: '管理员登录',
    username: '用户名',
    password: '密码',
    failed: '登录失败',
    signingIn: '登录中...',
    signIn: '登录',
  },
  upload: {
    title: '上传 Excel 数据',
    processing: '处理中...',
    uploadSync: '上传并同步',
    starting: '开始上传：{name}',
    complete: '完成！新增 {inserted}，状态更新 {updated}，跳过 {skipped}，图片 {images}{errors}',
    errorsSuffix: '，错误 {n}',
    failed: '上传失败：{msg}',
    error: '错误：{msg}',
    newN: '新增 {n}',
    updatedN: '更新 {n}',
    skippedN: '跳过 {n}',
    imagesN: '图片 {n}',
    errorsN: '错误 {n}',
  },
  ai: {
    title: 'AI 分类',
    provider: '服务商',
    scope: '范围',
    scopeLast50: '最近 50 条（测试）',
    scopeUnanalyzed: '未分析记录',
    scopeOthers: '仅"其他"分类',
    scopeAll: '全部记录',
    startNew: '开始新一轮',
    start: '开始 AI 分析',
    pause: '暂停',
    resume: '继续',
    cancel: '取消',
    classified: '已分类 {done} / {total}',
    paused: '已暂停',
    errorsN: '错误 {n}',
    classifying: '正在分类 {index}/{total}',
    noDescription: '无描述',
    keyMissing: 'API key 未配置，将使用关键词匹配（低精度）',
    providerLine: '服务商：{p}，范围：{s}，共 {n} 条记录',
    complete: '完成！已分类 {done}，跳过 {skipped}，错误 {errors}',
    fatal: '致命错误：{msg}',
    connError: '连接错误：{msg}',
    pausedAt: '⏸ 暂停于 {done}/{total}',
  },
  awards: {
    title: '安全奖项',
    add: '+ 添加',
    save: '保存',
    saving: '保存中...',
    saved: '已保存！',
    errorPrefix: '错误：',
    loading: '加载奖项中...',
    team: '团队',
    score: '得分',
    level: '等级',
    gold: '金',
    silver: '银',
    normal: '普通',
    teamName: '团队名称：',
  },
  imageModal: {
    loadFailed: '图片加载失败',
    fileMissing: '图片文件不存在或无法访问',
  },
  errorBoundary: { title: '出了点问题', reload: '重新加载' },
  embedded: { openNewTab: '在新标签页打开' },
};
```

- [ ] **Step 3: Write LanguageContext**

Create `client/src/context/LanguageContext.jsx`:

```jsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { resolveKey, interpolate, detectLang } from '../i18n/core';
import en from '../i18n/en';
import zh from '../i18n/zh';

const dicts = { en, zh };
const STORAGE_KEY = 'hse-lang';

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

function getInitial() {
  try {
    return detectLang((k) => localStorage.getItem(k));
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitial);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* noop */ }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const setLang = useCallback((l) => { if (l === 'zh' || l === 'en') setLangState(l); }, []);

  const t = useCallback((key, vars) => {
    const dict = dicts[lang] || en;
    const fallback = lang === 'en' ? null : en;
    return interpolate(resolveKey(dict, key, fallback), vars);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
```

- [ ] **Step 4: Wire the provider into App and split routes**

Modify `client/src/App.jsx`. Replace the entire file with:

```jsx
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';
import Overview from './pages/Overview';
import Observations from './pages/Observations';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import EmbeddedApp from './pages/EmbeddedApp';
import ErrorBoundary from './components/ErrorBoundary';

function AppRoutes() {
  const { t } = useLanguage();
  return (
    <Routes>
      <Route path="/" element={<AppShell><Overview /></AppShell>} />
      <Route path="/observations" element={<AppShell><Observations /></AppShell>} />
      <Route path="/analytics" element={<AppShell><Analytics /></AppShell>} />
      <Route path="/overtime" element={
        <AppShell><EmbeddedApp title={t('nav.overtime')} src="https://tcc-ytl-ot.vercel.app/overtime" /></AppShell>
      } />
      <Route path="/daily" element={
        <AppShell><EmbeddedApp title={t('nav.daily')} src="https://tcc-ytl-ot.vercel.app/daily-home" /></AppShell>
      } />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </ThemeProvider>
    </LanguageProvider>
  );
}
```

- [ ] **Step 5: Migrate Sidebar + add language toggle**

Modify `client/src/components/layout/Sidebar.jsx`:

1. Add import: `import { useLanguage } from '../../context/LanguageContext';`
2. Inside the component, add: `const { lang, setLang, t } = useLanguage();`
3. Change `NAV_ITEMS` and `EXTERNAL_NAV_ITEMS` labels from literals to translation keys. Replace the two module-level arrays with:

```js
const NAV_ITEMS = [
  { path: '/',              labelKey: 'nav.overview',     icon: LayoutDashboard },
  { path: '/analytics',     labelKey: 'nav.analytics',    icon: BarChart3 },
  { path: '/observations',  labelKey: 'nav.observations', icon: ClipboardList },
];

const EXTERNAL_NAV_ITEMS = [
  { labelKey: 'nav.overtime', icon: Clock,   path: '/overtime' },
  { labelKey: 'nav.daily',   icon: HardHat, path: '/daily' },
];
```

4. In both `.map()` render blocks, change `{item.label}` to `{t(item.labelKey)}`.
5. Change brand subtitle line `<div ...>Observation Platform</div>` to `{t('brand.subtitle')}`.
6. Change `外观` (the footer label) to `{t('appearance.label')}`, `aria-label="外观模式"` to `aria-label={t('appearance.mode')}`, `aria-label="日间模式"` to `aria-label={t('appearance.light')}`, `aria-label="夜间模式"` to `aria-label={t('appearance.dark')}`.
7. Add the language toggle as a second row directly below the appearance row, inside the same bottom `<div>` block (after the appearance row's closing `</div>`):

```jsx
<div className="flex items-center justify-between mt-3">
  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{t('language.label')}</span>
  <div role="radiogroup" aria-label={t('language.label')} style={{ display: 'inline-flex', gap: 4 }}>
    <button onClick={() => setLang('zh')} aria-pressed={lang === 'zh'}
      style={{
        padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)',
        fontSize: 12, cursor: 'pointer',
        background: lang === 'zh' ? 'var(--system-blue)' : 'transparent',
        color: lang === 'zh' ? '#fff' : 'var(--text-secondary)',
      }}>中文</button>
    <button onClick={() => setLang('en')} aria-pressed={lang === 'en'}
      style={{
        padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)',
        fontSize: 12, cursor: 'pointer',
        background: lang === 'en' ? 'var(--system-blue)' : 'transparent',
        color: lang === 'en' ? '#fff' : 'var(--text-secondary)',
      }}>EN</button>
  </div>
</div>
```

- [ ] **Step 6: Migrate Toolbar date labels**

Modify `client/src/components/layout/Toolbar.jsx`:

1. Add import: `import { useLanguage } from '../../context/LanguageContext';`
2. Inside the component add: `const { t } = useLanguage();`
3. Change `从` to `{t('toolbar.from')}` and `至` to `{t('toolbar.to')}`.

- [ ] **Step 7: Verify build**

Run: `npm run build` (in `client/`)
Expected: builds with no errors. `npm run dev` shows a working 中文/EN toggle in the sidebar that switches nav + toolbar labels and persists across reload.

- [ ] **Step 8: Commit**

```bash
git add client/src/i18n/en.js client/src/i18n/zh.js client/src/context/LanguageContext.jsx client/src/App.jsx client/src/components/layout/Sidebar.jsx client/src/components/layout/Toolbar.jsx
git commit -m "feat(i18n): add LanguageContext, dictionaries, and sidebar language toggle"
```

---

## Task 3: Migrate Overview page

**Files:**
- Modify: `client/src/pages/Overview.jsx`

**Interfaces:** Consumes `useLanguage()` → `t` from Task 2. Keys already defined in Task 2 dictionaries.

- [ ] **Step 1: Add hook + migrate strings**

Modify `client/src/pages/Overview.jsx`:

1. Add import: `import { useLanguage } from '../context/LanguageContext';`
2. Inside `Overview()`, add: `const { t } = useLanguage();`
3. Replace each literal as follows:

| Literal | Replacement |
|---------|-------------|
| `label: 'Total Records'` | `label: t('overview.kpi.total')` |
| `label: 'Open Observations'` | `label: t('overview.kpi.open')` |
| `label: 'Closed This Month'` | `label: t('overview.kpi.closedMonth')` |
| `label: 'Active Work Areas'` | `label: t('overview.kpi.activeAreas')` |
| `title="Overview"` | `title={t('overview.title')}` |
| `subtitle="30-second safety status snapshot"` | `subtitle={t('overview.subtitle')}` |
| `<h2 className="section-title mb-0">隐患类型分布</h2>` | `<h2 className="section-title mb-0">{t('overview.hazardDist')}</h2>` |
| `显示:` | `{t('overview.show')}` |
| `<option value="5">Top 5</option>` | `<option value="5">{t('overview.top5')}</option>` |
| `<option value="10">Top 10</option>` | `<option value="10">{t('overview.top10')}</option>` |
| `<option value="all">全部</option>` | `<option value="all">{t('common.all')}</option>` |
| `观察项状态` | `{t('overview.statusOverview')}` |
| `已关闭 / 未关闭` | `{t('overview.statusSubtitle')}` |
| `本周提交最多` | `{t('overview.weeklyTop')}` |
| `最近一周暂无提交记录` | `{t('overview.weeklyEmpty')}` |
| `待整改观察项` | `{t('overview.pending')}` |
| `Unclosed Observations` | `{t('overview.pendingSubtitle')}` |

Note: the `kpiCards` array is re-created on every render (it's in the component body, not memoized), so `t(...)` calls there work correctly.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Overview.jsx
git commit -m "feat(i18n): translate Overview page strings"
```

---

## Task 4: Migrate DataTable, ImageModal, EmptyState, SearchInput

**Files:**
- Modify: `client/src/components/DataTable.jsx`
- Modify: `client/src/components/ImageModal.jsx`
- Modify: `client/src/components/ui/EmptyState.jsx`
- Modify: `client/src/components/ui/SearchInput.jsx`

**Interfaces:** Consumes `useLanguage()`. Keys defined in Task 2.

- [ ] **Step 1: DataTable — move columns into component + translate**

Modify `client/src/components/DataTable.jsx`:

1. Add import: `import { useLanguage } from '../context/LanguageContext';`
2. Delete the module-level `DEFAULT_COLUMNS` array. Add it back **inside** the component (after the hooks), using `t`:

```js
const defaultColumns = [
  { key: 'obs_time',   label: t('table.col.time'),        width: 150 },
  { key: 'submitter',  label: t('table.col.submitter'),   width: 90 },
  { key: 'dept',       label: t('table.col.dept'),        width: 120 },
  { key: 'area',       label: t('table.col.area'),        width: 130 },
  { key: 'obs_type',   label: t('table.col.obsType'),     width: 72 },
  { key: 'hazard',     label: t('table.col.hazard'),      width: 140 },
  { key: 'description',label: t('table.col.description'), width: 200 },
  { key: 'measures',   label: t('table.col.measures'),    width: 160 },
  { key: 'status',     label: t('table.col.status'),      width: 100 },
  { key: 'photos',     label: t('table.col.photos'),      width: 70 },
];
```

3. Inside the component add: `const { t } = useLanguage();`
4. Change `const cols = columns || DEFAULT_COLUMNS;` to `const cols = columns || defaultColumns;`
5. In `renderCell`'s `obs_type` case, replace `'Safe'` → `t('table.safe')`, `'Risk'` → `t('table.risk')`.
6. In the `photos` case, replace `title="点击查看图片"` → `title={t('table.viewPhotosTitle')}` and `查看` → `{t('table.viewPhotos')}`.
7. Replace remaining literals:

| Literal | Replacement |
|---------|-------------|
| `` `${selected.size} selected` `` | `` t('table.selected', { n: selected.size }) `` |
| `Export CSV` | `{t('common.exportCsv')}` |
| `Loading...` | `{t('common.loading')}` |
| `No records found` | `{t('common.noRecords')}` |
| `Page {page} of {totalPages || 1}` | `{t('table.pageOf', { page, total: totalPages || 1 })}` |
| `Show` | `{t('common.show')}` |
| `Prev` | `{t('common.prev')}` |
| `Next` | `{t('common.next')}` |

For the `selected` line, the final JSX should read: `{selectable && selected.size > 0 && t('table.selected', { n: selected.size })}`.

- [ ] **Step 2: ImageModal**

Modify `client/src/components/ImageModal.jsx`:

1. Add import + hook (`const { t } = useLanguage();`).
2. Replace `图片加载失败` → `{t('imageModal.loadFailed')}` and `图片文件不存在或无法访问` → `{t('imageModal.fileMissing')}`.

- [ ] **Step 3: EmptyState default**

Modify `client/src/components/ui/EmptyState.jsx`:

1. Add import + hook.
2. Change `{title || 'No data'}` to `{title || t('common.noData')}`.

- [ ] **Step 4: SearchInput default**

Modify `client/src/components/ui/SearchInput.jsx`:

1. Add import + hook.
2. Change the default param `placeholder = 'Search...'` to `placeholder` and resolve inside: change signature to `export default function SearchInput({ value, onChange, placeholder })` and use `const { t } = useLanguage();` then `placeholder={placeholder || t('common.search')}`.

- [ ] **Step 5: Verify build + commit**

Run: `npm run build`; Expected: no errors.

```bash
git add client/src/components/DataTable.jsx client/src/components/ImageModal.jsx client/src/components/ui/EmptyState.jsx client/src/components/ui/SearchInput.jsx
git commit -m "feat(i18n): translate DataTable, ImageModal, and UI defaults"
```

---

## Task 5: Migrate Observations page + FilterBar

**Files:**
- Modify: `client/src/pages/Observations.jsx`
- Modify: `client/src/components/FilterBar.jsx`

**Interfaces:** Consumes `useLanguage()`. Keys defined in Task 2.

- [ ] **Step 1: Observations**

Modify `client/src/pages/Observations.jsx`:

1. Add import + hook.
2. Replace:
   - `title="Observations"` → `title={t('observations.title')}`
   - `subtitle="Complete safety observation records"` → `subtitle={t('observations.subtitle')}`
   - `Export CSV` (button text) → `{t('common.exportCsv')}`

Leave the CSV export `headers` array and filename as-is (data export, out of scope).

- [ ] **Step 2: FilterBar**

Modify `client/src/components/FilterBar.jsx`:

1. Add import + hook (`const { t } = useLanguage();`).
2. Translate field labels and placeholders, leaving option **values** intact:

| Literal | Replacement |
|---------|-------------|
| `<FilterField label="Status">` | `<FilterField label={t('filter.status')}>` |
| `<option value="">All</option>` (status) | `<option value="">{t('filter.all')}</option>` |
| `<FilterField label="Risk Category">` | `<FilterField label={t('filter.riskCategory')}>` |
| `<option value="">All Categories</option>` | `<option value="">{t('filter.allCategories')}</option>` |
| `<FilterField label="Department">` | `<FilterField label={t('filter.department')}>` |
| `placeholder="e.g. HSE"` | `placeholder={t('filter.deptPlaceholder')}` |
| `<FilterField label="Area">` | `<FilterField label={t('filter.area')}>` |
| `placeholder="e.g. HRSG"` | `placeholder={t('filter.areaPlaceholder')}` |
| `<FilterField label="Keyword">` | `<FilterField label={t('filter.keyword')}>` |
| `placeholder="Search..."` | `placeholder={t('common.search')}` |
| `Reset` | `{t('common.reset')}` |

Leave the `<option value="Open">Open</option>` etc. status values and the risk-category option values unchanged (they are filter values matching DB data).

- [ ] **Step 3: Verify build + commit**

Run: `npm run build`; Expected: no errors.

```bash
git add client/src/pages/Observations.jsx client/src/components/FilterBar.jsx
git commit -m "feat(i18n): translate Observations page and FilterBar"
```

---

## Task 6: Migrate Analytics page

**Files:**
- Modify: `client/src/pages/Analytics.jsx`

**Interfaces:** Consumes `useLanguage()`. Keys defined in Task 2.

- [ ] **Step 1: Migrate strings**

Modify `client/src/pages/Analytics.jsx`:

1. Add import + hook.
2. Replace the module-level `TABS` array so labels use keys (they're rendered via `TabBar` which prints `t.label`). Move `TABS` **inside** the component:

```js
const TABS = [
  { key: 'risk',   label: t('analytics.tab.risk') },
  { key: 'trends', label: t('analytics.tab.trends') },
  { key: 'areas',  label: t('analytics.tab.areas') },
  { key: 'people', label: t('analytics.tab.people') },
];
```

3. Replace remaining literals:

| Literal | Replacement |
|---------|-------------|
| `title="Analytics"` | `title={t('analytics.title')}` |
| `subtitle="Deep-dive into safety data"` | `subtitle={t('analytics.subtitle')}` |
| `区域-隐患热力图` | `{t('analytics.heatmap')}` |
| `Heatmap Analysis (Areas vs Hazards) — click a cell to drill down` | `{t('analytics.heatmapSubtitle')}` |
| `Clear filter` | `{t('analytics.clearFilter')}` |
| `Records: {drillDown.area} — {drillDown.hazard}` | `{t('analytics.records', { area: drillDown.area, hazard: drillDown.hazard })}` |
| `Monthly Observation Trend` | `{t('analytics.monthlyTrend')}` |
| `Week-over-Week Comparison` | `{t('analytics.wow')}` |
| `Weekly data available with date range filter` | `{t('analytics.wowHint')}` |
| `Open vs Closed Trend` | `{t('analytics.openVsClosed')}` |
| `Breakdown available with status filter` | `{t('analytics.breakdownHint')}` |
| `Top 10 Work Areas` | `{t('analytics.topAreas')}` |
| `High-Risk Area Rankings` | `{t('analytics.highRiskAreas')}` |
| `提交人` (section title) | `{t('analytics.submitters')}` |
| `Submitters` (subtitle) | `{t('analytics.submitters')}` |
| `提交人部门` | `{t('analytics.depts')}` |
| `Departments` | `{t('analytics.deptsSub')}` |

- [ ] **Step 2: Verify build + commit**

Run: `npm run build`; Expected: no errors.

```bash
git add client/src/pages/Analytics.jsx
git commit -m "feat(i18n): translate Analytics page"
```

---

## Task 7: Migrate PeopleTeams, WorkAreas, Settings, EmbeddedApp

**Files:**
- Modify: `client/src/pages/PeopleTeams.jsx`
- Modify: `client/src/pages/WorkAreas.jsx`
- Modify: `client/src/pages/Settings.jsx`
- Modify: `client/src/pages/EmbeddedApp.jsx`

**Interfaces:** Consumes `useLanguage()`. Keys defined in Task 2.

- [ ] **Step 1: PeopleTeams**

Modify `client/src/pages/PeopleTeams.jsx`:

1. Add import + hook.
2. Replace:

| Literal | Replacement |
|---------|-------------|
| `title="People & Teams"` | `title={t('peopleTeams.title')}` |
| `subtitle="Department performance and contributor insights"` | `subtitle={t('peopleTeams.subtitle')}` |
| `Department Performance` | `{t('peopleTeams.deptPerf')}` |
| `Close Rate by Department` | `{t('peopleTeams.closeRateByDept')}` |
| `Top Contributors` | `{t('peopleTeams.topContributors')}` |
| `submissions` | `{t('peopleTeams.submissions')}` |
| `No contributor data` | `{t('peopleTeams.noContributors')}` |
| `label: 'Avg Close Time'` | `label: t('peopleTeams.avgCloseTime')` |
| `label: 'Per Person Avg'` | `label: t('peopleTeams.perPersonAvg')` |
| `label: 'Close Rate'` | `label: t('peopleTeams.closeRate')` |
| `label: 'Active Submitters'` | `label: t('peopleTeams.activeSubmitters')` |

Leave the hardcoded demo data (`deptPerf` names, `'3.2 days'`, `'18 obs'`) untouched — they are placeholder sample data, not UI chrome.

- [ ] **Step 2: WorkAreas**

Modify `client/src/pages/WorkAreas.jsx`:

1. Add import + hook.
2. Replace:

| Literal | Replacement |
|---------|-------------|
| `title="Work Areas"` | `title={t('workAreas.title')}` |
| `subtitle="Area-centric safety analysis"` | `subtitle={t('workAreas.subtitle')}` |
| `placeholder="Search work areas..."` | `placeholder={t('workAreas.searchPlaceholder')}` |
| `Area Risk Distribution` | `{t('workAreas.areaRiskDist')}` |
| `High-Risk Work Areas` | `{t('workAreas.highRiskAreas')}` |
| `No data` (in the ternary) | `{t('common.noData')}` |
| `observations` (area card) | `{t('workAreas.observations')}` |
| `` `Observations — ${areaSearch}` `` | `` t('workAreas.observationsArea', { area: areaSearch }) `` |
| `Recent Area Observations` | `{t('workAreas.recent')}` |

- [ ] **Step 3: Settings**

Modify `client/src/pages/Settings.jsx`:

1. Add import + hook.
2. Replace `title="Settings"` → `title={t('settings.title')}`, `subtitle="Platform configuration"` → `subtitle={t('settings.subtitle')}`.
3. Move `SETTING_SECTIONS` inside the component and use `t`:

```js
const SETTING_SECTIONS = [
  { icon: Users,    label: t('settings.userManagement'), desc: t('settings.comingSoon') },
  { icon: MapPin,   label: t('settings.riskCategory'),   desc: t('settings.comingSoon') },
  { icon: MapPin,   label: t('settings.workArea'),       desc: t('settings.comingSoon') },
  { icon: Bell,     label: t('settings.notification'),   desc: t('settings.comingSoon') },
  { icon: Download, label: t('settings.export'),         desc: t('settings.comingSoon') },
  { icon: Palette,  label: t('settings.preferences'),    desc: t('settings.comingSoon') },
];
```

- [ ] **Step 4: EmbeddedApp**

Modify `client/src/pages/EmbeddedApp.jsx`:

1. Add import + hook.
2. Replace `在新标签页打开` → `{t('embedded.openNewTab')}`.

- [ ] **Step 5: Verify build + commit**

Run: `npm run build`; Expected: no errors.

```bash
git add client/src/pages/PeopleTeams.jsx client/src/pages/WorkAreas.jsx client/src/pages/Settings.jsx client/src/pages/EmbeddedApp.jsx
git commit -m "feat(i18n): translate PeopleTeams, WorkAreas, Settings, EmbeddedApp"
```

---

## Task 8: Migrate chart components

**Files:**
- Modify: `client/src/components/charts/AreaChart.jsx`
- Modify: `client/src/components/charts/DeptChart.jsx`
- Modify: `client/src/components/charts/DeptRankingList.jsx`
- Modify: `client/src/components/charts/SubmitterChart.jsx`
- Modify: `client/src/components/charts/SubmitterRankingList.jsx`
- Modify: `client/src/components/charts/TopRiskBars.jsx`
- Modify: `client/src/components/charts/WordCloud.jsx`
- Modify: `client/src/components/charts/MonthlyTrendChart.jsx`
- Modify: `client/src/components/charts/HazardChart.jsx`
- Modify: `client/src/components/charts/HazardList.jsx`
- Modify: `client/src/components/charts/HeatmapChart.jsx`
- Modify: `client/src/components/charts/StatusPie.jsx`

**Interfaces:** Consumes `useLanguage()`. Keys defined in Task 2. **Important:** any component that uses `t` inside an ECharts `option` built with `useMemo` must add `t` to the memo's dependency array so the chart re-renders on language change.

- [ ] **Step 1: "No data" components (simple)**

For `AreaChart.jsx`, `DeptChart.jsx`, `DeptRankingList.jsx`, `SubmitterChart.jsx`, `SubmitterRankingList.jsx`, `TopRiskBars.jsx`, `WordCloud.jsx`:

1. Add import `import { useLanguage } from '../../context/LanguageContext';` and hook `const { t } = useLanguage();`.
2. Replace every `No data` literal with `{t('common.noData')}`.

- [ ] **Step 2: MonthlyTrendChart (summary labels)**

Modify `client/src/components/charts/MonthlyTrendChart.jsx`:

1. Add import + hook.
2. Replace `No data` → `{t('common.noData')}`.
3. Replace `Total ` → `{t('charts.total')} ` (keep trailing space), `Monthly Avg ` → `{t('charts.monthlyAvg')} `, `Peak ` → `{t('charts.peak')} `.

- [ ] **Step 3: HazardChart (series name + tooltip unit)**

Modify `client/src/components/charts/HazardChart.jsx`:

1. Add import + hook.
2. Replace `No data` → `{t('common.noData')}`.
3. Replace `series.name: '隐患分类'` → `series.name: t('charts.hazardSeries')`.
4. In the tooltip `formatter`, replace the line `…${params.value} 项 (${params.percent}%)…` with a version using `t`:
   `return \`…<div>\${params.value} ${t('common.items')} (\${params.percent}%)</div>\`;`
5. Add `t` to the `useMemo(..., [chartData])` dependency array → `[chartData, t]`.

- [ ] **Step 4: StatusPie (legend names + close-rate label + tooltip unit)**

Modify `client/src/components/charts/StatusPie.jsx`:

1. Add import + hook.
2. Replace `No data` → `{t('common.noData')}`.
3. Replace the `pieData` names: `{ name: '已关闭', ... }` → `{ name: t('charts.closed'), ... }`, `{ name: '未关闭', ... }` → `{ name: t('charts.open'), ... }`.
4. In tooltip `formatter`, replace `${p.value} 项` with `${p.value} ${t('common.items')}`.
5. Replace the second `graphic` text `'关闭率'` with `t('charts.closeRate')`.
6. Add `t` to the option's dependency scope (the `option` is a plain object in render body, so no useMemo change needed — but verify it rebuilds each render; it does since it's not memoized).

- [ ] **Step 5: HeatmapChart (unit + high/low)

Modify `client/src/components/charts/HeatmapChart.jsx`:

1. Add import + hook.
2. Replace `No heatmap data` → `{t('charts.noHeatmap')}`.
3. In tooltip `formatter`, replace `${count} 项` with `${count} ${t('common.items')}`.
4. Replace `text: ['高', '低']` → `text: [t('charts.high'), t('charts.low')]`.
5. Add `t` to the `useMemo(..., [areas, hazards, seriesData, maxVal])` dependency array.

- [ ] **Step 6: HazardList (filter tooltip)**

Modify `client/src/components/charts/HazardList.jsx`:

1. Add import + hook in `HazardListItem` (the inner component renders the tooltip).
2. Replace `` title={`点击筛选: ${sub.name}`} `` → `` title={`${t('hazardList.filterBy')}: ${sub.name}`} ``.

- [ ] **Step 7: Verify build + commit**

Run: `npm run build`; Expected: no errors.

```bash
git add client/src/components/charts/
git commit -m "feat(i18n): translate chart legends, units, and empty states"
```

---

## Task 9: Migrate Admin, AdminLogin, ExcelUpload, AIClassifyPanel, AwardsManager, ErrorBoundary

**Files:**
- Modify: `client/src/pages/Admin.jsx`
- Modify: `client/src/components/AdminLogin.jsx`
- Modify: `client/src/components/ExcelUpload.jsx`
- Modify: `client/src/components/AIClassifyPanel.jsx`
- Modify: `client/src/components/AwardsManager.jsx`
- Modify: `client/src/components/ErrorBoundary.jsx`

**Interfaces:** Consumes `useLanguage()`. Keys defined in Task 2. `ErrorBoundary` is a class component — see note below.

- [ ] **Step 1: Admin**

Modify `client/src/pages/Admin.jsx`: add import + hook, replace `Admin Panel` → `{t('admin.panel')}` and `Logout` → `{t('admin.logout')}`.

- [ ] **Step 2: AdminLogin**

Modify `client/src/components/AdminLogin.jsx`: add import + hook, then replace:

| Literal | Replacement |
|---------|-------------|
| `Admin Login` | `{t('login.title')}` |
| `Username` | `{t('login.username')}` |
| `Password` | `{t('login.password')}` |
| `'Login failed'` (fallback in catch) | `t('login.failed')` |
| `'Signing in...'` | `t('login.signingIn')` |
| `'Sign In'` | `t('login.signIn')` |

- [ ] **Step 3: AwardsManager**

Modify `client/src/components/AwardsManager.jsx`: add import + hook, then replace:

| Literal | Replacement |
|---------|-------------|
| `prompt('Team name:')` | `prompt(t('awards.teamName'))` |
| `alert('Saved!')` | `alert(t('awards.saved'))` |
| `'Error: ' + (...)` | `t('awards.errorPrefix') + (...)` |
| `Loading awards...` | `{t('awards.loading')}` |
| `Safety Awards` | `{t('awards.title')}` |
| `+ Add` | `{t('awards.add')}` |
| `'Saving...'` | `t('awards.saving')` |
| `'Save'` | `t('awards.save')` |
| `Team` | `{t('awards.team')}` |
| `Score` | `{t('awards.score')}` |
| `Level` | `{t('awards.level')}` |
| `<option value="gold">Gold</option>` | `<option value="gold">{t('awards.gold')}</option>` |
| `<option value="silver">Silver</option>` | `<option value="silver">{t('awards.silver')}</option>` |
| `<option value="normal">Normal</option>` | `<option value="normal">{t('awards.normal')}</option>` |

- [ ] **Step 4: ExcelUpload**

Modify `client/src/components/ExcelUpload.jsx`: add import + hook, then replace:

| Literal | Replacement |
|---------|-------------|
| `Upload Excel Data` | `{t('upload.title')}` |
| `'Processing...'` | `t('upload.processing')` |
| `'Upload & Sync'` | `t('upload.uploadSync')` |
| `` `Starting upload: ${file.name}` `` | `` t('upload.starting', { name: file.name }) `` |
| `` `Upload failed: ${event.message}` `` | `` t('upload.failed', { msg: event.message }) `` |
| `` `Error: ${err.message}` `` | `` t('upload.error', { msg: err.message }) `` |
| the `done` case's `addLog(\`Complete! ...\`)` | `addLog(t('upload.complete', { inserted, updated, skipped, images: event.imagesDownloaded, errors: event.errors ? t('upload.errorsSuffix', { n: event.errors }) : '' }), 'done')` |

For the progress text fragment `{progress.inserted} new · {progress.updated} updated · {progress.skipped} skipped`, replace with:
```jsx
{t('upload.newN', { n: progress.inserted })}
{progress.updated > 0 && ` · ${t('upload.updatedN', { n: progress.updated })}`}
{progress.skipped > 0 && ` · ${t('upload.skippedN', { n: progress.skipped })}`}
```
and `· ${progress.images} images` → `· ${t('upload.imagesN', { n: progress.images })}`, `· ${progress.errors} errors` → `· ${t('upload.errorsN', { n: progress.errors })}`.

- [ ] **Step 5: AIClassifyPanel**

Modify `client/src/components/AIClassifyPanel.jsx`: add import + hook, then replace the static/constructed client strings (leave `event.message` and server-provided strings untouched):

| Literal | Replacement |
|---------|-------------|
| `AI Classification` | `{t('ai.title')}` |
| `Provider` (label) | `{t('ai.provider')}` |
| `Scope` (label) | `{t('ai.scope')}` |
| `Last 50 Records (Test)` | `{t('ai.scopeLast50')}` |
| `Unanalyzed Records` | `{t('ai.scopeUnanalyzed')}` |
| `"Others" Classification Only` | `{t('ai.scopeOthers')}` |
| `All Records` | `{t('ai.scopeAll')}` |
| `'Start New Run'` | `t('ai.startNew')` |
| `'Start AI Analysis'` | `t('ai.start')` |
| `Pause` | `{t('ai.pause')}` |
| `Resume` | `{t('ai.resume')}` |
| `Cancel` | `{t('ai.cancel')}` |
| `` `${progress.done} / ${progress.total} classified` `` | `` t('ai.classified', { done: progress.done, total: progress.total }) `` |
| `' · ⏸ PAUSED'` | `` ` · ⏸ ${t('ai.paused')}` `` |
| `` ` · ${progress.errors} errors` `` | `` ` · ${t('ai.errorsN', { n: progress.errors })}` `` |
| `Classifying {currentItem.index}/{currentItem.total}` | `{t('ai.classifying', { index: currentItem.index, total: currentItem.total })}` |
| `No description` | `{t('ai.noDescription')}` |
| `` `${event.provider.toUpperCase()} API key 未配置，将使用关键词匹配（低精度）` `` | `` `${event.provider.toUpperCase()} ${t('ai.keyMissing')}` `` |
| `` `Provider: ${event.provider}, Scope: ${event.scope}, Total: ${event.total} records` `` | `` t('ai.providerLine', { p: event.provider, s: event.scope, n: event.total }) `` |
| `` `⏸ Paused at ${event.done}/${event.total}` `` | `` t('ai.pausedAt', { done: event.done, total: event.total }) `` |
| `` `Complete! ${event.done} classified, ${event.skipped} skipped, ${event.errors} errors` `` | `` t('ai.complete', { done: event.done, skipped: event.skipped, errors: event.errors }) `` |
| `` `Fatal error: ${event.message}` `` | `` t('ai.fatal', { msg: event.message }) `` |
| `` `Connection error: ${err.message}` `` | `` t('ai.connError', { msg: err.message }) `` |

- [ ] **Step 6: ErrorBoundary (class component)**

`ErrorBoundary` is a class component and cannot call `useLanguage()`. Add a wrapper function component. Modify `client/src/components/ErrorBoundary.jsx`:

```jsx
import { Component } from 'react';
import { useLanguage } from '../context/LanguageContext';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
          <div className="card max-w-lg w-full text-center">
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--system-red)' }}>
              {this.props.t('errorBoundary.title')}
            </h2>
            <p className="text-sm mb-4 font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
              {this.state.error.message || String(this.state.error)}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="btn-primary"
            >
              {this.props.t('errorBoundary.reload')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundaryWithI18n(props) {
  const { t } = useLanguage();
  return <ErrorBoundary {...props} t={t} />;
}
```

- [ ] **Step 7: Verify build + commit**

Run: `npm run build`; Expected: no errors.

```bash
git add client/src/pages/Admin.jsx client/src/components/AdminLogin.jsx client/src/components/ExcelUpload.jsx client/src/components/AIClassifyPanel.jsx client/src/components/AwardsManager.jsx client/src/components/ErrorBoundary.jsx
git commit -m "feat(i18n): translate Admin panel, upload, AI, awards, and error boundary"
```

---

## Task 10: Final sweep + verification

**Files:** none (verification only)

- [ ] **Step 1: Grep for leftover hardcoded CJK/English UI strings**

Run (from `client/`):
```bash
node -e '
const fs=require("fs"),path=require("path");
const files=[];(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){if(e.name==="node_modules"||e.name==="dist")continue;w(p);}else if(/\.(jsx?)$/.test(e.name)&&!p.endsWith(".test.js"))files.push(p);}})("src");
const cjk=/[一-鿿]/;
const bad=[];
for(const f of files){const lines=fs.readFileSync(f,"utf8").split("\n");lines.forEach((ln,i)=>{if(cjk.test(ln)&&!/i18n\/(en|zh)\.js/.test(f))bad.push(`${f}:${i+1}: ${ln.trim()}`);});}
if(bad.length){console.log("REMAINING CJK IN NON-DICT FILES:");bad.forEach(b=>console.log("  "+b));process.exit(1);}else{console.log("OK: no CJK literals outside i18n dictionaries");}
'
```
Expected: `OK` (the only remaining CJK outside dictionaries is the language endonym `中文` in the Sidebar toggle — if the grep flags it, verify it is the intentional endonym and whitelist it).

- [ ] **Step 2: Run tests + build**

Run: `npm test` and `npm run build` (in `client/`)
Expected: all tests pass; build succeeds.

- [ ] **Step 3: Manual verification checklist (`npm run dev`)**

- Toggle 中文/EN flips every page and section instantly (Overview, Observations, Analytics, Work Areas, People & Teams, Settings, Admin).
- Reload preserves the chosen language.
- Clearing localStorage + `zh` browser locale → Chinese default; non-Chinese locale → English default.
- Dynamic values (counts, %, dates, pagination "Page x of y") render correctly in both languages.
- Missing-key fallback never blanks a label or crashes.

- [ ] **Step 4: Commit any fixes**

If the sweep or manual check surfaced anything, fix and commit:
```bash
git add -A
git commit -m "fix(i18n): resolve remaining hardcoded strings found in final sweep"
```
