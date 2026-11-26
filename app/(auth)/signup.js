import { useMemo, useState } from 'react';
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
import { useAuth, homeFor } from '../../src/lib/auth';
import { errMsg } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

// 👇 Logo ka link bahar se (yahan badal sakte hain)
const LOGO_URL =
  'https://res.cloudinary.com/dquki4xol/image/upload/v1795422499/AutoService_Car_Logo-removebg-preview_1_vsdhbf.png';

const PRIMARY = (colors && colors.blue) || '#1F6BFF';
const NAVY = (colors && colors.navy) || '#0F1B33';
const DANGER = '#E53935';
const SUCCESS = '#1FA84F';

const ROLES = [
  { value: 'owner', label: 'Vehicle Owner', icon: 'car-sport-outline', hint: 'Find and book mechanics' },
  { value: 'mechanic', label: 'Freelance Mechanic', icon: 'construct-outline', hint: 'Get jobs and earn' },
];

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function SignUp() {
  const { register } = useAuth();

  const [role, setRole] = useState('owner');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => {
    setF((prev) => ({ ...prev, [k]: k === 'phone' ? v.replace(/\D/g, '').slice(0, 10) : v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
    setApiError('');
  };

  // Password strength: 1 = weak, 2 = good, 3 = strong
  const strength = useMemo(() => {
    const p = f.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
    return Math.max(score, p ? 1 : 0);
  }, [f.password]);
  const strengthMeta = [
    { label: '', color: '#D5DAE5' },
    { label: 'Weak', color: DANGER },
    { label: 'Good', color: '#F5A623' },
    { label: 'Strong', color: SUCCESS },
  ][strength];

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 3) e.name = 'Enter your full name';
    if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
    if (f.phone && f.phone.length !== 10) e.phone = 'Enter a valid 10-digit phone number';
    if (f.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (f.confirm !== f.password) e.confirm = 'Passwords do not match';
    if (!agreed) e.terms = 'Please accept the Terms & Privacy Policy';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setApiError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const { confirm, ...data } = f; // confirm password API ko nahi bhejna
      const u = await register({
        ...data,
        name: data.name.trim(),
        email: data.email.trim(),
        role,
      });
      router.replace(homeFor(u));
    } catch (e) {
      setApiError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const FieldBox = ({ icon, error, children }) => (
    <View style={[s.inputWrap, error && s.inputError]}>
      <Ionicons name={icon} size={21} color="#1B2B4B" />
      {children}
    </View>
  );

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
          {/* Back */}
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
            style={s.backBtn}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={26} color={NAVY} />
          </Pressable>

          {/* Logo + heading */}
          <Image source={{ uri: LOGO_URL }} style={s.logo} resizeMode="contain" />
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join AutoService and get started in minutes</Text>

          {/* Role toggle */}
          <Text style={s.label}>I am a</Text>
          <View style={s.toggle}>
            {ROLES.map((r) => {
              const active = role === r.value;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => setRole(r.value)}
                  style={[s.toggleItem, active && s.toggleActive]}
                >
                  <Ionicons name={r.icon} size={20} color={active ? '#FFFFFF' : NAVY} />
                  <Text
                    numberOfLines={1}
                    style={[s.toggleText, active && { color: '#FFFFFF' }]}
                  >
                    {r.value === 'owner' ? 'Vehicle Owner' : 'Mechanic'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={s.hint}>{ROLES.find((r) => r.value === role).hint}</Text>

          {/* Full name */}
          <Text style={s.label}>Full Name</Text>
          <FieldBox icon="person-outline" error={errors.name}>
            <TextInput
              style={s.input}
              placeholder="Enter your full name"
              placeholderTextColor="#6B778C"
              value={f.name}
              onChangeText={set('name')}
              autoCapitalize="words"
            />
          </FieldBox>
          {!!errors.name && <Text style={s.error}>{errors.name}</Text>}

          {/* Email */}
          <Text style={s.label}>Email Address</Text>
          <FieldBox icon="mail-outline" error={errors.email}>
            <TextInput
              style={s.input}
              placeholder="Enter your email address"
              placeholderTextColor="#6B778C"
              value={f.email}
              onChangeText={set('email')}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </FieldBox>
          {!!errors.email && <Text style={s.error}>{errors.email}</Text>}

          {/* Phone */}
          <Text style={s.label}>Phone Number</Text>
          <FieldBox icon="call-outline" error={errors.phone}>
            <Text style={s.prefix}>+91</Text>
            <TextInput
              style={s.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#6B778C"
              value={f.phone}
              onChangeText={set('phone')}
              keyboardType="phone-pad"
            />
          </FieldBox>
          {!!errors.phone && <Text style={s.error}>{errors.phone}</Text>}

          {/* Password */}
          <Text style={s.label}>Password</Text>
          <FieldBox icon="lock-closed-outline" error={errors.password}>
            <TextInput
              style={s.input}
              placeholder="Min 6 characters"
              placeholderTextColor="#6B778C"
              value={f.password}
              onChangeText={set('password')}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={21}
                color="#1B2B4B"
              />
            </Pressable>
          </FieldBox>
          {!!errors.password && <Text style={s.error}>{errors.password}</Text>}

          {!!f.password && (
            <View style={s.strengthRow}>
              <View style={s.strengthBars}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      s.strengthBar,
                      { backgroundColor: i <= strength ? strengthMeta.color : '#D5DAE5' },
                    ]}
                  />
                ))}
              </View>
              <Text style={[s.strengthText, { color: strengthMeta.color }]}>
                {strengthMeta.label}
              </Text>
            </View>
          )}

          {/* Confirm password */}
          <Text style={s.label}>Confirm Password</Text>
          <FieldBox icon="shield-checkmark-outline" error={errors.confirm}>
            <TextInput
              style={s.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#6B778C"
              value={f.confirm}
              onChangeText={set('confirm')}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </FieldBox>
          {!!errors.confirm && <Text style={s.error}>{errors.confirm}</Text>}

          {/* Terms */}
          <Pressable
            style={s.termsRow}
            onPress={() => {
              setAgreed((v) => !v);
              setErrors((prev) => ({ ...prev, terms: undefined }));
            }}
          >
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={24}
              color={agreed ? PRIMARY : '#6B778C'}
            />
            <Text style={s.termsText}>
              I agree to the <Text style={s.link}>Terms of Service</Text> and{' '}
              <Text style={s.link}>Privacy Policy</Text>
            </Text>
          </Pressable>
          {!!errors.terms && <Text style={s.error}>{errors.terms}</Text>}

          {/* API error */}
          {!!apiError && (
            <View style={s.apiError}>
              <Ionicons name="alert-circle" size={18} color={DANGER} />
              <Text style={s.apiErrorText}>{apiError}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              s.createBtn,
              (busy || pressed) && { opacity: 0.85 },
              !f.name || !f.email || !f.password ? s.createDisabled : null,
            ]}
            onPress={submit}
            disabled={busy || !f.name || !f.email || !f.password}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.createText}>Create Account</Text>
            )}
          </Pressable>

          <Text style={s.signInRow}>
            Already have an account?{' '}
            <Link href="/(auth)/login" style={s.link}>
              Sign In
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  backBtn: { alignSelf: 'flex-start' },
  logo: { alignSelf: 'center', width: 240, height: 130 },
  title: { marginTop: 4, fontSize: 28, fontWeight: '800', color: NAVY, textAlign: 'center' },
  subtitle: { marginTop: 6, fontSize: 14.5, color: '#3A4660', textAlign: 'center' },

  label: { marginTop: 18, marginBottom: 8, fontSize: 14.5, fontWeight: '700', color: NAVY },
  hint: { marginTop: 8, fontSize: 13, color: '#3A4660', textAlign: 'center' },

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 4,
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
  toggleText: { fontSize: 15, fontWeight: '700', color: NAVY },

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

  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 12.5, fontWeight: '700', width: 48, textAlign: 'right' },

  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
  termsText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: '#3A4660' },
  link: { color: PRIMARY, fontWeight: '700' },

  apiError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
  },
  apiErrorText: { flex: 1, fontSize: 13.5, color: DANGER },

  createBtn: {
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
  createDisabled: { backgroundColor: '#9DBDF5', shadowOpacity: 0 },
  createText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  signInRow: { textAlign: 'center', marginTop: 22, fontSize: 14.5, color: NAVY },
});