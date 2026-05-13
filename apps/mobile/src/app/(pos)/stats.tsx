import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/colors';
import { formatCurrency, formatHour } from '@hackitup/shared';
import type { HourlyRevenue } from '@hackitup/shared';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatsData {
  revenue: number;
  salesCount: number;
  topProductName: string;
  lowStockCount: number;
  hourlyRevenue: HourlyRevenue[];
  topProducts: { name: string; quantity: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayEnd(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.summaryCard, accent && styles.summaryCardAccent]}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={accent ? colors.onPrimaryContainer : colors.secondary}
      />
      <Text
        style={[styles.summaryCardValue, accent && styles.summaryCardValueAccent]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={[styles.summaryCardLabel, accent && styles.summaryCardLabelAccent]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Bar chart (pure RN, no libs) ─────────────────────────────────────────────
const BAR_MAX_HEIGHT = 100;
const BAR_MIN_HEIGHT = 4;

function HourlyBarChart({ data }: { data: HourlyRevenue[] }) {
  if (data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>No revenue data yet today</Text>
      </View>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <View style={styles.chart}>
      {/* Y-axis hint */}
      <Text style={styles.chartYMax}>{formatCurrency(maxRevenue)}</Text>

      {/* Bars */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barsScrollContent}
      >
        {data.map((bucket) => {
          const ratio = bucket.revenue / maxRevenue;
          const barH = Math.max(BAR_MIN_HEIGHT, Math.round(ratio * BAR_MAX_HEIGHT));
          const hourLabel = formatHour(bucket.hour_bucket);
          const isHighest = bucket.revenue === maxRevenue && bucket.revenue > 0;

          return (
            <View key={bucket.hour_bucket} style={styles.barWrapper}>
              {/* Amount tooltip on tallest bar */}
              {isHighest && (
                <Text style={styles.barTooltip} numberOfLines={1}>
                  {formatCurrency(bucket.revenue)}
                </Text>
              )}

              {/* Bar area container keeps alignment */}
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.bar,
                    { height: barH },
                    isHighest && styles.barHighest,
                  ]}
                />
              </View>

              {/* Hour label */}
              <Text style={styles.barLabel} numberOfLines={1}>
                {hourLabel}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Baseline */}
      <View style={styles.chartBaseline} />
    </View>
  );
}

// ─── Top products list ────────────────────────────────────────────────────────
function TopProductList({ products }: { products: { name: string; quantity: number }[] }) {
  if (products.length === 0) {
    return (
      <Text style={styles.topProductsEmpty}>No products sold yet today.</Text>
    );
  }

  const maxQty = Math.max(...products.map((p) => p.quantity), 1);

  return (
    <View style={styles.topProductsList}>
      {products.map((p, idx) => {
        const pct = p.quantity / maxQty;
        return (
          <View key={p.name} style={styles.topProductRow}>
            <Text style={styles.topProductRank}>{idx + 1}</Text>
            <View style={styles.topProductInfo}>
              <View style={styles.topProductNameRow}>
                <Text style={styles.topProductName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.topProductQty}>{p.quantity} sold</Text>
              </View>
              <View style={styles.topProductBarTrack}>
                <View
                  style={[
                    styles.topProductBarFill,
                    { width: `${Math.round(pct * 100)}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const since = todayStart();
      const until = todayEnd();

      // ── 1. Today's transactions ────────────────────────────────────────────
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('id, total_amount, status')
        .gte('created_at', since)
        .lte('created_at', until)
        .eq('status', 'completed');

      if (txError) throw new Error(txError.message);

      const txList = (txData ?? []) as { id: string; total_amount: number; status: string }[];
      const revenue = txList.reduce((sum, t) => sum + t.total_amount, 0);
      const salesCount = txList.length;
      const txIds = txList.map((t) => t.id);

      // ── 2. Low-stock count ─────────────────────────────────────────────────
      const { count: lowStockCount, error: stockError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('stock', 10);

      if (stockError) throw new Error(stockError.message);

      // ── 3. Top products today ──────────────────────────────────────────────
      let topProducts: { name: string; quantity: number }[] = [];
      let topProductName = '—';

      if (txIds.length > 0) {
        const { data: itemData, error: itemError } = await supabase
          .from('transaction_items')
          .select('quantity, products(id, name)')
          .in('transaction_id', txIds);

        if (itemError) throw new Error(itemError.message);

        // Aggregate by product
        const qtyMap = new Map<string, { name: string; quantity: number }>();
        for (const row of itemData ?? []) {
          const raw = row as {
            quantity: number;
            products: { id: string; name: string } | { id: string; name: string }[] | null;
          };
          const product = Array.isArray(raw.products) ? raw.products[0] : raw.products;
          if (!product) continue;
          const existing = qtyMap.get(product.id);
          if (existing) {
            existing.quantity += raw.quantity;
          } else {
            qtyMap.set(product.id, {
              name: product.name,
              quantity: raw.quantity,
            });
          }
        }

        topProducts = Array.from(qtyMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        if (topProducts.length > 0) {
          topProductName = topProducts[0].name;
        }
      }

      // ── 4. Hourly revenue RPC ──────────────────────────────────────────────
      const { data: hourlyData, error: hourlyError } = await supabase
        .rpc('get_hourly_revenue', { p_hours: 24 });

      if (hourlyError) throw new Error(hourlyError.message);

      // Filter to today only
      const hourlyRevenue = ((hourlyData ?? []) as HourlyRevenue[]).filter((h) => {
        const t = new Date(h.hour_bucket).getTime();
        return t >= new Date(since).getTime() && t <= new Date(until).getTime();
      });

      setStats({
        revenue,
        salesCount,
        topProductName,
        lowStockCount: lowStockCount ?? 0,
        hourlyRevenue,
        topProducts,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load stats.';
      setError(message);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Today's Stats</Text>
          <Text style={styles.headerDate}>{today}</Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchStats(true)}
          style={styles.refreshBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="refresh" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading stats…</Text>
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
            onPress={() => fetchStats()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStats(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2×2 Summary grid ─────────────────────────────────────────── */}
          <View style={styles.summaryGrid}>
            <SummaryCard
              icon="currency-php"
              label="Today's Revenue"
              value={formatCurrency(stats?.revenue ?? 0)}
              accent
            />
            <SummaryCard
              icon="receipt-text-check-outline"
              label="Sales Count"
              value={String(stats?.salesCount ?? 0)}
            />
            <SummaryCard
              icon="star-outline"
              label="Top Product"
              value={stats?.topProductName ?? '—'}
            />
            <SummaryCard
              icon="alert-box-outline"
              label="Low Stock Items"
              value={String(stats?.lowStockCount ?? 0)}
            />
          </View>

          {/* ── Hourly revenue bar chart ──────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue by Hour</Text>
            <View style={styles.chartCard}>
              <HourlyBarChart data={stats?.hourlyRevenue ?? []} />
            </View>
          </View>

          {/* ── Top 5 products ────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Products Today</Text>
            <View style={styles.topProductsCard}>
              <TopProductList products={stats?.topProducts ?? []} />
            </View>
          </View>
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 24,
  },
  headerDate: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: 14,
    paddingBottom: 32,
    gap: 20,
  },

  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    alignItems: 'flex-start',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  summaryCardAccent: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  summaryCardValueAccent: {
    color: colors.onPrimaryContainer,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    lineHeight: 14,
  },
  summaryCardLabelAccent: {
    color: colors.onPrimaryContainer,
    opacity: 0.75,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: 0.2,
  },

  // Chart card
  chartCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 14,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  chart: {
    position: 'relative',
  },
  chartYMax: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  barsScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingBottom: 4,
    minWidth: '100%',
  },
  barWrapper: {
    alignItems: 'center',
    minWidth: 40,
    gap: 2,
  },
  barTooltip: {
    fontSize: 9,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  barArea: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 28,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.secondaryContainer,
  },
  barHighest: {
    backgroundColor: colors.primary,
  },
  barLabel: {
    fontSize: 9,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  chartBaseline: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginTop: 0,
  },
  chartEmpty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  chartEmptyText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },

  // Top products
  topProductsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 14,
    gap: 12,
  },
  topProductsEmpty: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 12,
  },
  topProductsList: {
    gap: 14,
  },
  topProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topProductRank: {
    width: 22,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  topProductInfo: {
    flex: 1,
    gap: 5,
  },
  topProductNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  topProductName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  topProductQty: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  topProductBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  topProductBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
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
});
