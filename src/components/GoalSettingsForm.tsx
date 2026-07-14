'use client';

import { FormEvent, useState } from 'react';
import { Goal } from '@/types/health';

interface GoalSettingsFormProps {
  goal: Goal | null;
}

export default function GoalSettingsForm({ goal }: GoalSettingsFormProps) {
  const [targetWeight, setTargetWeight] = useState(goal?.target_weight_kg?.toString() ?? '');
  const [endDate, setEndDate] = useState(goal?.end_date ?? '');
  const [protein, setProtein] = useState(goal?.protein_target_percent?.toString() ?? '30');
  const [fat, setFat] = useState(goal?.fat_target_percent?.toString() ?? '25');
  const [carbohydrate, setCarbohydrate] = useState(
    goal?.carbohydrate_target_percent?.toString() ?? '45'
  );
  const [steps, setSteps] = useState(goal?.daily_steps_target?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const macroInputs: Array<{ label: string; value: string; setValue: (value: string) => void }> = [
    { label: 'P', value: protein, setValue: setProtein },
    { label: 'F', value: fat, setValue: setFat },
    { label: 'C', value: carbohydrate, setValue: setCarbohydrate },
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch('/api/goals/active', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_weight_kg: Number(targetWeight),
        end_date: endDate,
        protein_target_percent: Number(protein),
        fat_target_percent: Number(fat),
        carbohydrate_target_percent: Number(carbohydrate),
        daily_steps_target: steps === '' ? null : Number(steps),
      }),
    });
    if (response.ok) {
      window.location.assign('/');
      return;
    }
    const body = await response.json().catch(() => ({}));
    setError(body.error ?? '保存に失敗しました');
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm text-ink-secondary">
          目標体重（kg）
          <input
            required
            min="1"
            step="0.1"
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="text-sm text-ink-secondary">
          期限日
          <input
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>
      </div>
      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold text-ink">PFC比率（合計100%）</legend>
        <p className="mt-1 text-xs text-ink-muted">Pは目標以上、F/Cは目標以下で判定します。</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {macroInputs.map(({ label, value, setValue }) => (
            <label key={label} className="text-sm text-ink-secondary">
              {label}（%）
              <input
                required
                min="0"
                max="100"
                step="0.1"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-2 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-accent"
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm text-ink-secondary">
        歩数目標（任意）
        <input
          min="1"
          step="1"
          type="number"
          placeholder="例: 8000"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="mt-2 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </label>
      <p className="rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-ink-muted">
        保存時の直近7日間の体重平均を開始体重として固定し、目標体重との差を1kg=7,700kcalで目標カロリー収支へ換算します。保存すると、現在の有効な計画は履歴になります。
      </p>
      {error && <p className="text-sm text-status-bad">{error}</p>}
      <button
        disabled={saving}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? '保存中…' : '計画を保存'}
      </button>
    </form>
  );
}
