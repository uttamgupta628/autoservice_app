import { View } from 'react-native';
import { Screen, TopBar, Loading, Empty, useApi } from '../src/components/ui';
import { ReviewItem } from '../src/components/shared';
import { useAuth } from '../src/lib/auth';
import { api } from '../src/lib/api';

export default function Reviews() {
  const { user } = useAuth();
  const { data, loading } = useApi(() => api.get(`/reviews/mechanic/${user._id}`).then((r) => r.data.reviews));
  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="Reviews" />
      <View style={{ padding: 16 }}>{loading ? <Loading /> : data?.length ? data.map((r) => <ReviewItem key={r._id} r={r} />) : <Empty icon="star-outline" text="No reviews yet. They appear after customers rate completed jobs." />}</View>
    </Screen>
  );
}
