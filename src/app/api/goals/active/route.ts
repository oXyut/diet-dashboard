import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { withGoalWriteAuth } from '@/lib/middleware/auth';
import { formatGoal } from '@/lib/formatters';
import { goalPlanSchema } from '@/lib/validators/goalSchema';
import { GoalPlanError, saveGoalPlan } from '@/lib/services/GoalPlanService';

export const PUT = withGoalWriteAuth(async (request: NextRequest) => {
  try {
    const plan = goalPlanSchema.parse(await request.json());
    return NextResponse.json({ success: true, data: formatGoal(await saveGoalPlan(plan)) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof GoalPlanError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('PUT /api/goals/active error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
