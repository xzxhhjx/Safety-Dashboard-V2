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
