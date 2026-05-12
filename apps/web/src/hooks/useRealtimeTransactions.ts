'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Transaction } from '@hackitup/shared';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function useRealtimeTransactions(initialData: Transaction[]) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);

  useEffect(() => {
    // Demo mode: no Supabase credentials — just use the initial (mock) data.
    if (DEMO_MODE) return;

    const supabase = createClient();

    const channel = supabase
      .channel('realtime:transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          setTransactions((prev) => [payload.new as Transaction, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return transactions;
}
