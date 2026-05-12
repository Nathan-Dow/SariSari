import { Tabs } from 'expo-router';
import { BottomTabBar } from '../../components/BottomTabBar';

export default function PosLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="sales" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="receipt" options={{ href: null }} />
    </Tabs>
  );
}
