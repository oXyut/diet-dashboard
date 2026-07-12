import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Goal } from '@/types/health';
import { ChartDataPoint, formatDateLabel } from '@/lib/utils/chartData';
import {
  chartColors,
  chartMargin,
  gridProps,
  tooltipCursor,
  xAxisProps,
  yAxisProps,
} from './chartTheme';

interface PFCCompositionChartProps {
  data: ChartDataPoint[];
  goal: Goal;
}

type Nutrient = 'proteinPercent' | 'fatPercent' | 'carbohydratePercent';

interface MacroChartConfig {
  key: Nutrient;
  label: string;
  color: string;
  target: number;
  direction: 'min' | 'max';
}

function ratioData(data: ChartDataPoint[]) {
  return data.slice(-7).map((item) => {
    const total = (item.protein ?? 0) * 4 + (item.fat ?? 0) * 9 + (item.carbohydrate ?? 0) * 4;
    return {
      date: item.date,
      proteinPercent: total ? ((item.protein ?? 0) * 4 * 100) / total : null,
      fatPercent: total ? ((item.fat ?? 0) * 9 * 100) / total : null,
      carbohydratePercent: total ? ((item.carbohydrate ?? 0) * 4 * 100) / total : null,
    };
  });
}

function upperBound(values: Array<number | null>, target: number): number {
  const maximum = Math.max(target, ...values.filter((value): value is number => value != null));
  return Math.max(30, Math.ceil((maximum + 5) / 10) * 10);
}

function MacroTrend({
  config,
  data,
}: {
  config: MacroChartConfig;
  data: ReturnType<typeof ratioData>;
}) {
  const domainMax = upperBound(
    data.map((item) => item[config.key]),
    config.target
  );
  return (
    <div className="border-b border-line py-3 last:border-0">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-ink">{config.label}</p>
        <p className="text-xs text-ink-muted">
          目標 {config.direction === 'min' ? `${config.target}%以上` : `${config.target}%以下`}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={82}>
        <LineChart data={data} margin={{ ...chartMargin, top: 4, bottom: 0 }}>
          <CartesianGrid {...gridProps} vertical={false} />
          {config.direction === 'min' ? (
            <ReferenceArea
              y1={config.target}
              y2={domainMax}
              fill="var(--status-good)"
              fillOpacity={0.08}
            />
          ) : (
            <ReferenceArea y1={0} y2={config.target} fill="var(--status-good)" fillOpacity={0.08} />
          )}
          <ReferenceLine y={config.target} stroke="var(--chart-target)" strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            {...xAxisProps}
            tick={{ ...xAxisProps.tick, fontSize: 10 }}
          />
          <YAxis
            {...yAxisProps}
            domain={[0, domainMax]}
            tickFormatter={(value) => `${value}%`}
            width={36}
            tick={{ ...yAxisProps.tick, fontSize: 10 }}
          />
          <Tooltip
            cursor={tooltipCursor}
            labelFormatter={(label) => formatDateLabel(String(label))}
            contentStyle={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey={config.key}
            name={config.label}
            stroke={config.color}
            strokeWidth={2}
            connectNulls={false}
            dot={(props: { cx?: number; cy?: number; value?: number; index?: number }) => {
              if (props.cx == null || props.cy == null || props.value == null) return <g />;
              const pass =
                config.direction === 'min'
                  ? props.value >= config.target
                  : props.value <= config.target;
              return (
                <circle
                  key={props.index}
                  cx={props.cx}
                  cy={props.cy}
                  r={4}
                  fill={pass ? 'var(--status-good)' : 'var(--status-bad)'}
                  stroke="var(--surface)"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 各栄養素を個別に基準線と比較することで、7日間の達否とズレを同時に読めるようにする。
export default function PFCCompositionChart({ data, goal }: PFCCompositionChartProps) {
  const trends = ratioData(data);
  const configs: MacroChartConfig[] = [
    {
      key: 'proteinPercent',
      label: 'たんぱく質（P）',
      color: chartColors.protein,
      target: goal.protein_target_percent ?? 0,
      direction: 'min',
    },
    {
      key: 'fatPercent',
      label: '脂質（F）',
      color: chartColors.fat,
      target: goal.fat_target_percent ?? 0,
      direction: 'max',
    },
    {
      key: 'carbohydratePercent',
      label: '炭水化物（C）',
      color: chartColors.carb,
      target: goal.carbohydrate_target_percent ?? 0,
      direction: 'max',
    },
  ];
  return (
    <div>
      <p className="mb-1 text-xs text-ink-muted">
        点が緑なら達成、赤なら不足または上限超過。破線が目標です。
      </p>
      {configs.map((config) => (
        <MacroTrend key={config.key} config={config} data={trends} />
      ))}
    </div>
  );
}
