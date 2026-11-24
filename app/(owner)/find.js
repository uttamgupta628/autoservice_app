import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, H1, Field, Chip, Loading, Empty, useApi, ErrorText } from '../../src/components/ui';
import { MechanicCard } from '../../src/components/shared';
import { api } from '../../src/lib/api';
import { getCurrentLocation } from '../../src/lib/device';

const SORTS = [{ v: 'relevance', l: 'Best match' }, { v: 'distance', l: 'Nearest' }, { v: 'rating', l: 'Top rated' }, { v: 'price', l: 'Lowest price' }];

export default function Find() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('relevance');
  const [loc, setLoc] = useState(null);
  const cats = useApi(() => api.get('/categories').then((r) => r.data.categories));

  useEffect(() => { getCurrentLocation().then(setLoc); }, []);
  useEffect(() => { const t = setTimeout(() => setQuery(q), 350); return () => clearTimeout(t); }, [q]);

  const { data, loading, error, pull, refreshing } = useApi(
    () => api.get('/mechanics', { params: { q: query || undefined, category: category || undefined, sort: sort === 'distance' && !loc ? 'relevance' : sort, lat: loc?.lat, lng: loc?.lng } }).then((r) => r.data.mechanics),
    [query, category, sort, loc]
  );

  return (
    <Screen onRefresh={pull} refreshing={refreshing}>
      <H1 style={{ marginBottom: 12 }}>Find Mechanics</H1>
      <Field icon="search" placeholder="Search by name, shop or service" value={q} onChangeText={setQ} style={{ marginBottom: 8 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <Chip label="All services" active={!category} onPress={() => setCategory('')} />
        {cats.data?.map((c) => <Chip key={c.slug} label={c.name} active={category === c.slug} onPress={() => setCategory(c.slug)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {SORTS.map((s) => <Chip key={s.v} label={s.l} active={sort === s.v} onPress={() => setSort(s.v)} />)}
      </ScrollView>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : data?.length ? data.map((m) => <MechanicCard key={m.id} m={m} />) : <Empty icon="search-outline" text="No verified mechanics match. Try another service or search." />}
    </Screen>
  );
}
