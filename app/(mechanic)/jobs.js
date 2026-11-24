import { useState } from 'react';
import { Screen, H1, Segmented, Loading, Empty, useApi, ErrorText } from '../../src/components/ui';
import { JobCard } from '../../src/components/shared';
import { api } from '../../src/lib/api';

export default function MechanicJobs() {
  const [tab, setTab] = useState('active');
  const { data, loading, error, pull, refreshing } = useApi(() => api.get(`/jobs/assigned?bucket=${tab}`).then((r) => r.data.jobs), [tab]);
  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <H1 style={{ marginBottom: 12 }}>Active Jobs</H1>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'active', label: 'Scheduled & active' }, { value: 'past', label: 'Past' }]} />
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : data?.length ? data.map((j) => <JobCard key={j._id} job={j} role="mechanic" />) : <Empty icon="construct-outline" text={tab === 'active' ? 'No scheduled jobs' : 'No completed jobs yet'} />}
    </Screen>
  );
}
