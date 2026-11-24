import { View } from 'react-native';
import { Screen, TopBar, Body, Muted, Card, Row, StatusBadge, Loading, Empty, ErrorText, useApi } from '../src/components/ui';
import { api } from '../src/lib/api';
import { fmtDate } from '../src/lib/theme';

export default function Disputes() {
  const { data, loading, error } = useApi(() => api.get('/disputes/mine').then((r) => r.data.disputes));
  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="Disputes & issues" />
      <View style={{ padding: 16 }}>
        <ErrorText>{error}</ErrorText>
        {loading ? <Loading /> : data?.length ? data.map((d) => (
          <Card key={d._id}>
            <Row style={{ justifyContent: 'space-between' }}><Body style={{ fontWeight: '700', flex: 1 }}>{d.subject}</Body><StatusBadge status={d.status} label={d.status.replace('_', ' ')} color={d.status === 'resolved' ? '#19A77C' : '#F2A43A'} /></Row>
            <Muted style={{ marginTop: 4 }}>Opened {fmtDate(d.createdAt)}</Muted>
            {d.resolution ? <Body style={{ marginTop: 8 }}>Resolution: {d.resolution}</Body> : null}
          </Card>
        )) : <Empty icon="shield-checkmark-outline" text="No issues reported. You can report one from any booked job." />}
      </View>
    </Screen>
  );
}
