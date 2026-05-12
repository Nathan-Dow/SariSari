import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../lib/colors';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TABS: { name: string; icon: IconName; iconFilled: IconName; label: string }[] = [
  { name: 'sales',     icon: 'point-of-sale',  iconFilled: 'point-of-sale',  label: 'Sales' },
  { name: 'scan',      icon: 'barcode-scan',   iconFilled: 'barcode-scan',   label: 'Scan' },
  { name: 'inventory', icon: 'package-variant', iconFilled: 'package-variant-closed', label: 'Inventory' },
  { name: 'stats',     icon: 'chart-line',     iconFilled: 'chart-line',     label: 'Stats' },
];

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab, index) => {
        const isFocused = state.index === index;
        const route = state.routes[index];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route?.key ?? '',
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.tab, isFocused && styles.tabActive]}
          >
            <MaterialCommunityIcons
              name={isFocused ? tab.iconFilled : tab.icon}
              size={24}
              color={isFocused ? colors.onSecondaryContainer : colors.onSurfaceVariant}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    gap: 2,
  },
  tabActive: {
    backgroundColor: colors.secondaryContainer,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.onSecondaryContainer,
    fontWeight: '700',
  },
});
