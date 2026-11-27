import { useEffect } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, H2, Muted, Body, Card, Row, Button, Chip, Segmented, Loading, useApi } from '../../src/components/ui';
import VehicleDiagram, { DiagramLegend, VIEWS, areasInView, areaShort } from '../../src/components/VehicleDiagram';
import { api } from '../../src/lib/api';
import { useDiagnose } from '../../src/lib/diagnose';
import { colors } from '../../src/lib/theme';

/** Step 1: choose the vehicle and tap the area where the problem is. */
export default function DiagnoseStart() {
  const d = useDiagnose();
  const { width } = useWindowDimensions();
  const vehicles = useApi(() => api.get('/vehicles').then((r) => r.data.vehicles));

  useEffect(() => {
    if (vehicles.data?.length && !d.vehicleId) d.setVehicleId((vehicles.data.find((v) => v.isDefault) || vehicles.data[0])._id);
  }, [vehicles.data]);

  const label = (id) => d.catalog?.areas.find((a) => a.id === id)?.label || areaShort(id);
  const diagramWidth = Math.min(width - 64, d.view === 'top' ? 230 : 340);

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <TopBar title="Diagnose a problem" subtitle="Step 1 of 3: where is the problem?" />
      {vehicles.loading || (!d.catalog && !d.catalogError) ? <Loading /> : (
        <View style={{ padding: 16, paddingBottom: 40 }}>
          <Muted style={{ marginBottom: 14 }}>Tap the area of your vehicle where the problem happens. We will ask a few questions, work out the possible causes and create a repair job for mechanics near you.</Muted>

          <H2>Your vehicle</H2>
          {vehicles.data?.length ? (
            <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {vehicles.data.map((v) => <Chip key={v._id} label={`${v.make} ${v.model}${v.plate ? ' · ' + v.plate : ''}`} active={d.vehicleId === v._id} onPress={() => d.setVehicleId(v._id)} />)}
            </Row>
          ) : (
            <Card><Muted>Add your vehicle first so mechanics know what they are working on.</Muted><Button title="Add a vehicle" onPress={() => router.push('/vehicles')} style={{ marginTop: 10 }} /></Card>
          )}

          <Segmented options={VIEWS} value={d.view} onChange={d.setView} />
          <Card style={{ marginTop: 12, alignItems: 'center', paddingVertical: 20 }}>
            <VehicleDiagram view={d.view} selected={d.areaId} onSelect={(id) => d.setAreaId(id === d.areaId ? null : id)} width={diagramWidth} />
            <DiagramLegend />
          </Card>

          <Row style={{ flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
            {areasInView(d.view).map((id) => <Chip key={id} label={areaShort(id)} active={d.areaId === id} onPress={() => d.setAreaId(id === d.areaId ? null : id)} />)}
          </Row>

          <Card style={{ backgroundColor: d.areaId ? '#E8F7F1' : '#fff', borderColor: d.areaId ? colors.green : colors.border }}>
            <Row style={{ gap: 10 }}>
              <Ionicons name={d.areaId ? 'checkmark-circle' : 'locate-outline'} size={22} color={d.areaId ? colors.green : colors.muted} />
              <Body style={{ flex: 1, fontWeight: '700' }}>{d.areaId ? label(d.areaId) : 'No area selected yet'}</Body>
            </Row>
          </Card>

          <Button title="Continue" disabled={!d.vehicleId} onPress={() => router.push('/diagnose/symptoms')} style={{ marginTop: 6 }} />
          <Pressable onPress={() => { d.setAreaId(null); router.push('/diagnose/symptoms'); }} style={{ alignItems: 'center', marginTop: 14 }} disabled={!d.vehicleId}>
            <Text style={{ color: colors.blue, fontWeight: '700' }}>I am not sure where the problem is</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}