import { getSupabaseAdmin } from '../src/lib/supabase';

async function insertInitialGoal() {
  const supabase = getSupabaseAdmin();

  const goalData = {
    name: 'メインダイエット目標',
    description: '目標体重100kgを目指すダイエット計画',
    target_weight_kg: 100.0,
    start_date: '2025-07-26',
    end_date: '2025-09-30',
    daily_calorie_intake_min: 1600,
    daily_calorie_intake_max: 2000,
    daily_protein_min_g: 90.5,
    daily_protein_max_g: 158.3,
    daily_fat_min_g: 40.2,
    daily_fat_max_g: 60.3,
    daily_carb_min_g: 203.5,
    daily_carb_max_g: 271.4,
    daily_steps_target: 8000,
    is_active: true
  };

  try {
    // First, check if the goal already exists
    const { data: existingGoals, error: selectError } = await supabase
      .from('goals')
      .select('*')
      .eq('name', goalData.name);

    if (selectError) {
      console.error('Error checking existing goals:', selectError);
      return;
    }

    if (existingGoals && existingGoals.length > 0) {
      console.log('Goal already exists, updating instead...');
      const { data, error } = await supabase
        .from('goals')
        .update(goalData)
        .eq('name', goalData.name)
        .select();

      if (error) {
        console.error('Error updating goal:', error);
        return;
      }

      console.log('Goal updated successfully:', data);
    } else {
      console.log('Inserting new goal...');
      const { data, error } = await supabase
        .from('goals')
        .insert([goalData])
        .select();

      if (error) {
        console.error('Error inserting goal:', error);
        return;
      }

      console.log('Goal inserted successfully:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

insertInitialGoal();