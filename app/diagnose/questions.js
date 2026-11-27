import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, H2, Muted, Body, Button, Loading, ErrorText, useApi } from '../../src/components/ui';
import { api } from '../../src/lib/api';
import { useDiagnose } from '../../src/lib/diagnose';
import { colors } from '../../src/lib/theme';

/** Step 3: one guided question per screen. Each question is its own route, so the system back button goes to the previous one. */
export default function Questions() {
  const { i } = useLocalSearchParams();
  const idx = Number(i) || 0;
  const d = useDiagnose();
  const sym = useApi(() => (d.symptom ? api.get(`/diagnostics/symptoms/${d.symptom.id}`).then((r) => r.data.symptom) : Promise.resolve(null)), [d.symptom?.id]);

  useEffect(() => { if (!d.symptom) router.replace('/diagnose/symptoms'); }, [d.symptom]);
  if (sym.loading || !sym.data) return <Screen><TopBar title="A few questions" /><Loading /><ErrorText>{sym.error}</ErrorText></Screen>;

  const qs = sym.data.questions;
  const q = qs[idx];
  const chosen = q && d.answers[q.id];
  const last = idx >= qs.length - 1;
  const next = () => (last ? router.push('/diagnose/result') : router.push(`/diagnose/questions?i=${idx + 1}`));

  if (!q) return null;
  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title={sym.data.label} subtitle={`Question ${idx + 1} of ${qs.length}`} />
      <View style={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: '#E3E8EF', marginBottom: 20 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.blue, width: `${((idx + 1) / qs.length) * 100}%` }} />
        </View>
        <H2 style={{ fontSize: 20, lineHeight: 27, marginBottom: 14 }}>{q.text}</H2>
        {q.options.map((o) => {
          const on = chosen === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => d.answer(q.id, o.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 10, backgroundColor: on ? '#EAF2FE' : '#fff', borderColor: on ? colors.blue : colors.border }}
            >
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? colors.blue : '#A0AEC0'} />
              <Body style={{ flex: 1, fontWeight: on ? '700' : '500', color: o.id === 'unsure' ? colors.muted : colors.text }}>{o.label}</Body>
            </Pressable>
          );
        })}
        <Button title={last ? 'See possible causes' : 'Next'} disabled={!chosen} onPress={next} style={{ marginTop: 10 }} />
        <Muted style={{ textAlign: 'center', marginTop: 12 }}>Not sure? Choose “Not sure”. The mechanic will check it on site.</Muted>
      </View>
    </Screen>
  );
}