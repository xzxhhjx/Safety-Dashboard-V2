// Node 21+ exposes a read-only global `navigator` (getter, no setter), and on
// this machine its locale is `zh-CN`. The i18n `detectLang` tests assume the
// browser-style behavior the code targets: no navigator, or an assignable one.
// Replace it with a writable data property so tests can stub navigator.language.
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: {},
});
