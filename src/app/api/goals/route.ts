import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/middleware/auth';
import { goalSchema } from '@/lib/validators/goalSchema';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    let query = supabase.from('goals').select('*').order('created_at', { ascending: false });

    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch goals', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // 許可したフィールドのみ抽出（未知のフィールドは除去される）
    const goal = goalSchema.parse(body);

    const { data, error } = await supabase.from('goals').insert([goal]).select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create goal', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
