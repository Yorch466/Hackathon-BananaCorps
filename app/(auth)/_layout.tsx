import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="user-type" />
      <Stack.Screen name="signup-conductor" />
      <Stack.Screen name="signup-shop" />
    </Stack>
  );
}
