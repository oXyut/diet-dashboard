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
import { Goal } from '@/types/health';
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

interface PFCChartProps {
  data: ChartDataPoint[];
  goal?: Goal | null;
}

function formatRange(min?: number | null, max?: number | null): string | undefined {
  if (min == null && max == null) return undefined;
  if (min != null && max != null) return `目標 ${min}–${max} g`;
  if (min != null) return `目標 ${min} g 以上`;
  return `目標 ${max} g 以下`;
}

export default function PFCChart({ data, goal }: PFCChartProps) {
  const extraByDataKey: Record<string, string> = {};
  const proteinRange = formatRange(goal?.daily_protein_min_g, goal?.daily_protein_max_g);
  const fatRange = formatRange(goal?.daily_fat_min_g, goal?.daily_fat_max_g);
  const carbRange = formatRange(goal?.daily_carb_min_g, goal?.daily_carb_max_g);
  if (proteinRange) extraByDataKey.protein = proteinRange;
  if (fatRange) extraByDataKey.fat = fatRange;
  if (carbRange) extraByDataKey.carbohydrate = carbRange;

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data} margin={chartMargin}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip
          content={<ChartTooltip extraByDataKey={extraByDataKey} />}
          cursor={tooltipCursor}
        />
        <Legend wrapperStyle={legendWrapperStyle} formatter={legendFormatter} />
        <Line
          type="monotone"
          dataKey="protein"
          name="たんぱく質"
          stroke={chartColors.protein}
          strokeWidth={2}
          connectNulls
          dot={seriesDot(chartColors.protein)}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="fat"
          name="脂質"
          stroke={chartColors.fat}
          strokeWidth={2}
          connectNulls
          dot={seriesDot(chartColors.fat)}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="carbohydrate"
          name="炭水化物"
          stroke={chartColors.carb}
          strokeWidth={2}
          connectNulls
          dot={seriesDot(chartColors.carb)}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
