import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput } from 'react-native';
import { Screen, TopBar, Muted, Body, Card, Row, Check, Button, Loading, ErrorText, useApi } from '../src/components/ui';
import { api, errMsg } from '../src/lib/api';
import { colors } from '../src/lib/theme';
import { router } from 'expo-router';

export default function Services() {
  const { data, loading } = useApi(() => api.get('/mechanics/me/profile').then((r) => r.data));
  const [rows, setRows] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;
    const mine = Object.fromEntries(data.profile.services.map((s) => [s.category, s]));
    setRows(Object.fromEntries(data.categories.map((c) => [c.slug, { enabled: !!mine[c.slug]?.enabled, price: String(mine[c.slug]?.price ?? c.basePrice) }])));
  }, [data]);

  const have = (profile, need) => need.every((n) => profile.equipment.map((e) => e.toLowerCase()).includes(n.toLowerCase()));
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api.put('/mechanics/me/services', { services: Object.entries(rows).map(([category, r]) => ({ category, enabled: r.enabled, price: Number(r.price) || 0 })) });
      Alert.alert('Saved', 'Your service catalog is updated.');
      router.back();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="Service Categories" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {loading || !data ? <Loading /> : (
          <>
            <Muted style={{ marginBottom: 10 }}>Choose what you offer and set your price. You only receive leads for enabled services, and some services need specific equipment on your profile.</Muted>
            {data.categories.map((c) => {
              const r = rows[c.slug] || { enabled: false, price: '' };
              const missing = c.requiredEquipment.filter((n) => !data.profile.equipment.map((e) => e.toLowerCase()).includes(n.toLowerCase()));
              return (
                <Card key={c.slug}>
                  <Check checked={r.enabled} onPress={() => setRows({ ...rows, [c.slug]: { ...r, enabled: !r.enabled } })} label={c.name} />
                  {r.enabled && (
                    <Row style={{ gap: 8, marginLeft: 34 }}>
                      <Muted>Price ₹</Muted>
                      <TextInput value={r.price} onChangeText={(t) => setRows({ ...rows, [c.slug]: { ...r, price: t.replace(/[^0-9.]/g, '') } })} keyboardType="decimal-pad" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, minWidth: 90, height: 38, backgroundColor: '#fff' }} />
                    </Row>
                  )}
                  {missing.length > 0 && <Text style={{ color: colors.amber, fontSize: 12, marginTop: 6, marginLeft: 34 }}>Needs equipment: {missing.join(', ')} (add it in Edit Profile to receive these jobs)</Text>}
                </Card>
              );
            })}
            {!data.categories.length && <Muted>No service categories exist yet. Restart the backend (it creates the defaults), then reopen this screen.</Muted>}
            <ErrorText>{error}</ErrorText>
            <Button title="Save" onPress={save} loading={busy} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}