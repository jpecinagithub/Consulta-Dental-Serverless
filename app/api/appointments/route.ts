import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getSchedule,
  getBlocks,
  getBookedTimes,
  claimSlot,
  saveAppointment,
} from '@/lib/kv';
import { generateAvailableSlots } from '@/lib/slots';
import { sendBookingConfirmation } from '@/lib/email';
import { getDentistById } from '@/lib/dentists';
import type { CreateAppointmentBody } from '@/types';

// ─── GET /api/appointments?dentistId=d1&date=2026-04-10 ──────────────────────
// Devuelve los slots disponibles para un dentista y fecha

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dentistId = searchParams.get('dentistId');
  const date = searchParams.get('date');

  if (!dentistId || !date) {
    return NextResponse.json({ error: 'Faltan parámetros: dentistId, date' }, { status: 400 });
  }

  if (!getDentistById(dentistId)) {
    return NextResponse.json({ error: 'Dentista no encontrado' }, { status: 404 });
  }

  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Formato de fecha inválido (yyyy-MM-dd)' }, { status: 400 });
  }

  const [schedule, blocks, booked] = await Promise.all([
    getSchedule(dentistId),
    getBlocks(dentistId, date),
    getBookedTimes(dentistId, date),
  ]);

  const slots = generateAvailableSlots(schedule, date, blocks, booked);

  return NextResponse.json({ slots });
}

// ─── POST /api/appointments ───────────────────────────────────────────────────
// Crea una nueva cita

export async function POST(request: NextRequest) {
  let body: CreateAppointmentBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { dentistId, date, time, patientName, patientEmail, patientPhone, reason } = body;

  // Validaciones
  if (!dentistId || !date || !time || !patientName || !patientEmail || !patientPhone) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const dentist = getDentistById(dentistId);
  if (!dentist) {
    return NextResponse.json({ error: 'Dentista no encontrado' }, { status: 404 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 });
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: 'Formato de hora inválido' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  // Verificar que el slot esté disponible según horario y bloqueos
  const [schedule, blocks, booked] = await Promise.all([
    getSchedule(dentistId),
    getBlocks(dentistId, date),
    getBookedTimes(dentistId, date),
  ]);

  const availableSlots = generateAvailableSlots(schedule, date, blocks, booked);
  if (!availableSlots.includes(time)) {
    return NextResponse.json({ error: 'El horario seleccionado no está disponible' }, { status: 409 });
  }

  // Intentar reservar el slot de forma atómica
  const id = uuidv4();
  const cancellationToken = uuidv4();

  const claimed = await claimSlot(dentistId, date, time, id);
  if (!claimed) {
    return NextResponse.json(
      { error: 'El horario ya ha sido reservado por otra persona. Por favor, elige otro.' },
      { status: 409 },
    );
  }

  const appointment = {
    id,
    dentistId,
    date,
    time,
    patientName: patientName.trim(),
    patientEmail: patientEmail.toLowerCase().trim(),
    patientPhone: patientPhone.trim(),
    reason: reason?.trim() ?? '',
    cancellationToken,
    createdAt: new Date().toISOString(),
  };

  await saveAppointment(appointment);

  // Enviar email de confirmación al paciente (no bloqueante para la respuesta)
  sendBookingConfirmation(appointment, dentist).catch(console.error);

  return NextResponse.json(
    {
      success: true,
      appointmentId: id,
      cancellationToken,
    },
    { status: 201 },
  );
}
