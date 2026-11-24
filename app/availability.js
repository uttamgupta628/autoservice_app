import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, H2, Muted, Body, Card, Row, Field, Chip, Toggle, Button, Loading, ErrorText, useApi } from '../src/components/ui';
import { api, errMsg } from '../src/lib/api';
import { getCurrentLocation } from '../src/lib/device';
import { useAuth } from '../src/lib/auth';
import { colors } from '../src/lib/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Availability() {
  const { refresh } = useAuth();
  const { data, loading } = useApi(() => api.get('/mechanics/me/profile').then((r) => r.data.profile));
  const [f, setF] = useState(null);
  const [blocked, setBlocked] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data) setF({ isOnline: data.isOnline, workingDays: data.workingDays, workStart: data.workStart, workEnd: data.workEnd, serviceRadiusKm: String(data.serviceRadiusKm), blockedDates: data.blockedDates, city: data.city || '', address: data.address || '', lat: data.location.coordinates[1], lng: data.location.coordinates[0] });
  }, [data]);
  if (loading || !f) return <Screen><TopBar title="Availability" /><Loading /></Screen>;

  const toggleDay = (d) => setF({ ...f, workingDays: f.workingDays.includes(d) ? f.workingDays.filter((x) => x !== d) : [...f.workingDays, d].sort() });
  const useLoc = async () => {
    const l = await getCurrentLocation();
    if (!l) return Alert.alert('Location unavailable', 'Allow location access to set your base location.');
    setF({ ...f, lat: l.lat, lng: l.lng, city: l.city || f.city, address: l.address || f.address });
  };
  const addBlocked = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blocked)) return Alert.alert('Use YYYY-MM-DD', 'Example: 2026-12-25');
    if (!f.blockedDates.includes(blocked)) setF({ ...f, blockedDates: [...f.blockedDates, blocked].sort() });
    setBlocked('');
  };
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api.put('/mechanics/me/profile', { ...f, serviceRadiusKm: Number(f.serviceRadiusKm) });
      await refresh();
      router.back();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="Set Availability" />
      <View style={{ padding: 16 }}>
        <Card><Row style={{ justifyContent: 'space-between' }}><View><Body style={{ fontWeight: '700' }}>Available for jobs</Body><Muted>Turn off to stop receiving leads</Muted></View><Toggle value={f.isOnline} onValueChange={(v) => setF({ ...f, isOnline: v })} /></Row></Card>

        <H2>Working days</H2>
        <Row style={{ flexWrap: 'wrap', marginBottom: 6 }}>{DAYS.map((d, i) => <Chip key={d} label={d} active={f.workingDays.includes(i)} onPress={() => toggleDay(i)} />)}</Row>

        <H2 style={{ marginTop: 10 }}>Working hours (24h, HH:MM)</H2>
        <Row style={{ gap: 10 }}>
          <Field style={{ flex: 1 }} label="From" value={f.workStart} onChangeText={(t) => setF({ ...f, workStart: t })} placeholder="09:00" maxLength={5} />
          <Field style={{ flex: 1 }} label="To" value={f.workEnd} onChangeText={(t) => setF({ ...f, workEnd: t })} placeholder="19:00" maxLength={5} />
        </Row>

        <H2>Work area</H2>
        <Field label="Service radius (km)" keyboardType="number-pad" value={f.serviceRadiusKm} onChangeText={(t) => setF({ ...f, serviceRadiusKm: t })} />
        <Field label="City" value={f.city} onChangeText={(t) => setF({ ...f, city: t })} />
        <Field label="Shop / base address" value={f.address} onChangeText={(t) => setF({ ...f, address: t })} />
        <Pressable onPress={useLoc} style={{ marginBottom: 16 }}><Text style={{ color: colors.blue, fontWeight: '600' }}>Use my current location as base ({f.lat.toFixed(3)}, {f.lng.toFixed(3)})</Text></Pressable>

        <H2>Days off</H2>
        <Row style={{ gap: 8 }}>
          <Field style={{ flex: 1, marginBottom: 0 }} placeholder="YYYY-MM-DD" value={blocked} onChangeText={setBlocked} maxLength={10} />
          <Button title="Add" onPress={addBlocked} style={{ minHeight: 48 }} />
        </Row>
        <Row style={{ flexWrap: 'wrap', marginTop: 10, marginBottom: 16 }}>{f.blockedDates.map((d) => <Chip key={d} label={`${d}  ✕`} onPress={() => setF({ ...f, blockedDates: f.blockedDates.filter((x) => x !== d) })} />)}</Row>

        <ErrorText>{error}</ErrorText>
        <Button title="Save" onPress={save} loading={busy} />
      </View>
    </Screen>
  );
}
