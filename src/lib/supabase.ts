import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

// Supabase genera tokens que superan el límite de 2KB de SecureStore.
// Este adapter parte la sesión en chunks para evitar el truncado silencioso.
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const first = await SecureStore.getItemAsync(`${key}.0`);
    if (first === null) return null;

    let result = first;
    let i = 1;
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}.${i}`);
      if (chunk === null) break;
      result += chunk;
      i++;
    }
    return result;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const SIZE = 1800; // seguro por debajo del límite de 2KB
    const total = Math.ceil(value.length / SIZE);
    for (let i = 0; i < total; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * SIZE, (i + 1) * SIZE));
    }
    // Limpiar chunks sobrantes si el nuevo valor es más corto
    let i = total;
    while ((await SecureStore.getItemAsync(`${key}.${i}`)) !== null) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
      i++;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    let i = 0;
    while ((await SecureStore.getItemAsync(`${key}.${i}`)) !== null) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
      i++;
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresca la sesión automáticamente cuando la app vuelve al primer plano.
// Sin esto, los tokens caducan silenciosamente mientras la app está en background.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
