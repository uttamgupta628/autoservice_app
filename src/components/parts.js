import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Card, Check, Chip, Field, H2, Muted, Row } from './ui';
import { uploadAssets } from '../lib/api';
import { pickImages } from '../lib/device';
import { colors } from '../lib/theme';

/**
 * Parts section shared by "Book service", the diagnostic result and the job screens.
 *   value = { source, items: [{ name, partNumber, brand, quantity, condition, notes, photos }], confirmed }
 * Milestone 1: the mechanic supplies the parts, or the customer supplies them and must confirm the details
 * before checkout. Milestone 2 options (supplier pick-up, shipped to the customer) are shown as "coming soon"
 * until the admin switches supplier integration on.
 */
const emptyItem = () => ({ name: '', partNumber: '', brand: '', quantity: '1', condition: 'new', notes: '', photos: [] });
export const defaultParts = (source = 'mechanic') => ({ source, items: source === 'mechanic' ? [] : [emptyItem()], confirmed: false });

export const PARTS_LABEL = {
  mechanic: 'Mechanic supplies the parts',
  customer: 'I will supply the parts',
  supplier_pickup: 'Mechanic picks the parts up from a supplier',
  ship_to_customer: 'Order online, shipped to me',
};

/** Returns a message when the parts block is not ready to submit, otherwise null. */
export function partsProblem(parts) {
  if (!parts || parts.source === 'mechanic') return null;
  if (!parts.items.length || parts.items.some((i) => !i.name.trim())) return 'Give every part a name';
  if (!parts.confirmed) return 'Confirm the part details before checkout';
  return null;
}

/** Uploads part photos and returns the shape the API expects. */
export async function toApiParts(parts) {
  if (!parts || parts.source === 'mechanic') return { source: 'mechanic' };
  const items = [];
  for (const i of parts.items) {
    const uploaded = i.photos.length ? await uploadAssets(i.photos.filter((p) => !p.url), 'parts') : [];
    items.push({
      name: i.name.trim(), partNumber: i.partNumber.trim(), brand: i.brand.trim(), quantity: Number(i.quantity) || 1,
      condition: i.condition, notes: i.notes.trim(), photos: [...i.photos.filter((p) => p.url).map((p) => ({ url: p.url, publicId: p.publicId })), ...uploaded.map((u) => ({ url: u.url, publicId: u.publicId }))],
    });
  }
  return { source: parts.source, items, confirmed: true };
}

function Option({ selected, disabled, title, text, onPress }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 8, backgroundColor: '#fff', borderColor: selected ? colors.blue : colors.border, opacity: disabled ? 0.55 : 1 }}
    >
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.blue : '#A0AEC0'} />
      <View style={{ flex: 1 }}>
        <Body style={{ fontWeight: '700' }}>{title}</Body>
        {!!text && <Muted style={{ marginTop: 2 }}>{text}</Muted>}
      </View>
    </Pressable>
  );
}

export function PartsSummary({ parts }) {
  return (
    <View>
      {parts.items.map((i, n) => (
        <Row key={n} style={{ alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <Ionicons name="cube-outline" size={18} color={colors.blue} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '700' }}>{i.quantity || 1} × {i.name}</Body>
            <Muted>{[i.brand, i.partNumber && `Part no. ${i.partNumber}`, i.condition].filter(Boolean).join(' · ')}</Muted>
            {!!i.notes && <Muted>{i.notes}</Muted>}
            {!!i.photos?.length && (
              <Row style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {i.photos.map((p, k) => <Image key={k} source={{ uri: p.uri || p.url }} style={{ width: 44, height: 44, borderRadius: 8 }} />)}
              </Row>
            )}
          </View>
        </Row>
      ))}
    </View>
  );
}

