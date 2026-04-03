import type { Dentist, Schedule } from '@/types';

// Configuración estática de los 3 dentistas
// Para añadir/cambiar dentistas, editar este archivo
export const DENTISTS: Dentist[] = [
  {
    id: 'd1',
    name: 'Dr. García',
    email: process.env.DENTIST_1_EMAIL ?? 'garcia@clinica.com',
    specialty: 'Odontología General',
    color: 'blue',
  },
  {
    id: 'd2',
    name: 'Dra. López',
    email: process.env.DENTIST_2_EMAIL ?? 'lopez@clinica.com',
    specialty: 'Ortodoncia',
    color: 'teal',
  },
  {
    id: 'd3',
    name: 'Dr. Martínez',
    email: process.env.DENTIST_3_EMAIL ?? 'martinez@clinica.com',
    specialty: 'Implantología',
    color: 'violet',
  },
];

// Horario por defecto que se aplica si el admin no ha configurado uno aún
export const DEFAULT_SCHEDULE: Omit<Schedule, 'dentistId'> = {
  workDays: [1, 2, 3, 4, 5], // lunes a viernes
  startTime: '09:00',
  endTime: '18:00',
  breakStart: '14:00',
  breakEnd: '15:00',
};

export function getDentistById(id: string): Dentist | undefined {
  return DENTISTS.find((d) => d.id === id);
}
