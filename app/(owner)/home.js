import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, H1, H2, Muted, Card, Row, Loading, useApi, Button } from '../../src/components/ui';
import { JobCard } from '../../src/components/shared';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

const TILES = [
  { icon: 'calendar-outline', label: 'Book a Service', go: '/book' },
  { icon: 'car-outline', label: 'My Garage', go: '/vehicles' },
  { icon: 'people-outline', label: 'Find Mechanics', go: '/(owner)/find' },
  { icon: 'receipt-outline', label: 'Service History', go: '/(owner)/bookings' },
];

export default function OwnerHome() {
  const { user } = useAuth();
  const { data, loading, pull, refreshing } = useApi(() => api.get('/jobs/mine?bucket=upcoming').then((r) => r.data.jobs));
  const notif = useApi(() => api.get('/notifications').then((r) => r.data));
  return (
    <Screen onRefresh={() => { pull(); notif.pull(); }} refreshing={refreshing}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <H1>Hello, {user.name.split(' ')[0]} 👋</H1>
          <Muted style={{ marginTop: 2 }}>How can we help your vehicle?</Muted>
        </View>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={10}>
          <Ionicons name="notifications-outline" size={26} color={colors.navy} />
          {notif.data?.unread > 0 && <View style={{ position: 'absolute', right: -2, top: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} />}
        </Pressable>
      </Row>

      <Pressable onPress={() => router.push('/(owner)/find')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginVertical: 16 }}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <Text style={{ marginLeft: 8, color: '#9AA7B8' }}>Search service (e.g. Brake, AC)</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {TILES.map((t) => (
          <Pressable key={t.label} onPress={() => router.push(t.go)} style={{ width: '48%', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 20, alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name={t.icon} size={28} color={colors.blue} />
            <Text style={{ marginTop: 8, fontWeight: '600', color: colors.navy }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ backgroundColor: colors.green, borderRadius: 16, padding: 18, marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Not sure what's wrong?</Text>
        <Text style={{ color: '#E6FFF6', marginTop: 4, marginBottom: 12 }}>Describe the problem and compare quotes from trusted mechanics near you.</Text>
        <Button title="Request a repair quote" variant="ghost" onPress={() => router.push('/book')} />
      </View>

      <H2>Active bookings</H2>
      {loading ? <Loading /> : data?.length ? data.slice(0, 3).map((j) => <JobCard key={j._id} job={j} role="owner" />) : <Card><Muted>No active bookings. Book a service to get started.</Muted></Card>}
    </Screen>
  );
}
