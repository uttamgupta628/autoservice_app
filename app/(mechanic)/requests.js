import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, H1, Segmented, Loading, Empty, Row, Button, Card, Muted, useApi, ErrorText } from '../../src/components/ui';
import { LeadCard, JobCard } from '../../src/components/shared';
import { api, errMsg } from '../../src/lib/api';
import { router } from 'expo-router';

export default function Requests() {
  const [tab, setTab] = useState('new');
  const leads = useApi(() => api.get('/jobs/requests').then((r) => r.data));
  const quotes = useApi(() => api.get('/jobs/my-quotes').then((r) => r.data.jobs));
  const decline = (job) =>
    Alert.alert('Decline this job?', 'It will be removed from your board.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => { try { await api.post(`/jobs/${job._id}/decline`); leads.reload(); } catch (e) { Alert.alert('Error', errMsg(e)); } } },
    ]);
  const cur = tab === 'new' ? leads : quotes;
  return (
    <Screen onRefresh={() => { leads.pull(); quotes.pull(); }} refreshing={cur.refreshing}>
      <H1 style={{ marginBottom: 12 }}>Job Requests</H1>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'new', label: `New${leads.data?.jobs?.length ? ` (${leads.data.jobs.length})` : ''}` }, { value: 'quotes', label: 'My quotes' }]} />
      <ErrorText>{cur.error}</ErrorText>
      {cur.loading ? <Loading /> : tab === 'new' ? (
        leads.data?.notVerified ? <Empty icon="shield-outline" text="Get verified to see matched jobs near you." />
        : leads.data?.jobs?.length ? leads.data.jobs.map((j) => (
          <View key={j._id}>
            <LeadCard job={j} />
            {!j.myQuote && (
              <Row style={{ gap: 10, marginTop: -4, marginBottom: 14 }}>
                <Button title="Decline" variant="ghost" style={{ flex: 1, minHeight: 42 }} onPress={() => decline(j)} />
                <Button title="Accept & quote" style={{ flex: 1, minHeight: 42 }} onPress={() => router.push(`/job/${j._id}`)} />
              </Row>
            )}
          </View>
        )) : <Empty icon="briefcase-outline" text="No matching requests right now. Make sure you're online and your services, radius and hours are set." />
      ) : quotes.data?.length ? quotes.data.map((j) => <JobCard key={j._id} job={{ ...j, price: j.quotes?.[0]?.total }} role="mechanic" />) : <Empty text="You haven't sent any quotes yet" />}
    </Screen>
  );
}
