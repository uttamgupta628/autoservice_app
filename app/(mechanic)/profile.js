import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, H1, Muted, Avatar, Card, MenuItem, Row, StatusBadge } from '../../src/components/ui';
import { Verified } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { useAvatarUpload } from '../../src/lib/avatar';
import { colors } from '../../src/lib/theme';

export default function MechanicProfileTab() {
  const { user, logout } = useAuth();
  const changeAvatar = useAvatarUpload();
  const status = user.mechanic?.verificationStatus;
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <Pressable onPress={changeAvatar}><Avatar user={user} size={92} /></Pressable>
        <Row style={{ gap: 6, marginTop: 10 }}><H1 style={{ fontSize: 22 }}>{user.name}</H1>{status === 'verified' && <Verified />}</Row>
        <Muted>{user.email}</Muted>
        <View style={{ marginTop: 8 }}><StatusBadge status="x" label={status === 'verified' ? 'Verified mechanic' : `Verification: ${String(status).replace('_', ' ')}`} color={status === 'verified' ? colors.green : colors.amber} /></View>
      </View>
      <Card style={{ paddingVertical: 0 }}>
        <MenuItem icon="create-outline" label="Edit Profile" onPress={() => router.push('/edit-profile')} />
        <MenuItem icon="shield-checkmark-outline" label="Documents & Verification" onPress={() => router.push('/verification')} />
        <MenuItem icon="construct-outline" label="Service Categories & Rates" onPress={() => router.push('/services')} />
        <MenuItem icon="time-outline" label="Availability & Work Area" onPress={() => router.push('/availability')} />
        <MenuItem icon="star-outline" label="Reviews" onPress={() => router.push('/reviews')} />
        <MenuItem icon="chatbubbles-outline" label="Messages" onPress={() => router.push('/inbox')} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        <MenuItem icon="flag-outline" label="Disputes & issues" onPress={() => router.push('/disputes')} />
        <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => Linking.openURL('mailto:support@autoservice.example')} />
        <MenuItem icon="log-out-outline" label="Logout" danger onPress={logout} />
      </Card>
    </Screen>
  );
}
