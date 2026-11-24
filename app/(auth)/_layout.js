import { Redirect, Stack } from 'expo-router';
import { useAuth, homeFor } from '../../src/lib/auth';

export default function AuthLayout() {
  const { user, ready } = useAuth();
  if (ready && user) return <Redirect href={homeFor(user)} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
