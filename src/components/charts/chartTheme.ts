// チャート共通のダークテーマ定数。色の実体は globals.css の CSS 変数が単一ソース
export const chartColors = {
  weight: 'var(--chart-weight)',
  intake: 'var(--chart-intake)',
  burn: 'var(--chart-burn)',
  protein: 'var(--chart-protein)',
  fat: 'var(--chart-fat)',
  carb: 'var(--chart-carb)',
  target: 'var(--chart-target)',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  surface: 'var(--surface)',
} as const;

// グリッドは実線ヘアラインの水平線のみ(破線は「予測・閾値」に見えるため使わない)
export const gridProps = {
  stroke: 'var(--chart-grid)',
  strokeWidth: 1,
  vertical: false,
} as const;

export const axisTick = {
  fill: 'var(--chart-axis)',
  fontSize: 12,
} as const;

export const xAxisProps = {
  tick: axisTick,
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
} as const;

export const yAxisProps = {
  tick: axisTick,
  tickLine: false,
  axisLine: false,
  width: 44,
} as const;

export const legendWrapperStyle = {
  color: 'var(--text-secondary)',
  fontSize: 12,
} as const;

export const tooltipCursor = { stroke: 'var(--border)', strokeWidth: 1 } as const;

export const chartMargin = { top: 8, right: 12, left: 0, bottom: 0 } as const;

export const CHART_HEIGHT = 280;
export const CHART_HEIGHT_SM = 220;

// 実測点を「測定した日」として見せるための共通ドット(周囲にサーフェス色のリング)
export const seriesDot = (color: string) => ({
  r: 3,
  fill: color,
  stroke: 'var(--surface)',
  strokeWidth: 2,
});
