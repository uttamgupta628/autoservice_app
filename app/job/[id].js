import { useState } from 'react';
import { Alert, Image, Linking, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar, Body, Button, Card, Divider, ErrorText, Field, H2, Loading, Muted, Row, Screen, Stars, StatusBadge, TopBar, useApi,
} from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { api, errMsg } from '../../src/lib/api';
import { colors, fmtDate, fmtDateTime, money, pretty } from '../../src/lib/theme';

export default function JobDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { data, loading, error, reload, pull, refreshing } = useApi(() => api.get(`/jobs/${id}`).then((r) => r.data), [id]);

  if (loading && !data) return <Screen><TopBar title="Job" /><Loading /></Screen>;
  if (!data) return <Screen><TopBar title="Job" /><ErrorText>{error}</ErrorText></Screen>;
  const { job, payment, review } = data;
  const isOwner = user.role === 'owner';

  return (
    <Screen padded={false} edges={['top', 'bottom']} onRefresh={pull} refreshing={refreshing}>
      <TopBar title={`Job J-${String(job._id).slice(-6).toUpperCase()}`} />
      <View style={{ padding: 16 }}>
        <Summary job={job} isOwner={isOwner} />
        {isOwner ? <OwnerActions job={job} payment={payment} review={review} reload={reload} /> : <MechanicActions job={job} payment={payment} reload={reload} />}
        <Timeline history={job.history} />
      </View>
    </Screen>
  );
}

