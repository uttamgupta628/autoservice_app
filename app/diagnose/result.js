import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, H2, Muted, Body, Card, Row, Field, Button, Check, Loading, ErrorText } from '../../src/components/ui';
import { DateTimeField, defaultWhen } from '../../src/components/shared';
import { PartsSection, defaultParts, partsProblem, toApiParts } from '../../src/components/parts';
import { api, errMsg, uploadAssets } from '../../src/lib/api';
import { DEFAULT_LOCATION, getCurrentLocation, pickImages } from '../../src/lib/device';
import { useDiagnose } from '../../src/lib/diagnose';
import { colors } from '../../src/lib/theme';

const LEVEL_COLOR = { likely: colors.green, possible: colors.amber, 'less likely': colors.muted };
const CLASS_ICON = { diagnostic: 'search-circle', repair: 'build', installation: 'construct' };

/** Step 3 result: possible causes, safety screening, service classification, then the generated repair job. */
export default function Result() {
  const d = useDiagnose();
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [ack, setAck] = useState(false);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [parts, setParts] = useState(defaultParts());
  const [when, setWhen] = useState(defaultWhen());
  const [loc, setLoc] = useState({ ...DEFAULT_LOCATION, address: '' });
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!d.symptom) return router.replace('/diagnose');
    api.post('/diagnostics/evaluate', { symptomId: d.symptom.id, areaId: d.areaId, answers: d.answers })
      .then((r) => { setRes(r.data.result); if (r.data.result.classification === 'installation') setParts(defaultParts('customer')); })
      .catch((e) => setError(errMsg(e)));
  }, []);

  const useMyLocation = async () => {
    setLocating(true);
    const l = await getCurrentLocation();
    setLocating(false);
    if (!l) return Alert.alert('Location unavailable', 'Allow location access, or type the service address manually.');
    setLoc({ lat: l.lat, lng: l.lng, city: l.city, address: l.address || loc.address });
  };
  useEffect(() => { useMyLocation(); /* eslint-disable-next-line */ }, []);

  if (!res) return <Screen><TopBar title="Possible causes" /><Loading label="Working out the possible causes…" /><ErrorText>{error}</ErrorText></Screen>;

  const urgent = res.safety.level === 'urgent';
  const warn = res.safety.level === 'warning';

  const submit = async () => {
    setError('');
    if (urgent && !ack) return setError('Please confirm you have read the safety warning');
    if (!loc.address.trim()) return setError('Enter the service address');
    const pp = partsProblem(parts);
    if (pp) return setError(pp);
    setBusy(true);
    try {
      const media = photos.length ? await uploadAssets(photos, 'jobs') : [];
      const { data } = await api.post('/jobs', {
        vehicleId: d.vehicleId, scheduledAt: when.toISOString(), media,
        location: { address: loc.address.trim(), city: loc.city, lat: loc.lat, lng: loc.lng },
        diagnosis: { symptomId: d.symptom.id, areaId: d.areaId, answers: d.answers, acknowledgeSafety: ack, ownerNote: note },
        parts: await toApiParts(parts),
      });
      if (data.matchedCount === 0) Alert.alert('No mechanics available yet', 'No verified mechanic currently matches this service, place and time. Your request stays open. You could try another time.');
      router.dismissAll?.();
      router.replace(`/job/${data.job._id}`);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="Possible causes" subtitle="Step 3 of 3: review and send" />
      <View style={{ padding: 16, paddingBottom: 40 }}>
        {(urgent || warn) && (
          <Card style={{ backgroundColor: urgent ? '#FDECEC' : '#FFF6E5', borderColor: urgent ? colors.danger : colors.amber, borderWidth: 1.5 }}>
            <Row style={{ gap: 10, marginBottom: 8 }}>
              <Ionicons name="warning" size={26} color={urgent ? colors.danger : colors.amber} />
              <Body style={{ fontWeight: '800', fontSize: 17, color: urgent ? colors.danger : '#9A6A12' }}>{urgent ? 'Urgent safety warning' : 'Safety notice'}</Body>
            </Row>
            {res.safety.messages.map((m) => <Body key={m} style={{ marginBottom: 6 }}>{m}</Body>)}
            {!!res.safety.advice && <Body style={{ fontWeight: '700', marginTop: 4 }}>{res.safety.advice}</Body>}
            {urgent && (
              <>
                <Button title="Call emergency services (112)" variant="danger" size="sm" icon="call" onPress={() => Linking.openURL('tel:112')} style={{ marginTop: 12 }} />
                <Check checked={ack} onPress={() => setAck(!ack)} label="I have read this warning. I will not drive the vehicle until it is checked." />
              </>
            )}
          </Card>
        )}

        <Card>
          <Row style={{ gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name={CLASS_ICON[res.classification]} size={30} color={colors.blue} />
            <View style={{ flex: 1 }}>
              <Muted>Recommended service</Muted>
              <Body style={{ fontWeight: '800', fontSize: 17 }}>{res.serviceName}</Body>
              <View style={{ alignSelf: 'flex-start', backgroundColor: '#EAF2FE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginVertical: 6 }}>
                <Text style={{ color: colors.blue, fontWeight: '800', fontSize: 12 }}>{res.classificationLabel.toUpperCase()}</Text>
              </View>
              <Muted>{res.classificationReason}</Muted>
            </View>
          </Row>
        </Card>

        {res.causes.length > 0 && (
          <>
            <H2>Possible causes</H2>
            <Card>
              {res.causes.map((c) => (
                <Row key={c.label} style={{ justifyContent: 'space-between', paddingVertical: 6, gap: 10 }}>
                  <Body style={{ flex: 1 }}>{c.label}</Body>
                  <Text style={{ color: LEVEL_COLOR[c.level], fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>{c.level}</Text>
                </Row>
              ))}
              <Muted style={{ marginTop: 8 }}>These are possible causes, not a confirmed diagnosis. A mechanic will confirm on site, and you approve any repair before it starts.</Muted>
            </Card>
          </>
        )}

        <H2>Your answers</H2>
        <Card>
          <Body style={{ fontWeight: '700', marginBottom: 6 }}>{res.symptom.label}{res.area ? ` · ${res.area.label}` : ''}</Body>
          {res.answers.map((a) => (
            <View key={a.question} style={{ marginBottom: 6 }}>
              <Muted>{a.question}</Muted>
              <Body style={{ fontWeight: '600' }}>{a.answer}</Body>
            </View>
          ))}
        </Card>

        <Field label="Anything else the mechanic should know? (optional)" multiline placeholder="When it started, what you tried, noises, smells…" value={note} onChangeText={setNote} />
        <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {photos.map((p, i) => (
            <Pressable key={p.uri} onPress={() => setPhotos(photos.filter((_, j) => j !== i))}>
              <Image source={{ uri: p.uri }} style={{ width: 64, height: 64, borderRadius: 10 }} />
              <View style={{ position: 'absolute', right: 2, top: 2, backgroundColor: '#000A', borderRadius: 10 }}><Ionicons name="close" size={14} color="#fff" /></View>
            </Pressable>
          ))}
          {photos.length < 4 && (
            <Pressable onPress={async () => setPhotos([...photos, ...(await pickImages({ max: 4 - photos.length }))].slice(0, 4))} style={{ width: 64, height: 64, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="camera-outline" size={22} color={colors.blue} />
            </Pressable>
          )}
        </Row>

        <PartsSection value={parts} onChange={setParts} supplierEnabled={!!d.catalog?.config?.supplierIntegrationEnabled} hint={res.classification === 'installation' ? 'You are having a part fitted. If you already have it, choose “I will supply the parts”.' : 'Only needed if you already have the parts.'} />

        <H2>Preferred date & time</H2>
        <DateTimeField value={when} onChange={setWhen} />
        <H2>Service location</H2>
        <Field icon="location-outline" placeholder="House no, street, area" value={loc.address} onChangeText={(t) => setLoc({ ...loc, address: t })} style={{ marginBottom: 6 }} />
        <Pressable onPress={useMyLocation} style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.blue, fontWeight: '600' }}>{locating ? 'Locating…' : 'Use my current location'}</Text>
        </Pressable>

        <Muted style={{ marginBottom: 12 }}>Your repair job goes to verified mechanics near you who have the right skills and equipment and are free at that time. They see the full symptom report before quoting, and only an approximate area until you book.</Muted>
        <ErrorText>{error}</ErrorText>
        <Button title="Generate repair job" onPress={submit} loading={busy} />
      </View>
    </Screen>
  );
}