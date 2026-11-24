import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth';
import { colors } from '../../src/lib/theme';

const icon = (name) => ({ color, size, focused }) => <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />;

export default function MechanicTabs() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'mechanic') return <Redirect href="/(owner)/home" />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#8A97AA', tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 } }}>
      <Tabs.Screen name="home" options={{ title: 'Dashboard', tabBarIcon: icon('grid') }} />
      <Tabs.Screen name="requests" options={{ title: 'Job Board', tabBarIcon: icon('briefcase') }} />
      <Tabs.Screen name="jobs" options={{ title: 'My Jobs', tabBarIcon: icon('construct') }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings', tabBarIcon: icon('wallet') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
