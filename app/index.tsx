import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/features/auth/store';

export default function Index() {
  const { user, role, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1B3E' }}>
        <ActivityIndicator color="#1DB88A" size="large" />
      </View>
    );
  }

  if (user && role) {
    if (role === 'conductor') return <Redirect href="/(conductor)/dashboard" />;
    return <Redirect href="/(shop)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
