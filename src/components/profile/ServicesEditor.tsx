import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import type { DbServicio } from '@/types/database';

interface ServicesEditorProps {
  tallerId: string;
  servicios: DbServicio[];
  onDelete: (id: string) => void;
}

function ServiceRow({ servicio, onDelete }: { servicio: DbServicio; onDelete: () => void }) {
  return (
    <View className="flex-row items-center bg-navy-700 rounded-xl px-3 py-3 mb-2">
      <View className="flex-1">
        <Text className="text-ink-primary text-sm font-semibold">{servicio.nombre_servicio}</Text>
        {servicio.descripcion ? (
          <Text className="text-ink-secondary text-xs mt-0.5">{servicio.descripcion}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Eliminar servicio', '¿Eliminar este servicio?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: onDelete },
          ])
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="trash" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

interface ServiceFormProps {
  tallerId: string;
  initial?: DbServicio;
  onSave: (s: Omit<DbServicio, 'id_servicio'> & { id_servicio?: string }) => void;
  onCancel: () => void;
}

function ServiceForm({ tallerId, initial, onSave, onCancel }: ServiceFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre_servicio ?? '');
  const [desc, setDesc] = useState(initial?.descripcion ?? '');

  const handleSave = () => {
    if (!nombre.trim()) return;
    onSave({
      id_servicio: initial?.id_servicio,
      taller_id: tallerId,
      nombre_servicio: nombre.trim(),
      descripcion: desc.trim() || null,
      imagen_servicio_url: initial?.imagen_servicio_url ?? null,
      precio: initial?.precio ?? null,
      duracion: initial?.duracion ?? null,
    });
  };

  return (
    <View className="bg-navy-700 rounded-xl p-3 mb-3">
      <TextInput
        className="bg-navy-800 text-ink-primary text-sm rounded-lg px-3 py-2 mb-2"
        placeholder="Nombre del servicio"
        placeholderTextColor="#4B5563"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        className="bg-navy-800 text-ink-primary text-sm rounded-lg px-3 py-2 mb-3"
        placeholder="Descripción (opcional)"
        placeholderTextColor="#4B5563"
        value={desc}
        onChangeText={setDesc}
      />
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleSave}
          className="flex-1 bg-accent py-2 rounded-lg items-center"
          activeOpacity={0.8}
        >
          <Text className="text-navy-900 font-bold text-sm">Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 bg-navy-800 py-2 rounded-lg items-center border border-navy-600"
          activeOpacity={0.8}
        >
          <Text className="text-ink-secondary text-sm">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const ServicesEditor = ({ servicios, onDelete }: ServicesEditorProps) => {
  return (
    <View>
      {servicios.length === 0 ? (
        <Text className="text-ink-muted text-sm py-2">No hay servicios registrados.</Text>
      ) : (
        servicios.map((s) => (
          <ServiceRow
            key={s.id_servicio}
            servicio={s}
            onDelete={() => onDelete(s.id_servicio)}
          />
        ))
      )}
    </View>
  );
};
