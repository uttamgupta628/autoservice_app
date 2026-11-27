import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Button, Card, Chip, Divider, ErrorText, Field, H2, Muted, Row } from './ui';
import { PartsSection, PartsSummary, PARTS_LABEL, defaultParts, partsProblem, toApiParts } from './parts';
import { api, errMsg } from '../lib/api';
import { colors } from '../lib/theme';

export const CLASS_LABEL = { diagnostic: 'Diagnostic', repair: 'Repair', installation: 'Installation' };
const CLASS_FULL = { diagnostic: 'Diagnostic inspection', repair: 'Repair', installation: 'Installation' };
const LEVEL_COLOR = { likely: colors.green, possible: colors.amber, 'less likely': colors.muted };

/** Small action runner: shows the error, reloads the job when done. */
function useRun(reload) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const run = async (key, fn, after) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      after?.();
      await reload();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };
  return { busy, error, run };
}

export function ClassPill({ cls, urgent }) {
  if (!cls && !urgent) return null;
  return (
    <Row style={{ gap: 6 }}>
      {!!cls && <View style={{ backgroundColor: '#EAF2FE', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 }}><Text style={{ color: colors.blue, fontWeight: '800', fontSize: 11 }}>{CLASS_LABEL[cls].toUpperCase()}</Text></View>}
      {!!urgent && <View style={{ backgroundColor: '#FDECEC', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 }}><Text style={{ color: colors.danger, fontWeight: '800', fontSize: 11 }}>URGENT</Text></View>}
    </Row>
  );
}

/** The structured symptom report the mechanic reads before quoting (the owner sees the same report). */
export function DiagnosisCard({ job }) {
  const d = job.diagnosis;
  if (!d?.symptomId) return null;
  const urgent = d.safety?.level === 'urgent';
  const warn = d.safety?.level === 'warning';
  return (
    <>
      <H2>Symptom report</H2>
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '800', fontSize: 16 }}>{d.symptomLabel}</Body>
            {!!d.areaLabel && <Muted>Problem area: {d.areaLabel}</Muted>}
          </View>
          <ClassPill cls={d.classification} urgent={urgent} />
        </Row>

        {(urgent || warn) && (
          <View style={{ backgroundColor: urgent ? '#FDECEC' : '#FFF6E5', borderRadius: 12, padding: 12, marginTop: 10 }}>
            <Row style={{ gap: 8, marginBottom: 4 }}>
              <Ionicons name="warning" size={18} color={urgent ? colors.danger : colors.amber} />
              <Body style={{ fontWeight: '800', color: urgent ? colors.danger : '#9A6A12' }}>{urgent ? 'Safety: urgent' : 'Safety notice'}</Body>
            </Row>
            {d.safety.messages?.map((m) => <Body key={m} style={{ marginBottom: 4 }}>{m}</Body>)}
          </View>
        )}

        <Divider />
        <Muted style={{ marginBottom: 4 }}>Customer's answers</Muted>
        {d.answers?.map((a) => (
          <View key={a.question} style={{ marginBottom: 6 }}>
            <Muted>{a.question}</Muted>
            <Body style={{ fontWeight: '600' }}>{a.answer}</Body>
          </View>
        ))}

        {d.causes?.length > 0 && (
          <>
            <Divider />
            <Muted style={{ marginBottom: 4 }}>Possible causes (not confirmed)</Muted>
            {d.causes.map((c) => (
              <Row key={c.label} style={{ justifyContent: 'space-between', gap: 8, paddingVertical: 2 }}>
                <Body style={{ flex: 1 }}>{c.label}</Body>
                <Text style={{ color: LEVEL_COLOR[c.level], fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>{c.level}</Text>
              </Row>
            ))}
          </>
        )}

        <Divider />
        <Row style={{ gap: 8, alignItems: 'flex-start' }}>
          <Ionicons name="clipboard-outline" size={18} color={colors.blue} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '700' }}>{d.serviceName} ({CLASS_FULL[d.classification]})</Body>
            {!!d.classificationReason && <Muted>{d.classificationReason}</Muted>}
          </View>
        </Row>
        {!!d.ownerNote && <Muted style={{ marginTop: 8 }}>Customer note: “{d.ownerNote}”</Muted>}
      </Card>
    </>
  );
}

