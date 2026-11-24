import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Body, Muted, Card, Row, Loading, Empty, ErrorText, useApi } from '../src/components/ui';
import { api } from '../src/lib/api';
import { colors, fmtDateTime } from '../src/lib/theme';

const ICON = { lead: 'briefcase', quote: 'pricetag', booking: 'calendar', message: 'chatbubble', payment: 'cash', review: 'star', approval: 'help-circle', verification: 'shield-checkmark', dispute: 'flag', job: 'construct' };

export default function Notifications() {
  const { data, loading, error, pull, refreshing } = useApi(async () => {
    const r = await api.get('/notifications');
    if (r.data.unread) api.post('/notifications/read-all').catch(() => {});
    return r.data;
  });
  return (
    <Screen padded={false} edges={['top', 'bottom']} onRefresh={pull} refreshing={refreshing}>
      <TopBar title="Notifications" />
      <View style={{ padding: 16 }}>
        <ErrorText>{error}</ErrorText>
        {loading ? <Loading /> : data?.notifications?.length ? data.notifications.map((n) => (
          <Card key={n._id} onPress={n.job ? () => router.push(n.type === 'message' ? `/chat/${n.job}` : `/job/${n.job}`) : undefined} style={!n.read ? { borderColor: colors.blue } : undefined}>
            <Row style={{ gap: 12, alignItems: 'flex-start' }}>
              <Ionicons name={ICON[n.type] || 'notifications'} size={22} color={colors.blue} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '700' }}>{n.title}</Body>
                <Muted style={{ marginTop: 2 }}>{n.body}</Muted>
                <Muted style={{ marginTop: 4, fontSize: 11 }}>{fmtDateTime(n.createdAt)}</Muted>
              </View>
            </Row>
          </Card>
        )) : <Empty icon="notifications-off-outline" text="You're all caught up" />}
      </View>
    </Screen>
  );
}
