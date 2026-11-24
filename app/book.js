import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, H2, Muted, Body, Card, Row, Field, Button, Check, Chip, Loading, ErrorText, useApi } from '../src/components/ui';
import { DateTimeField, defaultWhen } from '../src/components/shared';
import { api, errMsg, uploadAssets } from '../src/lib/api';
import { DEFAULT_LOCATION, getCurrentLocation, pickImages } from '../src/lib/device';
import { colors, money, pretty } from '../src/lib/theme';

export default function Book() {
  const { mechanicId } = useLocalSearchParams();
  const instant = !!mechanicId;
  const vehicles = useApi(() => api.get('/vehicles').then((r) => r.data.vehicles));
  const cats = useApi(() => api.get('/categories').then((r) => r.data.categories));
  const mech = useApi(() => (mechanicId ? api.get(`/mechanics/${mechanicId}`).then((r) => r.data.mechanic) : Promise.resolve(null)), [mechanicId]);

  const [vehicleId, setVehicleId] = useState(null);
  const [picked, setPicked] = useState({}); // instant: slug -> true
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [when, setWhen] = useState(defaultWhen());
  const [loc, setLoc] = useState({ ...DEFAULT_LOCATION, address: '' });
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicles.data?.length && !vehicleId) setVehicleId((vehicles.data.find((v) => v.isDefault) || vehicles.data[0])._id);
  }, [vehicles.data, vehicleId]);

  const useMyLocation = async () => {
    setLocating(true);
    const l = await getCurrentLocation();
    setLocating(false);
    if (!l) return Alert.alert('Location unavailable', 'Allow location access, or type the service address manually.');
    setLoc({ lat: l.lat, lng: l.lng, city: l.city, address: l.address || loc.address });
  };
  useEffect(() => { useMyLocation(); /* eslint-disable-next-line */ }, []);

  const catBySlug = Object.fromEntries((cats.data || []).map((c) => [c.slug, c]));
  const offered = (mech.data?.services || []).filter((s) => catBySlug[s.category]?.instantBook !== false);
  const total = offered.filter((s) => picked[s.category]).reduce((a, s) => a + (s.price || 0), 0);
  const selectedSlugs = Object.keys(picked).filter((k) => picked[k]);

  const submit = async () => {
    setError('');
    if (!vehicleId) return setError('Add a vehicle first');
    if (!loc.address.trim()) return setError('Enter the service address');
    if (instant && !selectedSlugs.length) return setError('Select at least one service');
    if (!instant && !category) return setError('Choose a service category');
    if (!instant && description.trim().length < 5) return setError('Describe the problem so mechanics can quote accurately');
    setBusy(true);
    try {
      const media = !instant && photos.length ? await uploadAssets(photos, 'jobs') : [];
      const body = {
        vehicleId, scheduledAt: when.toISOString(), description, media,
        location: { address: loc.address.trim(), city: loc.city, lat: loc.lat, lng: loc.lng },
        ...(instant ? { mechanicId, services: selectedSlugs } : { category }),
      };
      const { data } = await api.post('/jobs', body);
      if (!instant && data.matchedCount === 0) {
        Alert.alert('No mechanics available yet', 'No verified mechanic currently matches this service, place and time. Your request stays open. You could try another time.');
      }
      router.replace(`/job/${data.job._id}`);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const ready = !vehicles.loading && !cats.loading && !mech.loading;
  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title={instant ? 'Book Service' : 'Request Repair Quotes'} />
      {!ready ? <Loading /> : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {instant && mech.data && <Card><Row style={{ gap: 8 }}><Ionicons name="construct" size={18} color={colors.blue} /><Body style={{ fontWeight: '700' }}>{mech.data.shopName || mech.data.name}</Body></Row></Card>}

          <H2>Select vehicle</H2>
          {vehicles.data?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {vehicles.data.map((v) => <Chip key={v._id} label={`${v.make} ${v.model}${v.plate ? ' · ' + v.plate : ''}`} active={vehicleId === v._id} onPress={() => setVehicleId(v._id)} />)}
            </ScrollView>
          ) : (
            <Card><Muted>You have no vehicles yet.</Muted><Button title="Add a vehicle" onPress={() => router.push('/vehicles')} style={{ marginTop: 10 }} /></Card>
          )}

          {instant ? (
            <>
              <H2>Select service</H2>
              <Card>
                {offered.length ? offered.map((s) => (
                  <Check key={s.category} checked={!!picked[s.category]} onPress={() => setPicked({ ...picked, [s.category]: !picked[s.category] })} label={pretty(s.category)} right={<Body style={{ fontWeight: '700' }}>{money(s.price)}</Body>} />
                )) : <Muted>This mechanic has no instant-book services. Go back and use "Request repair quotes" from Home.</Muted>}
              </Card>
            </>
          ) : (
            <>
              <H2>What does your vehicle need?</H2>
              {!cats.data?.length && <Muted style={{ marginBottom: 12 }}>No service categories found. Ask the admin to add some (or run the backend seed), then reopen this screen.</Muted>}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {cats.data?.map((c) => <Chip key={c.slug} label={c.name} active={category === c.slug} onPress={() => setCategory(c.slug)} />)}
              </ScrollView>
              <Field label="Describe the problem" multiline placeholder="e.g. Grinding noise from the front wheels when braking" value={description} onChangeText={setDescription} />
              <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {photos.map((p, i) => (
                  <Pressable key={p.uri} onPress={() => setPhotos(photos.filter((_, j) => j !== i))}>
                    <Image source={{ uri: p.uri }} style={{ width: 70, height: 70, borderRadius: 10 }} />
                    <View style={{ position: 'absolute', right: 2, top: 2, backgroundColor: '#000A', borderRadius: 10 }}><Ionicons name="close" size={16} color="#fff" /></View>
                  </Pressable>
                ))}
                {photos.length < 4 && (
                  <Pressable onPress={async () => setPhotos([...photos, ...(await pickImages({ max: 4 - photos.length }))].slice(0, 4))} style={{ width: 70, height: 70, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="camera-outline" size={24} color={colors.blue} />
                  </Pressable>
                )}
              </Row>
            </>
          )}

          <H2>Preferred date & time</H2>
          <DateTimeField value={when} onChange={setWhen} />

          <H2>Service location</H2>
          <Field icon="location-outline" placeholder="House no, street, area" value={loc.address} onChangeText={(t) => setLoc({ ...loc, address: t })} style={{ marginBottom: 6 }} />
          <Pressable onPress={useMyLocation} style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.blue, fontWeight: '600' }}>{locating ? 'Locating…' : 'Use my current location'}</Text>
          </Pressable>

          {instant && <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}><Body style={{ fontWeight: '700' }}>Total</Body><Body style={{ fontWeight: '800', fontSize: 18 }}>{money(total)}</Body></Row>}
          {!instant && <Muted style={{ marginBottom: 12 }}>Your request goes only to verified mechanics near you who offer this service, have the right equipment and are free at that time. They see an approximate area until you book.</Muted>}
          <ErrorText>{error}</ErrorText>
          <Button title={instant ? 'Confirm Booking' : 'Post Request'} onPress={submit} loading={busy} disabled={!vehicleId} />
        </ScrollView>
      )}
    </Screen>
  );
}