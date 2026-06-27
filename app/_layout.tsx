import '../global.css';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { restoreSession } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { supabase } from '@/lib/supabase';

// Evitar que la splash screen se oculte antes de tiempo
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

export default function RootLayout() {
  console.log(' [BOOT] Iniciando RootLayout...');

  const setUser    = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const clear      = useAuthStore((s) => s.clear);

  // Mantener Zustand sincronizado cuando Supabase emite SIGNED_OUT
  // (cubre el caso donde signOut() limpia SecureStore pero el store no recibe el evento)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') clear();
    });
    return () => subscription.unsubscribe();
  }, []);

  const [loaded, error] = useFonts({
    'Inter': Inter_400Regular,
    'InterBold': Inter_700Bold,
    'JetBrainsMono': JetBrainsMono_400Regular,
  });

  useEffect(() => {
    console.log(' [FONTS] Estado:', { loaded, error: !!error });
    if (loaded || error) {
      console.log(' [BOOT] Ocultando SplashScreen...');
      SplashScreen.hideAsync().catch(() => {});

      // Restaurar sesión persistida (SecureStore) al abrir la app
      restoreSession()
        .then(({ user }) => {
          setUser(user);
          setLoading(false);
        })
        .catch(() => {
          setUser(null);
          setLoading(false);
        });
    }
  }, [loaded, error]);

  if (error) {
    console.error(' [ERROR] Error cargando fuentes:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
        <Text style={{ color: 'white' }}>Error crítico: No se pudieron cargar las fuentes.</Text>
      </View>
    );
  }

  if (!loaded) {
    console.log(' [BOOT] Cargando recursos...');
    return null; // Mantiene la Splash Screen activa
  }

  console.log(' [BOOT] Renderizando Stack...');
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(conductor)" />
          <Stack.Screen name="(shop)" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="shop" />
          <Stack.Screen name="conductor" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
