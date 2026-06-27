import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { ChatButton } from '@/components/ai/ChatButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PromoBanner } from '@/components/dashboard/PromoBanner';
import { CategorySection } from '@/components/dashboard/CategorySection';
import { SpecialtyFilters } from '@/components/dashboard/SpecialtyFilters';
import { WorkshopCarousel } from '@/components/dashboard/WorkshopCarousel';
import { SupplierList } from '@/components/dashboard/SupplierList';
import { StatusBar } from 'expo-status-bar';
import { useNearbyWorkshops, useTopSuppliers } from '@/features/dashboard/hooks';
import { useRouter } from 'expo-router';

// Palabras clave que activan redirección a repuestos
const PRODUCT_KEYWORDS = ['frenos', 'aceite', 'amortiguador', 'filtro', 'llanta', 'bateria', 'disco', 'pastilla'];

export default function ConductorDashboard() {
  const router = useRouter();
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  
  const { data: workshopsData } = useNearbyWorkshops();
  const { data: suppliersData } = useTopSuppliers();

  const handleSearchSubmit = (query: string) => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return;

    // Redirección inteligente si busca un repuesto común
    const isProductSearch = PRODUCT_KEYWORDS.some(kw => cleanQuery.includes(kw));
    if (isProductSearch) {
      router.push({
        pathname: '/(conductor)/products',
        params: { searchParam: cleanQuery }
      });
    }
  };

  const filteredWorkshops = useMemo(() => {
    if (!dashboardSearchQuery.trim()) return workshopsData;
    const query = dashboardSearchQuery.toLowerCase().trim();
    return workshopsData?.filter(w => 
      w.nombre_taller.toLowerCase().includes(query) || 
      w.especialidad.toLowerCase().includes(query)
    );
  }, [dashboardSearchQuery, workshopsData]);

  const filteredSuppliers = useMemo(() => {
    if (!dashboardSearchQuery.trim()) return suppliersData;
    const query = dashboardSearchQuery.toLowerCase().trim();
    return suppliersData?.filter(s => 
      s.nombre_proveedor.toLowerCase().includes(query)
    );
  }, [dashboardSearchQuery, suppliersData]);

  return (
    <SafeAreaView className="flex-1 bg-navy-900" edges={['top']}>
      <StatusBar style="light" />
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DashboardHeader 
          searchQuery={dashboardSearchQuery}
          onSearchChange={setDashboardSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />
        
        {/* Solo mostrar banners y categorías si no hay búsqueda activa para ahorrar espacio */}
        {!dashboardSearchQuery.trim() && (
          <>
            <PromoBanner />
            <CategorySection />
            <SpecialtyFilters />
          </>
        )}

        <WorkshopCarousel data={filteredWorkshops} isFiltered={!!dashboardSearchQuery.trim()} />
        <SupplierList data={filteredSuppliers} isFiltered={!!dashboardSearchQuery.trim()} />
        
        {dashboardSearchQuery.trim() && filteredWorkshops?.length === 0 && filteredSuppliers?.length === 0 && (
          <View className="px-4 py-12 items-center">
            <Text className="text-ink-secondary text-sm text-center">
              No se encontraron resultados para "{dashboardSearchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>
      <ChatButton />
    </SafeAreaView>
  );
}

