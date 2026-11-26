import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { colors, radius, STATUS } from '../lib/theme';
import { errMsg } from '../lib/api';

/* ------------------------------------------------------------------ */
/*  Design tokens (theme me jo nahi hai uska fallback)                 */
/* ------------------------------------------------------------------ */
const SOFT_BLUE = '#E8F0FF';
const SOFT_RED = '#FDECEC';
const SOFT_GREEN = '#E6F6EC';
const INPUT_BG = '#F7FAFF';
const PLACEHOLDER = '#8A97AB';

const shadow = (opacity = 0.08, radiusPx = 8, y = 3, elevation = 3) => ({
  shadowColor: '#1B2B4B',
  shadowOpacity: opacity,
  shadowRadius: radiusPx,
  shadowOffset: { width: 0, height: y },
  elevation,
});

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */
export function Screen({
  children,
  scroll = true,
  onRefresh,
  refreshing,
  style,
  padded = true,
  edges = ['top'],
}) {
  const content = padded ? { padding: 16, paddingBottom: 40 } : { paddingBottom: 40 };
  return (
    <SafeAreaView style={[s.screen, style]} edges={edges}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.blue}
                  colors={[colors.blue]}
                />
              ) : undefined
            }
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

export function TopBar({ title, subtitle, right, back = true }) {
  return (
    <View style={s.topbar}>
      {back ? (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [s.topbarBack, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
      ) : (
        <View style={s.topbarSlot} />
      )}

      <View style={s.topbarCenter}>
        <Text style={s.topbarTitle} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={s.topbarSub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={s.topbarSlot}>{right}</View>
    </View>
  );
}

export const H1 = ({ children, style }) => <Text style={[s.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }) => <Text style={[s.h2, style]}>{children}</Text>;

export const Muted = ({ children, style, numberOfLines, onPress }) => (
  <Text
    numberOfLines={numberOfLines}
    onPress={onPress}
    suppressHighlighting={false}
    style={[s.muted, style]}
  >
    {children}
  </Text>
);

export const Body = ({ children, style, numberOfLines, onPress }) => (
  <Text numberOfLines={numberOfLines} onPress={onPress} style={[s.body, style]}>
    {children}
  </Text>
);

// Section heading: title left, optional action (e.g. "See all") right
export function SectionHeader({ title, action, onAction, style }) {
  return (
    <View style={[s.sectionHeader, style]}>
      <Text style={s.sectionTitle}>{title}</Text>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={s.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export const Card = ({ children, style, onPress }) =>
  onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.card, style, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
    >
      {children}
    </Pressable>
  ) : (
    <View style={[s.card, style]}>{children}</View>
  );

export const Row = ({ children, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>
);

/* ------------------------------------------------------------------ */
/*  Inputs                                                             */
/* ------------------------------------------------------------------ */
const VARIANTS = {
  primary: { bg: colors.blue, fg: colors.white, glow: colors.blue },
  success: { bg: colors.green, fg: colors.white, glow: colors.green },
  danger: { bg: colors.danger, fg: colors.white, glow: colors.danger },
  amber: { bg: colors.amber, fg: colors.white, glow: colors.amber },
  soft: { bg: SOFT_BLUE, fg: colors.blue },
  ghost: { bg: colors.white, fg: colors.navy, border: colors.border },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md', // 'md' | 'sm'
  loading,
  disabled,
  icon,
  style,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;
  const small = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSm,
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1, borderColor: v.border },
        v.glow && !off && !small && { ...shadow(0.3, 10, 5, 5), shadowColor: v.glow },
        { opacity: off ? 0.55 : pressed ? 0.88 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Row style={{ gap: 8 }}>
          {!!icon && <Ionicons name={icon} size={small ? 16 : 19} color={v.fg} />}
          <Text style={[s.btnText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
        </Row>
      )}
    </Pressable>
  );
}

export function Field({ label, icon, error, hint, right, style, onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);
  const isPassword = !!props.secureTextEntry;
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}

      <View
        style={[
          s.inputWrap,
          props.multiline && { alignItems: 'flex-start' },
          focused && s.inputFocused,
          !!error && s.inputError,
        ]}
      >
        {!!icon && (
          <Ionicons
            name={icon}
            size={19}
            color={error ? colors.danger : focused ? colors.blue : colors.muted}
            style={{ marginRight: 10, marginTop: props.multiline ? 14 : 0 }}
          />
        )}

        <TextInput
          placeholderTextColor={PLACEHOLDER}
          selectionColor={colors.blue}
          style={[
            s.input,
            props.multiline && { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
          ]}
          {...props}
          secureTextEntry={isPassword ? hidden : false}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />

        {isPassword ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        ) : (
          right || null
        )}
      </View>

      {error ? (
        <Row style={{ marginTop: 5, gap: 4 }}>
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <Text style={s.error}>{error}</Text>
        </Row>
      ) : hint ? (
        <Text style={s.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export const Toggle = ({ value, onValueChange }) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    trackColor={{ true: colors.green, false: '#CBD5E1' }}
    thumbColor="#fff"
    ios_backgroundColor="#CBD5E1"
  />
);

export function Check({ checked, onPress, label, right }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked }}
      style={s.check}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={24}
        color={checked ? colors.blue : '#A0AEC0'}
      />
      <Text style={[s.body, { flex: 1, marginLeft: 10 }]}>{label}</Text>
      {right}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        active && { backgroundColor: colors.blue, borderColor: colors.blue, ...shadow(0.2, 6, 2, 2) },
      ]}
    >
      <Row style={{ gap: 6 }}>
        {!!icon && <Ionicons name={icon} size={14} color={active ? '#fff' : colors.navy} />}
        <Text style={{ color: active ? '#fff' : colors.navy, fontWeight: '700', fontSize: 13 }}>
          {label}
        </Text>
      </Row>
    </Pressable>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={s.segment}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[s.segItem, active && { backgroundColor: colors.blue, ...shadow(0.25, 6, 2, 2) }]}
          >
            <Text
              style={{
                color: active ? '#fff' : colors.muted,
                fontWeight: '700',
                fontSize: 13.5,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Display                                                            */
/* ------------------------------------------------------------------ */
export function StatusBadge({ status, label, color }) {
  const m = STATUS[status] || {};
  const c = color || m.color || colors.muted;
  return (
    <View style={[s.badge, { backgroundColor: c + '1F' }]}>
      <View style={[s.badgeDot, { backgroundColor: c }]} />
      <Text style={{ color: c, fontSize: 12, fontWeight: '700' }}>
        {label || m.label || status}
      </Text>
    </View>
  );
}

export function Avatar({ user, size = 48, uri }) {
  const src = uri || user?.avatar?.url;
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.border,
        }}
      />
    );
  }
  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.navy,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export const Stars = ({ value = 0, size = 14, onChange }) => (
  <Row>
    {[1, 2, 3, 4, 5].map((i) => (
      <Pressable key={i} disabled={!onChange} onPress={() => onChange?.(i)} hitSlop={4}>
        <Ionicons
          name={i <= Math.round(value) ? 'star' : 'star-outline'}
          size={size}
          color={colors.amber}
        />
      </Pressable>
    ))}
  </Row>
);

export const Verified = () => <Ionicons name="checkmark-circle" size={16} color={colors.green} />;

export const Divider = ({ style }) => (
  <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border, marginVertical: 12 }, style]} />
);

