import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlaceholderProps {
  label: string;
}

export const Placeholder = ({ label }: PlaceholderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    borderWidth: 1,
    borderColor: '#333333',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  text: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
  },
});
