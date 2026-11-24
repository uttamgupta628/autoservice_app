import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen, H1, Muted, Field, Button, ErrorText } from '../../src/components/ui';
import { Brand } from '../../src/components/shared';
import { useAuth, homeFor } from '../../src/lib/auth';
import { errMsg } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
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
    <Screen edges={['top', 'bottom']}>
      <View style={{ marginTop: 40, marginBottom: 36 }}><Brand /></View>
      <H1>Welcome Back</H1>
      <Muted style={{ marginBottom: 24, marginTop: 4 }}>Sign in to your account</Muted>
      <Field icon="person-outline" placeholder="Email or Phone" autoCapitalize="none" value={identifier} onChangeText={setIdentifier} />
      <Field icon="lock-closed-outline" placeholder="Password" secureTextEntry={!show} value={password} onChangeText={setPassword} />
      <Pressable onPress={() => setShow(!show)}><Text style={{ color: colors.blue, textAlign: 'right', marginBottom: 14, fontWeight: '600' }}>{show ? 'Hide' : 'Show'} password</Text></Pressable>
      <ErrorText>{error}</ErrorText>
      <Button title="Sign In" onPress={submit} loading={busy} disabled={!identifier || !password} />
      <Text style={{ textAlign: 'center', marginTop: 22, color: colors.muted }}>
        Don't have an account? <Link href="/(auth)/signup" style={{ color: colors.blue, fontWeight: '700' }}>Sign Up</Link>
      </Text>
    </Screen>
  );
}
