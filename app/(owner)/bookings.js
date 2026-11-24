import { useState } from 'react';
import { Screen, H1, Segmented, Loading, Empty, useApi, ErrorText } from '../../src/components/ui';
import { JobCard } from '../../src/components/shared';
import { api } from '../../src/lib/api';

export default function Bookings() {
  const [tab, setTab] = useState('upcoming');
  const { data, loading, error, pull, refreshing } = useApi(() => api.get(`/jobs/mine?bucket=${tab}`).then((r) => r.data.jobs), [tab]);
  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <H1 style={{ marginBottom: 12 }}>My Jobs</H1>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]} />
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : data?.length ? data.map((j) => <JobCard key={j._id} job={j} role="owner" />) : <Empty icon="calendar-outline" text={tab === 'upcoming' ? 'No upcoming jobs' : 'No past jobs yet'} />}
    </Screen>
  );
}
