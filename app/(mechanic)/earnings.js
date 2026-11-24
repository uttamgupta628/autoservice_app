import { Text, View } from 'react-native';
import { Screen, H1, H2, Muted, Body, Card, Row, Stars, Loading, Empty, useApi, ErrorText } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { colors, fmtDate, money, pretty } from '../../src/lib/theme';
import { router } from 'expo-router';

export default function Earnings() {
  const { data, loading, error, pull, refreshing } = useApi(() => api.get('/mechanics/me/earnings').then((r) => r.data));
  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <H1 style={{ marginBottom: 12 }}>Earnings</H1>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : data && (
        <>
          <View style={{ backgroundColor: colors.navy, borderRadius: 18, padding: 20, marginBottom: 12 }}>
            <Text style={{ color: '#9FB3CC' }}>Net earnings</Text>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', marginVertical: 4 }}>{money(data.net)}</Text>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ color: '#9FB3CC' }}>Pending payout {money(data.pendingPayout)}</Text>
              <Text style={{ color: '#9FB3CC' }}>Paid out {money(data.settledPayout)}</Text>
            </Row>
          </View>
          <Row style={{ gap: 12, marginBottom: 12 }}>
            <Card style={{ flex: 1, marginBottom: 0 }}><Muted>Gross</Muted><Body style={{ fontWeight: '800', fontSize: 18 }}>{money(data.gross)}</Body></Card>
            <Card style={{ flex: 1, marginBottom: 0 }}><Muted>Platform fees</Muted><Body style={{ fontWeight: '800', fontSize: 18 }}>{money(data.fees)}</Body></Card>
          </Row>
          <Card onPress={() => router.push('/reviews')}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View><Muted>Rating</Muted><Row style={{ gap: 8 }}><Body style={{ fontWeight: '800', fontSize: 22 }}>{data.rating ? data.rating.toFixed(1) : '—'}</Body><Stars value={data.rating} size={16} /></Row></View>
              <View style={{ alignItems: 'flex-end' }}><Muted>{data.reviewCount} reviews</Muted><Muted>{data.completedJobs} jobs done</Muted></View>
            </Row>
          </Card>
          <H2 style={{ marginTop: 8 }}>Recent payments</H2>
          {data.payments.length ? data.payments.map((p) => (
            <Card key={p._id} onPress={() => router.push(`/job/${p.job?._id || p.job}`)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View><Body style={{ fontWeight: '600' }}>{pretty(p.job?.category || 'Job')}</Body><Muted>{fmtDate(p.createdAt)} · {p.status}</Muted></View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Body style={{ fontWeight: '800', color: p.status === 'captured' ? colors.green : colors.muted }}>{money(p.status === 'captured' ? p.payout : p.amount)}</Body>
                  <Muted>{p.status === 'captured' ? `payout ${p.payoutStatus}` : ''}</Muted>
                </View>
              </Row>
            </Card>
          )) : <Empty icon="wallet-outline" text="Completed jobs will show up here" />}
        </>
      )}
    </Screen>
  );
}
