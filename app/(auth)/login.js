import { useState } from 'react';
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

// 👇 Links bahar se (yahan badal sakte hain)
const LOGO_URL =
  'https://res.cloudinary.com/dquki4xol/image/upload/v1795422499/AutoService_Car_Logo-removebg-preview_1_vsdhbf.png';
const GOOGLE_LOGO_URL = 'https://developers.google.com/identity/images/g-logo.png';

const PRIMARY = (colors && colors.blue) || '#1F6BFF';
const NAVY = (colors && colors.navy) || '#0F1B33';
const DANGER = '#E53935';

export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = !!identifier.trim() && !!password && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const u = await login(identifier.trim(), password);
      router.replace(homeFor(u));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

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
          {/* Logo + heading */}
          <Image source={{ uri: LOGO_URL }} style={s.logo} resizeMode="contain" />
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

          {/* Email / Phone */}
          <Text style={s.label}>Email or Phone</Text>
          <View style={[s.inputWrap, !!error && s.inputError]}>
            <Ionicons name="person-outline" size={21} color="#1B2B4B" />
            <TextInput
              style={s.input}
              placeholder="Enter your email or phone"
              placeholderTextColor="#6B778C"
              value={identifier}
              onChangeText={(t) => {
                setIdentifier(t);
                setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <Text style={s.label}>Password</Text>
          <View style={[s.inputWrap, !!error && s.inputError]}>
            <Ionicons name="lock-closed-outline" size={21} color="#1B2B4B" />
            <TextInput
              style={s.input}
              placeholder="Enter your password"
              placeholderTextColor="#6B778C"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError('');
              }}
              secureTextEntry={!show}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
            <Pressable onPress={() => setShow((v) => !v)} hitSlop={10}>
              <Ionicons
                name={show ? 'eye-off-outline' : 'eye-outline'}
                size={21}
                color="#1B2B4B"
              />
            </Pressable>
          </View>

          {/* Forgot password */}
          <Link href="/(auth)/forgotpassword" style={s.forgot}>
            Forgot password?
          </Link>

          {/* Error */}
          {!!error && (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={18} color={DANGER} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* Sign In */}
          <Pressable
            style={({ pressed }) => [
              s.signInBtn,
              pressed && { opacity: 0.85 },
              !canSubmit && !busy && s.signInDisabled,
            ]}
            onPress={submit}
            disabled={!canSubmit}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.signInText}>Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.line} />
            <Text style={s.dividerText}>or continue with</Text>
            <View style={s.line} />
          </View>

          {/* Social buttons (abhi sirf UI) */}
          <View style={s.socialRow}>
            <Pressable style={s.socialBtn}>
              <Image source={{ uri: GOOGLE_LOGO_URL }} style={s.googleLogo} resizeMode="contain" />
            </Pressable>
            <Pressable style={s.socialBtn}>
              <Ionicons name="logo-apple" size={28} color="#000000" />
            </Pressable>
          </View>

          {/* Sign up */}
          <Text style={s.signUpRow}>
            Don't have an account?{' '}
            <Link href="/(auth)/signup" style={s.link}>
              Sign Up
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  logo: { alignSelf: 'center', width: 260, height: 140 },
  title: { marginTop: 6, fontSize: 30, fontWeight: '800', color: NAVY, textAlign: 'center' },
  subtitle: { marginTop: 6, marginBottom: 10, fontSize: 15, color: '#3A4660', textAlign: 'center' },

  label: { marginTop: 16, marginBottom: 8, fontSize: 14.5, fontWeight: '700', color: NAVY },
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
  input: { flex: 1, fontSize: 15, color: NAVY },

  forgot: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 18,
    color: PRIMARY,
    fontSize: 14.5,
    fontWeight: '700',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
  },
  errorText: { flex: 1, fontSize: 13.5, color: DANGER },

  signInBtn: {
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
  signInDisabled: { backgroundColor: '#9DBDF5', shadowOpacity: 0, elevation: 0 },
  signInText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#D5DAE5' },
  dividerText: { marginHorizontal: 12, color: '#3A4660', fontSize: 14 },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialBtn: {
    width: 84,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B2B4B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  googleLogo: { width: 26, height: 26 },

  signUpRow: { textAlign: 'center', marginTop: 26, fontSize: 14.5, color: NAVY },
  link: { color: PRIMARY, fontWeight: '700' },
});