/** Customer-supplied parts: details, confirmation, readiness, mechanic check, supplier steps (milestone 2). */
export function PartsCard({ job, isOwner, reload, supplierEnabled }) {
  const p = job.parts;
  const { busy, error, run } = useRun(reload);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [mismatch, setMismatch] = useState('');
  const [showMismatch, setShowMismatch] = useState(false);
  const [tracking, setTracking] = useState('');
  if (!p || p.source === 'mechanic') return null;

  const active = ['booked', 'in_progress'].includes(job.status);
  const canEdit = isOwner && ['requested', 'quoted', 'booked'].includes(job.status);
  const insp = p.inspection?.status || 'pending';
  const yes = (v) => <Ionicons name={v ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={v ? colors.green : '#B8C2D1'} />;

  const startEdit = () => {
    setDraft({ source: p.source, items: p.items.map((i) => ({ ...i, quantity: String(i.quantity), photos: i.photos || [] })), confirmed: false });
    setEditing(true);
  };
  const save = () => {
    const prob = partsProblem(draft);
    if (prob) return run('save', async () => { throw new Error(prob); });
    return run('save', async () => api.put(`/jobs/${job._id}/parts`, await toApiParts(draft)), () => setEditing(false));
  };

  return (
    <>
      <H2>Parts</H2>
      <Card>
        <Row style={{ gap: 8, marginBottom: 8 }}>
          <Ionicons name="cube" size={20} color={colors.blue} />
          <Body style={{ fontWeight: '800', flex: 1 }}>{PARTS_LABEL[p.source]}</Body>
        </Row>
        {p.source === 'customer' && !isOwner && <Muted style={{ marginBottom: 8 }}>The customer supplies these parts, so your quote should cover labour and travel only. Parts are not added to the quote.</Muted>}

        {editing ? (
          <>
            <PartsSection value={draft} onChange={setDraft} supplierEnabled={supplierEnabled} />
            <ErrorText>{error}</ErrorText>
            <Button title="Save and confirm parts" loading={busy === 'save'} onPress={save} />
            <Pressable onPress={() => setEditing(false)} style={{ alignItems: 'center', marginTop: 10 }}><Text style={{ color: colors.blue, fontWeight: '700' }}>Cancel</Text></Pressable>
          </>
        ) : (
          <>
            <PartsSummary parts={p} />
            <Divider />
            <Row style={{ gap: 8, marginBottom: 6 }}>{yes(p.customerConfirmed)}<Body>Customer confirmed the part details</Body></Row>
            <Row style={{ gap: 8, marginBottom: 6 }}>{yes(p.ready)}<Body>{p.ready ? 'Parts are ready for the visit' : 'Parts not marked ready yet'}</Body></Row>
            <Row style={{ gap: 8, marginBottom: 6 }}>
              <Ionicons name={insp === 'ok' ? 'checkmark-circle' : insp === 'mismatch' ? 'alert-circle' : 'ellipse-outline'} size={18} color={insp === 'ok' ? colors.green : insp === 'mismatch' ? colors.danger : '#B8C2D1'} />
              <Body>{insp === 'ok' ? 'Mechanic checked the parts: OK' : insp === 'mismatch' ? `Mechanic reported a mismatch: ${p.inspection.note}` : 'Mechanic has not checked the parts yet'}</Body>
            </Row>
            {p.fulfillment?.status && p.fulfillment.status !== 'none' && <Muted>Parts status: {p.fulfillment.status.replace('_', ' ')}{p.fulfillment.tracking ? ` · ${p.fulfillment.tracking}` : ''}</Muted>}
            <ErrorText>{error}</ErrorText>

            {isOwner && active && p.source !== 'supplier_pickup' && (
              p.ready
                ? <Button title="Parts are not ready" variant="ghost" size="sm" style={{ marginTop: 10 }} loading={busy === 'ready'} onPress={() => run('ready', () => api.post(`/jobs/${job._id}/parts/ready`, { ready: false }))} />
                : p.source === 'ship_to_customer'
                  ? (
                    <>
                      <Field placeholder="Tracking / order number (optional)" value={tracking} onChangeText={setTracking} style={{ marginTop: 10 }} />
                      <Row style={{ gap: 8 }}>
                        <Button title="Shipped" variant="ghost" size="sm" style={{ flex: 1 }} loading={busy === 'ship'} onPress={() => run('ship', () => api.post(`/jobs/${job._id}/parts/fulfillment`, { status: 'shipped', tracking }))} />
                        <Button title="Delivered" size="sm" style={{ flex: 1 }} loading={busy === 'deliv'} onPress={() => run('deliv', () => api.post(`/jobs/${job._id}/parts/fulfillment`, { status: 'delivered', tracking }))} />
                      </Row>
                    </>
                  )
                  : <Button title="Confirm parts are ready" variant="success" icon="checkmark-circle" style={{ marginTop: 10 }} loading={busy === 'ready'} onPress={() => run('ready', () => api.post(`/jobs/${job._id}/parts/ready`, {}))} />
            )}
            {canEdit && <Pressable onPress={startEdit} style={{ marginTop: 12 }}><Text style={{ color: colors.blue, fontWeight: '700' }}>Edit parts</Text></Pressable>}

            {!isOwner && active && (
              <>
                {p.source === 'supplier_pickup' && !p.ready && <Button title="Mark parts picked up" icon="cube" style={{ marginTop: 10 }} loading={busy === 'pick'} onPress={() => run('pick', () => api.post(`/jobs/${job._id}/parts/fulfillment`, { status: 'picked_up' }))} />}
                {insp !== 'ok' && (
                  <Row style={{ gap: 8, marginTop: 10 }}>
                    <Button title="Parts look correct" variant="success" size="sm" style={{ flex: 1 }} loading={busy === 'ok'} onPress={() => run('ok', () => api.post(`/jobs/${job._id}/parts/inspect`, { status: 'ok' }))} />
                    <Button title="Does not match" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setShowMismatch(!showMismatch)} />
                  </Row>
                )}
                {showMismatch && (
                  <View style={{ marginTop: 10 }}>
                    <Field placeholder="What does not match? (e.g. wrong size)" multiline value={mismatch} onChangeText={setMismatch} />
                    <Button title="Send to customer" variant="danger" size="sm" disabled={!mismatch.trim()} loading={busy === 'mm'} onPress={() => run('mm', () => api.post(`/jobs/${job._id}/parts/inspect`, { status: 'mismatch', note: mismatch }), () => { setShowMismatch(false); setMismatch(''); })} />
                  </View>
                )}
              </>
            )}
          </>
        )}
      </Card>
    </>
  );
}

