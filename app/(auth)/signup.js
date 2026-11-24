import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, H1, Muted, Field, Button, ErrorText, TopBar } from '../../src/components/ui';
import { useAuth, homeFor } from '../../src/lib/auth';
import { errMsg } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

const ROLES = [
  { value: 'owner', label: 'Vehicle Owner', icon: 'car-outline', hint: 'Find and book mechanics' },
  { value: 'mechanic', label: 'Freelance Mechanic', icon: 'construct-outline', hint: 'Get jobs and earn' },
];

export default function SignUp() {
  const { register } = useAuth();
  const [role, setRole] = useState('owner');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const submit = async () => {
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Enter a valid email address');
    if (f.password.length < 6) return setError('Password must be at least 6 characters');
    setBusy(true);
    try {
      const u = await register({ ...f, email: f.email.trim(), role });
      router.replace(homeFor(u));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} padded={false}>
      <TopBar title="" />
      <View style={{ padding: 16 }}>
        <H1 style={{ marginBottom: 16 }}>Create Account</H1>
        {ROLES.map((r) => (
          <Pressable key={r.value} onPress={() => setRole(r.value)} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: role === r.value ? colors.blue : colors.border }}>
            <Ionicons name={r.icon} size={22} color={role === r.value ? colors.blue : colors.muted} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: '700', color: colors.navy }}>{r.label}</Text>
              <Muted>{r.hint}</Muted>
            </View>
            <Ionicons name={role === r.value ? 'radio-button-on' : 'radio-button-off'} size={20} color={role === r.value ? colors.blue : '#A0AEC0'} />
          </Pressable>
        ))}
        <View style={{ height: 8 }} />
        <Field icon="person-outline" placeholder="Full Name" value={f.name} onChangeText={set('name')} />
        <Field icon="mail-outline" placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={set('email')} />
        <Field icon="call-outline" placeholder="Phone" keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
        <Field icon="lock-closed-outline" placeholder="Password (min 6 characters)" secureTextEntry value={f.password} onChangeText={set('password')} />
        <ErrorText>{error}</ErrorText>
        <Button title="Create Account" onPress={submit} loading={busy} disabled={!f.name || !f.email || !f.password} />
        <Text style={{ textAlign: 'center', marginTop: 18, color: colors.muted }}>
          Already have an account? <Link href="/(auth)/login" style={{ color: colors.blue, fontWeight: '700' }}>Sign In</Link>
        </Text>
      </View>
    </Screen>
  );
}
