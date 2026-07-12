import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartDataPoint, formatDateLabel } from '@/lib/utils/chartData';
import { ChartTooltip } from './ChartTooltip';
import {
  CHART_HEIGHT,
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

interface CalorieChartProps {
  data: ChartDataPoint[];
}

export default function CalorieChart({ data }: CalorieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data} margin={chartMargin}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={tooltipCursor} />
        <Legend wrapperStyle={legendWrapperStyle} formatter={legendFormatter} />
        <Line
          type="monotone"
          dataKey="intakeCalories"
          name="摂取"
          stroke={chartColors.intake}
          strokeWidth={2}
          connectNulls
          dot={seriesDot(chartColors.intake)}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="calories"
          name="消費"
          stroke={chartColors.burn}
          strokeWidth={2}
          connectNulls
          dot={seriesDot(chartColors.burn)}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
