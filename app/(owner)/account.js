import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, H1, Muted, Avatar, Card, MenuItem } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { useAvatarUpload } from '../../src/lib/avatar';

export default function Account() {
  const { user, logout } = useAuth();
  const changeAvatar = useAvatarUpload();
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <Pressable onPress={changeAvatar}><Avatar user={user} size={92} /></Pressable>
        <Muted style={{ marginTop: 6 }}>Tap photo to change</Muted>
        <H1 style={{ fontSize: 22, marginTop: 8 }}>{user.name}</H1>
        <Muted>{user.email}</Muted>
      </View>
      <Card style={{ paddingVertical: 0 }}>
        <MenuItem icon="car-outline" label="My Vehicles" onPress={() => router.push('/vehicles')} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        <MenuItem icon="warning-outline" label="Disputes & issues" onPress={() => router.push('/disputes')} />
        <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => Linking.openURL('mailto:support@autoservice.example')} />
        <MenuItem icon="log-out-outline" label="Logout" danger onPress={logout} />
      </Card>
    </Screen>
  );
}
