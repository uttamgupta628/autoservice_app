import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth';
import { colors } from '../../src/lib/theme';

const icon = (name) => ({ color, size, focused }) => <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />;

export default function OwnerTabs() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'owner') return <Redirect href="/(mechanic)/home" />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: '#8A97AA', tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 } }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="find" options={{ title: 'Find', tabBarIcon: icon('search') }} />
      <Tabs.Screen name="bookings" options={{ title: 'My Jobs', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: icon('chatbubble') }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
