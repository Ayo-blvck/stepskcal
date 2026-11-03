import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors } from './theme';

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
  return (
    <View style={s.field}>
      <Text style={s.label}>{props.label}</Text>
      <TextInput
        style={[s.input, props.error ? s.inputError : null]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#999999"
        keyboardType={props.keyboardType}
        maxLength={props.maxLength}
        autoCorrect={false}
      />
      {props.error ? (
        <Text style={s.error}>{props.error}</Text>
      ) : props.hint ? (
        <Text style={s.hint}>{props.hint}</Text>
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
  return (
    <View style={s.field}>
      {props.label ? <Text style={s.label}>{props.label}</Text> : null}
      <View style={s.segRow}>
        {props.options.map((o) => {
          const active = o.value === props.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => props.onChange(o.value)}
              style={[s.seg, active ? s.segActive : null]}
            >
              <Text style={[s.segText, active ? s.segTextActive : null]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {props.error ? <Text style={s.error}>{props.error}</Text> : null}
    </View>
  );
}

export function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[s.button, props.disabled ? s.buttonDisabled : null]}
    >
      <Text style={s.buttonText}>{props.title}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: 12, color: colors.danger },
  hint: { fontSize: 12, color: colors.muted },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  segActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontSize: 15, color: colors.text },
  segTextActive: { color: '#FFFFFF', fontWeight: '600' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});