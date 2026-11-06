import { Tabs, useRouter } from 'expo-router';
import {
  Activity,
  Bell,
  ChartLine,
  Footprints,
  House,
  Plus,
  Scale,
  Target,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState, type ComponentProps } from 'react';
import { Keyboard, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './kit';
import { useTheme } from './ThemeProvider';
import { font, radius } from './tokens';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];



const TABS: {
  name: string;
  label: string;
  Icon: LucideIcon;
  href: '/' | '/foods' | '/progress' | '/reminders';
}[] = [
  { name: 'index', label: 'Today', Icon: House, href: '/' },
  { name: 'foods', label: 'Foods', Icon: Target, href: '/foods' },
  { name: 'progress', label: 'Progress', Icon: ChartLine, href: '/progress' },
  { name: 'reminders', label: 'Reminders', Icon: Bell, href: '/reminders' },
];

const ACTIONS: {
  key: string;
  title: string;
  sub: string;
  Icon: LucideIcon;
  href: '/foods' | '/activity' | '/steps' | '/progress';
}[] = [
  { key: 'food', title: 'Log food', sub: 'Pick from your foods or quick add', Icon: Utensils, href: '/foods' },
  { key: 'activity', title: 'Log activity', sub: 'Football, gym, treadmill', Icon: Activity, href: '/activity' },
  { key: 'steps', title: 'Update steps', sub: "Type your watch's count", Icon: Footprints, href: '/steps' },
  { key: 'weight', title: 'Log weight', sub: 'Add a weigh-in', Icon: Scale, href: '/progress' },
];

const TOP = 28; // how far the + button rises above the bar
const ROW = 52;
const FAB = 60;

export function TabBar({ state }: BottomTabBarProps) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const bottom = Math.max(insets.bottom, 8);
  const focusedName = state.routes[state.index]?.name;

    function press(tab: (typeof TABS)[number]) {
    if (focusedName !== tab.name) router.navigate(tab.href);
  }

  function go(href: (typeof ACTIONS)[number]['href']) {
    setOpen(false);
    router.push(href);
  }

  const renderItem = (tab: (typeof TABS)[number]) => {
    const focused = focusedName === tab.name;
    const color = focused ? t.accent : t.muted;
    return (
      <Pressable
        key={tab.name}
        onPress={() => press(tab)}
        accessibilityRole="button"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: focused }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
      >
        <tab.Icon size={24} color={color} strokeWidth={focused ? 2.4 : 2} />
        <Text style={{ fontFamily: focused ? font.bold : font.semibold, fontSize: 12, color }}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  if (keyboardOpen && !open) return null;

  return (
    <>
      <View style={{ height: TOP + 8 + ROW + bottom }}>
        <View
          style={{
            position: 'absolute',
            top: TOP,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: t.bg,
            borderTopWidth: 1,
            borderTopColor: t.border,
          }}
        />
        <View
          style={{ position: 'absolute', top: TOP + 8, left: 0, right: 0, bottom, flexDirection: 'row' }}
        >
          {TABS.slice(0, 2).map(renderItem)}
          <View style={{ width: 76 }} />
          {TABS.slice(2).map(renderItem)}
        </View>

        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add"
          style={({ pressed }) => ({
            position: 'absolute',
            top: 0,
            left: '50%',
            marginLeft: -FAB / 2,
            width: FAB,
            height: FAB,
            borderRadius: radius.fab,
            backgroundColor: t.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: t.primary,
            shadowOpacity: 0.35,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Plus size={30} color={t.onPrimary} strokeWidth={2.5} />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: t.overlay, justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              backgroundColor: t.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 16 + insets.bottom,
              gap: 4,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: t.border,
                marginBottom: 10,
              }}
            />
            <AppText variant="h2" style={{ paddingHorizontal: 8, paddingBottom: 6 }}>
              Add
            </AppText>
            {ACTIONS.map((a) => {
              const Icon = a.Icon;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => go(a.href)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 10,
                    borderRadius: radius.field,
                    backgroundColor: pressed ? t.tint : 'transparent',
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.icon,
                      backgroundColor: t.tint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} color={t.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong">{a.title}</AppText>
                    <AppText variant="caption" tone="muted">
                      {a.sub}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}