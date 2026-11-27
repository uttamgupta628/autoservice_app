import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, H2, Muted, Body, Card, Row, Field, Loading, Empty } from '../../src/components/ui';
import { useDiagnose } from '../../src/lib/diagnose';
import { colors } from '../../src/lib/theme';

/** Step 2: pick the symptom. Searchable, grouped by category, narrowed to the tapped area. */
export default function Symptoms() {
  const d = useDiagnose();
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const area = d.catalog?.areas.find((a) => a.id === d.areaId);

  const groups = useMemo(() => {
    if (!d.catalog) return [];
    const term = q.trim().toLowerCase();
    let list = d.catalog.symptoms;
    if (term) list = list.filter((s) => [s.label, s.category, ...s.keywords].join(' ').toLowerCase().includes(term));
    else if (area && !all) list = list.filter((s) => s.areas.includes(area.id));
    const map = {};
    list.forEach((s) => (map[s.category] = [...(map[s.category] || []), s]));
    return Object.entries(map);
  }, [d.catalog, q, area, all]);

  const pick = (s) => { d.pickSymptom({ id: s.id, label: s.label }); router.push('/diagnose/questions?i=0'); };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="What is happening?" subtitle="Step 2 of 3" />
      {!d.catalog ? <Loading /> : (
        <View style={{ padding: 16, paddingBottom: 40 }}>
          <Field icon="search" placeholder="Search: noise, won't start, AC, brakes…" value={q} onChangeText={setQ} autoCorrect={false} style={{ marginBottom: 10 }} />
          {area && !q.trim() && (
            <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <Muted>{all ? 'Showing all problems' : `Problems for: ${area.label}`}</Muted>
              <Pressable onPress={() => setAll(!all)}><Text style={{ color: colors.blue, fontWeight: '700' }}>{all ? 'Only this area' : 'Show all'}</Text></Pressable>
            </Row>
          )}
          {!groups.length ? <Empty icon="search-outline" title="Nothing matches" text="Try another word, or choose “Something else”." /> : groups.map(([cat, items]) => (
            <View key={cat}>
              <H2>{cat}</H2>
              {items.map((s) => (
                <Card key={s.id} onPress={() => pick(s)}>
                  <Row style={{ gap: 10 }}>
                    <Body style={{ flex: 1, fontWeight: '600' }}>{s.label}</Body>
                    <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
                  </Row>
                </Card>
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}