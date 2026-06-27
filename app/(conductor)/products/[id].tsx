import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/components/ui/Icon';
import { Stars } from '@/components/ui/Stars';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { productsApi } from '@/lib/products';

const { width } = Dimensions.get('window');

const TABS = ['Descripción', 'Compatibilidad', 'Envío'];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { tokens } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Descripción');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProductById(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: tokens.colors.bg[0] }]}>
        <ActivityIndicator color={tokens.colors.accent} size="large" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.center, { backgroundColor: tokens.colors.bg[0] }]}>
        <Text style={{ color: tokens.colors.ink[0] }}>Error al cargar el producto</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: tokens.colors.accent }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg[0] }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Over Carousel */}
      <View style={styles.absoluteHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="chevron-left" size={24} color={tokens.colors.ink[0]} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Carousel */}
        <View style={[styles.carouselContainer, { backgroundColor: tokens.colors.bg[1] }]}>
          {product.images && product.images.length > 0 ? (
            <View style={styles.imagePlaceholder}>
               <Text style={{ color: 'white' }}>Imagen: {product.images[activeImageIndex]}</Text>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={[styles.placeholderText, { color: tokens.colors.ink[3] }]}>
                {product.name.toUpperCase()}
              </Text>
            </View>
          )}
          
          {/* Pagination Dots */}
          {product.images && product.images.length > 1 && (
            <View style={styles.pagination}>
              {product.images.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    { backgroundColor: i === activeImageIndex ? tokens.colors.accent : tokens.colors.ink[3] }
                  ]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* Main Info */}
        <View style={styles.infoSection}>
          <View style={styles.badgeRow}>
            <Badge label={`${product.category} · ORIGINAL`} />
          </View>

          <Text style={[styles.title, { color: tokens.colors.ink[0] }]}>
            {product.name}
          </Text>

          <View style={styles.ratingRow}>
            <Stars rating={4.5} size={16} />
            <Text style={[styles.ratingText, { color: tokens.colors.ink[1] }]}>
              4.5 · 24 reseñas
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: tokens.colors.ink[0] }]}>
              Bs. {product.price}
            </Text>
            {/* Logic for discount could be added here if available in DB */}
          </View>

          {/* Tabs */}
          <View style={[styles.tabsContainer, { borderBottomColor: tokens.colors.line }]}>
            {TABS.map((tab) => (
              <TouchableOpacity 
                key={tab} 
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton,
                  activeTab === tab && { borderBottomColor: tokens.colors.accent }
                ]}
              >
                <Text style={[
                  styles.tabText, 
                  { color: activeTab === tab ? tokens.colors.accent : tokens.colors.ink[2] }
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.tabBody}>
            {activeTab === 'Descripción' && (
              <>
                <Text style={[styles.descriptionText, { color: tokens.colors.ink[1] }]}>
                  {product.description || 'Sin descripción disponible.'}
                </Text>
                <View style={styles.specsContainer}>
                  <View style={styles.specItem}>
                    <View style={[styles.bullet, { backgroundColor: tokens.colors.accent }]} />
                    <Text style={[styles.specText, { color: tokens.colors.ink[1] }]}>Disponibilidad: {product.stock} unidades</Text>
                  </View>
                </View>
              </>
            )}
            {activeTab === 'Compatibilidad' && (
              <Text style={[styles.descriptionText, { color: tokens.colors.ink[1] }]}>
                Información de compatibilidad no disponible.
              </Text>
            )}
            {activeTab === 'Envío' && (
              <Text style={[styles.descriptionText, { color: tokens.colors.ink[1] }]}>
                Información de envío no disponible.
              </Text>
            )}
          </View>

          {/* Supplier Card */}
          {product.supplier && (
            <View style={[styles.supplierCard, { backgroundColor: tokens.colors.bg[1] }]}>
              <View style={styles.supplierLeft}>
                <Avatar label={product.supplier.initials} size={48} />
                <View style={styles.supplierInfo}>
                  <Text style={[styles.supplierName, { color: tokens.colors.ink[0] }]}>
                    {product.supplier.name}
                  </Text>
                  <Text style={[styles.supplierZone, { color: tokens.colors.ink[2] }]}>
                    {product.supplier.zone}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.contactButton, { borderColor: tokens.colors.accent }]}>
                <Icon name="phone" size={16} color={tokens.colors.accent} />
                <Text style={[styles.contactText, { color: tokens.colors.accent }]}>Contacto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomActions, { backgroundColor: tokens.colors.bg[1], borderTopColor: tokens.colors.line }]}>
        <TouchableOpacity style={[styles.cartButton, { borderColor: tokens.colors.line }]}>
          <Icon name="shopping-cart" size={20} color={tokens.colors.ink[0]} />
          <Text style={[styles.cartButtonText, { color: tokens.colors.ink[0] }]}>Carrito</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.buyButton, { backgroundColor: tokens.colors.accent }]}>
          <Text style={styles.buyButtonText}>Comprar — Bs.{product.price}</Text>
          <Icon name="arrow-right" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  carouselContainer: {
    height: 300,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    opacity: 0.6,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoSection: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'InterBold',
    lineHeight: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontFamily: 'InterBold',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'InterBold',
  },
  tabBody: {
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  specsContainer: {
    marginTop: 16,
    gap: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  specText: {
    fontSize: 14,
    fontFamily: 'Inter',
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginTop: 32,
  },
  supplierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supplierInfo: {
    gap: 2,
  },
  supplierName: {
    fontSize: 16,
    fontFamily: 'InterBold',
  },
  supplierZone: {
    fontSize: 13,
    fontFamily: 'Inter',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactText: {
    fontSize: 13,
    fontFamily: 'InterBold',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
  },
  cartButton: {
    flex: 0.35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    height: 56,
  },
  cartButtonText: {
    fontSize: 15,
    fontFamily: 'InterBold',
  },
  buyButton: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    height: 56,
  },
  buyButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'InterBold',
  },
});
