/**
 * Lógica de generación de slots de 30 minutos.
 * Todos los cálculos se hacen con strings "HH:mm" para evitar problemas de TZ.
 */

import { parseISO, getDay } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import type { Schedule } from '@/types';
import { DEFAULT_SCHEDULE } from './dentists';

export const TZ = 'Europe/Madrid';
export const SLOT_MINUTES = 30;

/** Devuelve la hora actual en Madrid como "HH:mm" */
export function nowTimeMadrid(): string {
  return format(toZonedTime(new Date(), TZ), 'HH:mm');
}

/** Devuelve la fecha de hoy en Madrid como "yyyy-MM-dd" */
export function todayMadrid(): string {
  return format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd');
}

/** Convierte "HH:mm" a minutos desde medianoche */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convierte minutos a "HH:mm" */
function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Genera todos los slots posibles del día según el horario,
 * excluyendo bloques de descanso, horas bloqueadas por admin y citas ya reservadas.
 * Si la fecha es hoy, excluye también slots ya pasados.
 */
export function generateAvailableSlots(
  schedule: Schedule | null,
  date: string,
  blocks: string[],
  booked: string[],
): string[] {
  const sched = schedule ?? { ...DEFAULT_SCHEDULE, dentistId: '' };

  // Verificar si el día de la semana está habilitado
  // parseISO interpreta la fecha como local; usamos getDay sobre la fecha en Madrid
  const dateInMadrid = toZonedTime(parseISO(date), TZ);
  const dayOfWeek = getDay(dateInMadrid); // 0=Dom … 6=Sáb

  if (!sched.workDays.includes(dayOfWeek)) return [];

  const start = toMinutes(sched.startTime);
  const end = toMinutes(sched.endTime);
  const breakStart = sched.breakStart ? toMinutes(sched.breakStart) : null;
  const breakEnd = sched.breakEnd ? toMinutes(sched.breakEnd) : null;

  const isToday = date === todayMadrid();
  const nowMinutes = isToday ? toMinutes(nowTimeMadrid()) : -1;

  const blockedSet = new Set(blocks);
  const bookedSet = new Set(booked);
  const slots: string[] = [];

  for (let t = start; t < end; t += SLOT_MINUTES) {
    // Excluir pausa de almuerzo
    if (breakStart !== null && breakEnd !== null) {
      if (t >= breakStart && t < breakEnd) continue;
    }

    const timeStr = fromMinutes(t);

    // Excluir slots ya pasados si es hoy (con 5 min de margen)
    if (isToday && t <= nowMinutes + 5) continue;

    // Excluir bloqueados por admin
    if (blockedSet.has(timeStr)) continue;

    // Excluir ya reservados
    if (bookedSet.has(timeStr)) continue;

    slots.push(timeStr);
  }

  return slots;
}

/** Genera TODOS los slots del día (sin filtrar bloques/citas), para el admin */
export function generateAllSlots(schedule: Schedule | null, date: string): string[] {
  const sched = schedule ?? { ...DEFAULT_SCHEDULE, dentistId: '' };

  const dateInMadrid = toZonedTime(parseISO(date), TZ);
  const dayOfWeek = getDay(dateInMadrid);
  if (!sched.workDays.includes(dayOfWeek)) return [];

  const start = toMinutes(sched.startTime);
  const end = toMinutes(sched.endTime);
  const breakStart = sched.breakStart ? toMinutes(sched.breakStart) : null;
  const breakEnd = sched.breakEnd ? toMinutes(sched.breakEnd) : null;

  const slots: string[] = [];
  for (let t = start; t < end; t += SLOT_MINUTES) {
    if (breakStart !== null && breakEnd !== null) {
      if (t >= breakStart && t < breakEnd) continue;
    }
    slots.push(fromMinutes(t));
  }

  return slots;
}

/** Formatea una fecha "yyyy-MM-dd" en español legible: "viernes, 10 de abril de 2026" */
export function formatDateEs(date: string): string {
  const d = toZonedTime(parseISO(date), TZ);
  return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { timeZone: TZ, locale: undefined });
}
