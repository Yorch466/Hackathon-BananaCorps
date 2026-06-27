import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/components/ui/Icon';

// Mock Data as per requirements
const MOCK_PRODUCTS = [
  { id: '1', producto: 'Amortiguador A', categoria: 'Suspensión', precio: 150, stock: 10 },
  { id: '2', producto: 'Batería B', categoria: 'Eléctrico', precio: 200, stock: 5 },
  { id: '3', producto: 'Caja de Cambios C', categoria: 'Transmisión', precio: 1200, stock: 2 },
  { id: '4', producto: 'Disco de Freno D', categoria: 'Frenos', precio: 80, stock: 15 },
  { id: '5', producto: 'Espejo Lateral E', categoria: 'Carrocería', precio: 45, stock: 8 },
  { id: '6', producto: 'Filtro de Aire F', categoria: 'Filtros', precio: 25, stock: 20 },
];

const CATEGORIES = ['Todos', 'Frenos', 'Filtros', 'Suspensión', 'Eléctrico', 'Transmisión', 'Carrocería'];

export default function ProductsScreen() {
  const { tokens } = useTheme();
  const router = useRouter();
  
  // 1. Gestión de Estados (Hooks)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // 3. Optimización con Debounce (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 2. Lógica de Filtrado Combinado (Doble Filtro)
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((item) => {
      // A) Filtro por Categoría
      const matchesCategory = 
        selectedCategory === 'Todos' || 
        item.categoria === selectedCategory;

      // B) Filtro por Texto
      const matchesSearch = 
        item.producto.toLowerCase().trim().includes(debouncedQuery.toLowerCase().trim());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, debouncedQuery]);

  const renderProduct = ({ item }: { item: typeof MOCK_PRODUCTS[0] }) => {
    const isLowStock = item.stock < 5;

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: tokens.colors.bg[1] }]}
        onPress={() => router.push(`/(conductor)/products/${item.id}`)}
      >
        <View style={[styles.imagePlaceholder, { backgroundColor: tokens.colors.bg[0] }]}>
          <Icon name="box" size={40} color={tokens.colors.ink[3]} />
          <Text style={[styles.placeholderText, { color: tokens.colors.ink[3], marginTop: 8 }]}>
            {item.producto.split(' ').pop()}
          </Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.productName, { color: tokens.colors.ink[0] }]} numberOfLines={1}>
            {item.producto}
          </Text>
          <Text style={[styles.productCategory, { color: tokens.colors.ink[2] }]}>
            {item.categoria.toUpperCase()}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={[styles.price, { color: tokens.colors.ink[0] }]}>
              Bs.{item.precio}
            </Text>
            <View style={[
              styles.stockBadge, 
              { backgroundColor: isLowStock ? tokens.colors.danger : tokens.colors.accent }
            ]}>
              <Text style={[styles.stockText, { color: isLowStock ? '#FFF' : '#000' }]}>
                {item.stock} stock
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg[0] }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="chevron-left" size={24} color={tokens.colors.ink[0]} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: tokens.colors.ink[0] }]}>Repuestos</Text>
        </View>

        <View style={styles.headerButton} />
      </View>

      {/* 4. Barra de Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: tokens.colors.bg[1], borderColor: tokens.colors.line }]}>
          <Icon name="search" size={18} color={tokens.colors.ink[2]} />
          <TextInput
            style={[styles.searchInput, { color: tokens.colors.ink[0] }]}
            placeholder="Buscar repuestos..."
            placeholderTextColor={tokens.colors.ink[3]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={16} color={tokens.colors.ink[2]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill,
                { borderColor: tokens.colors.line },
                selectedCategory === cat && { backgroundColor: tokens.colors.accent, borderColor: tokens.colors.accent }
              ]}
            >
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === cat ? tokens.colors.bg[0] : tokens.colors.ink[1] }
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid de Productos o Empty State */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search" size={48} color={tokens.colors.ink[3]} />
            <Text style={[styles.emptyText, { color: tokens.colors.ink[2] }]}>
              No se encontraron repuestos para tu búsqueda
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'InterBold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Inter',
  },
  filterWrapper: {
    marginVertical: 12,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 0.48,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
    opacity: 0.5,
  },
  cardContent: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontFamily: 'InterBold',
  },
  productCategory: {
    fontSize: 10,
    fontFamily: 'Inter',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  price: {
    fontSize: 14,
    fontFamily: 'InterBold',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 10,
    fontFamily: 'InterBold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});

