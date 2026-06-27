import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { tokens } from '@/theme/tokens';
import { Icon } from '@/components/ui/Icon';

async function fetchTaller(id: string) {
  const { data, error } = await supabase
    .from('taller')
    .select(`
      id_taller, nombre_taller, direccion, telefono, lat, lng,
      taller_especialidad ( especialidad:especialidad_id ( nombre_especialidad ) )
    `)
    .eq('id_taller', id)
    .single();
  if (error) throw error;
  return data;
}

export default function WorkshopProfile() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['taller', id],
    queryFn:  () => fetchTaller(id),
    enabled:  !!id,
  });

  const handleCall = () => {
    if (data?.telefono) Linking.openURL(`tel:${data.telefono}`);
  };

  const handleMaps = () => {
    if (data?.lat && data?.lng) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`);
    }
  };

  const especialidades: string[] = data?.taller_especialidad
    ?.map((te: any) => te.especialidad?.nombre_especialidad)
    .filter(Boolean) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="chevron-left" size={22} color={tokens.colors.ink[0]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil del Taller</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.colors.accent} size="large" />
        </View>
      )}

      {(error || (!isLoading && !data)) && (
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar el taller</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {data && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Card principal */}
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{data.nombre_taller?.slice(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{data.nombre_taller}</Text>
            {data.direccion && (
              <View style={styles.infoRow}>
                <Icon name="pin" size={14} color={tokens.colors.ink[2]} />
                <Text style={styles.infoText}>{data.direccion}</Text>
              </View>
            )}
            {data.telefono && (
              <View style={styles.infoRow}>
                <Icon name="phone" size={14} color={tokens.colors.ink[2]} />
                <Text style={styles.infoText}>{data.telefono}</Text>
              </View>
            )}
          </View>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            {data.telefono && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.8}>
                <Icon name="phone" size={18} color={tokens.colors.accent} />
                <Text style={styles.actionBtnText}>Llamar</Text>
              </TouchableOpacity>
            )}
            {data.lat && data.lng && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleMaps} activeOpacity={0.8}>
                <Icon name="navigate" size={18} color={tokens.colors.accent} />
                <Text style={styles.actionBtnText}>Cómo llegar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Especialidades */}
          {especialidades.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Especialidades</Text>
              <View style={styles.tagsWrap}>
                {especialidades.map((esp, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{esp}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: tokens.colors.bg[0],
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  backBtn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: tokens.colors.bg[1],
    alignItems:      'center',
    justifyContent:  'center',
  },
  headerTitle: {
    color:      tokens.colors.ink[0],
    fontSize:   16,
    fontWeight: '700',
  },
  scrollContent: {
    padding:       20,
    paddingBottom: 40,
    gap:           16,
  },
  card: {
    backgroundColor: tokens.colors.bg[1],
    borderRadius:    20,
    padding:         24,
    alignItems:      'center',
    gap:             8,
    borderWidth:     1,
    borderColor:     tokens.colors.line,
  },
  avatar: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: tokens.colors.accent + '22',
    borderWidth:     2,
    borderColor:     tokens.colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  avatarText: {
    color:      tokens.colors.accent,
    fontSize:   26,
    fontWeight: '700',
  },
  name: {
    color:      tokens.colors.ink[0],
    fontSize:   20,
    fontWeight: '700',
    textAlign:  'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  infoText: {
    color:    tokens.colors.ink[2],
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap:           12,
  },
  actionBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    backgroundColor: tokens.colors.bg[1],
    borderWidth:     1.5,
    borderColor:     tokens.colors.accent,
    borderRadius:    14,
    paddingVertical: 14,
  },
  actionBtnText: {
    color:      tokens.colors.accent,
    fontSize:   14,
    fontWeight: '600',
  },
  sectionTitle: {
    color:      tokens.colors.ink[0],
    fontSize:   16,
    fontWeight: '700',
    marginTop:  4,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  tag: {
    backgroundColor:   tokens.colors.accent + '20',
    borderWidth:       1,
    borderColor:       tokens.colors.accent + '60',
    borderRadius:      20,
    paddingHorizontal: 14,
    paddingVertical:   7,
  },
  tagText: {
    color:      tokens.colors.accent,
    fontSize:   13,
    fontWeight: '600',
  },
  errorText: {
    color:    tokens.colors.ink[2],
    fontSize: 15,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical:   10,
    backgroundColor:   tokens.colors.accent,
    borderRadius:      10,
  },
  retryText: {
    color:      '#000',
    fontWeight: '700',
  },
});