/** Mechanic: this job looks misclassified (for example installation where a diagnostic inspection is safer). */
export function FlagClassification({ job, reload }) {
  const d = job.diagnosis;
  const { busy, error, run } = useRun(reload);
  const [open, setOpen] = useState(false);
  const [rec, setRec] = useState(null);
  const [note, setNote] = useState('');
  if (!d?.classification || !['requested', 'quoted', 'booked'].includes(job.status)) return null;
  const mineFlags = job.classificationFlags || [];
  const pending = mineFlags.find((f) => f.status === 'open');

  return (
    <Card>
      <Row style={{ gap: 8 }}>
        <Ionicons name="flag-outline" size={20} color={colors.amber} />
        <Body style={{ fontWeight: '800', flex: 1 }}>Is this classified correctly?</Body>
      </Row>
      <Muted style={{ marginTop: 4 }}>The customer's report says <Text style={{ fontWeight: '700' }}>{CLASS_FULL[d.classification]}</Text>. If you think another type of job fits better (for example a diagnostic inspection instead of installing a part), tell the customer before you quote.</Muted>
      {mineFlags.map((f) => (
        <Muted key={f._id} style={{ marginTop: 6 }}>Your suggestion: {CLASS_FULL[f.recommended]} · {f.status === 'open' ? 'waiting for the customer' : f.status}</Muted>
      ))}
      {!pending && !open && <Button title="Flag classification" variant="ghost" size="sm" style={{ marginTop: 10 }} onPress={() => setOpen(true)} />}
      {open && !pending && (
        <View style={{ marginTop: 10 }}>
          <Row style={{ gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {Object.keys(CLASS_FULL).filter((c) => c !== d.classification).map((c) => <Chip key={c} label={CLASS_FULL[c]} active={rec === c} onPress={() => setRec(c)} />)}
          </Row>
          <Field placeholder="Why do you recommend this?" multiline value={note} onChangeText={setNote} />
          <ErrorText>{error}</ErrorText>
          <Button title="Send recommendation" disabled={!rec || note.trim().length < 5} loading={busy === 'flag'} onPress={() => run('flag', () => api.post(`/jobs/${job._id}/flag-classification`, { recommended: rec, note }), () => { setOpen(false); setNote(''); })} />
        </View>
      )}
    </Card>
  );
}

/** Owner: answer a mechanic's classification suggestion. */
export function SuggestionList({ job, reload }) {
  const { busy, error, run } = useRun(reload);
  const open = (job.classificationFlags || []).filter((f) => f.status === 'open');
  if (!open.length || !['requested', 'quoted', 'booked'].includes(job.status)) return null;
  return (
    <>
      <H2>Mechanic suggestion</H2>
      <ErrorText>{error}</ErrorText>
      {open.map((f) => (
        <Card key={f._id} style={{ borderColor: colors.amber, borderWidth: 1.5 }}>
          <Body style={{ fontWeight: '800' }}>{f.mechanic?.name || 'A mechanic'} recommends: {CLASS_FULL[f.recommended]}</Body>
          <Muted style={{ marginTop: 2 }}>Currently: {CLASS_FULL[job.diagnosis?.classification]}</Muted>
          <Body style={{ marginTop: 8 }}>“{f.note}”</Body>
          <Row style={{ gap: 8, marginTop: 12 }}>
            <Button title="Accept change" size="sm" style={{ flex: 1 }} loading={busy === 'a' + f._id} onPress={() => run('a' + f._id, () => api.post(`/jobs/${job._id}/classification/respond`, { flagId: f._id, accept: true }))} />
            <Button title="Keep current" variant="ghost" size="sm" style={{ flex: 1 }} loading={busy === 'd' + f._id} onPress={() => run('d' + f._id, () => api.post(`/jobs/${job._id}/classification/respond`, { flagId: f._id, accept: false }))} />
          </Row>
        </Card>
      ))}
    </>
  );
}