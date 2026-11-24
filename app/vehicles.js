import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, H2, Muted, Body, Card, Row, Field, Button, Loading, Empty, ErrorText, useApi } from '../src/components/ui';
import { api, errMsg } from '../src/lib/api';
import { colors } from '../src/lib/theme';

const BLANK = { make: '', model: '', year: '', plate: '', vin: '', mileage: '' };

export default function Vehicles() {
  const { data, loading, reload } = useApi(() => api.get('/vehicles').then((r) => r.data.vehicles));
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(BLANK);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/vehicles', { ...f, year: Number(f.year), mileage: f.mileage ? Number(f.mileage) : undefined, vin: f.vin || undefined });
      setF(BLANK);
      setAdding(false);
      reload();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = (v) =>
    Alert.alert('Remove vehicle', `Remove ${v.make} ${v.model}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { try { await api.delete(`/vehicles/${v._id}`); reload(); } catch (e) { Alert.alert('Cannot remove', errMsg(e)); } } },
    ]);
  const makeDefault = async (v) => { await api.put(`/vehicles/${v._id}`, { isDefault: true }); reload(); };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="My Garage" />
      <View style={{ padding: 16 }}>
        {loading ? <Loading /> : data?.length ? data.map((v) => (
          <Card key={v._id}>
            <Row style={{ gap: 12 }}>
              <Ionicons name="car-sport" size={30} color={colors.blue} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '700' }}>{v.year} {v.make} {v.model}</Body>
                <Muted>{[v.plate, v.mileage ? `${v.mileage.toLocaleString('en-IN')} km` : ''].filter(Boolean).join(' · ')}</Muted>
              </View>
              {v.isDefault ? <Muted style={{ color: colors.green, fontWeight: '700' }}>Default</Muted> : <Muted onPress={() => makeDefault(v)} style={{ color: colors.blue, fontWeight: '600' }}>Set default</Muted>}
              <Ionicons name="trash-outline" size={20} color={colors.danger} onPress={() => remove(v)} />
            </Row>
          </Card>
        )) : <Empty icon="car-outline" text="Add your first vehicle to book services" />}

        {adding ? (
          <Card>
            <H2>Add vehicle</H2>
            <Field label="Make *" placeholder="e.g. Hyundai" value={f.make} onChangeText={set('make')} />
            <Field label="Model *" placeholder="e.g. i20" value={f.model} onChangeText={set('model')} />
            <Field label="Year *" placeholder="e.g. 2020" keyboardType="number-pad" value={f.year} onChangeText={set('year')} maxLength={4} />
            <Field label="Registration number" placeholder="KA03AB1234" autoCapitalize="characters" value={f.plate} onChangeText={set('plate')} />
            <Field label="VIN (optional, 17 characters)" autoCapitalize="characters" value={f.vin} onChangeText={set('vin')} maxLength={17} />
            <Field label="Odometer (km)" keyboardType="number-pad" value={f.mileage} onChangeText={set('mileage')} />
            <ErrorText>{error}</ErrorText>
            <Row style={{ gap: 10 }}>
              <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button title="Save" onPress={save} loading={busy} disabled={!f.make || !f.model || !f.year} style={{ flex: 1 }} />
            </Row>
          </Card>
        ) : <Button title="Add vehicle" icon="add" onPress={() => setAdding(true)} />}
      </View>
    </Screen>
  );
}
