import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TopBar, Loading, ErrorText, Muted, useApi } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { api, errMsg } from '../../src/lib/api';
import { colors, fmtTime } from '../../src/lib/theme';

export default function Chat() {
  const { jobId } = useLocalSearchParams();
  const { user } = useAuth();
  // simple polling keeps the conversation live without a websocket server
  const { data, loading, error, reload } = useApi(() => api.get(`/messages/job/${jobId}`).then((r) => r.data), [jobId], { poll: 4000 });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const list = useRef(null);

  useEffect(() => { if (data?.messages?.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 100); }, [data?.messages?.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    setErr('');
    try {
      await api.post(`/messages/job/${jobId}`, { text: t });
      setText('');
      await reload();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cloud }} edges={['top', 'bottom']}>
      <TopBar title={data?.with?.name || 'Chat'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading && !data ? <Loading /> : error && !data ? <ErrorText>{error}</ErrorText> : (
          <FlatList
            ref={list}
            data={data.messages}
            keyExtractor={(m) => m._id}
            contentContainerStyle={{ padding: 14, flexGrow: 1, justifyContent: data.messages.length ? 'flex-end' : 'center' }}
            ListEmptyComponent={<Muted style={{ textAlign: 'center' }}>Say hello 👋 Messages are linked to this job.</Muted>}
            renderItem={({ item: m }) => {
              const mine = String(m.from) === String(user._id);
              return (
                <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', marginBottom: 8 }}>
                  <View style={{ backgroundColor: mine ? colors.blue : '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: mine ? 0 : 1, borderColor: colors.border }}>
                    <Text style={{ color: mine ? '#fff' : colors.text, fontSize: 15 }}>{m.text}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.muted, alignSelf: mine ? 'flex-end' : 'flex-start', marginTop: 2 }}>{fmtTime(m.createdAt)}</Text>
                </View>
              );
            }}
          />
        )}
        <ErrorText>{err}</ErrorText>
        <View style={{ flexDirection: 'row', padding: 10, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' }}>
          <TextInput value={text} onChangeText={setText} placeholder="Type a message" placeholderTextColor="#9AA7B8" style={{ flex: 1, minHeight: 44, backgroundColor: colors.cloud, borderRadius: 22, paddingHorizontal: 16, fontSize: 15 }} multiline maxLength={2000} />
          <Pressable onPress={send} disabled={sending || !text.trim()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', opacity: sending || !text.trim() ? 0.5 : 1 }}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
