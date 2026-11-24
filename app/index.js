import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth, homeFor } from '../src/lib/auth';
import { Brand } from '../src/components/shared';
import { colors } from '../src/lib/theme';

// Splash while the saved session is restored, then route by role.
export default function Index() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <View style={s.splash}>
        <Brand light size={34} />
        <Text style={s.tag}>Automotive Service Marketplace</Text>
      </View>
    );
  }
  return <Redirect href={homeFor(user)} />;
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  tag: { color: '#9FB3CC', marginTop: 10, fontSize: 14 },
});
