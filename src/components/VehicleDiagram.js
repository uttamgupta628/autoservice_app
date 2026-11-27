import { Pressable, Text, View } from 'react-native';
import { colors } from '../lib/theme';

/**
 * Interactive vehicle diagram: five views (front, rear, left, right, top) drawn with plain Views so no extra
 * native package is needed. The highlighted dashed zones are tappable, each one maps to an "area" id that the
 * backend diagnostic rules understand (engine_bay, cooling, wheels, cabin, exhaust, underbody, lights_body,
 * doors_glass, boot).
 *
 * Rectangles are [left, top, width, height] in the view's own coordinate space, scaled to the requested width.
 */
const BODY = '#DCE6F5';
const EDGE = '#9DB2D3';
const GLASS = '#A9C8F2';
const TYRE = '#1F2A3C';
const LIGHT = '#F6C945';

const SPEC = {
  top: {
    w: 220, h: 330,
    shapes: [
      { r: [40, 10, 140, 310], fill: BODY, radius: 60, edge: true },
      { r: [56, 110, 108, 40], fill: GLASS, radius: 14 },
      { r: [56, 228, 108, 26], fill: GLASS, radius: 12 },
      { r: [28, 62, 22, 52], fill: TYRE, radius: 6 }, { r: [170, 62, 22, 52], fill: TYRE, radius: 6 },
      { r: [28, 216, 22, 52], fill: TYRE, radius: 6 }, { r: [170, 216, 22, 52], fill: TYRE, radius: 6 },
    ],
    spots: [
      { id: 'engine_bay', r: [52, 28, 116, 78], radius: 36 },
      { id: 'cabin', r: [52, 108, 116, 122], radius: 14 },
      { id: 'boot', r: [52, 258, 116, 44], radius: 16 },
      { id: 'lights_body', r: [58, 6, 104, 18], radius: 9 }, { id: 'lights_body', r: [58, 306, 104, 18], radius: 9 },
      { id: 'doors_glass', r: [30, 140, 16, 90], radius: 8 }, { id: 'doors_glass', r: [174, 140, 16, 90], radius: 8 },
      { id: 'wheels', r: [24, 58, 30, 60], radius: 8 }, { id: 'wheels', r: [166, 58, 30, 60], radius: 8 },
      { id: 'wheels', r: [24, 212, 30, 60], radius: 8 }, { id: 'wheels', r: [166, 212, 30, 60], radius: 8 },
    ],
  },
  front: {
    w: 260, h: 200,
    shapes: [
      { r: [62, 26, 136, 80], fill: BODY, radius: 32, edge: true },
      { r: [30, 90, 200, 80], fill: BODY, radius: 24, edge: true },
      { r: [74, 34, 112, 48], fill: GLASS, radius: 18 },
      { r: [36, 116, 44, 22], fill: LIGHT, radius: 8 }, { r: [180, 116, 44, 22], fill: LIGHT, radius: 8 },
      { r: [88, 118, 84, 28], fill: '#7F93B3', radius: 6 },
      { r: [24, 146, 28, 44], fill: TYRE, radius: 7 }, { r: [208, 146, 28, 44], fill: TYRE, radius: 7 },
    ],
    spots: [
      { id: 'cabin', r: [70, 30, 120, 54], radius: 18 },
      { id: 'engine_bay', r: [52, 86, 156, 26], radius: 10 },
      { id: 'lights_body', r: [32, 112, 52, 30], radius: 10 }, { id: 'lights_body', r: [176, 112, 52, 30], radius: 10 },
      { id: 'cooling', r: [86, 114, 88, 34], radius: 8 },
      { id: 'lights_body', r: [60, 150, 140, 22], radius: 10 },
      { id: 'wheels', r: [20, 144, 36, 50], radius: 9 }, { id: 'wheels', r: [204, 144, 36, 50], radius: 9 },
      { id: 'doors_glass', r: [40, 56, 26, 36], radius: 8 }, { id: 'doors_glass', r: [194, 56, 26, 36], radius: 8 },
    ],
  },
  rear: {
    w: 260, h: 200,
    shapes: [
      { r: [62, 26, 136, 80], fill: BODY, radius: 32, edge: true },
      { r: [30, 90, 200, 80], fill: BODY, radius: 24, edge: true },
      { r: [74, 34, 112, 48], fill: GLASS, radius: 18 },
      { r: [36, 106, 38, 20], fill: '#E5675A', radius: 8 }, { r: [186, 106, 38, 20], fill: '#E5675A', radius: 8 },
      { r: [24, 146, 28, 44], fill: TYRE, radius: 7 }, { r: [208, 146, 28, 44], fill: TYRE, radius: 7 },
      { r: [172, 170, 22, 12], fill: '#7F93B3', radius: 6 },
    ],
    spots: [
      { id: 'cabin', r: [70, 30, 120, 54], radius: 18 },
      { id: 'boot', r: [78, 88, 104, 44], radius: 12 },
      { id: 'lights_body', r: [32, 100, 48, 30], radius: 10 }, { id: 'lights_body', r: [180, 100, 48, 30], radius: 10 },
      { id: 'lights_body', r: [60, 140, 100, 24], radius: 10 },
      { id: 'exhaust', r: [164, 164, 38, 26], radius: 8 },
      { id: 'wheels', r: [20, 144, 36, 50], radius: 9 }, { id: 'wheels', r: [204, 144, 36, 50], radius: 9 },
      { id: 'doors_glass', r: [40, 56, 26, 36], radius: 8 }, { id: 'doors_glass', r: [194, 56, 26, 36], radius: 8 },
    ],
  },
  left: {
    w: 340, h: 170,
    shapes: [
      { r: [10, 78, 320, 50], fill: BODY, radius: 22, edge: true },
      { r: [82, 32, 170, 60], fill: BODY, radius: 28, edge: true },
      { r: [96, 40, 62, 40], fill: GLASS, radius: 12 }, { r: [164, 40, 76, 40], fill: GLASS, radius: 12 },
      { r: [8, 98, 12, 18], fill: LIGHT, radius: 5 }, { r: [320, 96, 12, 18], fill: '#E5675A', radius: 5 },
      { r: [300, 126, 28, 8], fill: '#7F93B3', radius: 4 },
      { r: [52, 102, 56, 56], fill: TYRE, radius: 28 }, { r: [236, 102, 56, 56], fill: TYRE, radius: 28 },
      { r: [68, 118, 24, 24], fill: '#C3CEDF', radius: 12 }, { r: [252, 118, 24, 24], fill: '#C3CEDF', radius: 12 },
    ],
    spots: [
      { id: 'engine_bay', r: [14, 68, 74, 36], radius: 14 },
      { id: 'cabin', r: [94, 36, 150, 46], radius: 16 },
      { id: 'doors_glass', r: [96, 84, 144, 36], radius: 10 },
      { id: 'boot', r: [250, 66, 78, 38], radius: 14 },
      { id: 'lights_body', r: [4, 94, 26, 28], radius: 8 }, { id: 'lights_body', r: [312, 92, 26, 28], radius: 8 },
      { id: 'underbody', r: [112, 124, 120, 18], radius: 8 },
      { id: 'exhaust', r: [296, 124, 40, 18], radius: 8 },
      { id: 'wheels', r: [46, 98, 68, 66], radius: 34 }, { id: 'wheels', r: [230, 98, 68, 66], radius: 34 },
    ],
  },
};

