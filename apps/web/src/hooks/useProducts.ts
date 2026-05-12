'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@hackitup/shared';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetch() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (err) {
        setError(err.message);
      } else {
        setProducts((data as Product[]) ?? []);
      }
      setLoading(false);
    }

    fetch();
  }, []);

  return { products, loading, error };
}
