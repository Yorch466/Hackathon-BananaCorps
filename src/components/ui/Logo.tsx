import React from 'react';
import { Text, StyleSheet } from 'react-native';

export const Logo = () => {
  return <Text style={styles.text}>ANFIAUTO</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1DB88A',
    letterSpacing: 1.5,
  },
});
