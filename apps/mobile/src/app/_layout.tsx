import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/colors';
import type { Session } from '@supabase/supabase-js';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // In demo mode every route is accessible — skip auth entirely
  if (DEMO_MODE) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(pos)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(pos)" redirect={!session} />
      <Stack.Screen name="(auth)" redirect={!!session} />
    </Stack>
  );
}
