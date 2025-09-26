import { NextRequest, NextResponse } from 'next/server';
import { TurtleTradeService } from '@/services/TurtleTradeService';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { strike, premium, expiry, notes } = body;

    if (!premium) {
      return NextResponse.json({ error: 'Premium is required' }, { status: 400 });
    }

    const updatedTrade = await TurtleTradeService.updateTrade(id, {
      strike: strike ? parseFloat(strike) : undefined,
      premium: parseFloat(premium),
      expiry: expiry || undefined,
      notes: notes || undefined
    });

    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    await TurtleTradeService.deleteTrade(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}