import { NextRequest, NextResponse } from 'next/server';
import { getBlocks, addBlock, removeBlock, getSchedule } from '@/lib/kv';
import { getDentistById } from '@/lib/dentists';
import { generateAllSlots } from '@/lib/slots';

type Params = { params: { dentistId: string } };

// ─── GET /api/blocks/:dentistId?date=yyyy-MM-dd ───────────────────────────────

export async function GET(request: NextRequest, { params }: Params) {
  const { dentistId } = params;
  const date = request.nextUrl.searchParams.get('date');

  if (!getDentistById(dentistId)) {
    return NextResponse.json({ error: 'Dentista no encontrado' }, { status: 404 });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Parámetro date requerido (yyyy-MM-dd)' }, { status: 400 });
  }

  const [blocks, schedule] = await Promise.all([
    getBlocks(dentistId, date),
    getSchedule(dentistId),
  ]);

  // Devolvemos también todos los slots del día para que el admin pueda mostrar el grid completo
  const allSlots = generateAllSlots(schedule, date);

  return NextResponse.json({ blocks, allSlots });
}

// ─── POST /api/blocks/:dentistId ─────────────────────────────────────────────
// Añade un bloqueo

export async function POST(request: NextRequest, { params }: Params) {
  const { dentistId } = params;

  if (!getDentistById(dentistId)) {
    return NextResponse.json({ error: 'Dentista no encontrado' }, { status: 404 });
  }

  let body: { date: string; time: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { date, time } = body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date inválido' }, { status: 400 });
  }

  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: 'time inválido (HH:mm)' }, { status: 400 });
  }

  await addBlock(dentistId, date, time);

  return NextResponse.json({ success: true });
}

// ─── DELETE /api/blocks/:dentistId ───────────────────────────────────────────
// Elimina un bloqueo

export async function DELETE(request: NextRequest, { params }: Params) {
  const { dentistId } = params;

  if (!getDentistById(dentistId)) {
    return NextResponse.json({ error: 'Dentista no encontrado' }, { status: 404 });
  }

  let body: { date: string; time: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { date, time } = body;

  if (!date || !time) {
    return NextResponse.json({ error: 'date y time requeridos' }, { status: 400 });
  }

  await removeBlock(dentistId, date, time);

  return NextResponse.json({ success: true });
}
