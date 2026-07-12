import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartDataPoint, formatDateLabel, getWeightAxisDomain } from '@/lib/utils/chartData';
import { ChartTooltip } from './ChartTooltip';
import {
  chartColors,
  chartMargin,
  gridProps,
  legendFormatter,
  legendWrapperStyle,
  seriesDot,
  tooltipCursor,
  xAxisProps,
  yAxisProps,
} from './chartTheme';

interface WeightChartProps {
  data: ChartDataPoint[];
  targetWeightKg?: number | null;
  height?: number;
}

export default function WeightChart({ data, targetWeightKg, height = 320 }: WeightChartProps) {
  const domain = getWeightAxisDomain(data);
  const hasGoalLine = data.some((item) => item.linearTarget != null);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={chartMargin}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} {...xAxisProps} />
        <YAxis domain={domain} {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={tooltipCursor} />
        {hasGoalLine && <Legend wrapperStyle={legendWrapperStyle} formatter={legendFormatter} />}
        {targetWeightKg != null && (
          <ReferenceLine
            y={targetWeightKg}
            stroke={chartColors.target}
            strokeWidth={1}
            label={{
              value: `目標 ${targetWeightKg} kg`,
              fill: 'var(--text-muted)',
              fontSize: 11,
              position: 'insideBottomRight',
            }}
          />
        )}
        {hasGoalLine && (
          <Line
            type="monotone"
            dataKey="linearTarget"
            name="目標ペース"
            stroke={chartColors.target}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        )}
        {/* 欠測が多いため connectNulls + 常時ドットで「点=測定日」を可視化する */}
        <Line
          type="monotone"
          dataKey="weight"
          name="体重"
          stroke={chartColors.weight}
          strokeWidth={2}
          connectNulls
          dot={seriesDot(chartColors.weight)}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
