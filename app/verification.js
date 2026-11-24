import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, H2, Muted, Body, Card, Row, Button, StatusBadge, Loading, ErrorText, useApi } from '../src/components/ui';
import { api, errMsg, uploadAssets } from '../src/lib/api';
import { pickImages } from '../src/lib/device';
import { useAuth } from '../src/lib/auth';
import { colors } from '../src/lib/theme';

const SLOTS = [
  { type: 'id_proof', label: 'ID proof (Aadhaar / Driving licence)', required: true, multi: false },
  { type: 'certificate', label: 'Skill certificate (optional)', required: false, multi: false },
  { type: 'shop_photo', label: 'Shop / work photos', required: true, multi: true },
];

export default function Verification() {
  const { refresh } = useAuth();
  const { data, loading, reload } = useApi(() => api.get('/mechanics/me/profile').then((r) => r.data.profile));
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (data) setDocs(data.documents); }, [data]);
  // coming back from the Service Categories screen should refresh the checklist
  useFocusEffect(useCallback(() => { reload(); }, []));  // uploads are saved before leaving, so nothing is lost
  if (loading || !data) return <Screen><TopBar title="Verification" /><Loading /></Screen>;

  const locked = ['submitted', 'verified', 'suspended'].includes(data.verificationStatus);
  const add = async (slot) => {
    const assets = await pickImages({ multiple: slot.multi, max: slot.multi ? 4 : 1 });
    if (!assets.length) return;
    setBusy(slot.type);
    setError('');
    try {
      const up = await uploadAssets(assets, 'verification');
      const fresh = up.map((u) => ({ type: slot.type, url: u.url, publicId: u.publicId, name: slot.label }));
      setDocs((d) => (slot.multi ? [...d, ...fresh] : [...d.filter((x) => x.type !== slot.type), ...fresh]));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const submit = async () => {
    setBusy('submit');
    setError('');
    try {
      await api.put('/mechanics/me/documents', { documents: docs });
      await api.post('/mechanics/me/submit');
      await refresh();
      reload();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const hasServices = data.services.some((s) => s.enabled);
  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="Verify Your Profile" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body style={{ fontWeight: '700' }}>Status</Body>
            <StatusBadge status="x" label={data.verificationStatus.replace('_', ' ')} color={data.verificationStatus === 'verified' ? colors.green : data.verificationStatus === 'rejected' || data.verificationStatus === 'suspended' ? colors.danger : colors.amber} />
          </Row>
          {data.verificationNote ? <Muted style={{ marginTop: 8 }}>Note from support: {data.verificationNote}</Muted> : null}
          {data.verificationStatus === 'submitted' && <Muted style={{ marginTop: 8 }}>Submitted. We usually review within 1 to 2 working days.</Muted>}
        </Card>

        {SLOTS.map((slot) => {
          const items = docs.filter((d) => d.type === slot.type);
          return (
            <Card key={slot.type}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}><Body style={{ fontWeight: '700' }}>{slot.label}</Body><Muted>{slot.required ? 'Required' : 'Optional'}</Muted></View>
                <Ionicons name={items.length ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={items.length ? colors.green : '#B8C2D1'} />
              </Row>
              <Row style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {items.map((d, i) => (
                  <View key={d.url + i}>
                    <Image source={{ uri: d.url }} style={{ width: 72, height: 72, borderRadius: 10 }} />
                    {!locked && <Pressable onPress={() => setDocs(docs.filter((x) => x !== d))} style={{ position: 'absolute', right: 2, top: 2, backgroundColor: '#000A', borderRadius: 10 }}><Ionicons name="close" size={16} color="#fff" /></Pressable>}
                  </View>
                ))}
                {!locked && (slot.multi || !items.length) && (
                  <Pressable onPress={() => add(slot)} disabled={!!busy} style={{ width: 72, height: 72, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={busy === slot.type ? 'hourglass-outline' : 'cloud-upload-outline'} size={24} color={colors.blue} />
                  </Pressable>
                )}
              </Row>
            </Card>
          );
        })}

        <Card>
          <Row style={{ gap: 10 }}>
            <Ionicons name={hasServices ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={hasServices ? colors.green : '#B8C2D1'} />
            <Body style={{ flex: 1 }}>Service categories selected</Body>
            {!hasServices && <Muted onPress={async () => { try { await api.put('/mechanics/me/documents', { documents: docs }); } catch (e) {} router.push('/services'); }} style={{ color: colors.blue, fontWeight: '700' }}>Set up</Muted>}
          </Row>
        </Card>

        <ErrorText>{error}</ErrorText>
        {!locked && <Button title="Submit for Verification" onPress={submit} loading={busy === 'submit'} disabled={!docs.some((d) => d.type === 'id_proof') || !docs.some((d) => d.type === 'shop_photo') || !hasServices} />}
      </ScrollView>
    </Screen>
  );
}