import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { useCartStore } from '../../store/cartStore';
import { lookupProductByBarcode } from '../../hooks/useProductLookup';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/colors';
import { type Product, MOCK_PRODUCTS } from '@hackitup/shared';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

const VIEWFINDER_W = 256;
const VIEWFINDER_H = 160;

// ── Viewfinder corner bracket ─────────────────────────────────────────────────
function CornerBracket({ position }: {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('Left');
  return (
    <View
      style={[
        styles.bracket,
        isTop ? { top: 0 } : { bottom: 0 },
        isLeft ? { left: 0 } : { right: 0 },
        {
          borderTopWidth: isTop ? 4 : 0,
          borderBottomWidth: isTop ? 0 : 4,
          borderLeftWidth: isLeft ? 4 : 0,
          borderRightWidth: isLeft ? 0 : 4,
        },
      ]}
    />
  );
}

// ── Quick-add product chip ────────────────────────────────────────────────────
function QuickAddChip({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.75}>
      <MaterialCommunityIcons name="cart-plus" size={16} color={colors.onSurface} />
      <Text style={styles.chipText} numberOfLines={1}>{product.name}</Text>
    </TouchableOpacity>
  );
}

// ── Cart item row (preview in panel) ─────────────────────────────────────────
function CartPreviewItem({
  name,
  barcode,
  quantity,
  subtotal,
  isLast,
}: {
  name: string;
  barcode: string | null;
  quantity: number;
  subtotal: number;
  isLast: boolean;
}) {
  return (
    <View style={[styles.cartRow, !isLast && styles.cartRowBorder]}>
      <View style={styles.cartRowLeft}>
        <Text style={styles.cartItemName}>{name}</Text>
        {barcode && <Text style={styles.cartItemBarcode}>{barcode}</Text>}
      </View>
      <View style={styles.cartRowRight}>
        <Text style={styles.cartItemQty}>x{quantity}</Text>
        <Text style={styles.cartItemPrice}>${subtotal.toFixed(2)}</Text>
      </View>
    </View>
  );
}