export function PartsSection({ value, onChange, supplierEnabled, hint }) {
  const set = (patch) => onChange({ ...value, ...patch, confirmed: patch.confirmed ?? false });
  const setItem = (idx, patch) => set({ items: value.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  const choose = (source) => onChange(value.source === source ? value : { ...defaultParts(source), items: source === 'mechanic' ? [] : value.items.length ? value.items : [emptyItem()] });
  const customer = value.source !== 'mechanic';

  return (
    <View style={{ marginBottom: 6 }}>
      <H2>Parts</H2>
      {!!hint && <Muted style={{ marginBottom: 8 }}>{hint}</Muted>}
      <Option selected={value.source === 'mechanic'} title={PARTS_LABEL.mechanic} text="The mechanic buys and fits the parts. They are included in the quote." onPress={() => choose('mechanic')} />
      <Option selected={value.source === 'customer'} title={PARTS_LABEL.customer} text="You already have the part. The quote then covers labour and travel only." onPress={() => choose('customer')} />
      <Option selected={value.source === 'supplier_pickup'} disabled={!supplierEnabled} title={PARTS_LABEL.supplier_pickup} text={supplierEnabled ? 'The mechanic collects the parts from a partner store.' : 'Coming soon (needs the parts-store integration)'} onPress={() => choose('supplier_pickup')} />
      <Option selected={value.source === 'ship_to_customer'} disabled={!supplierEnabled} title={PARTS_LABEL.ship_to_customer} text={supplierEnabled ? 'Parts are delivered to you, then the mechanic completes the job.' : 'Coming soon (needs the parts-store integration)'} onPress={() => choose('ship_to_customer')} />

      {customer && (
        <>
          {value.items.map((it, idx) => (
            <Card key={idx}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <Body style={{ fontWeight: '700' }}>Part {idx + 1}</Body>
                {value.items.length > 1 && <Pressable onPress={() => set({ items: value.items.filter((_, i) => i !== idx) })} hitSlop={8}><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable>}
              </Row>
              <Field label="Part name *" placeholder="e.g. 55Ah car battery" value={it.name} onChangeText={(t) => setItem(idx, { name: t })} />
              <Row style={{ gap: 10 }}>
                <Field style={{ flex: 1 }} label="Brand" value={it.brand} onChangeText={(t) => setItem(idx, { brand: t })} />
                <Field style={{ width: 90 }} label="Qty" keyboardType="number-pad" value={String(it.quantity)} onChangeText={(t) => setItem(idx, { quantity: t.replace(/[^0-9]/g, '') })} />
              </Row>
              <Field label="Part number (if known)" autoCapitalize="characters" value={it.partNumber} onChangeText={(t) => setItem(idx, { partNumber: t })} />
              <Row style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {['new', 'used', 'refurbished'].map((c) => <Chip key={c} label={c[0].toUpperCase() + c.slice(1)} active={it.condition === c} onPress={() => setItem(idx, { condition: c })} />)}
              </Row>
              <Field label="Notes for the mechanic" multiline placeholder="Fitment details, warranty, anything useful" value={it.notes} onChangeText={(t) => setItem(idx, { notes: t })} />
              <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                {it.photos.map((p, k) => (
                  <Pressable key={k} onPress={() => setItem(idx, { photos: it.photos.filter((_, i) => i !== k) })}>
                    <Image source={{ uri: p.uri || p.url }} style={{ width: 64, height: 64, borderRadius: 10 }} />
                    <View style={{ position: 'absolute', right: 2, top: 2, backgroundColor: '#000A', borderRadius: 10 }}><Ionicons name="close" size={14} color="#fff" /></View>
                  </Pressable>
                ))}
                {it.photos.length < 3 && (
                  <Pressable onPress={async () => setItem(idx, { photos: [...it.photos, ...(await pickImages({ max: 3 - it.photos.length }))].slice(0, 3) })} style={{ width: 64, height: 64, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="camera-outline" size={22} color={colors.blue} />
                  </Pressable>
                )}
              </Row>
            </Card>
          ))}
          {value.items.length < 5 && (
            <Pressable onPress={() => set({ items: [...value.items, emptyItem()] })} style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.blue, fontWeight: '700' }}>+ Add another part</Text>
            </Pressable>
          )}

          <Card style={{ borderColor: colors.blue, borderWidth: 1.5 }}>
            <Row style={{ gap: 8, marginBottom: 8 }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.blue} />
              <Body style={{ fontWeight: '800' }}>Part confirmation</Body>
            </Row>
            {value.items.some((i) => i.name.trim()) ? <PartsSummary parts={{ items: value.items.filter((i) => i.name.trim()) }} /> : <Muted>Add the part details above.</Muted>}
            <Check checked={value.confirmed} onPress={() => onChange({ ...value, confirmed: !value.confirmed })} label="I confirm these details are correct and the parts fit my vehicle. I will have them ready for the visit." />
          </Card>
        </>
      )}
    </View>
  );
}