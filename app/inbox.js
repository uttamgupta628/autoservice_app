import { View } from 'react-native';
import { Screen, TopBar, Loading, useApi } from '../src/components/ui';
import { ConversationList } from '../src/components/shared';
import { api } from '../src/lib/api';

export default function Inbox() {
  const { data, loading, pull, refreshing } = useApi(() => api.get('/messages/conversations').then((r) => r.data.conversations), [], { poll: 8000 });
  return (
    <Screen padded={false} edges={['top', 'bottom']} onRefresh={pull} refreshing={refreshing}>
      <TopBar title="Messages" />
      <View style={{ padding: 16 }}>{loading ? <Loading /> : <ConversationList conversations={data} />}</View>
    </Screen>
  );
}
