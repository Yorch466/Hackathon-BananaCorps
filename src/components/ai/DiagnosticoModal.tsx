import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { generarMensajeSOS } from '@/features/ai/gemini';
import { tokens } from '@/theme/tokens';

interface Props {
  visible:      boolean;
  onClose:      () => void;
  tallerNombre: string;
  telefono:     string | null;
  distanciaKm?: number | null;
}

type Step = 'input' | 'loading' | 'preview';

export function DiagnosticoModal({ visible, onClose, tallerNombre, telefono, distanciaKm }: Props) {
  const insets = useSafeAreaInsets();

  const [step,      setStep]      = useState<Step>('input');
  const [problema,  setProblema]  = useState('');
  const [vehiculo,  setVehiculo]  = useState('');
  const [mensaje,   setMensaje]   = useState('');

  const inputRef = useRef<TextInput>(null);

  const handleReset = () => {
    setStep('input');
    setProblema('');
    setVehiculo('');
    setMensaje('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleGenerar = async () => {
    if (!problema.trim()) {
      inputRef.current?.focus();
      return;
    }
    setStep('loading');
    try {
      const msg = await generarMensajeSOS({
        problema:     problema.trim(),
        vehiculo:     vehiculo.trim() || null,
        tallerNombre,
        distanciaKm,
      });
      setMensaje(msg);
      setStep('preview');
    } catch (e: unknown) {
      console.error('[Gemini]', e instanceof Error ? e.message : String(e));
      const distTexto =
        distanciaKm == null ? '' :
        distanciaKm < 1    ? ` Me encuentro a ${Math.round(distanciaKm * 1000)} metros de su taller.` :
                             ` Me encuentro a ${distanciaKm.toFixed(1)} km de su taller.`;
      const vehTexto = vehiculo.trim() && vehiculo !== 'No especificado'
        ? ` El vehículo afectado es un ${vehiculo.trim()}.` : '';
      setMensaje(`Buenas, me comunico a través de la app El Maestrito. Estoy varado y necesito asistencia urgente en ${tallerNombre}.${vehTexto} Mi vehículo presenta falla en el sistema de arranque con sonido de rozamiento metálico al activar el encendido, posiblemente relacionado con el motor de arranque o la corona del volante de inercia. Adicionalmente se detecta emisión de vapor o humo desde el compartimento del motor, lo que podría indicar sobrecalentamiento o fuga en el sistema de refrigeración.${distTexto} ¿Tienen disponibilidad para asistirme?`);
      setStep('preview');
    }
  };

  const handleEnviar = () => {
    if (!telefono) return;
    const clean = telefono.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/591${clean}?text=${encodeURIComponent(mensaje)}`).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp'),
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={20} color={tokens.colors.ink[2]} />
            </TouchableOpacity>
          </View>

          {/* Título */}
          <View style={styles.titleRow}>
            <View style={styles.geminiDot} />
            <Text style={styles.title}>Mensaje con IA para {tallerNombre}</Text>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Paso 1: Formulario ── */}
            {(step === 'input' || step === 'loading') && (
              <>
                <Text style={styles.label}>¿Cuál es el problema?</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.textArea}
                  placeholder="Ej: El motor hace un ruido metálico al arrancar y el auto no tiene fuerza…"
                  placeholderTextColor={tokens.colors.ink[3]}
                  value={problema}
                  onChangeText={setProblema}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={step === 'input'}
                  autoFocus
                />

                <Text style={styles.label}>Vehículo <Text style={styles.labelOpt}>(opcional)</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Toyota Corolla 2018"
                  placeholderTextColor={tokens.colors.ink[3]}
                  value={vehiculo}
                  onChangeText={setVehiculo}
                  editable={step === 'input'}
                />

                {step === 'loading' ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={tokens.colors.accent} />
                    <Text style={styles.loadingText}>Gemini está redactando tu mensaje…</Text>
                  </View>
                ) : (
                  <Button
                    label="Generar mensaje con IA"
                    onPress={handleGenerar}
                    disabled={!problema.trim()}
                  />
                )}
              </>
            )}

            {/* ── Paso 2: Preview + envío ── */}
            {step === 'preview' && (
              <>
                <Text style={styles.label}>Mensaje generado</Text>
                <TextInput
                  style={styles.previewText}
                  value={mensaje}
                  onChangeText={setMensaje}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.editHint}>Podés editar el mensaje antes de enviarlo</Text>

                <Button
                  label="Enviar por WhatsApp"
                  onPress={handleEnviar}
                  disabled={!telefono || !mensaje.trim()}
                />
                <Button
                  label="Regenerar"
                  variant="outline"
                  onPress={() => setStep('input')}
                />
              </>
            )}
          </ScrollView>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor:      tokens.colors.bg[2],
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    borderTopWidth:       1,
    borderTopColor:       tokens.colors.line,
    paddingHorizontal:    20,
    paddingTop:           4,
    maxHeight:            '90%',
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -6 },
    shadowOpacity:        0.4,
    shadowRadius:         18,
    elevation:            24,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     12,
    marginBottom:   16,
  },
  handle: {
    width: 40, height: 4,
    borderRadius:    2,
    backgroundColor: tokens.colors.line,
  },
  closeBtn: {
    position: 'absolute',
    right: 0, top: 8,
    padding: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  20,
  },
  geminiDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: tokens.colors.accent,
  },
  title: {
    color:      tokens.colors.ink[0],
    fontSize:   15,
    fontWeight: '700',
    flex:       1,
  },
  label: {
    color:        tokens.colors.ink[2],
    fontSize:     12,
    fontWeight:   '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom:  6,
  },
  labelOpt: {
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
  },
  textArea: {
    backgroundColor: tokens.colors.bg[1],
    borderWidth:     1.5,
    borderColor:     tokens.colors.line,
    borderRadius:    tokens.radii.md,
    color:           tokens.colors.ink[0],
    fontSize:        14,
    padding:         12,
    minHeight:       100,
    marginBottom:    16,
  },
  input: {
    backgroundColor: tokens.colors.bg[1],
    borderWidth:     1.5,
    borderColor:     tokens.colors.line,
    borderRadius:    tokens.radii.md,
    color:           tokens.colors.ink[0],
    fontSize:        14,
    padding:         12,
    marginBottom:    20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    paddingVertical: 14,
  },
  loadingText: {
    color:    tokens.colors.ink[2],
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  previewText: {
    backgroundColor: tokens.colors.bg[1],
    borderWidth:     1.5,
    borderColor:     tokens.colors.accent,
    borderRadius:    tokens.radii.md,
    color:           tokens.colors.ink[0],
    fontSize:        14,
    lineHeight:      22,
    padding:         12,
    minHeight:       120,
  },
  editHint: {
    color:        tokens.colors.ink[3],
    fontSize:     11,
    textAlign:    'center',
    marginBottom: 16,
  },
});