// ── Main Scan Screen ──────────────────────────────────────────────────────────
export default function ScanScreen() {
  const { width, height } = useWindowDimensions();
  const { items, addItem, total } = useCartStore();
  const [scanActive, setScanActive] = useState(true);
  const [quickAddProducts, setQuickAddProducts] = useState<Product[]>([]);

  // Animated scanning line
  const scanLineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scanLineY]);

  const scanLineTranslate = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [-(VIEWFINDER_H / 2 - 6), VIEWFINDER_H / 2 - 6],
  });

  // Fetch quick-add products (most frequent or alphabetical fallback)
  useEffect(() => {
    if (DEMO_MODE) {
      setQuickAddProducts(MOCK_PRODUCTS.filter((p) => p.is_active).slice(0, 5));
      return;
    }
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .limit(5)
      .then(({ data }) => {
        setQuickAddProducts((data as Product[]) ?? []);
      });
  }, []);

  const handleBarcodeScanned = async (barcode: string) => {
    setScanActive(false);
    const product = await lookupProductByBarcode(barcode);
    if (product) {
      addItem(product);
    } else {
      Alert.alert('Product Not Found', `No product found for barcode: ${barcode}`);
    }
    // Re-enable scan after a short delay
    setTimeout(() => setScanActive(true), 1500);
  };

  const handleQuickAdd = (product: Product) => {
    addItem(product);
  };

  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = total();

  // Overlay: 4 rectangles that frame the viewfinder, creating a "cutout" effect
  const sideW = (width - VIEWFINDER_W) / 2;
  // The viewfinder is centered vertically in the camera area
  // We don't know the exact height so we use flex positioning

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* ── Top App Bar ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
            <MaterialCommunityIcons name="menu" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Omega POS</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
          <MaterialCommunityIcons name="account-circle" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* ── Camera + Overlay ─────────────────────────────────────────── */}
      <View style={styles.cameraArea}>
        {/* Live camera */}
        <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} active={scanActive} />

        {/* Dark vignette overlay — top strip */}
        <View style={[styles.mask, styles.maskTop]} pointerEvents="none" />
        {/* Dark vignette overlay — bottom strip (behind cart panel) */}
        <View style={[styles.mask, styles.maskBottom]} pointerEvents="none" />
        {/* Dark vignette overlay — left strip */}
        <View
          style={[styles.mask, styles.maskSide, { left: 0, width: sideW }]}
          pointerEvents="none"
        />
        {/* Dark vignette overlay — right strip */}
        <View
          style={[styles.mask, styles.maskSide, { right: 0, width: sideW }]}
          pointerEvents="none"
        />

        {/* ── Viewfinder frame ────────────────────────────────────────── */}
        <View style={styles.viewfinderContainer} pointerEvents="none">
          <View style={styles.viewfinder}>
            <CornerBracket position="topLeft" />
            <CornerBracket position="topRight" />
            <CornerBracket position="bottomLeft" />
            <CornerBracket position="bottomRight" />

            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
          </View>

          {/* Instruction pill */}
          <View style={styles.instructionPill}>
            <MaterialCommunityIcons name="line-scan" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.instructionText}>Align barcode within frame</Text>
          </View>
        </View>

        {/* ── Bottom floating panel area ─────────────────────────────── */}
        <View style={styles.bottomPanel}>
          {/* Quick-add chips row */}
          <View style={styles.chipsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {quickAddProducts.map((p) => (
                <QuickAddChip key={p.id} product={p} onPress={() => handleQuickAdd(p)} />
              ))}
            </ScrollView>
            {/* Mic button */}
            <TouchableOpacity style={styles.micBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="microphone" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Floating cart panel */}
          <View style={styles.cartPanel}>
            {/* Cart header */}
            <View style={styles.cartHeader}>
              <View style={styles.cartTitleRow}>
                <MaterialCommunityIcons name="cart" size={22} color={colors.onSurface} />
                <Text style={styles.cartTitle}>Current Cart</Text>
              </View>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount} Items</Text>
              </View>
            </View>

            {/* Cart items preview */}
            <ScrollView
              style={styles.cartItems}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {items.length === 0 ? (
                <Text style={styles.emptyCart}>No items — scan a product to begin</Text>
              ) : (
                items.map((item, i) => (
                  <CartPreviewItem
                    key={item.product.id}
                    name={item.product.name}
                    barcode={item.product.barcode}
                    quantity={item.quantity}
                    subtotal={item.product.price * item.quantity}
                    isLast={i === items.length - 1}
                  />
                ))
              )}
            </ScrollView>

            {/* Total + Checkout */}
            <View style={styles.cartFooter}>
              <View>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>${cartTotal.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkoutBtn, items.length === 0 && styles.checkoutBtnDisabled]}
                onPress={() => router.push('/(pos)/cart')}
                disabled={items.length === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.checkoutText}>Checkout</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    zIndex: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  iconBtn: {
    padding: 6,
  },

  // Camera area
  cameraArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surfaceDim,
    overflow: 'hidden',
  },

  // Dark mask strips (4-rectangle cutout approach)
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(45, 49, 51, 0.62)',
    zIndex: 10,
  },
  maskTop: {
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
  },
  maskBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    // Bottom portion is covered by the cart panel; we fade from the viewfinder
    top: '48%',
  },
  maskSide: {
    top: '20%',
    bottom: '52%',
  },

  // Viewfinder
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 11,
    alignItems: 'center',
    justifyContent: 'center',
    // Center it in the upper portion, above the cart panel
    paddingBottom: '45%',
  },
  viewfinder: {
    width: VIEWFINDER_W,
    height: VIEWFINDER_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(119, 118, 131, 0.4)',
  },
  bracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.secondaryContainer,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },

  // Instruction pill
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },

  // Bottom floating panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingBottom: 16,
    height: '55%',
    justifyContent: 'flex-end',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  chipsScroll: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 48,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  chipText: {
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: '500',
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Cart panel
  cartPanel: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cartBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSecondaryContainer,
    letterSpacing: 0.3,
  },

  // Cart items
  cartItems: {
    maxHeight: 120,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cartRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  cartRowLeft: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cartItemBarcode: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
    letterSpacing: 0.5,
  },
  cartRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cartItemQty: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  emptyCart: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Cart footer
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.onSurface,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 56,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  checkoutBtnDisabled: {
    opacity: 0.45,
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onPrimary,
  },
});
