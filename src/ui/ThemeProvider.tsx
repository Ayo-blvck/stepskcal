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
import { LoadingScreen } from './LoadingScreen';
import { dark, light, type Mode, type Palette } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

const DEFAULT_PREFERENCE: ThemePreference = 'system';

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getKv('theme')
      .then((v) => {
        if (v === 'system' || v === 'light' || v === 'dark') setPref(v);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
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

  if (!loaded) return <LoadingScreen />;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = (): Palette => useContext(Ctx).theme;

export function useThemePreference() {
  const { preference, setPreference } = useContext(Ctx);
  return { preference, setPreference };
}