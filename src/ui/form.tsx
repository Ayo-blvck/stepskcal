import { Pressable, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { AppText, Button } from './kit';
import { useTheme } from './ThemeProvider';
import { font, radius } from './tokens';

export function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label">{props.label}</AppText>
      <TextInput 
        maxFontSizeMultiplier={1.4}
        style={{
          borderWidth: 1,
          borderColor: props.error ? t.danger : t.border,
          borderRadius: radius.field,
          backgroundColor: t.card,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: font.medium,
          fontSize: 16,
          color: t.text,
        }}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={t.muted}
        keyboardType={props.keyboardType}
        maxLength={props.maxLength}
        autoCorrect={false}
      />
      {props.error ? (
        <AppText variant="caption" tone="danger">
          {props.error}
        </AppText>
      ) : props.hint ? (
        <AppText variant="caption" tone="muted">
          {props.hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function Segmented<T extends string>(props: {
  label?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  error?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {props.label ? <AppText variant="label">{props.label}</AppText> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {props.options.map((o) => {
          const on = o.value === props.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => props.onChange(o.value)}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.pill,
                backgroundColor: on ? t.ink : t.card,
                borderWidth: 1,
                borderColor: on ? t.ink : t.border,
              }}
            >
              <AppText
                variant="bodyStrong"
                style={{ color: on ? t.onInk : t.text, fontFamily: on ? font.bold : font.semibold }}
              >
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {props.error ? (
        <AppText variant="caption" tone="danger">
          {props.error}
        </AppText>
      ) : null}
    </View>
  );
}

export function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Button title={props.title} onPress={props.onPress} disabled={props.disabled} />;
}

export function SecondaryButton(props: { title: string; onPress: () => void; danger?: boolean }) {
  return (
    <Button
      title={props.title}
      onPress={props.onPress}
      variant={props.danger ? 'danger' : 'secondary'}
    />
  );
}