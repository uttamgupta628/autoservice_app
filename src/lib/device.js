import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', address: '' };

/** Current position + reverse-geocoded address. Resolves null if permission is denied. */
export async function getCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude: lat, longitude: lng } = pos.coords;
    let city = '';
    let address = '';
    try {
      const [p] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (p) {
        city = p.city || p.subregion || p.region || '';
        address = [p.name, p.street, p.district, p.city].filter(Boolean).join(', ');
      }
    } catch {}
    return { lat, lng, city, address };
  } catch {
    return null;
  }
}

/** Pick images from the library. Returns an array of assets (possibly empty). */
export async function pickImages({ multiple = true, max = 4 } = {}) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo access in Settings to upload images.');
    return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: max,
    quality: 0.7,
  });
  return res.canceled ? [] : res.assets;
}
