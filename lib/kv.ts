/**
 * Capa de abstracción sobre Vercel KV (Redis / Upstash).
 * El cliente se inicializa de forma lazy para evitar errores en build
 * cuando las variables de entorno KV aún no están configuradas.
 *
 * Claves utilizadas:
 *   schedule:{dentistId}              → Schedule JSON
 *   blocks:{dentistId}:{date}         → Set de horas bloqueadas ("10:00", "10:30"…)
 *   slot:{dentistId}:{date}:{time}    → appointmentId  (SETNX para atomicidad)
 *   appt:{id}                         → Appointment JSON
 *   appts:{dentistId}:{date}          → Set de appointmentIds del día
 *   cancel:{token}                    → appointmentId  (TTL 30 días)
 */

import { createClient } from '@vercel/kv';
import type { Appointment, Schedule } from '@/types';

const CANCEL_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 días en segundos

function getKv() {
  return createClient({
    url: process.env.KV_REST_API_URL ?? '',
    token: process.env.KV_REST_API_TOKEN ?? '',
  });
}

// ─── Horarios ─────────────────────────────────────────────────────────────────

export async function getSchedule(dentistId: string): Promise<Schedule | null> {
  return getKv().get<Schedule>(`schedule:${dentistId}`);
}

export async function setSchedule(schedule: Schedule): Promise<void> {
  await getKv().set(`schedule:${schedule.dentistId}`, schedule);
}

// ─── Bloqueos ─────────────────────────────────────────────────────────────────

export async function getBlocks(dentistId: string, date: string): Promise<string[]> {
  const members = await getKv().smembers(`blocks:${dentistId}:${date}`) as string[];
  return members ?? [];
}

export async function addBlock(dentistId: string, date: string, time: string): Promise<void> {
  await getKv().sadd(`blocks:${dentistId}:${date}`, time);
}

export async function removeBlock(dentistId: string, date: string, time: string): Promise<void> {
  await getKv().srem(`blocks:${dentistId}:${date}`, time);
}

// ─── Citas ────────────────────────────────────────────────────────────────────

/**
 * Reserva atómicamente un slot.
 * Devuelve true si se ha podido reservar, false si ya estaba ocupado.
 */
export async function claimSlot(
  dentistId: string,
  date: string,
  time: string,
  appointmentId: string,
): Promise<boolean> {
  const key = `slot:${dentistId}:${date}:${time}`;
  const result = await getKv().setnx(key, appointmentId);
  return result === 1;
}

export async function freeSlot(dentistId: string, date: string, time: string): Promise<void> {
  await getKv().del(`slot:${dentistId}:${date}:${time}`);
}

export async function getBookedTimes(dentistId: string, date: string): Promise<string[]> {
  const ids = await getKv().smembers(`appts:${dentistId}:${date}`) as string[];
  if (!ids || ids.length === 0) return [];

  const appointments = await Promise.all(ids.map((id) => getKv().get<Appointment>(`appt:${id}`)));
  return appointments
    .filter((a): a is Appointment => a !== null)
    .map((a) => a.time);
}

export async function saveAppointment(appointment: Appointment): Promise<void> {
  const kv = getKv();
  await Promise.all([
    kv.set(`appt:${appointment.id}`, appointment),
    kv.sadd(`appts:${appointment.dentistId}:${appointment.date}`, appointment.id),
    kv.set(`cancel:${appointment.cancellationToken}`, appointment.id, {
      ex: CANCEL_TOKEN_TTL,
    }),
  ]);
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  return getKv().get<Appointment>(`appt:${id}`);
}

export async function getAppointmentByToken(token: string): Promise<Appointment | null> {
  const id = await getKv().get<string>(`cancel:${token}`);
  if (!id) return null;
  return getAppointment(id);
}

export async function deleteAppointment(appointment: Appointment): Promise<void> {
  const kv = getKv();
  await Promise.all([
    kv.del(`appt:${appointment.id}`),
    kv.del(`cancel:${appointment.cancellationToken}`),
    kv.srem(`appts:${appointment.dentistId}:${appointment.date}`, appointment.id),
    freeSlot(appointment.dentistId, appointment.date, appointment.time),
  ]);
}

export async function getAppointmentsByDentistAndDate(
  dentistId: string,
  date: string,
): Promise<Appointment[]> {
  const ids = await getKv().smembers(`appts:${dentistId}:${date}`) as string[];
  if (!ids || ids.length === 0) return [];

  const appointments = await Promise.all(ids.map((id) => getKv().get<Appointment>(`appt:${id}`)));
  return appointments
    .filter((a): a is Appointment => a !== null)
    .sort((a, b) => a.time.localeCompare(b.time));
}