const AREA_SHORT = {
  engine_bay: 'Engine bay', cooling: 'Radiator', wheels: 'Wheels & brakes', cabin: 'Cabin', exhaust: 'Exhaust',
  underbody: 'Underneath', lights_body: 'Lights & bumper', doors_glass: 'Doors & glass', boot: 'Boot',
};

export const VIEWS = [
  { value: 'front', label: 'Front' },
  { value: 'rear', label: 'Rear' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
];

/** Area ids that can be tapped in a view (used for the quick-pick chips under the diagram). */
export const areasInView = (view) => [...new Set(SPEC[view === 'right' ? 'left' : view].spots.map((s) => s.id))];
export const areaShort = (id) => AREA_SHORT[id] || id;

export default function VehicleDiagram({ view = 'front', selected, onSelect, width = 300 }) {
  const mirror = view === 'right';
  const spec = SPEC[mirror ? 'left' : view];
  const k = width / spec.w;
  const pos = ([l, t, w, h]) => ({ position: 'absolute', left: (mirror ? spec.w - l - w : l) * k, top: t * k, width: w * k, height: h * k });

  return (
    <View style={{ width, height: spec.h * k, alignSelf: 'center' }} accessibilityLabel={`Vehicle ${view} view`}>
      {spec.shapes.map((sh, i) => (
        <View key={`s${i}`} style={[pos(sh.r), { backgroundColor: sh.fill, borderRadius: sh.radius * k }, sh.edge && { borderWidth: 1.5, borderColor: EDGE }]} />
      ))}
      {spec.spots.map((sp, i) => {
        const on = selected === sp.id;
        return (
          <Pressable
            key={`p${i}`}
            onPress={() => onSelect?.(sp.id)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={AREA_SHORT[sp.id]}
            accessibilityState={{ selected: on }}
            style={[
              pos(sp.r),
              {
                borderRadius: sp.radius * k,
                borderWidth: on ? 2.5 : 1.5,
                borderStyle: on ? 'solid' : 'dashed',
                borderColor: on ? colors.green : colors.blue,
                backgroundColor: on ? 'rgba(25,167,124,0.38)' : 'rgba(38,119,232,0.16)',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function DiagramLegend() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 8 }}>
      <Text style={{ color: colors.blue, fontSize: 12, fontWeight: '600' }}>▢ Tap a highlighted area</Text>
      <Text style={{ color: colors.green, fontSize: 12, fontWeight: '600' }}>■ Selected</Text>
    </View>
  );
}