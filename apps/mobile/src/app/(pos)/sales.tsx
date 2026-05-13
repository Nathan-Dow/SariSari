import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/colors';
import { formatCurrency, formatDate } from '@hackitup/shared';
import type { Transaction, TransactionItem } from '@hackitup/shared';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TransactionItemWithProduct = TransactionItem & {
  products: { name: string } | null;
};

// ─── Filter helpers ───────────────────────────────────────────────────────────
type FilterKey = 'today' | 'week' | 'month';

function getFilterStart(key: FilterKey): string {
  const now = new Date();
  if (key === 'today') {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (key === 'week') {
    const day = now.getDay(); // 0 = Sun
    now.setDate(now.getDate() - day);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  // month
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

// ─── Payment method icon ──────────────────────────────────────────────────────
function paymentIcon(method: string): keyof typeof MaterialCommunityIcons.glyphMap {
  if (method === 'cash') return 'cash';
  if (method === 'card') return 'credit-card';
  if (method === 'gcash' || method === 'maya') return 'cellphone';
  return 'receipt';
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TransactionRow({
  tx,
  expanded,
  items,
  itemsLoading,
  onPress,
}: {
  tx: Transaction;
  expanded: boolean;
  items: TransactionItemWithProduct[];
  itemsLoading: boolean;
  onPress: () => void;
}) {
  const shortId = tx.id.slice(-8).toUpperCase();
  const dateStr = formatDate(tx.created_at);

  return (
    <View style={styles.txCard}>
      {/* Summary row */}
      <TouchableOpacity
        style={styles.txSummary}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {/* Left */}
        <View style={styles.txLeft}>
          <View style={styles.txIdRow}>
            <MaterialCommunityIcons
              name={paymentIcon(tx.payment_method)}
              size={16}
              color={colors.primary}
            />
            <Text style={styles.txId}># {shortId}</Text>
          </View>
          <Text style={styles.txDate}>{dateStr}</Text>
          <Text style={styles.txMeta}>
            {tx.payment_method.toUpperCase()}
          </Text>
        </View>

        {/* Right */}
        <View style={styles.txRight}>
          <Text style={styles.txTotal}>{formatCurrency(tx.total_amount)}</Text>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.onSurfaceVariant}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded line items */}
      {expanded && (
        <View style={styles.txItems}>
          {itemsLoading ? (
            <View style={styles.txItemsLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : items.length === 0 ? (
            <Text style={styles.txItemsEmpty}>No items found</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.lineItem}>
                <Text style={styles.lineItemName} numberOfLines={1}>
                  {item.products?.name ?? 'Unknown product'}
                </Text>
                <View style={styles.lineItemRight}>
                  <Text style={styles.lineItemQty}>×{item.quantity}</Text>
                  <Text style={styles.lineItemSubtotal}>
                    {formatCurrency(item.subtotal)}
                  </Text>
                </View>
              </View>
            ))
          )}
          <View style={styles.lineItemDivider} />
          <View style={styles.lineItemTotal}>
            <Text style={styles.lineItemTotalLabel}>Total</Text>
            <Text style={styles.lineItemTotalValue}>
              {formatCurrency(tx.total_amount)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SalesScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('today');

  // Expanded state: maps txId → items (once loaded)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<TransactionItemWithProduct[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const fetchTransactions = useCallback(
    async (isRefresh = false, activeFilter: FilterKey = filter) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;

      if (!uid) {
        setError('You must be logged in to view sales.');
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
        return;
      }

      const since = getFilterStart(activeFilter);

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('cashier_id', uid)
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTransactions((data as Transaction[]) ?? []);
      }

      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    },
    [filter],
  );

  useEffect(() => {
    setExpandedId(null);
    setExpandedItems([]);
    fetchTransactions(false, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleExpandTx = useCallback(
    async (txId: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      if (expandedId === txId) {
        setExpandedId(null);
        setExpandedItems([]);
        return;
      }

      setExpandedId(txId);
      setExpandedItems([]);
      setItemsLoading(true);

      const { data, error: itemsError } = await supabase
        .from('transaction_items')
        .select('*, products(name)')
        .eq('transaction_id', txId)
        .order('id', { ascending: true });

      if (!itemsError && data) {
        setExpandedItems(data as TransactionItemWithProduct[]);
      }
      setItemsLoading(false);
    },
    [expandedId],
  );

  // Summary stats for current filter
  const totalSales = transactions.length;
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Transaction>) => (
      <TransactionRow
        tx={item}
        expanded={expandedId === item.id}
        items={expandedId === item.id ? expandedItems : []}
        itemsLoading={expandedId === item.id && itemsLoading}
        onPress={() => handleExpandTx(item.id)}
      />
    ),
    [expandedId, expandedItems, itemsLoading, handleExpandTx],
  );

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sales</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f.key && styles.filterTabTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary bar */}
      {!loading && error === null && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalSales}</Text>
            <Text style={styles.summaryLabel}>
              {totalSales === 1 ? 'Sale' : 'Sales'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
          </View>
        </View>
      )}

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading transactions…</Text>
        </View>
      ) : error !== null ? (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchTransactions()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={
            transactions.length === 0 ? styles.listEmpty : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTransactions(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={52}
                color={colors.outlineVariant}
              />
              <Text style={styles.emptyTitle}>No sales yet</Text>
              <Text style={styles.emptySubtitle}>
                Completed transactions will appear here.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          keyboardDismissMode="on-drag"
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
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  filterTab: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  filterTabActive: {
    backgroundColor: colors.primaryContainer,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  filterTabTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 0,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: 8,
  },

  // List
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  // Transaction card
  txCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  txSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  txLeft: {
    flex: 1,
    gap: 3,
  },
  txIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txId: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  txDate: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  txMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    letterSpacing: 0.4,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txTotal: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },

  // Expanded items
  txItems: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    padding: 14,
    gap: 8,
    backgroundColor: colors.surfaceContainer,
  },
  txItemsLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  txItemsEmpty: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 8,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lineItemName: {
    flex: 1,
    fontSize: 13,
    color: colors.onSurface,
  },
  lineItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineItemQty: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  lineItemSubtotal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    fontVariant: ['tabular-nums'],
    minWidth: 72,
    textAlign: 'right',
  },
  lineItemDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: 4,
  },
  lineItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  lineItemTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
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
    fontSize: 17,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});
