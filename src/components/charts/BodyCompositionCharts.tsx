import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartDataPoint, formatDateLabel } from '@/lib/utils/chartData';
import SectionCard from '../SectionCard';
import { ChartTooltip } from './ChartTooltip';
import {
  CHART_HEIGHT_SM,
  chartColors,
  chartMargin,
  gridProps,
  seriesDot,
  tooltipCursor,
  xAxisProps,
  yAxisProps,
} from './chartTheme';

interface BodyCompositionChartsProps {
  data: ChartDataPoint[];
}

interface SingleMetricChartProps {
  data: ChartDataPoint[];
  dataKey: 'bodyFat' | 'muscleMass';
  name: string;
  color: string;
}

// 単位が異なる指標(% と kg)は1チャートに混載せず、小型チャート2連で表示する
function SingleMetricChart({ data, dataKey, name, color }: SingleMetricChartProps) {
  const hasData = data.some((item) => item[dataKey] != null);
  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center text-sm text-ink-muted"
        style={{ height: CHART_HEIGHT_SM }}
      >
        表示できるデータがありません
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT_SM}>
      <LineChart data={data} margin={chartMargin}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} {...xAxisProps} />
        <YAxis domain={['auto', 'auto']} {...yAxisProps} />
        <Tooltip content={<ChartTooltip />} cursor={tooltipCursor} />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          connectNulls
          dot={seriesDot(color)}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function BodyCompositionCharts({ data }: BodyCompositionChartsProps) {
  return (
    <>
      <SectionCard title="体脂肪率 (%)">
        <SingleMetricChart
          data={data}
          dataKey="bodyFat"
          name="体脂肪率"
          color={chartColors.intake}
        />
      </SectionCard>
      <SectionCard title="筋肉量 (kg)">
        <SingleMetricChart
          data={data}
          dataKey="muscleMass"
          name="筋肉量"
          color={chartColors.carb}
        />
      </SectionCard>
    </>
  );
}
