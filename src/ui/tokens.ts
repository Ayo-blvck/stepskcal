import type { TextStyle } from 'react-native';

export type Mode = 'light' | 'dark';

export interface Palette {
  mode: Mode;
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  primary: string; // fills: buttons, FAB, toggles
  onPrimary: string;
  accent: string; // green as text, active icons and bars
  tint: string; // soft green fill (dashed box, + buttons)
  ink: string; // selected "ink" pill
  onInk: string;
  heroFrom: string;
  heroTo: string;
  heroPanel: string;
  heroTrack: string;
  onHero: string;
  onHeroMuted: string;
  lime: string; // steps
  amber: string; // kcal and over budget
  danger: string;
  chartLine: string;
  chartPlan: string;
  overlay: string;
}

export const light: Palette = {
  mode: 'light',
  bg: '#F6F5F0',
  card: '#FFFFFF',
  border: '#E4E2DA',
  text: '#10241C',
  muted: '#5C6B63',
  primary: '#1B7F4B',
  onPrimary: '#FFFFFF',
  accent: '#1B7F4B',
  tint: '#E6F2EB',
  ink: '#10241C',
  onInk: '#FFFFFF',
  heroFrom: '#17694A',
  heroTo: '#0C3326',
  heroPanel: 'rgba(255,255,255,0.12)',
  heroTrack: 'rgba(255,255,255,0.14)',
  onHero: '#FFFFFF',
  onHeroMuted: '#CFE3D8',
  lime: '#CDEB6B',
  amber: '#F2A33A',
  danger: '#C0392B',
  chartLine: '#1B5FAA',
  chartPlan: '#9A9A92',
  overlay: 'rgba(0,0,0,0.45)',
};

export const dark: Palette = {
  mode: 'dark',
  bg: '#0B1713',
  card: '#14241D',
  border: '#25372F',
  text: '#EAF2ED',
  muted: '#9DB3A8',
  primary: '#1B7F4B',
  onPrimary: '#FFFFFF',
  accent: '#4CC285',
  tint: '#1A3228',
  ink: '#EAF2ED',
  onInk: '#0B1713',
  heroFrom: '#17694A',
  heroTo: '#0C3326',
  heroPanel: 'rgba(255,255,255,0.12)',
  heroTrack: 'rgba(255,255,255,0.14)',
  onHero: '#FFFFFF',
  onHeroMuted: '#CFE3D8',
  lime: '#CDEB6B',
  amber: '#F2A33A',
  danger: '#E5685A',
  chartLine: '#6AA6E8',
  chartPlan: '#6F7F76',
  overlay: 'rgba(0,0,0,0.6)',
};

export const radius = { card: 20, hero: 28, field: 16, button: 18, icon: 16, fab: 20, pill: 999 } as const;

export const font = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const typography = {
  title: { fontFamily: font.extrabold, fontSize: 30, lineHeight: 36 },
  numberLg: { fontFamily: font.extrabold, fontSize: 34, lineHeight: 40 },
  number: { fontFamily: font.extrabold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
  label: { fontFamily: font.bold, fontSize: 14, lineHeight: 20 },
  body: { fontFamily: font.medium, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: font.medium, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: font.medium, fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;