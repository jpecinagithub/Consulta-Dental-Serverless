import { NextRequest, NextResponse } from 'next/server';
import { getSchedule, setSchedule } from '@/lib/kv';
import { getDentistById, DEFAULT_SCHEDULE } from '@/lib/dentists';
import type { Schedule } from '@/types';

type Params = { params: { dentistId: string } };

// ─── GET /api/schedules/:dentistId ───────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { dentistId } = params;

  if (!getDentistById(dentistId)) {
    return NextResponse.json({ error: 'Dentista no encontrado' }, { status: 404 });
  }

  const schedule = await getSchedule(dentistId);

  // Si no hay horario configurado, devolver el por defecto
  return NextResponse.json(schedule ?? { ...DEFAULT_SCHEDULE, dentistId });
}

// ─── PUT /api/schedules/:dentistId ───────────────────────────────────────────

export async function PUT(request: NextRequest, { params }: Params) {
  const { dentistId } = params;

  if (!getDentistById(dentistId)) {
    return NextResponse.json({ error: 'Dentista no encontrado' }, { status: 404 });
  }

  let body: Partial<Schedule>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { workDays, startTime, endTime, breakStart, breakEnd } = body;

  // Validaciones básicas
  if (!Array.isArray(workDays) || workDays.some((d) => d < 0 || d > 6)) {
    return NextResponse.json({ error: 'workDays inválido (array de 0-6)' }, { status: 400 });
  }

  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(startTime ?? '') || !timeRegex.test(endTime ?? '')) {
    return NextResponse.json({ error: 'startTime/endTime inválidos (HH:mm)' }, { status: 400 });
  }

  if (breakStart && !timeRegex.test(breakStart)) {
    return NextResponse.json({ error: 'breakStart inválido' }, { status: 400 });
  }

  const schedule: Schedule = {
    dentistId,
    workDays,
    startTime: startTime!,
    endTime: endTime!,
    breakStart: breakStart ?? null,
    breakEnd: breakEnd ?? null,
  };

  await setSchedule(schedule);

  return NextResponse.json({ success: true, schedule });
}
