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
function CornerBracket({
  position,
}: {
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
function QuickAddChip({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.chipIcon}>＋</Text>
      <Text style={styles.chipText} numberOfLines={1}>
        {product.name}
      </Text>
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
        <Text style={styles.cartItemPrice}>
          ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}

// ── Main Scan Screen ──────────────────────────────────────────────────────────
export default function ScanScreen() {
  const { width } = useWindowDimensions();
  const { items, addItem, total } = useCartStore();
  const [scanActive, setScanActive] = useState(true);
  const [quickAddProducts, setQuickAddProducts] = useState<Product[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

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

  // Fetch quick-add products
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
    try {
      setScanActive(false);
      setLastScanned(barcode);
      console.log("[DB] Looking up product for barcode:", barcode);

      const product = await lookupProductByBarcode(barcode);
      
      if (product) {
        Alert.alert('✓ Added', `${product.name} added to cart`, [
          { text: 'OK', onPress: () => setScanActive(true) },
        ]);
      } else {
        Alert.alert('Not Found', `No product found for barcode: ${barcode}`, [
          { text: 'OK', onPress: () => setScanActive(true) },
        ]);
      }
    } catch (error) {
      console.error("[DB] Supabase lookup failed:", error);
      Alert.alert('Error', 'Failed to search database. Check your connection.', [
        { text: 'OK', onPress: () => setScanActive(true) },
      ]);
    }
  };

  const handleQuickAdd = (product: Product) => {
    addItem(product);
    Alert.alert('✓ Added', `${product.name} added to cart`);
  };

  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = total();
  const sideW = (width - VIEWFINDER_W) / 2;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* ── Top App Bar ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SariSari POS</Text>
        {lastScanned && (
          <Text style={styles.lastScanned} numberOfLines={1}>
            Last: {lastScanned}
          </Text>
        )}
      </View>

      {/* ── Camera area (takes up top 45% of screen) ──────────────────── */}
      <View style={styles.cameraArea}>
        {/* Live camera — NO zIndex so it sits at base layer */}
        <BarcodeScanner onBarcodeScanned={handleBarcodeScanned} active={scanActive} />

        {/* Dark overlay strips — pointerEvents none so touches pass through */}
        <View style={[styles.mask, styles.maskTop]} pointerEvents="none" />
        <View style={[styles.mask, styles.maskBottom]} pointerEvents="none" />
        <View
          style={[styles.mask, styles.maskSide, { left: 0, width: sideW }]}
          pointerEvents="none"
        />
        <View
          style={[styles.mask, styles.maskSide, { right: 0, width: sideW }]}
          pointerEvents="none"
        />

        {/* Viewfinder frame — pointerEvents none */}
        <View style={styles.viewfinderContainer} pointerEvents="none">
          <View style={styles.viewfinder}>
            <CornerBracket position="topLeft" />
            <CornerBracket position="topRight" />
            <CornerBracket position="bottomLeft" />
            <CornerBracket position="bottomRight" />
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
          </View>
          <View style={styles.instructionPill}>
            <Text style={styles.instructionText}>Align barcode within frame</Text>
          </View>
        </View>
      </View>

      {/* ── Bottom section (NOT overlapping camera) ───────────────────── */}
      <View style={styles.bottomSection}>
        {/* Quick-add chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsRow}
        >
          {quickAddProducts.map((p) => (
            <QuickAddChip key={p.id} product={p} onPress={() => handleQuickAdd(p)} />
          ))}
        </ScrollView>

        {/* Cart panel */}
        <View style={styles.cartPanel}>
          {/* Cart header */}
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>🛒 Current Cart</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount} Items</Text>
            </View>
          </View>

          {/* Cart items */}
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
              <Text style={styles.totalAmount}>
                ₱{cartTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.checkoutBtn,
                items.length === 0 && styles.checkoutBtnDisabled,
              ]}
              onPress={() => router.push('/(pos)/cart')}
              disabled={items.length === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutText}>Checkout →</Text>
            </TouchableOpacity>
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
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  lastScanned: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    maxWidth: 180,
  },

  // Camera — takes top 42% of remaining screen
  cameraArea: {
    flex: 42,
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  // Dark mask strips
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  maskTop: {
    top: 0,
    left: 0,
    right: 0,
    height: '15%',
  },
  maskBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
  },
  maskSide: {
    top: '15%',
    bottom: '15%',
  },

  // Viewfinder
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: VIEWFINDER_W,
    height: VIEWFINDER_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#fff',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: colors.secondary,
  },
  instructionPill: {
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  instructionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },

  // Bottom section — takes remaining 58% — normal flow so buttons work
  bottomSection: {
    flex: 58,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },

  // Quick-add chips
  chipsRow: {
    flexShrink: 0,
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
    height: 40,
    borderRadius: 8,
  },
  chipIcon: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  chipText: {
    fontSize: 13,
    color: colors.onSurface,
    fontWeight: '500',
  },

  // Cart panel
  cartPanel: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 14,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  cartBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSecondaryContainer,
  },
  cartItems: {
    flex: 1,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  cartRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  cartRowLeft: { flex: 1 },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cartItemBarcode: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  cartRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cartItemQty: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  emptyCart: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Cart footer
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    height: 56,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnDisabled: {
    opacity: 0.4,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});