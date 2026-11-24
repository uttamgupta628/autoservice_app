import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen, TopBar, Muted, Field, Button, Loading, ErrorText, useApi } from '../src/components/ui';
import { api, errMsg } from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { getCurrentLocation } from '../src/lib/device';
import { colors } from '../src/lib/theme';

const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function EditProfile() {
  const { user, refresh } = useAuth();
  const { data, loading } = useApi(() => api.get('/mechanics/me/profile').then((r) => r.data));
  const [f, setF] = useState(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (data) setF({ shopName: data.profile.shopName || '', bio: data.profile.bio || '', experienceYears: String(data.profile.experienceYears || 0), vehicleMakes: data.profile.vehicleMakes.join(', '), equipment: data.profile.equipment.join(', '), city: data.profile.city || '', radius: String(data.profile.serviceRadiusKm || 10), lat: data.profile.location?.coordinates?.[1], lng: data.profile.location?.coordinates?.[0] });
  }, [data]);
  if (loading || !f) return <Screen><TopBar title="Edit Profile" /><Loading /></Screen>;
  const set = (k) => (v) => setF({ ...f, [k]: v });
  const required = [...new Set(data.categories.flatMap((c) => c.requiredEquipment))];

  const useMyLocation = async () => {
    setLocating(true);
    const l = await getCurrentLocation();
    setLocating(false);
    if (!l) return setError('Location unavailable. Allow location access and try again.');
    setError('');
    setF((p) => ({ ...p, lat: l.lat, lng: l.lng, city: l.city || p.city }));
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api.put('/auth/me', { name, phone });
      await api.put('/mechanics/me/profile', { shopName: f.shopName, bio: f.bio, experienceYears: Number(f.experienceYears) || 0, vehicleMakes: list(f.vehicleMakes), equipment: list(f.equipment), city: f.city, serviceRadiusKm: Number(f.radius) || 10, lat: f.lat, lng: f.lng });
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
      <TopBar title="Edit Profile" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Field label="Your name" value={name} onChangeText={setName} />
        <Field label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Field label="Shop / business name" value={f.shopName} onChangeText={set('shopName')} />
        <Field label="About you" multiline value={f.bio} onChangeText={set('bio')} placeholder="Experience, specialities, warranty…" />
        <Field label="Years of experience" keyboardType="number-pad" value={f.experienceYears} onChangeText={set('experienceYears')} />
        <Field label="Vehicle makes you work on" placeholder="Hyundai, Honda, Toyota (leave empty for all)" value={f.vehicleMakes} onChangeText={set('vehicleMakes')} />
        <Field label="Equipment" placeholder="Comma separated" value={f.equipment} onChangeText={set('equipment')} style={{ marginBottom: 4 }} />
        <Muted style={{ marginBottom: 16 }}>Equipment used by some services: {required.join(', ') || 'none'}. Use these exact names to unlock those jobs.</Muted>
        <Field label="City" value={f.city} onChangeText={set('city')} />
        <Field label="Service radius (km)" keyboardType="number-pad" value={f.radius} onChangeText={set('radius')} />
        <Pressable onPress={useMyLocation} style={{ marginBottom: 4 }}>
          <Text style={{ color: colors.blue, fontWeight: '700' }}>{locating ? 'Locating…' : 'Use my current location as my shop location'}</Text>
        </Pressable>
        <Muted style={{ marginBottom: 16 }}>{f.lat != null ? `Saved location: ${Number(f.lat).toFixed(4)}, ${Number(f.lng).toFixed(4)}. ` : ''}You only get requests inside your radius from this point.</Muted>
        <ErrorText>{error}</ErrorText>
        <Button title="Save changes" onPress={save} loading={busy} />
      </ScrollView>
    </Screen>
  );
}