import { Screen, H1, Loading, useApi } from '../../src/components/ui';
import { ConversationList } from '../../src/components/shared';
import { api } from '../../src/lib/api';

export default function Messages() {
  const { data, loading, pull, refreshing } = useApi(() => api.get('/messages/conversations').then((r) => r.data.conversations), [], { poll: 8000 });
  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <H1 style={{ marginBottom: 12 }}>Messages</H1>
      {loading ? <Loading /> : <ConversationList conversations={data} />}
    </Screen>
  );
}