/* ---------------- shared ---------------- */
function Summary({ job, isOwner }) {
  const other = isOwner ? job.mechanic : job.owner;
  const vehicle = job.vehicle;
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <H2 style={{ marginBottom: 2 }}>{job.services?.length > 1 ? job.services.map((s) => s.name).join(', ') : pretty(job.category)}</H2>
          <Muted>{vehicle ? `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}${vehicle.plate ? ' · ' + vehicle.plate : ''}` : ''}</Muted>
        </View>
        <StatusBadge status={job.status} />
      </Row>
      <Divider />
      <Info icon="calendar-outline" text={fmtDateTime(job.scheduledAt)} />
      <Info icon="location-outline" text={job.location?.address || job.location?.city} />
      {job.location?.approximate && <Muted style={{ marginLeft: 26, marginBottom: 6 }}>Exact address is shared once the booking is confirmed.</Muted>}
      {job.description ? <Info icon="document-text-outline" text={job.description} /> : null}
      {job.price > 0 && <Info icon="cash-outline" text={`${money(job.price)}`} bold />}
      {job.media?.length > 0 && (
        <ScrollView horizontal style={{ marginTop: 10 }}>
          {job.media.map((m) => <Image key={m.url} source={{ uri: m.url }} style={{ width: 90, height: 90, borderRadius: 10, marginRight: 8 }} />)}
        </ScrollView>
      )}
      {other?.name && (
        <>
          <Divider />
          <Row style={{ gap: 12 }}>
            <Avatar user={other} size={44} />
            <View style={{ flex: 1 }}>
              <Muted>{isOwner ? 'Mechanic' : 'Customer'}</Muted>
              <Body style={{ fontWeight: '700' }}>{other.name}</Body>
            </View>
            {other.phone ? <Ionicons name="call" size={22} color={colors.blue} onPress={() => Linking.openURL(`tel:${other.phone}`)} style={{ marginRight: 14 }} /> : null}
            {job.mechanic && !['requested', 'quoted'].includes(job.status) && <Ionicons name="chatbubble-ellipses" size={22} color={colors.blue} onPress={() => router.push(`/chat/${job._id}`)} />}
          </Row>
        </>
      )}
    </Card>
  );
}
const Info = ({ icon, text, bold }) => (
  <Row style={{ alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
    <Ionicons name={icon} size={18} color={colors.muted} style={{ marginTop: 1 }} />
    <Body style={[{ flex: 1 }, bold && { fontWeight: '800' }]}>{text}</Body>
  </Row>
);

function Timeline({ history = [] }) {
  if (!history.length) return null;
  return (
    <Card>
      <H2>Activity</H2>
      {history.map((h, i) => (
        <Row key={i} style={{ alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue, marginTop: 5 }} />
          <View style={{ flex: 1 }}>
            <Body style={{ textTransform: 'capitalize' }}>{h.status.replace('_', ' ')}{h.note ? ` · ${h.note}` : ''}</Body>
            <Muted>{fmtDateTime(h.at)}</Muted>
          </View>
        </Row>
      ))}
    </Card>
  );
}

const useAction = (reload) => {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const run = async (key, fn, done) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      await reload();
      done?.();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };
  return { busy, error, run, setError };
};

/* ---------------- owner ---------------- */
function OwnerActions({ job, payment, review, reload }) {
  const { busy, error, run } = useAction(reload);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [issue, setIssue] = useState(null);

  const accept = (q) =>
    Alert.alert('Accept quote', `Book ${q.mechanic?.name} for ${money(q.total)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => run('accept' + q._id, () => api.post(`/jobs/${job._id}/quotes/${q._id}/accept`)) },
    ]);
  const cancel = () =>
    Alert.alert('Cancel this job?', 'The mechanic will be notified.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel job', style: 'destructive', onPress: () => run('cancel', () => api.post(`/jobs/${job._id}/cancel`, { reason: 'Cancelled by customer' })) },
    ]);

  return (
    <>
      <ErrorText>{error}</ErrorText>

      {['requested', 'quoted'].includes(job.status) && (
        <>
          <H2>Quotes</H2>
          {job.quotes?.length ? [...job.quotes].sort((a, b) => a.total - b.total).map((q, i) => (
            <Card key={q._id}>
              <Row style={{ gap: 12 }}>
                <Avatar user={q.mechanic} size={42} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '700' }}>{q.mechanic?.name}</Body>
                  {i === 0 && job.quotes.length > 1 && <Muted style={{ color: colors.green, fontWeight: '700' }}>Lowest price</Muted>}
                </View>
                <Body style={{ fontWeight: '800', fontSize: 18 }}>{money(q.total)}</Body>
              </Row>
              <Divider />
              <Line label="Labor" value={q.labor} /><Line label="Parts" value={q.parts} /><Line label="Travel" value={q.travel} /><Line label="Tax" value={q.tax} />
              {q.note ? <Muted style={{ marginTop: 6 }}>“{q.note}”</Muted> : null}
              {q.validUntil && <Muted style={{ marginTop: 4 }}>Valid until {fmtDateTime(q.validUntil)}{q.version > 1 ? ` · revised (v${q.version})` : ''}</Muted>}
              <Button title="Accept quote" variant="success" style={{ marginTop: 10 }} loading={busy === 'accept' + q._id} onPress={() => accept(q)} />
            </Card>
          )) : <Card><Muted>Waiting for mechanics to respond. You'll get a notification when a quote arrives.</Muted></Card>}
          <Button title="Cancel request" variant="ghost" loading={busy === 'cancel'} onPress={cancel} />
        </>
      )}

      {job.status === 'booked' && <Button title="Cancel booking" variant="ghost" loading={busy === 'cancel'} onPress={cancel} />}

      {['in_progress', 'booked'].includes(job.status) && job.changeOrders?.length > 0 && (
        <ChangeOrders job={job} owner onRespond={(co, approve) => run('co' + co._id, () => api.post(`/jobs/${job._id}/change-orders/${co._id}/respond`, { approve }))} busy={busy} />
      )}

      {job.status === 'completed' && (
        <>
          <Card>
            <H2>Invoice</H2>
            {job.changeOrders?.filter((c) => c.status === 'approved').length > 0 && (
              <>{job.changeOrders.filter((c) => c.status === 'approved').map((c) => <Line key={c._id} label={`Extra: ${c.description}`} value={c.amount} />)}<Divider /></>
            )}
            <Row style={{ justifyContent: 'space-between' }}><Body style={{ fontWeight: '800' }}>Total paid</Body><Body style={{ fontWeight: '800' }}>{money(payment?.amount ?? job.price)}</Body></Row>
            <Muted style={{ marginTop: 4 }}>Payment: {payment?.status || 'recorded'}{payment?.status === 'refunded' ? ' (refunded)' : ''}</Muted>
          </Card>

          {review ? (
            <Card><H2>Your review</H2><Stars value={review.rating} size={18} />{review.comment ? <Body style={{ marginTop: 6 }}>{review.comment}</Body> : null}</Card>
          ) : (
            <Card>
              <H2>Rate this service</H2>
              <Stars value={rating} size={32} onChange={setRating} />
              <Field style={{ marginTop: 10 }} multiline placeholder="Share your experience (optional)" value={comment} onChangeText={setComment} />
              <Button title="Submit review" loading={busy === 'review'} onPress={() => run('review', () => api.post('/reviews', { jobId: job._id, rating, comment }))} />
            </Card>
          )}
        </>
      )}

      {['booked', 'in_progress', 'completed'].includes(job.status) && (
        <>
          {issue === null ? <Button title="Report an issue" variant="ghost" icon="flag-outline" onPress={() => setIssue({ subject: '', description: '' })} /> : (
            <Card>
              <H2>Report an issue</H2>
              <Field placeholder="Subject (e.g. Overcharged)" value={issue.subject} onChangeText={(t) => setIssue({ ...issue, subject: t })} />
              <Field multiline placeholder="What happened?" value={issue.description} onChangeText={(t) => setIssue({ ...issue, description: t })} />
              <Row style={{ gap: 10 }}>
                <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setIssue(null)} />
                <Button title="Send" style={{ flex: 1 }} disabled={!issue.subject} loading={busy === 'issue'} onPress={() => run('issue', () => api.post('/disputes', { jobId: job._id, ...issue }), () => { setIssue(null); Alert.alert('Sent', 'Our support team will review your report.'); })} />
              </Row>
            </Card>
          )}
        </>
      )}
    </>
  );
}

const Line = ({ label, value }) => (
  <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}><Muted>{label}</Muted><Body>{money(value)}</Body></Row>
);

function ChangeOrders({ job, owner, onRespond, busy }) {
  return (
    <>
      <H2>Additional work</H2>
      {job.changeOrders.map((c) => (
        <Card key={c._id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Body style={{ flex: 1, fontWeight: '600' }}>{c.description}</Body>
            <Body style={{ fontWeight: '800' }}>{money(c.amount)}</Body>
          </Row>
          {c.status !== 'pending' ? <StatusBadge status={c.status} label={c.status} color={c.status === 'approved' ? colors.green : colors.danger} /> : owner ? (
            <Row style={{ gap: 10, marginTop: 10 }}>
              <Button title="Reject" variant="ghost" style={{ flex: 1 }} loading={busy === 'co' + c._id} onPress={() => onRespond(c, false)} />
              <Button title="Approve" variant="success" style={{ flex: 1 }} loading={busy === 'co' + c._id} onPress={() => onRespond(c, true)} />
            </Row>
          ) : <StatusBadge status="pending" label="Awaiting customer approval" />}
        </Card>
      ))}
    </>
  );
}

/* ---------------- mechanic ---------------- */
function MechanicActions({ job, payment, reload }) {
  const { busy, error, run } = useAction(reload);
  const assigned = !['requested', 'quoted'].includes(job.status);
  const mine = job.quotes?.[0];
  const [q, setQ] = useState({ labor: mine ? String(mine.labor) : '', parts: mine ? String(mine.parts) : '', travel: mine ? String(mine.travel) : '', note: mine?.note || '' });
  const [extra, setExtra] = useState({ description: '', amount: '' });
  const n = (v) => Number(v) || 0;

  if (!assigned) {
    const editable = !mine || mine.status === 'pending';
    return (
      <>
        <ErrorText>{error}</ErrorText>
        <H2>{mine ? 'Your quote' : 'Send a quote'}</H2>
        {mine && <Card><Row style={{ justifyContent: 'space-between' }}><Body style={{ fontWeight: '700' }}>Current total</Body><Body style={{ fontWeight: '800' }}>{money(mine.total)}</Body></Row><Muted>Version {mine.version} · tax included in total</Muted></Card>}
        {editable && (
          <Card>
            <Field label="Labor (₹) *" keyboardType="decimal-pad" value={q.labor} onChangeText={(t) => setQ({ ...q, labor: t })} />
            <Field label="Parts (₹)" keyboardType="decimal-pad" value={q.parts} onChangeText={(t) => setQ({ ...q, parts: t })} />
            <Field label="Travel (₹)" keyboardType="decimal-pad" value={q.travel} onChangeText={(t) => setQ({ ...q, travel: t })} />
            <Field label="Note to customer" multiline placeholder="Warranty, parts brand, what's included…" value={q.note} onChangeText={(t) => setQ({ ...q, note: t })} />
            <Muted style={{ marginBottom: 10 }}>Subtotal {money(n(q.labor) + n(q.parts) + n(q.travel))}. Tax is added automatically when you send.</Muted>
            <Button title={mine ? 'Update quote' : 'Accept job & send quote'} loading={busy === 'quote'} disabled={n(q.labor) <= 0} onPress={() => run('quote', () => api.post(`/jobs/${job._id}/quotes`, { labor: n(q.labor), parts: n(q.parts), travel: n(q.travel), note: q.note }))} />
          </Card>
        )}
        {!mine && <Button title="Decline" variant="ghost" loading={busy === 'decline'} onPress={() => run('decline', () => api.post(`/jobs/${job._id}/decline`), () => router.back())} />}
      </>
    );
  }

  return (
    <>
      <ErrorText>{error}</ErrorText>
      {job.location?.coordinates && job.status !== 'completed' && job.status !== 'cancelled' && (
        <Button title="Open in Maps" variant="ghost" icon="navigate-outline" style={{ marginBottom: 12 }} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${job.location.coordinates[1]},${job.location.coordinates[0]}`)} />
      )}

      {job.status === 'booked' && (
        <>
          <Button title="Check in & start job" icon="play" loading={busy === 'start'} onPress={() => run('start', () => api.post(`/jobs/${job._id}/status`, { status: 'in_progress' }))} />
          <View style={{ height: 10 }} />
          <Button title="Cancel booking" variant="ghost" loading={busy === 'cancel'} onPress={() => Alert.alert('Cancel booking?', 'Cancellations affect your reliability score.', [{ text: 'Keep', style: 'cancel' }, { text: 'Cancel', style: 'destructive', onPress: () => run('cancel', () => api.post(`/jobs/${job._id}/cancel`, { reason: 'Cancelled by mechanic' })) }])} />
        </>
      )}

      {job.changeOrders?.length > 0 && <ChangeOrders job={job} />}

      {job.status === 'in_progress' && (
        <>
          <Card>
            <H2>Request additional work</H2>
            <Field placeholder="What else is needed?" value={extra.description} onChangeText={(t) => setExtra({ ...extra, description: t })} />
            <Field placeholder="Amount (₹)" keyboardType="decimal-pad" value={extra.amount} onChangeText={(t) => setExtra({ ...extra, amount: t })} />
            <Button title="Send for approval" variant="amber" disabled={!extra.description || n(extra.amount) <= 0} loading={busy === 'co'} onPress={() => run('co', () => api.post(`/jobs/${job._id}/change-orders`, { description: extra.description, amount: n(extra.amount) }), () => setExtra({ description: '', amount: '' }))} />
          </Card>
          <Button title="Mark job complete" variant="success" icon="checkmark-circle" loading={busy === 'done'} onPress={() => run('done', () => api.post(`/jobs/${job._id}/status`, { status: 'completed' }))} />
        </>
      )}

      {job.status === 'completed' && payment && (
        <Card>
          <H2>Earnings for this job</H2>
          <Line label="Job total" value={payment.amount} /><Line label="Platform fee" value={-payment.platformFee} />
          <Divider /><Row style={{ justifyContent: 'space-between' }}><Body style={{ fontWeight: '800' }}>Your payout</Body><Body style={{ fontWeight: '800', color: colors.green }}>{money(payment.payout)}</Body></Row>
          <Muted style={{ marginTop: 4 }}>Payout status: {payment.payoutStatus}</Muted>
        </Card>
      )}
    </>
  );
}
