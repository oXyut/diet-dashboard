import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartDataPoint, formatDateLabel } from '@/lib/utils/chartData';
import { ChartTooltip } from './ChartTooltip';
import { CHART_HEIGHT_SM, chartMargin, gridProps, xAxisProps, yAxisProps } from './chartTheme';

interface DeficitChartProps {
  data: ChartDataPoint[];
  targetBalance: number | null;
}

export default function DeficitChart({ data, targetBalance }: DeficitChartProps) {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT_SM}>
      <BarChart data={data.slice(-7)} margin={chartMargin}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} {...xAxisProps} />
        <YAxis unit=" kcal" {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
        <ReferenceLine y={0} stroke="var(--chart-axis)" />
        {targetBalance != null && (
          <ReferenceLine
            y={targetBalance}
            stroke="var(--chart-target)"
            strokeDasharray="4 4"
            label={{
              value: '目標収支',
              fill: 'var(--text-muted)',
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />
        )}
        <Bar dataKey="calorieBalance" name="カロリー収支" maxBarSize={24} radius={[4, 4, 0, 0]}>
          {data.slice(-7).map((entry) => (
            <Cell
              key={entry.date}
              fill={
                entry.calorieBalance == null
                  ? 'var(--status-none)'
                  : entry.calorieBalance <= 0
                    ? 'var(--status-good)'
                    : 'var(--status-bad)'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
