export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentByToken, deleteAppointment } from '@/lib/kv';
import { sendCancellationConfirmation } from '@/lib/email';
import { getDentistById } from '@/lib/dentists';

// ─── GET /api/appointments/cancel?token=xxx ───────────────────────────────────
// Obtiene los detalles de la cita antes de confirmar la cancelación

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }

  const appointment = await getAppointmentByToken(token);

  if (!appointment) {
    return NextResponse.json(
      { error: 'Cita no encontrada o enlace de cancelación expirado' },
      { status: 404 },
    );
  }

  const dentist = getDentistById(appointment.dentistId);

  return NextResponse.json({
    appointment: {
      date: appointment.date,
      time: appointment.time,
      patientName: appointment.patientName,
    },
    dentistName: dentist?.name ?? 'Dentista',
  });
}

// ─── POST /api/appointments/cancel ───────────────────────────────────────────
// Cancela la cita dado un token

export async function POST(request: NextRequest) {
  let token: string;

  try {
    const body = await request.json();
    token = body.token;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  }

  const appointment = await getAppointmentByToken(token);

  if (!appointment) {
    return NextResponse.json(
      { error: 'Cita no encontrada o enlace de cancelación expirado' },
      { status: 404 },
    );
  }

  await deleteAppointment(appointment);

  const dentist = getDentistById(appointment.dentistId);
  if (dentist) {
    sendCancellationConfirmation(appointment, dentist).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
