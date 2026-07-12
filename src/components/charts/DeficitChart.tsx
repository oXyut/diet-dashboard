import {
  Bar,
  BarChart,
  CartesianGrid,
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
  targetDeficit: number | null;
}

export default function DeficitChart({ data, targetDeficit }: DeficitChartProps) {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT_SM}>
      <BarChart data={data.slice(-7)} margin={chartMargin}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} {...xAxisProps} />
        <YAxis unit=" kcal" {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
        <ReferenceLine y={0} stroke="var(--chart-axis)" />
        {targetDeficit != null && (
          <ReferenceLine
            y={targetDeficit}
            stroke="var(--chart-target)"
            strokeDasharray="4 4"
            label={{
              value: '必要赤字',
              fill: 'var(--text-muted)',
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />
        )}
        <Bar
          dataKey="deficit"
          name="赤字"
          fill="var(--status-good)"
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
