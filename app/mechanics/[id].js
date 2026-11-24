import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, H1, H2, Muted, Body, Avatar, Row, Card, Segmented, Verified, Stars, Button, Loading, Empty, ErrorText, useApi } from '../../src/components/ui';
import { ReviewItem } from '../../src/components/shared';
import { api } from '../../src/lib/api';
import { colors, money, pretty } from '../../src/lib/theme';

export default function MechanicProfile() {
  const { id } = useLocalSearchParams();
  const [tab, setTab] = useState('about');
  const { data, loading, error } = useApi(() => api.get(`/mechanics/${id}`).then((r) => r.data), [id]);
  if (loading) return <Screen><TopBar title="Mechanic" /><Loading /></Screen>;
  if (error || !data) return <Screen><TopBar title="Mechanic" /><ErrorText>{error}</ErrorText></Screen>;
  const m = data.mechanic;

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="" />
      <View style={{ padding: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Avatar user={m} size={88} />
          <Row style={{ gap: 6, marginTop: 10 }}><H1 style={{ fontSize: 22 }}>{m.shopName || m.name}</H1>{m.verified && <Verified />}</Row>
          <Row style={{ gap: 6, marginTop: 4 }}><Stars value={m.rating} /><Muted>{m.rating ? m.rating.toFixed(1) : 'New'} ({m.reviewCount} reviews)</Muted></Row>
          <Muted style={{ marginTop: 4 }}>{m.city} · {m.completedJobs} jobs completed · {m.experienceYears} yrs experience</Muted>
        </View>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'about', label: 'About' }, { value: 'services', label: 'Services' }, { value: 'reviews', label: 'Reviews' }]} />

        {tab === 'about' && (
          <>
            <Card><Body>{m.bio || 'This mechanic has not added a bio yet.'}</Body></Card>
            <Card>
              <Muted>Works on</Muted><Body style={{ marginBottom: 10 }}>{m.vehicleMakes.length ? m.vehicleMakes.join(', ') : 'All makes'}</Body>
              <Muted>Equipment</Muted><Body style={{ marginBottom: 10 }}>{m.equipment.join(', ') || '—'}</Body>
              <Muted>Travel radius</Muted><Body>{m.serviceRadiusKm} km</Body>
            </Card>
          </>
        )}
        {tab === 'services' && (m.services.length ? m.services.map((s) => (
          <Card key={s.category}><Row style={{ justifyContent: 'space-between' }}><Body style={{ fontWeight: '600' }}>{pretty(s.category)}</Body><Body style={{ fontWeight: '700' }}>{money(s.price)}</Body></Row></Card>
        )) : <Empty text="No services listed" />)}
        {tab === 'reviews' && (data.reviews.length ? data.reviews.map((r) => <ReviewItem key={r._id} r={r} />) : <Empty icon="star-outline" text="No reviews yet" />)}

        <View style={{ height: 8 }} />
        <Button title="Book Service" onPress={() => router.push({ pathname: '/book', params: { mechanicId: m.id } })} />
      </View>
    </Screen>
  );
}
