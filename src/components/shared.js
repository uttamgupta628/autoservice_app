import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, fmtDate, fmtDateTime, fmtTime, money, pretty } from '../lib/theme';
import { Avatar, Body, Card, Empty, Muted, Row, Stars, StatusBadge, Verified } from './ui';

export function Brand({ light, size = 30 }) {
  return (
    <Row style={{ gap: 8, justifyContent: 'center' }}>
      <Ionicons name="car-sport" size={size + 4} color={light ? '#fff' : colors.blue} />
      <Text style={{ fontSize: size, fontWeight: '800', color: light ? '#fff' : colors.navy }}>
        Auto<Text style={{ color: colors.blue }}>Service</Text>
      </Text>
    </Row>
  );
}

/** Date + time picker pair (Android shows dialogs one after another, iOS shows compact pickers). */
export function DateTimeField({ label, value, onChange }) {
  const [mode, setMode] = useState(null);
  const min = new Date();
  const set = (d) => onChange(d);
  const box = { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', flex: 1 };

  if (Platform.OS === 'ios') {
    return (
      <View style={{ marginBottom: 12 }}>
        {label && <Text style={{ fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 6 }}>{label}</Text>}
        <Row style={{ gap: 8 }}>
          <DateTimePicker value={value} mode="date" minimumDate={min} onChange={(_, d) => d && set(new Date(new Date(d).setHours(value.getHours(), value.getMinutes())))} />
          <DateTimePicker value={value} mode="time" minuteInterval={15} onChange={(_, d) => d && set(new Date(new Date(value).setHours(d.getHours(), d.getMinutes())))} />
        </Row>
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 12 }}>
      {label && <Text style={{ fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 6 }}>{label}</Text>}
      <Row style={{ gap: 8 }}>
        <Pressable style={box} onPress={() => setMode('date')}>
          <Ionicons name="calendar-outline" size={18} color={colors.muted} />
          <Text style={{ marginLeft: 8, color: colors.text }}>{fmtDate(value)}</Text>
        </Pressable>
        <Pressable style={box} onPress={() => setMode('time')}>
          <Ionicons name="time-outline" size={18} color={colors.muted} />
          <Text style={{ marginLeft: 8, color: colors.text }}>{fmtTime(value)}</Text>
        </Pressable>
      </Row>
      {mode && (
        <DateTimePicker
          value={value}
          mode={mode}
          minimumDate={mode === 'date' ? min : undefined}
          is24Hour={false}
          onChange={(e, d) => {
            const m = mode;
            setMode(null);
            if (e.type === 'dismissed' || !d) return;
            if (m === 'date') set(new Date(new Date(d).setHours(value.getHours(), value.getMinutes(), 0, 0)));
            else set(new Date(new Date(value).setHours(d.getHours(), d.getMinutes(), 0, 0)));
          }}
        />
      )}
    </View>
  );
}

/** Next sensible default for a booking: tomorrow 10:00. */
export const defaultWhen = () => {
  const d = new Date(Date.now() + 86400000);
  d.setHours(10, 0, 0, 0);
  return d;
};

export function MechanicCard({ m }) {
  return (
    <Card onPress={() => router.push(`/mechanics/${m.id}`)}>
      <Row style={{ gap: 12 }}>
        <Avatar user={m} size={56} />
        <View style={{ flex: 1 }}>
          <Row style={{ gap: 6 }}>
            <Body style={{ fontWeight: '700' }} numberOfLines={1}>{m.shopName || m.name}</Body>
            {m.verified && <Verified />}
          </Row>
          <Row style={{ gap: 6, marginTop: 3 }}>
            <Ionicons name="star" size={14} color={colors.amber} />
            <Muted>{m.rating ? m.rating.toFixed(1) : 'New'} ({m.reviewCount} reviews)</Muted>
          </Row>
          <Muted style={{ marginTop: 2 }}>
            {m.distanceKm != null ? `${m.distanceKm} km · ` : ''}{m.city || ''}{Number.isFinite(m.startingPrice) ? ` · from ${money(m.startingPrice)}` : ''}
          </Muted>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
      </Row>
    </Card>
  );
}

