'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MOCK_HOURLY_REVENUE, type HourlyRevenue } from '@hackitup/shared';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function useHourlyRevenue(hours = 24) {
  const [data, setData] = useState<HourlyRevenue[]>(DEMO_MODE ? MOCK_HOURLY_REVENUE : []);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (DEMO_MODE) return;

    const supabase = createClient();
    setLoading(true);

    supabase
      .rpc('get_hourly_revenue', { p_hours: hours })
      .then(({ data: rows, error: err }) => {
        if (err) setError(err.message);
        else setData((rows as HourlyRevenue[]) ?? []);
        setLoading(false);
      });
  }, [hours]);

  return { data, loading, error };
}
