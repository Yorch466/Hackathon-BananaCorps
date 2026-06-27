import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { sendMessage } from '@/features/ai/agent';
import type { Message } from '@/features/ai/types';
import { tokens } from '@/theme/tokens';
import { useLocation } from '@/hooks/useLocation';

const SUGGESTIONS = [
  '¿Dónde consigo pastillas de freno?',
  'Taller de frenos cerca mío',
  '¿Qué repuestos hay disponibles?',
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ChatModal({ visible, onClose }: Props) {
  const insets       = useSafeAreaInsets();
  const router       = useRouter();
  const { location } = useLocation();
  const flatListRef  = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState('');
  const [thinking, setThinking] = useState(false);

  const handleSend = useCallback(async (text: string) => {
    const userText = text.trim();
    if (!userText || thinking) return;

    const userMsg: Message = { role: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const reply = await sendMessage(userText, location, []);
      setMessages((prev) => [...prev, { role: 'model', text: reply.text, actions: reply.actions }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: 'Ocurrió un error. Intentá de nuevo.' }]);
    } finally {
      setThinking(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [thinking, location]);

  const handleAction = (id: string, type: 'taller' | 'proveedor') => {
    onClose();
    router.push({ pathname: '/(conductor)/supplier/[id]', params: { id, type } });
  };

  const handleClose = () => {
    setMessages([]);
    setInput('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 8, 16) }]}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerDot} />
              <Text style={styles.headerTitle}>Asistente ANFIAUTO</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={20} color={tokens.colors.ink[2]} />
            </TouchableOpacity>
          </View>

          {/* Mensajes */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Preguntame sobre repuestos o talleres cercanos</Text>
                <View style={styles.chips}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity key={s} style={styles.chip} onPress={() => handleSend(s)} activeOpacity={0.75}>
                      <Text style={styles.chipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <View style={item.role === 'user' ? styles.bubbleUserWrap : styles.bubbleModelWrap}>
                <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleModel]}>
                  <Text style={[styles.bubbleText, item.role === 'user' ? styles.textUser : styles.textModel]}>
                    {item.text}
                  </Text>
                </View>
                {/* Botones de acción solo en mensajes del modelo */}
                {item.role === 'model' && item.actions && item.actions.length > 0 && (
                  <View style={styles.actionsWrap}>
                    {item.actions.map((action) => (
                      <TouchableOpacity
                        key={action.id}
                        style={styles.actionBtn}
                        onPress={() => handleAction(action.id, action.type)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.actionBtnInner}>
                          <Icon name="navigate" size={15} color={tokens.colors.bg[0]} />
                          <Text style={styles.actionBtnText} numberOfLines={1}>
                            {action.type === 'proveedor'
                              ? `VER PERFIL DE ${action.label.toUpperCase()}`
                              : `IR AL TALLER ${action.label.toUpperCase()}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          />

          {/* Pensando */}
          {thinking && (
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" color={tokens.colors.accent} />
              <Text style={styles.thinkingText}>Consultando…</Text>
            </View>
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escribí tu consulta…"
              placeholderTextColor={tokens.colors.ink[3]}
              value={input}
              onChangeText={setInput}
              editable={!thinking}
              returnKeyType="send"
              onSubmitEditing={() => handleSend(input)}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || thinking) && styles.sendBtnDisabled]}
              onPress={() => handleSend(input)}
              disabled={!input.trim() || thinking}
              activeOpacity={0.75}
            >
              <Icon name="navigate" size={18} color={tokens.colors.bg[0]} />
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    justifyContent:  'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor:      tokens.colors.bg[2],
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    borderTopWidth:       1,
    borderTopColor:       tokens.colors.line,
    height:               '92%',
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -6 },
    shadowOpacity:        0.4,
    shadowRadius:         18,
    elevation:            24,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  headerDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: tokens.colors.accent,
  },
  headerTitle: {
    color:      tokens.colors.ink[0],
    fontSize:   16,
    fontWeight: '700',
  },
  list:        { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  emptyWrap: {
    alignItems: 'center',
    gap:        16,
    paddingTop: 32,
  },
  emptyText: {
    color:             tokens.colors.ink[2],
    fontSize:          14,
    textAlign:         'center',
    paddingHorizontal: 24,
  },
  chips: {
    gap:               8,
    alignItems:        'stretch',
    width:             '100%',
    paddingHorizontal: 8,
  },
  chip: {
    backgroundColor:   tokens.colors.bg[1],
    borderWidth:       1,
    borderColor:       tokens.colors.accent,
    borderRadius:      10,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  chipText: {
    color:    tokens.colors.accent,
    fontSize: 13,
  },
  bubbleUserWrap:  { alignItems: 'flex-end' },
  bubbleModelWrap: { alignItems: 'flex-start' },
  bubble: {
    maxWidth:          '82%',
    borderRadius:      14,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  bubbleUser: {
    backgroundColor: '#1e3a5f',
  },
  bubbleModel: {
    backgroundColor: tokens.colors.bg[1],
    borderWidth:     1,
    borderColor:     tokens.colors.accent + '44',
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  textUser:   { color: '#fff' },
  textModel:  { color: tokens.colors.ink[0] },
  actionsWrap: {
    marginTop: 8,
    gap:       8,
    maxWidth:  '82%',
  },
  actionBtn: {
    backgroundColor: tokens.colors.accent,
    borderRadius:    12,
    overflow:        'hidden',
  },
  actionBtnInner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingHorizontal: 16,
    paddingVertical:   11,
  },
  actionBtnText: {
    color:          tokens.colors.bg[0],
    fontSize:       11,
    fontWeight:     '800',
    letterSpacing:  0.8,
    flexShrink:     1,
  },
  thinkingRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingHorizontal: 20,
    paddingVertical:   8,
  },
  thinkingText: {
    color:    tokens.colors.ink[3],
    fontSize: 13,
  },
  inputRow: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    gap:               10,
    paddingHorizontal: 16,
    paddingTop:        10,
    borderTopWidth:    1,
    borderTopColor:    tokens.colors.line,
  },
  input: {
    flex:              1,
    backgroundColor:   tokens.colors.bg[1],
    borderWidth:       1.5,
    borderColor:       tokens.colors.line,
    borderRadius:      14,
    color:             tokens.colors.ink[0],
    fontSize:          15,
    paddingHorizontal: 14,
    paddingVertical:   12,
    maxHeight:         120,
  },
  sendBtn: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: tokens.colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
