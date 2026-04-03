import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentsByDentistAndDate, deleteAppointment, getAppointment } from '@/lib/kv';
import { getDentistById } from '@/lib/dentists';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

function isAdmin(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return !!token && verifySessionToken(token);
}

// ─── GET /api/admin/appointments?dentistId=d1&date=yyyy-MM-dd ─────────────────

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const dentistId = searchParams.get('dentistId');
  const date = searchParams.get('date');

  if (!dentistId || !date) {
    return NextResponse.json({ error: 'Faltan parámetros: dentistId, date' }, { status: 400 });
  }

  if (!getDentistById(dentistId)) {
    return NextResponse.json({ error: 'Dentista no encontrado' }, { status: 404 });
  }

  const appointments = await getAppointmentsByDentistAndDate(dentistId, date);

  return NextResponse.json({ appointments });
}

// ─── DELETE /api/admin/appointments ──────────────────────────────────────────
// El admin puede cancelar una cita por ID

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: { appointmentId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const appointment = await getAppointment(body.appointmentId);
  if (!appointment) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
  }

  await deleteAppointment(appointment);

  return NextResponse.json({ success: true });
}
