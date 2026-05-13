import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ScrollView,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/colors';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '@hackitup/shared';
import type { Product } from '@hackitup/shared';

// ─── Stock badge semantics ────────────────────────────────────────────────────
// rgb() values used intentionally — the color palette has no green/amber tokens.
const STOCK_HIGH_BG = 'rgb(220,237,200)';
const STOCK_HIGH_TEXT = 'rgb(51,105,30)';
const STOCK_MED_BG = 'rgb(255,236,179)';
const STOCK_MED_TEXT = 'rgb(230,81,0)';

function stockBadgeColors(stock: number): { bg: string; fg: string; label: string } {
  if (stock >= 10) return { bg: STOCK_HIGH_BG, fg: STOCK_HIGH_TEXT, label: `${stock} in stock` };
  if (stock >= 1)  return { bg: STOCK_MED_BG,  fg: STOCK_MED_TEXT,  label: `${stock} left` };
  return { bg: colors.errorContainer, fg: colors.onErrorContainer, label: 'Out of stock' };
}

// ─── Product row ──────────────────────────────────────────────────────────────
function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const badge = stockBadgeColors(product.stock);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowMain}>
        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.productSku}>{product.sku}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
        <View style={[styles.stockBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.stockBadgeText, { color: badge.fg }]}>{badge.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Product detail modal ─────────────────────────────────────────────────────
function ProductModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem } = useCartStore();
  const badge = stockBadgeColors(product.stock);

  const handleAddToCart = () => {
    addItem(product);
    Alert.alert(
      'Added to Cart',
      `${product.name} has been added to your cart.`,
      [{ text: 'OK', onPress: onClose }],
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalSheet}
          onPress={() => {
            /* swallow tap so sheet doesn't close */
          }}
        >
          {/* Drag handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={2}>{product.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyInner}
            showsVerticalScrollIndicator={false}
          >
            {/* SKU / barcode / category chips */}
            <View style={styles.chipRow}>
              <View style={styles.infoChip}>
                <MaterialCommunityIcons name="barcode" size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.infoChipText}>{product.barcode ?? '—'}</Text>
              </View>
              <View style={styles.infoChip}>
                <MaterialCommunityIcons name="tag-outline" size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.infoChipText}>{product.sku}</Text>
              </View>
              {product.category !== null && (
                <View style={styles.infoChip}>
                  <MaterialCommunityIcons name="folder-outline" size={14} color={colors.onSurfaceVariant} />
                  <Text style={styles.infoChipText}>{product.category}</Text>
                </View>
              )}
            </View>

            {/* Price + cost */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Selling Price</Text>
                <Text style={styles.metricValue}>{formatCurrency(product.price)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Cost</Text>
                <Text style={styles.metricValue}>
                  {product.cost !== null ? formatCurrency(product.cost) : '—'}
                </Text>
              </View>
            </View>

            {/* Stock level */}
            <View style={styles.stockCard}>
              <Text style={styles.stockCardLabel}>Current Stock</Text>
              <View style={[styles.stockPill, { backgroundColor: badge.bg }]}>
                <Text style={[styles.stockPillText, { color: badge.fg }]}>
                  {product.stock} {product.stock === 1 ? 'unit' : 'units'}
                </Text>
              </View>
              {product.stock === 0 && (
                <Text style={styles.outOfStockNote}>
                  This item cannot be sold until restocked.
                </Text>
              )}
            </View>

            {/* Description */}
            {product.description !== null && (
              <View style={styles.descSection}>
                <Text style={styles.descLabel}>Description</Text>
                <Text style={styles.descText}>{product.description}</Text>
              </View>
            )}
          </ScrollView>

          {/* Add to cart button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.addToCartBtn, product.stock === 0 && styles.addToCartBtnDisabled]}
              onPress={handleAddToCart}
              disabled={product.stock === 0}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="cart-plus" size={20} color={colors.onPrimary} />
              <Text style={styles.addToCartText}>
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProducts((data as Product[]) ?? []);
    }

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [products, query]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => (
      <ProductRow product={item} onPress={() => setSelectedProduct(item)} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <Text style={styles.headerCount}>
          {loading ? '—' : `${products.length} products`}
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.onSurfaceVariant}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or SKU…"
          placeholderTextColor={colors.onSurfaceVariant}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products…</Text>
        </View>
      ) : error !== null ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProducts()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={filtered.length === 0 ? styles.listEmpty : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProducts(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialCommunityIcons
                name="package-variant-remove"
                size={52}
                color={colors.outlineVariant}
              />
              <Text style={styles.emptyTitle}>
                {query.length > 0 ? 'No products match your search' : 'No products found'}
              </Text>
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  style={styles.clearSearchBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {/* Product detail modal */}
      {selectedProduct !== null && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  headerCount: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  clearBtn: { padding: 4 },

  // List
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  separator: {
    height: 8,
  },

  // Product row
  row: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  rowMain: {
    flex: 1,
    gap: 3,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  productSku: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // States
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 4,
    height: 56,
    paddingHorizontal: 32,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  emptyTitle: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  clearSearchBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 12 },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    lineHeight: 26,
  },
  modalCloseBtn: {
    padding: 4,
    marginTop: 2,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyInner: {
    padding: 20,
    gap: 20,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceContainerHigh,
  },
  infoChipText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    padding: 14,
    gap: 4,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },

  stockCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  stockCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stockPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
  },
  stockPillText: {
    fontSize: 22,
    fontWeight: '700',
  },
  outOfStockNote: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
  },

  descSection: {
    gap: 6,
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  descText: {
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 20,
  },

  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  addToCartBtnDisabled: {
    opacity: 0.4,
  },
  addToCartText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onPrimary,
  },
});
