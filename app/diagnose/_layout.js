import { Stack } from 'expo-router';
import { DiagnoseProvider } from '../../src/lib/diagnose';

export default function DiagnoseLayout() {
  return (
    <DiagnoseProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DiagnoseProvider>
  );
}