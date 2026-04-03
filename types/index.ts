// ─── Dentista ─────────────────────────────────────────────────────────────────
export interface Dentist {
  id: string;
  name: string;
  email: string;
  specialty: string;
  color: string; // clase Tailwind para identificación visual
}

// ─── Horario ──────────────────────────────────────────────────────────────────
export interface Schedule {
  dentistId: string;
  // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  workDays: number[];
  startTime: string;  // "09:00"
  endTime: string;    // "18:00"
  breakStart: string | null; // "14:00" | null
  breakEnd: string | null;   // "15:00" | null
}

// ─── Cita ─────────────────────────────────────────────────────────────────────
export interface Appointment {
  id: string;
  dentistId: string;
  date: string;            // "2026-04-10"
  time: string;            // "10:00"
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason: string;
  cancellationToken: string;
  createdAt: string;       // ISO 8601
}

// ─── Petición de creación de cita ─────────────────────────────────────────────
export interface CreateAppointmentBody {
  dentistId: string;
  date: string;
  time: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason?: string;
}
