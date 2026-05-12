import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../lib/colors';

export default function ReceiptScreen() {
  const { transactionId, total } = useLocalSearchParams<{
    transactionId: string;
    total: string;
  }>();

  const shortId = transactionId?.slice(0, 8).toUpperCase() ?? '—';
  const totalAmount = parseFloat(total ?? '0');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Success icon */}
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="check-circle" size={72} color={colors.secondary} />
        </View>

        <Text style={styles.title}>Payment Complete</Text>
        <Text style={styles.subtitle}>Transaction processed successfully</Text>

        {/* Receipt card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>ORDER ID</Text>
            <Text style={styles.cardValue}>#{shortId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>TOTAL CHARGED</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>TIME</Text>
            <Text style={styles.cardValue}>
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(pos)/scan')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="barcode-scan" size={20} color={colors.onPrimary} />
          <Text style={styles.primaryBtnText}>Scan Next Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(pos)/scan')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Back to Scanner</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginVertical: 8,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  cardValue: { fontSize: 15, fontWeight: '600', color: colors.onSurface, fontVariant: ['tabular-nums'] },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: colors.outlineVariant },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '600', color: colors.onPrimary },
  secondaryBtn: {
    height: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 15, color: colors.onSurfaceVariant, fontWeight: '500' },
});
