import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSpecialties } from '@/features/dashboard/hooks';

export const SpecialtyFilters = () => {
  const { data: specialties, isLoading } = useSpecialties();
  console.log("Especialidades:");
  console.log(specialties);
  console.log(isLoading);

  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (specialties && specialties.length > 0 && !selected) {
      setSelected(specialties[0].nombre_especialidad);
    }
  }, [specialties]);

  if (isLoading) {
    return <ActivityIndicator className="mt-4" color="#1DB88A" />;
  }

  const items = specialties || [];

  return (
    <View className="mt-6">
      <Text className="px-4 text-ink-primary font-bold text-lg mb-3">Especialidades</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id_especialidad}
            onPress={() => setSelected(item.nombre_especialidad)}
            className={`mr-2 px-6 py-2.5 rounded-full border ${
              selected === item.nombre_especialidad 
                ? 'bg-accent border-accent' 
                : 'bg-navy-800 border-navy-700'
            }`}
          >
            <Text 
              className={`text-xs font-semibold ${
                selected === item.nombre_especialidad ? 'text-white' : 'text-ink-secondary'
              }`}
            >
              {item.nombre_especialidad}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
