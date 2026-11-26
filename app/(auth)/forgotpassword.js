import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { errMsg } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

// 👇 Logo ka link bahar se (yahan badal sakte hain)
const LOGO_URL =
  'https://res.cloudinary.com/dquki4xol/image/upload/v1795243876/AutoService_Logo_with_Blue_Accents-removebg-preview_zjpoe2.png';

const PRIMARY = (colors && colors.blue) || '#1F6BFF';
const NAVY = (colors && colors.navy) || '#0F1B33';
const DANGER = '#E53935';
const SUCCESS = '#1FA84F';

const RESEND_SECONDS = 30;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// TODO: yahan apni reset-link API call lagayein, e.g.
// await api.post('/auth/forgot-password', { method, value });
async function requestResetLink(/* method, value */) {
  await new Promise((resolve) => setTimeout(resolve, 900)); // demo delay
}

export default function ForgotPassword() {
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [value, setValue] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const isEmail = method === 'email';

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const switchMethod = (m) => {
    setMethod(m);
    setValue('');
    setFieldError('');
    setApiError('');
  };

  const onChange = (t) => {
    setValue(isEmail ? t : t.replace(/\D/g, '').slice(0, 10));
    setFieldError('');
    setApiError('');
  };

  const validate = () => {
    const v = value.trim();
    if (isEmail) {
      if (!EMAIL_RE.test(v)) {
        setFieldError('Enter a valid email address');
        return false;
      }
    } else if (!/^\d{10}$/.test(v)) {
      setFieldError('Enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const send = async () => {
    if (busy) return;
    setApiError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await requestResetLink(method, value.trim());
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      setApiError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/(auth)/login');

  const maskedTarget = isEmail
    ? value.trim()
    : `+91 ${value.slice(0, 2)}******${value.slice(-2)}`;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#DCEBFF', '#F4F8FF', '#FFFFFF']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={goBack} style={s.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={26} color={NAVY} />
          </Pressable>

          <Image source={{ uri: LOGO_URL }} style={s.logo} resizeMode="contain" />

          {sent ? (
            /* ---------------- Success state ---------------- */
            <View style={s.successWrap}>
              <View style={s.successIcon}>
                <Ionicons name="checkmark" size={38} color="#FFFFFF" />
              </View>
              <Text style={s.title}>Check your {isEmail ? 'email' : 'phone'}</Text>
              <Text style={s.subtitle}>
                We've sent a password reset link to{'\n'}
                <Text style={s.bold}>{maskedTarget}</Text>
              </Text>

              <Pressable
                style={({ pressed }) => [s.sendBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={s.sendText}>Back to Sign In</Text>
              </Pressable>

              <View style={s.resendRow}>
                <Text style={s.mutedText}>Didn't get it? </Text>
                {cooldown > 0 ? (
                  <Text style={s.mutedText}>Resend in {cooldown}s</Text>
                ) : (
                  <Pressable onPress={send} disabled={busy} hitSlop={8}>
                    <Text style={s.link}>{busy ? 'Sending…' : 'Resend link'}</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => {
                  setSent(false);
                  setCooldown(0);
                }}
                hitSlop={8}
              >
                <Text style={[s.link, { marginTop: 14 }]}>
                  Use a different {isEmail ? 'email' : 'phone number'}
                </Text>
              </Pressable>
            </View>
          ) : (
            /* ---------------- Form state ---------------- */
            <>
              <Text style={s.title}>Forgot Password?</Text>
              <Text style={s.subtitle}>
                No worries! Enter your registered email or phone number and we'll
                send you a password reset link.
              </Text>

              {/* Email / Phone toggle */}
              <View style={s.toggle}>
                {[
                  { key: 'email', label: 'Email', icon: 'mail-outline' },
                  { key: 'phone', label: 'Phone', icon: 'call-outline' },
                ].map((m) => {
                  const active = method === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => switchMethod(m.key)}
                      style={[s.toggleItem, active && s.toggleActive]}
                    >
                      <Ionicons name={m.icon} size={20} color={active ? '#FFFFFF' : NAVY} />
                      <Text style={[s.toggleText, active && { color: '#FFFFFF' }]}>
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Input */}
              <Text style={s.label}>{isEmail ? 'Email Address' : 'Phone Number'}</Text>
              <View style={[s.inputWrap, !!fieldError && s.inputError]}>
                <Ionicons
                  name={isEmail ? 'mail-outline' : 'call-outline'}
                  size={21}
                  color="#1B2B4B"
                />
                {!isEmail && <Text style={s.prefix}>+91</Text>}
                <TextInput
                  style={s.input}
                  placeholder={isEmail ? 'Enter your email address' : 'Enter 10-digit number'}
                  placeholderTextColor="#6B778C"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  keyboardType={isEmail ? 'email-address' : 'phone-pad'}
                  returnKeyType="send"
                  onSubmitEditing={send}
                />
              </View>
              {!!fieldError && <Text style={s.error}>{fieldError}</Text>}

              {/* API error */}
              {!!apiError && (
                <View style={s.apiError}>
                  <Ionicons name="alert-circle" size={18} color={DANGER} />
                  <Text style={s.apiErrorText}>{apiError}</Text>
                </View>
              )}

              {/* Send button */}
              <Pressable
                style={({ pressed }) => [
                  s.sendBtn,
                  pressed && { opacity: 0.85 },
                  !value.trim() && !busy && s.sendDisabled,
                ]}
                onPress={send}
                disabled={busy || !value.trim()}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={s.sendText}>Send Reset Link</Text>
                )}
              </Pressable>

              {/* Info box */}
              <View style={s.infoBox}>
                <Ionicons name="paper-plane-outline" size={24} color={PRIMARY} />
                <Text style={s.infoText}>
                  We'll send a password reset link to your {isEmail ? 'email' : 'phone'}{' '}
                  shortly.
                </Text>
              </View>
            </>
          )}

          {/* Sign in */}
          {!sent && (
            <Text style={s.signInRow}>
              Remember your password?{' '}
              <Link href="/(auth)/login" replace style={s.link}>
                Sign In
              </Link>
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 28 },
  backBtn: { alignSelf: 'flex-start' },
  logo: { alignSelf: 'center', width: 260, height: 140 },

  title: { marginTop: 14, fontSize: 28, fontWeight: '800', color: NAVY, textAlign: 'center' },
  subtitle: {
    marginTop: 12,
    fontSize: 14.5,
    lineHeight: 21,
    color: '#3A4660',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  bold: { fontWeight: '800', color: NAVY },

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 4,
    marginTop: 26,
    shadowColor: '#1B2B4B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  toggleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 26,
    gap: 8,
  },
  toggleActive: { backgroundColor: PRIMARY },
  toggleText: { fontSize: 16, fontWeight: '700', color: NAVY },

  label: { marginTop: 22, marginBottom: 8, fontSize: 15, fontWeight: '700', color: NAVY },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFDAEC',
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
  },
  inputError: { borderColor: DANGER, backgroundColor: '#FFF6F6' },
  prefix: { fontSize: 15, fontWeight: '700', color: NAVY },
  input: { flex: 1, fontSize: 15, color: NAVY },
  error: { marginTop: 6, marginLeft: 4, fontSize: 12.5, color: DANGER },

  apiError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
  },
  apiErrorText: { flex: 1, fontSize: 13.5, color: DANGER },

  sendBtn: {
    marginTop: 22,
    backgroundColor: PRIMARY,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  sendDisabled: { backgroundColor: '#9DBDF5', shadowOpacity: 0, elevation: 0 },
  sendText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3FB',
    borderRadius: 12,
    padding: 16,
    marginTop: 22,
    gap: 14,
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20, color: '#3A4660' },

  successWrap: { alignItems: 'stretch' },
  successIcon: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: SUCCESS,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  mutedText: { fontSize: 14, color: '#3A4660' },

  signInRow: { textAlign: 'center', marginTop: 28, fontSize: 14.5, color: NAVY },
  link: { color: PRIMARY, fontSize: 14.5, fontWeight: '700', textAlign: 'center' },
});