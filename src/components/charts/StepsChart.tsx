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
import {
  CHART_HEIGHT_SM,
  chartColors,
  chartMargin,
  gridProps,
  xAxisProps,
  yAxisProps,
} from './chartTheme';

interface StepsChartProps {
  data: ChartDataPoint[];
  targetSteps?: number | null;
}

export default function StepsChart({ data, targetSteps }: StepsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT_SM}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
        {targetSteps != null && (
          <ReferenceLine
            y={targetSteps}
            stroke={chartColors.target}
            strokeWidth={1}
            label={{
              value: `目標 ${targetSteps.toLocaleString()} 歩`,
              fill: 'var(--text-muted)',
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />
        )}
        <Bar
          dataKey="steps"
          name="歩数"
          fill={chartColors.steps}
          maxBarSize={16}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
