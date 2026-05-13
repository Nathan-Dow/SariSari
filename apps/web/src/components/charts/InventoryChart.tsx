'use client';

import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { MOCK_INVENTORY_LOGS } from '@hackitup/shared';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface LogEntry {
  delta: number;
  reason: string;
  created_at: string;
}

interface ChartPoint {
  date: string;
  stock: number;
  delta: number;
  reason: string;
}

interface TooltipPayload {
  value: number;
  payload: ChartPoint;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const sign = d.delta >= 0 ? '+' : '';
  const reasonLabel: Record<string, string> = {
    restock: 'Restock',
    sale: 'Sale',
    adjustment: 'Adjustment',
    waste: 'Waste',
  };
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 shadow-sm">
      <p className="font-label-mono text-label-mono text-on-surface-variant mb-1">{label}</p>
      <p className="font-label-mono text-label-mono text-on-surface font-bold">
        {d.stock} units
      </p>
      <p className={`font-label-mono text-label-mono ${d.delta >= 0 ? 'text-primary' : 'text-error'}`}>
        {sign}{d.delta} · {reasonLabel[d.reason] ?? d.reason}
      </p>
    </div>
  );
}

export function InventoryChart({ productId }: { productId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (DEMO_MODE) {
      const filtered = MOCK_INVENTORY_LOGS.filter((l) => l.product_id === productId);
      setLogs(filtered);
      setLoading(false);
      return;
    }

    createClient()
      .from('inventory_logs')
      .select('delta, reason, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })
      .limit(90)
      .then(({ data }) => {
        setLogs((data ?? []) as LogEntry[]);
        setLoading(false);
      });
  }, [productId]);

  let running = 0;
  const chartData: ChartPoint[] = logs.map((log) => ({
    date: new Date(log.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
    stock: (running += log.delta),
    delta: log.delta,
    reason: log.reason,
  }));

  const gradientId = `stockGradient-${productId.replace(/[^a-zA-Z0-9]/g, '')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <span className="font-label-mono text-label-mono text-on-surface-variant">Loading…</span>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant">
        <span className="material-symbols-outlined text-[32px] mb-2">bar_chart</span>
        <p className="font-body-sm text-body-sm">No stock history available</p>
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#15157d" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#f7fafc" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#e0e3e5" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#464652', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)' }}
            axisLine={{ stroke: '#c7c5d4' }}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: '#464652', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="stock"
            stroke="#15157d"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ fill: '#ffffff', stroke: '#15157d', strokeWidth: 1.5, r: 3 }}
            activeDot={{ fill: '#15157d', stroke: '#ffffff', strokeWidth: 2, r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
