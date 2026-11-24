import { Alert } from 'react-native';
import { api, errMsg } from './api';
import { useAuth } from './auth';
import { pickImages } from './device';

/** Returns a function that lets the user pick a photo and uploads it as their avatar (Cloudinary). */
export function useAvatarUpload() {
  const { refresh } = useAuth();
  return async () => {
    const [a] = await pickImages({ multiple: false });
    if (!a) return;
    try {
      const form = new FormData();
      form.append('file', { uri: a.uri, name: a.fileName || 'avatar.jpg', type: a.mimeType || 'image/jpeg' });
      await api.post('/auth/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' }, transformRequest: (d) => d, timeout: 60000 });
      await refresh();
    } catch (e) {
      Alert.alert('Upload failed', errMsg(e));
    }
  };
}
