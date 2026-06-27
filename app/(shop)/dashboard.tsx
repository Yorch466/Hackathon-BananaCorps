import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Placeholder } from '@/components/ui/Placeholder';

export default function ShopDashboard() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Dashboard Taller" />
      <Placeholder label="Ventas, citas y resumen del taller" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
