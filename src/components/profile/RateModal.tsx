import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';

const TAGS = ['Trabajo limpio', 'Puntual', 'Precio justo', 'Buena atención', 'Recomendado'];

interface RateModalProps {
  visible: boolean;
  entityName: string;
  entityType: 'taller' | 'proveedor';
  onClose: () => void;
  onSubmit: (stars: number, tags: string[]) => Promise<void>;
}

export const RateModal = ({
  visible,
  entityName,
  entityType,
  onClose,
  onSubmit,
}: RateModalProps) => {
  const [stars, setStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const typeLabel = entityType === 'taller' ? 'CALIFICAR TALLER' : 'CALIFICAR PROVEEDOR';

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleClose = () => {
    setStars(0);
    setSelectedTags([]);
    onClose();
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert('Selecciona al menos una estrella');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(stars, selectedTags);
      setStars(0);
      setSelectedTags([]);
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo enviar la calificación. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View className="flex-1" />
        </TouchableWithoutFeedback>

        <View className="bg-navy-800 rounded-t-3xl px-6 pt-5 pb-8">
          {/* Header */}
          <View className="flex-row items-start justify-between mb-5">
            <View className="flex-1 mr-4">
              <Text className="text-ink-secondary text-xs font-bold tracking-widest mb-1">
                {typeLabel}
              </Text>
              {entityName ? (
                <Text className="text-ink-primary text-lg font-bold">{entityName}</Text>
              ) : null}
              <Text className="text-ink-secondary text-xs mt-0.5">¿Cómo fue tu experiencia?</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Estrellas */}
          <View className="flex-row justify-center gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setStars(i)} activeOpacity={0.7}>
                <Icon
                  name={i <= stars ? 'starFill' : 'star'}
                  size={38}
                  color={i <= stars ? '#1DB88A' : '#4B5563'}
                  filled={i <= stars}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Tags */}
          <Text className="text-ink-secondary text-xs font-bold tracking-widest uppercase mb-3">
            ¿Qué destacarías?
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  className={`px-3 py-2 rounded-full border ${
                    active ? 'bg-accent border-accent' : 'border-navy-600 bg-navy-700'
                  }`}
                  activeOpacity={0.75}
                >
                  <Text
                    className={`text-xs font-semibold ${active ? 'text-navy-900' : 'text-ink-secondary'}`}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botones */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleClose}
              className="flex-1 border border-navy-600 py-3.5 rounded-xl items-center"
              activeOpacity={0.8}
            >
              <Text className="text-ink-secondary font-semibold text-sm">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || stars === 0}
              className={`flex-1 bg-accent py-3.5 rounded-xl items-center ${
                submitting || stars === 0 ? 'opacity-50' : ''
              }`}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#0D1B3E" />
              ) : (
                <Text className="text-navy-900 font-bold text-sm">Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
