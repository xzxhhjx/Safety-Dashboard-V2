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