export function Loading({ label }) {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.blue} />
      {!!label && <Text style={[s.muted, { marginTop: 12 }]}>{label}</Text>}
    </View>
  );
}

export function Empty({ icon = 'file-tray-outline', title, text, action, onAction }) {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={36} color={colors.blue} />
      </View>
      {!!title && <Text style={s.emptyTitle}>{title}</Text>}
      {!!text && <Text style={[s.muted, { marginTop: 6, textAlign: 'center', lineHeight: 19 }]}>{text}</Text>}
      {!!action && (
        <Button title={action} onPress={onAction} size="sm" style={{ marginTop: 18, minWidth: 140 }} />
      )}
    </View>
  );
}

export const ErrorText = ({ children }) =>
  children ? (
    <View style={s.errorBox}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={s.errorBoxText}>{children}</Text>
    </View>
  ) : null;

export function MenuItem({ icon, label, onPress, danger, badge, last }) {
  const tint = danger ? colors.danger : colors.blue;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.menuItem, last && { borderBottomWidth: 0 }, pressed && { opacity: 0.7 }]}
    >
      <View style={[s.menuIcon, { backgroundColor: danger ? SOFT_RED : SOFT_BLUE }]}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <Text style={[s.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
      {badge ? (
        <View style={s.dot}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{badge}</Text>
        </View>
      ) : null}
      {!danger && <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Data hook: refetches on focus, supports pull to refresh            */
/* ------------------------------------------------------------------ */
export function useApi(fn, deps = [], { poll } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: '', refreshing: false });

  const run = useCallback(async (mode) => {
    setState((p) => ({
      ...p,
      loading: mode === 'initial' && !p.data,
      refreshing: mode === 'pull',
      error: '',
    }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: '', refreshing: false });
    } catch (e) {
      setState((p) => ({ ...p, loading: false, refreshing: false, error: errMsg(e) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      run('initial');
      if (!poll) return undefined;
      const t = setInterval(() => run('poll'), poll);
      return () => clearInterval(t);
    }, [run, poll])
  );

  return { ...state, reload: () => run('initial'), pull: () => run('pull') };
}

/* ------------------------------------------------------------------ */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cloud },

  // TopBar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 56,
    backgroundColor: colors.cloud,
  },
  topbarBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(0.08, 6, 2, 2),
  },
  topbarSlot: { width: 38, alignItems: 'center', justifyContent: 'center' },
  topbarCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  topbarTitle: { fontSize: 17, fontWeight: '800', color: colors.navy },
  topbarSub: { fontSize: 12, color: colors.muted, marginTop: 1 },

  // Text
  h1: { fontSize: 28, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '800', color: colors.navy, marginBottom: 10 },
  muted: { color: colors.muted, fontSize: 13.5 },
  body: { color: colors.text, fontSize: 15 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.navy },
  sectionAction: { fontSize: 13.5, fontWeight: '700', color: colors.blue },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    ...shadow(0.07, 10, 3, 2),
  },

  // Button
  btn: {
    minHeight: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnSm: { minHeight: 40, borderRadius: 10, paddingHorizontal: 14 },
  btnText: { fontSize: 16.5, fontWeight: '700', letterSpacing: 0.2 },

  // Field
  label: { fontSize: 13.5, fontWeight: '700', color: colors.navy, marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  inputFocused: { borderColor: colors.blue, backgroundColor: colors.white },
  inputError: { borderColor: colors.danger, backgroundColor: '#FFF6F6' },
  input: { flex: 1, minHeight: 52, fontSize: 15.5, color: colors.text },
  error: { color: colors.danger, fontSize: 12.5, flex: 1 },
  hint: { color: colors.muted, fontSize: 12.5, marginTop: 5 },

  check: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },

  chip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: 8,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },

  // Empty / error
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: SOFT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 16, fontSize: 17, fontWeight: '800', color: colors.navy, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: SOFT_RED,
  },
  errorBoxText: { flex: 1, color: colors.danger, fontSize: 13.5 },

  // Menu
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, marginLeft: 14, fontSize: 15.5, fontWeight: '600', color: colors.text },
  dot: {
    backgroundColor: colors.danger,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 5,
  },
});