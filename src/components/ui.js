import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { colors, radius, STATUS } from '../lib/theme';
import { errMsg } from '../lib/api';

/* ---------- layout ---------- */
export function Screen({ children, scroll = true, onRefresh, refreshing, style, padded = true, edges = ['top'] }) {
  const content = padded ? { padding: 16, paddingBottom: 32 } : { paddingBottom: 32 };
  return (
    <SafeAreaView style={[s.screen, style]} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={content}
            keyboardShouldPersistTaps="handled"
            refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.blue} /> : undefined}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function TopBar({ title, right, back = true }) {
  return (
    <View style={s.topbar}>
      {back ? (
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12} style={s.topbarBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
      ) : <View style={s.topbarBtn} />}
      <Text style={s.topbarTitle} numberOfLines={1}>{title}</Text>
      <View style={s.topbarBtn}>{right}</View>
    </View>
  );
}

export const H1 = ({ children, style }) => <Text style={[s.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }) => <Text style={[s.h2, style]}>{children}</Text>;
export const Muted = ({ children, style, numberOfLines, onPress }) => <Text numberOfLines={numberOfLines} onPress={onPress} suppressHighlighting={false} style={[s.muted, style]}>{children}</Text>;
export const Body = ({ children, style, numberOfLines, onPress }) => <Text numberOfLines={numberOfLines} onPress={onPress} style={[s.body, style]}>{children}</Text>;

export const Card = ({ children, style, onPress }) =>
  onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85 }]}>{children}</Pressable>
  ) : (
    <View style={[s.card, style]}>{children}</View>
  );

export const Row = ({ children, style }) => <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;

/* ---------- inputs ---------- */
export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }) {
  const bg = { primary: colors.blue, success: colors.green, danger: colors.danger, ghost: colors.white, amber: colors.amber }[variant];
  const fg = variant === 'ghost' ? colors.navy : colors.white;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: off ? 0.55 : pressed ? 0.85 : 1 }, variant === 'ghost' && { borderWidth: 1, borderColor: colors.border }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <Row style={{ gap: 8 }}>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={[s.btnText, { color: fg }]}>{title}</Text>
        </Row>
      )}
    </Pressable>
  );
}

export function Field({ label, icon, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.inputWrap, props.multiline && { alignItems: 'flex-start' }, error && { borderColor: colors.danger }]}>
        {icon && <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: 8, marginTop: props.multiline ? 12 : 0 }} />}
        <TextInput placeholderTextColor="#9AA7B8" style={[s.input, props.multiline && { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]} {...props} />
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

export const Toggle = ({ value, onValueChange }) => (
  <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.green, false: '#CBD5E1' }} thumbColor="#fff" />
);

export function Check({ checked, onPress, label, right }) {
  return (
    <Pressable onPress={onPress} style={s.check}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={24} color={checked ? colors.blue : '#A0AEC0'} />
      <Text style={[s.body, { flex: 1, marginLeft: 10 }]}>{label}</Text>
      {right}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: colors.blue, borderColor: colors.blue }]}>
      <Text style={{ color: active ? '#fff' : colors.navy, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={s.segment}>
      {options.map((o) => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.segItem, value === o.value && { backgroundColor: colors.blue }]}>
          <Text style={{ color: value === o.value ? '#fff' : colors.muted, fontWeight: '700', fontSize: 13 }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- display ---------- */
export function StatusBadge({ status, label, color }) {
  const m = STATUS[status] || {};
  const c = color || m.color || colors.muted;
  return (
    <View style={[s.badge, { backgroundColor: c + '22' }]}>
      <Text style={{ color: c, fontSize: 12, fontWeight: '700' }}>{label || m.label || status}</Text>
    </View>
  );
}

export function Avatar({ user, size = 48, uri }) {
  const src = uri || user?.avatar?.url;
  if (src) return <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }} />;
  const initials = (user?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export const Stars = ({ value = 0, size = 14, onChange }) => (
  <Row>
    {[1, 2, 3, 4, 5].map((i) => (
      <Pressable key={i} disabled={!onChange} onPress={() => onChange?.(i)} hitSlop={4}>
        <Ionicons name={i <= Math.round(value) ? 'star' : 'star-outline'} size={size} color={colors.amber} />
      </Pressable>
    ))}
  </Row>
);

export const Verified = () => <Ionicons name="checkmark-circle" size={16} color={colors.green} />;
export const Divider = () => <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />;

export function Loading() {
  return <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={colors.blue} /></View>;
}
export function Empty({ icon = 'file-tray-outline', text }) {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <Ionicons name={icon} size={44} color="#B8C2D1" />
      <Text style={[s.muted, { marginTop: 10, textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}
export const ErrorText = ({ children }) => (children ? <Text style={[s.error, { marginVertical: 8, fontSize: 14 }]}>{children}</Text> : null);

export function MenuItem({ icon, label, onPress, danger, badge }) {
  return (
    <Pressable onPress={onPress} style={s.menuItem}>
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.navy} />
      <Text style={[s.body, { flex: 1, marginLeft: 14 }, danger && { color: colors.danger }]}>{label}</Text>
      {badge ? <View style={s.dot}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{badge}</Text></View> : null}
      {!danger && <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />}
    </Pressable>
  );
}

/* ---------- data hook: refetches on focus, supports pull to refresh ---------- */
export function useApi(fn, deps = [], { poll } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: '', refreshing: false });
  const run = useCallback(async (mode) => {
    setState((p) => ({ ...p, loading: mode === 'initial' && !p.data, refreshing: mode === 'pull', error: '' }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: '', refreshing: false });
    } catch (e) {
      setState((p) => ({ ...p, loading: false, refreshing: false, error: errMsg(e) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useFocusEffect(useCallback(() => {
    run('initial');
    if (!poll) return undefined;
    const t = setInterval(() => run('poll'), poll);
    return () => clearInterval(t);
  }, [run, poll]));
  return { ...state, reload: () => run('initial'), pull: () => run('pull') };
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cloud },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 52, backgroundColor: colors.cloud },
  topbarBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.navy },
  h1: { fontSize: 26, fontWeight: '800', color: colors.navy },
  h2: { fontSize: 18, fontWeight: '700', color: colors.navy, marginBottom: 10 },
  muted: { color: colors.muted, fontSize: 13 },
  body: { color: colors.text, fontSize: 15 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  btn: { minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12 },
  input: { flex: 1, minHeight: 48, fontSize: 15, color: colors.text },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  check: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, marginRight: 8 },
  segment: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { backgroundColor: colors.danger, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8, paddingHorizontal: 5 },
});
