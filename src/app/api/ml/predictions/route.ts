import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { formatWeightPrediction } from '@/lib/formatters';
import { withAuth } from '@/lib/middleware/auth';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const predictionSchema = z.object({
  targetDate: dateSchema,
  sourceDate: dateSchema,
  status: z.enum(['ready', 'insufficient_data', 'awaiting_training']),
  predictionKg: z.number().positive().nullable(),
  interpretationKg: z.number().positive().nullable(),
  validationMaeKg: z.number().nonnegative().nullable(),
  modelVersion: z.string().max(64).nullable(),
  mlflowRunId: z.string().max(64).nullable(),
  topContributions: z
    .array(z.object({ feature: z.string().min(1), contribution_kg: z.number() }))
    .max(5)
    .default([]),
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = predictionSchema.parse(await request.json());
    const row = await prisma.weightPrediction.upsert({
      where: { targetDate: new Date(`${body.targetDate}T00:00:00.000Z`) },
      create: {
        ...body,
        targetDate: new Date(`${body.targetDate}T00:00:00.000Z`),
        sourceDate: new Date(`${body.sourceDate}T00:00:00.000Z`),
      },
      update: {
        ...body,
        sourceDate: new Date(`${body.sourceDate}T00:00:00.000Z`),
      },
    });
    return NextResponse.json(formatWeightPrediction(row));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 });
  }
});
