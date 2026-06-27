import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { ChatModal } from './ChatModal';
import { tokens } from '@/theme/tokens';

export function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Icon name="chat" size={24} color={tokens.colors.bg[0]} />
      </TouchableOpacity>

      <ChatModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    position:        'absolute',
    bottom:          16,
    right:           16,
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: tokens.colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     tokens.colors.accent,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.7,
    shadowRadius:    12,
    elevation:       10,
    zIndex:          100,
  },
});
