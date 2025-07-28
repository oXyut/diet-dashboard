/**
 * PFC（タンパク質、脂質、炭水化物）から摂取カロリーを計算する
 * 
 * カロリー換算係数:
 * - タンパク質: 1g = 4kcal
 * - 脂質: 1g = 9kcal
 * - 炭水化物: 1g = 4kcal
 */
export function calculateIntakeCalories(
  proteinG: number | null | undefined,
  fatG: number | null | undefined,
  carbohydrateG: number | null | undefined
): number | null {
  // いずれかの値が存在しない場合はnullを返す
  if (proteinG == null && fatG == null && carbohydrateG == null) {
    return null;
  }

  // 各栄養素のカロリーを計算（nullの場合は0として扱う）
  const proteinCalories = (proteinG ?? 0) * 4;
  const fatCalories = (fatG ?? 0) * 9;
  const carbohydrateCalories = (carbohydrateG ?? 0) * 4;

  // 合計カロリーを計算
  const totalCalories = proteinCalories + fatCalories + carbohydrateCalories;

  // 小数点第1位で四捨五入
  return Math.round(totalCalories * 10) / 10;
}

/**
 * PFC比率を計算する
 * @returns 各栄養素の比率（パーセンテージ）
 */
export function calculatePFCRatio(
  proteinG: number | null | undefined,
  fatG: number | null | undefined,
  carbohydrateG: number | null | undefined
): { protein: number; fat: number; carbohydrate: number } | null {
  const totalCalories = calculateIntakeCalories(proteinG, fatG, carbohydrateG);
  
  if (!totalCalories || totalCalories === 0) {
    return null;
  }

  const proteinCalories = (proteinG ?? 0) * 4;
  const fatCalories = (fatG ?? 0) * 9;
  const carbohydrateCalories = (carbohydrateG ?? 0) * 4;

  return {
    protein: Math.round((proteinCalories / totalCalories) * 1000) / 10,
    fat: Math.round((fatCalories / totalCalories) * 1000) / 10,
    carbohydrate: Math.round((carbohydrateCalories / totalCalories) * 1000) / 10,
  };
}