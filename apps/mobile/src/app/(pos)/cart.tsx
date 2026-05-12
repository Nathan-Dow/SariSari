import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCartStore } from '../../store/cartStore';
import { processCheckout } from '../../hooks/useCheckout';
import { colors } from '../../lib/colors';
import type { CartItem } from '@hackitup/shared';

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: 'cash' as const },
  { key: 'card', label: 'Card', icon: 'credit-card' as const },
  { key: 'gcash', label: 'GCash', icon: 'cellphone' as const },
  { key: 'maya', label: 'Maya', icon: 'cellphone' as const },
];

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemSku}>{item.product.sku}</Text>
        <Text style={styles.itemUnitPrice}>${item.product.price.toFixed(2)} each</Text>
      </View>
      <View style={styles.itemControls}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="minus" size={16} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={16} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.itemSubtotal}>
          ${(item.product.price * item.quantity).toFixed(2)}
        </Text>
        <TouchableOpacity
          onPress={() => removeItem(item.product.id)}
          activeOpacity={0.7}
          style={styles.removeBtn}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { items, clearCart, total } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const result = await processCheckout(
        items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        paymentMethod
      );
      clearCart();
      router.replace({
        pathname: '/(pos)/receipt',
        params: {
          transactionId: result.transaction_id,
          total: result.total_amount.toString(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      Alert.alert('Checkout Error', message);
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = total();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Cart</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Cart items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ITEMS ({items.length})</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Your cart is empty</Text>
          ) : (
            items.map((item) => <CartItemRow key={item.product.id} item={item} />)
          )}
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity
                key={pm.key}
                style={[
                  styles.paymentChip,
                  paymentMethod === pm.key && styles.paymentChipActive,
                ]}
                onPress={() => setPaymentMethod(pm.key)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={pm.icon}
                  size={18}
                  color={paymentMethod === pm.key ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.paymentChipText,
                    paymentMethod === pm.key && styles.paymentChipTextActive,
                  ]}
                >
                  {pm.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
          {items.map((item) => (
            <View key={item.product.id} style={styles.summaryRow}>
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {item.product.name} × {item.quantity}
              </Text>
              <Text style={styles.summaryValue}>
                ${(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotal}>${cartTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>${cartTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, (loading || items.length === 0) && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
          disabled={loading || items.length === 0}
          activeOpacity={0.85}
        >
          {loading ? (
            <Text style={styles.checkoutText}>Processing…</Text>
          ) : (
            <>
              <Text style={styles.checkoutText}>Confirm &amp; Pay</Text>
              <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
  },
  content: { flex: 1 },
  contentInner: { padding: 16, gap: 24, paddingBottom: 32 },

  section: { gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
  },

  itemRow: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  itemInfo: { gap: 2 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  itemSku: { fontSize: 12, color: colors.onSurfaceVariant, fontVariant: ['tabular-nums'] },
  itemUnitPrice: { fontSize: 13, color: colors.onSurfaceVariant },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    minWidth: 24,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  itemSubtotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  removeBtn: { padding: 4 },
  emptyText: {
    textAlign: 'center',
    color: colors.onSurfaceVariant,
    fontSize: 14,
    paddingVertical: 24,
  },

  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  paymentChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  paymentChipText: { fontSize: 14, color: colors.onSurfaceVariant, fontWeight: '500' },
  paymentChipTextActive: { color: colors.onPrimaryContainer, fontWeight: '600' },

  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { flex: 1, fontSize: 14, color: colors.onSurfaceVariant, marginRight: 8 },
  summaryValue: { fontSize: 14, color: colors.onSurface, fontVariant: ['tabular-nums'] },
  summaryDivider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: 4 },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  summaryTotal: { fontSize: 20, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  footerLabel: { fontSize: 13, color: colors.onSurfaceVariant },
  footerTotal: { fontSize: 26, fontWeight: '700', color: colors.onSurface },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 56,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  checkoutBtnDisabled: { opacity: 0.45 },
  checkoutText: { fontSize: 17, fontWeight: '600', color: colors.onPrimary },
});
