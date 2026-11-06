import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from './ThemeProvider';
import { font, radius, typography } from './tokens';

// ---------- text ----------

export type TextVariant = keyof typeof typography;
export type TextTone = 'default' | 'muted' | 'accent' | 'onPrimary' | 'onHero' | 'onHeroMuted' | 'danger';

export function AppText({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: TextTone }) {
  const t = useTheme();
  const color: Record<TextTone, string> = {
    default: t.text,
    muted: t.muted,
    accent: t.accent,
    onPrimary: t.onPrimary,
    onHero: t.onHero,
    onHeroMuted: t.onHeroMuted,
    danger: t.danger,
  };
  return <Text {...rest} style={[typography[variant], { color: color[tone] }, style]} />;
}

// ---------- surfaces ----------

export function Card(props: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.card,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 16,
  };
  if (props.onPress) {
    return (
      <Pressable
        onPress={props.onPress}
        style={({ pressed }) => [base, props.style, pressed ? { opacity: 0.85 } : null]}
      >
        {props.children}
      </Pressable>
    );
  }
  return <View style={[base, props.style]}>{props.children}</View>;
}

export function HeroCard(props: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <LinearGradient
      colors={[t.heroFrom, t.heroTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[{ borderRadius: radius.hero, padding: 20 }, props.style]}
    >
      {props.children}
    </LinearGradient>
  );
}

// ---------- buttons ----------

export type ButtonVariant = 'primary' | 'secondary' | 'dashed' | 'ghost' | 'danger';

export function Button(props: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  pill?: boolean;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const variant = props.variant ?? 'primary';
  const small = props.size === 'sm';
  const v = {
    primary: { bg: t.primary, fg: t.onPrimary, border: t.primary },
    secondary: { bg: t.card, fg: t.text, border: t.border },
    dashed: { bg: t.tint, fg: t.accent, border: t.accent },
    ghost: { bg: 'transparent', fg: t.accent, border: 'transparent' },
    danger: { bg: t.card, fg: t.danger, border: t.danger },
  }[variant];
  const Icon = props.icon;

  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          minHeight: small ? 40 : 52,
          borderRadius: props.pill ? radius.pill : radius.button,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: v.bg,
          borderWidth: 1,
          borderColor: v.border,
          borderStyle: variant === 'dashed' ? 'dashed' : 'solid',
          opacity: props.disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        props.style,
      ]}
    >
      {Icon ? <Icon size={18} color={v.fg} /> : null}
      <Text style={{ fontFamily: font.bold, fontSize: small ? 14 : 16, color: v.fg }}>
        {props.title}
      </Text>
    </Pressable>
  );
}

export function IconButton(props: { icon: LucideIcon; onPress: () => void; label: string }) {
  const t = useTheme();
  const Icon = props.icon;
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.icon,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: t.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon size={20} color={t.text} />
    </Pressable>
  );
}

// ---------- chips and controls ----------

export function Chip(props: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'ink' | 'green';
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const on = props.selected === true;
  const fill = props.tone === 'green' ? t.primary : t.ink;
  const fg = props.tone === 'green' ? t.onPrimary : t.onInk;
  return (
    <Pressable
      onPress={props.onPress}
      style={[
        {
          minHeight: 40,
          minWidth: 48,
          paddingHorizontal: 16,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: on ? fill : t.card,
          borderWidth: 1,
          borderColor: on ? fill : t.border,
        },
        props.style,
      ]}
    >
      <Text style={{ fontFamily: on ? font.bold : font.semibold, fontSize: 15, color: on ? fg : t.text }}>
        {props.label}
      </Text>
    </Pressable>
  );
}

export function Toggle(props: { value: boolean; onValueChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Switch
      value={props.value}
      onValueChange={props.onValueChange}
      trackColor={{ false: t.border, true: t.primary }}
      thumbColor="#FFFFFF"
    />
  );
}

// ---------- progress ----------

export function ProgressBar(props: { value: number; color?: string; height?: number }) {
  const t = useTheme();
  const height = props.height ?? 10;
  const v = Math.max(0, Math.min(1, props.value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: t.border, overflow: 'hidden' }}>
      <View
        style={{
          width: `${v * 100}%`,
          minWidth: v > 0 ? height : 0,
          height,
          borderRadius: height / 2,
          backgroundColor: props.color ?? t.accent,
        }}
      />
    </View>
  );
}

export function Ring(props: {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  track?: string;
}) {
  const t = useTheme();
  const r = (props.size - props.stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = props.size / 2;
  const p = Math.max(0, Math.min(1, props.progress));
  return (
    <Svg width={props.size} height={props.size}>
      <Circle
        cx={mid}
        cy={mid}
        r={r}
        stroke={props.track ?? t.heroTrack}
        strokeWidth={props.stroke}
        fill="none"
      />
      {p > 0 ? (
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={props.color}
          strokeWidth={props.stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      ) : null}
    </Svg>
  );
}

/** A ring with the main number and label inside, and a small line underneath. Built for the hero card. */
export function RingStat(props: {
  value: string;
  label: string;
  sub?: string;
  progress: number;
  color: string;
  size?: number;
}) {
  const size = props.size ?? 120;
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute' }}>
          <Ring size={size} stroke={Math.round(size * 0.1)} progress={props.progress} color={props.color} />
        </View>
        <AppText
          variant="number"
          tone="onHero"
          maxFontSizeMultiplier={1.15}
          style={{ fontSize: Math.round(size * 0.19), lineHeight: Math.round(size * 0.24) }}
        >
          {props.value}
        </AppText>
        <AppText variant="caption" tone="onHeroMuted" maxFontSizeMultiplier={1.15}>
          {props.label}
        </AppText>
      </View>
      {props.sub ? (
        <AppText variant="small" tone="onHeroMuted" maxFontSizeMultiplier={1.15}>
          {props.sub}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------- lists ----------

export function ListRow(props: {
  title: string;
  subtitle?: string;
  right?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const t = useTheme();
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: props.last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="body">{props.title}</AppText>
        {props.subtitle ? (
          <AppText variant="caption" tone="muted">
            {props.subtitle}
          </AppText>
        ) : null}
      </View>
      {props.right ? <AppText variant="bodyStrong">{props.right}</AppText> : null}
    </View>
  );
  return props.onPress ? <Pressable onPress={props.onPress}>{body}</Pressable> : body;
}

export function Snackbar(props: { message: string; actionLabel?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: t.ink,
          borderRadius: radius.field,
          paddingVertical: 12,
          paddingLeft: 16,
          paddingRight: 8,
        }}
      >
        <Text style={{ flex: 1, fontFamily: font.semibold, fontSize: 14, color: t.onInk }}>
          {props.message}
        </Text>
        {props.actionLabel ? (
          <Pressable onPress={props.onAction} hitSlop={8} style={{ padding: 8 }}>
            <Text
              style={{
                fontFamily: font.bold,
                fontSize: 14,
                color: t.mode === 'dark' ? '#14683F' : t.lime,
              }}
            >
              {props.actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ScreenHeader(props: { title: string; onBack: () => void }) {
  return (
    <View style={{ gap: 14 }}>
      <IconButton icon={ChevronLeft} label="Back" onPress={props.onBack} />
      <AppText variant="title">{props.title}</AppText>
    </View>
  );
}