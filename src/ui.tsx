import React from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius } from './theme';

export const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 56;

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    kind === 'primary' ? colors.primary : kind === 'danger' ? colors.dangerBg : colors.infoBg;
  const fg = kind === 'primary' ? '#fff' : kind === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
    >
      <Text style={[s.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'danger' | 'info' }) {
  const map = {
    ok: [colors.okBg, colors.ok],
    warn: [colors.warnBg, colors.warn],
    danger: [colors.dangerBg, colors.danger],
    info: [colors.infoBg, colors.primary],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <View style={s.track}>
      <View
        style={[
          s.fill,
          { width: `${pct}%`, backgroundColor: pct === 100 ? colors.ok : colors.primary },
        ]}
      />
    </View>
  );
}

export const card: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radius,
  padding: 16,
  borderWidth: 1,
  borderColor: colors.line,
};

const s = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
