import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, H1, H2, Muted, Body, Card, Row, Toggle, Loading, useApi, Button } from '../../src/components/ui';
import { JobCard, LeadCard } from '../../src/components/shared';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

export default function MechanicHome() {
  const { user, refresh } = useAuth();
  const requests = useApi(() => api.get('/jobs/requests').then((r) => r.data));
  const active = useApi(() => api.get('/jobs/assigned?bucket=active').then((r) => r.data.jobs));
  const notif = useApi(() => api.get('/notifications').then((r) => r.data));
  const status = user.mechanic?.verificationStatus;
  const verified = status === 'verified';

  const toggleOnline = async (v) => {
    await api.put('/mechanics/me/profile', { isOnline: v });
    refresh();
  };
  const reloadAll = () => { requests.pull(); active.pull(); notif.pull(); };
  const msg = {
    draft: 'Complete your verification to start receiving paid jobs.',
    submitted: 'Your documents are with our team. We will notify you when you are verified.',
    under_review: 'We need more information. Open verification to update your documents.',
    rejected: `Verification rejected${user.mechanic?.verificationNote ? ': ' + user.mechanic.verificationNote : ''}. Update and resubmit.`,
    suspended: 'Your profile is suspended. Contact support.',
  }[status];

  return (
    <Screen onRefresh={reloadAll} refreshing={requests.refreshing}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <H1>Hello, {user.name.split(' ')[0]}</H1>
          <Muted>Here's your business overview</Muted>
        </View>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={10}>
          <Ionicons name="notifications-outline" size={26} color={colors.navy} />
          {notif.data?.unread > 0 && <View style={{ position: 'absolute', right: -2, top: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger }} />}
        </Pressable>
      </Row>

      {!verified && msg && (
        <Card style={{ backgroundColor: '#FFF7E8', borderColor: colors.amber, marginTop: 16 }}>
          <Row style={{ gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="shield-outline" size={22} color={colors.amber} />
            <View style={{ flex: 1 }}><Body style={{ fontWeight: '700' }}>Not verified yet</Body><Muted style={{ marginTop: 2 }}>{msg}</Muted></View>
          </Row>
          {status !== 'submitted' && status !== 'suspended' && <Button title="Open verification" style={{ marginTop: 10 }} onPress={() => router.push('/verification')} />}
        </Card>
      )}

      <Card style={{ marginTop: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View><Body style={{ fontWeight: '700' }}>Available for jobs</Body><Muted>{user.mechanic?.isOnline ? 'You are receiving new leads' : 'You are offline'}</Muted></View>
          <Toggle value={!!user.mechanic?.isOnline} onValueChange={toggleOnline} />
        </Row>
      </Card>

      <Row style={{ gap: 12, marginBottom: 12 }}>
        <Stat value={requests.data?.jobs?.length ?? '–'} label="New requests" color={colors.blue} onPress={() => router.push('/(mechanic)/requests')} />
        <Stat value={active.data?.length ?? '–'} label="Active jobs" color={colors.green} onPress={() => router.push('/(mechanic)/jobs')} />
      </Row>

      <H2>Today's requests</H2>
      {requests.loading ? <Loading /> : requests.data?.jobs?.length ? requests.data.jobs.slice(0, 3).map((j) => <LeadCard key={j._id} job={j} />) : <Card><Muted>No new requests right now.</Muted></Card>}

      <H2 style={{ marginTop: 8 }}>Upcoming jobs</H2>
      {active.loading ? <Loading /> : active.data?.length ? active.data.slice(0, 3).map((j) => <JobCard key={j._id} job={j} role="mechanic" />) : <Card><Muted>No booked jobs yet.</Muted></Card>}
    </Screen>
  );
}

const Stat = ({ value, label, color, onPress }) => (
  <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
    <Text style={{ fontSize: 30, fontWeight: '800', color }}>{value}</Text>
    <Muted>{label}</Muted>
  </Pressable>
);
