import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Placeholder } from '@/components/ui/Placeholder';
import { useLocalSearchParams } from 'expo-router';

export default function ShopItemDetail() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Item ${id}`} showBackButton />
      <Placeholder label={`Detalle y edición del item ${id}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
