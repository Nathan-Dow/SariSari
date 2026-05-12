'use client';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useHourlyRevenue } from '@/hooks/useHourlyRevenue';
import { formatHour } from '@hackitup/shared';

function formatYAxis(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

interface TooltipPayload {
  value: number;
  payload: { hour_bucket: string; revenue: number; tx_count: number };
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
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 shadow-sm">
      <p className="font-label-mono text-label-mono text-on-surface-variant mb-1">
        {label ? formatHour(label) : ''}
      </p>
      <p className="font-label-mono text-label-mono text-on-surface font-bold">
        ${d.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      <p className="font-label-mono text-label-mono text-on-surface-variant">
        {d.tx_count} transactions
      </p>
    </div>
  );
}

export function RevenueChart() {
  const { data, loading } = useHourlyRevenue(24);

  return (
    <div className="xl:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-headline-md text-headline-md text-on-surface">Hourly Revenue Trend</h4>
        <button className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>
      <div className="flex-1 min-h-[240px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="font-label-mono text-label-mono text-on-surface-variant">Loading…</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15157d" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#f7fafc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="0"
                stroke="#e0e3e5"
                vertical={false}
              />
              <XAxis
                dataKey="hour_bucket"
                tickFormatter={(v: string) => formatHour(v)}
                tick={{ fill: '#464652', fontSize: 12, fontFamily: 'var(--font-jetbrains-mono)' }}
                axisLine={{ stroke: '#c7c5d4' }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: '#464652', fontSize: 12, fontFamily: 'var(--font-jetbrains-mono)' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#15157d"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={{ fill: '#ffffff', stroke: '#15157d', strokeWidth: 1.5, r: 3 }}
                activeDot={{ fill: '#15157d', stroke: '#ffffff', strokeWidth: 2, r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
