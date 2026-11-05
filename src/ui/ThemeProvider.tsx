import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { getKv, setKv } from '../db/repo';
import { dark, light, type Mode, type Palette } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

// Stays 'light' until every screen is redesigned (R9), then becomes 'system'.
const DEFAULT_PREFERENCE: ThemePreference = 'light';

interface ThemeValue {
  theme: Palette;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const Ctx = createContext<ThemeValue>({
  theme: light,
  preference: DEFAULT_PREFERENCE,
  setPreference: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>(DEFAULT_PREFERENCE);

  useEffect(() => {
    getKv('theme').then((v) => {
      if (v === 'system' || v === 'light' || v === 'dark') setPref(v);
    });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    setKv('theme', p).catch(() => undefined);
  }, []);

  const mode: Mode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(
    () => ({ theme: mode === 'dark' ? dark : light, preference, setPreference }),
    [mode, preference, setPreference],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Renders children in a fixed theme without touching the saved preference. */
export function ThemeOverride({ mode, children }: { mode: Mode; children: ReactNode }) {
  const outer = useContext(Ctx);
  const value = useMemo(
    () => ({ ...outer, theme: mode === 'dark' ? dark : light }),
    [outer, mode],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = (): Palette => useContext(Ctx).theme;

export function useThemePreference() {
  const { preference, setPreference } = useContext(Ctx);
  return { preference, setPreference };
}