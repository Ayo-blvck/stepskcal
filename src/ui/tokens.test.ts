import { describe, expect, it } from 'vitest';
import { dark, light, type Palette } from './tokens';

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes: [string, Palette][] = [
  ['light', light],
  ['dark', dark],
];

describe.each(themes)('%s palette', (_name, p) => {
  it('keeps body text readable', () => {
    expect(contrast(p.text, p.bg)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.text, p.card)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.muted, p.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.accent, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.accent, p.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.danger, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.danger, p.card)).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps button and pill labels readable', () => {
    expect(contrast(p.onPrimary, p.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.onInk, p.ink)).toBeGreaterThanOrEqual(7);
  });
  it('keeps the hero card readable', () => {
    expect(contrast(p.onHero, p.heroFrom)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.onHeroMuted, p.heroFrom)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.lime, p.heroFrom)).toBeGreaterThanOrEqual(3);
    expect(contrast(p.amber, p.heroFrom)).toBeGreaterThanOrEqual(3);
  });
  it('keeps the weight line visible on cards', () => {
    expect(contrast(p.chartLine, p.card)).toBeGreaterThanOrEqual(3);
  });
});