export function JobCard({ job, role }) {
  const counterpart = role === 'owner' ? job.mechanic : job.owner;
  const quotes = job.quotes?.length || 0;
  const label = job.status === 'quoted' ? `${quotes} quote${quotes === 1 ? '' : 's'}` : undefined;
  return (
    <Card onPress={() => router.push(`/job/${job._id}`)}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Body style={{ fontWeight: '700' }}>{job.services?.length > 1 ? job.services.map((s) => s.name).join(', ') : pretty(job.category)}</Body>
          <Muted style={{ marginTop: 2 }}>
            {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : ''}
            {counterpart?.name ? ` · ${counterpart.name}` : job.status === 'requested' || job.status === 'quoted' ? ' · Waiting for mechanics' : ''}
          </Muted>
        </View>
        <StatusBadge status={job.status} label={label} />
      </Row>
      <Row style={{ marginTop: 10, justifyContent: 'space-between' }}>
        <Row style={{ gap: 6 }}><Ionicons name="calendar-outline" size={14} color={colors.muted} /><Muted>{fmtDateTime(job.scheduledAt)}</Muted></Row>
        {job.price > 0 && <Body style={{ fontWeight: '700' }}>{money(job.price)}</Body>}
      </Row>
    </Card>
  );
}

export function ReviewItem({ r }) {
  return (
    <Card>
      <Row style={{ gap: 10 }}>
        <Avatar user={r.owner} size={36} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>{r.owner?.name || 'Customer'}</Body>
          <Stars value={r.rating} />
        </View>
        <Muted>{fmtDate(r.createdAt)}</Muted>
      </Row>
      {r.comment ? <Body style={{ marginTop: 8 }}>{r.comment}</Body> : null}
    </Card>
  );
}

export function ConversationList({ conversations }) {
  if (!conversations?.length) return <Empty icon="chatbubbles-outline" text="No conversations yet. Messaging opens once a mechanic is booked." />;
  return conversations.map((c) => (
    <Card key={c.jobId} onPress={() => router.push(`/chat/${c.jobId}`)}>
      <Row style={{ gap: 12 }}>
        <Avatar user={c.with} size={46} />
        <View style={{ flex: 1 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body style={{ fontWeight: '700' }}>{c.with?.name}</Body>
            <Muted>{fmtTime(c.lastAt)}</Muted>
          </Row>
          <Muted numberOfLines={1} style={{ marginTop: 2 }}>{c.lastMessage || `${pretty(c.category)} · ${c.status.replace('_', ' ')}`}</Muted>
        </View>
        {c.unread > 0 && (
          <View style={{ backgroundColor: colors.blue, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{c.unread}</Text>
          </View>
        )}
      </Row>
    </Card>
  ));
}

export function LeadCard({ job }) {
  return (
    <Card onPress={() => router.push(`/job/${job._id}`)}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Body style={{ fontWeight: '700' }}>{pretty(job.category)}</Body>
        {job.myQuote ? <Muted style={{ color: colors.green, fontWeight: '700' }}>Quoted {money(job.myQuote.total)}</Muted> : <Muted style={{ color: colors.blue, fontWeight: '700' }}>New</Muted>}
      </Row>
      <Muted style={{ marginTop: 2 }}>{job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : ''} · {job.distanceKm} km away</Muted>
      <Body numberOfLines={2} style={{ marginTop: 6 }}>{job.description}</Body>
      <Row style={{ gap: 6, marginTop: 8 }}><Ionicons name="calendar-outline" size={14} color={colors.muted} /><Muted>{fmtDateTime(job.scheduledAt)}</Muted></Row>
    </Card>
  );
}
