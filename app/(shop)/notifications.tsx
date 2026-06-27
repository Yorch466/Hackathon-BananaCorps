import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Placeholder } from '@/components/ui/Placeholder';

export default function ShopNotifications() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Notificaciones" />
      <Placeholder label="Alertas y avisos para el taller" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
