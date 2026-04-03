import { Resend } from 'resend';
import type { Appointment, Dentist } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Clínica Dental <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateEs(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const names = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${d} de ${names[m - 1]} de ${y}`;
}

async function send(to: string, subject: string, html: string) {
  await resend.emails.send({ from: FROM, to, subject, html });
}

// ─── Email al paciente: confirmación de reserva ───────────────────────────────

export async function sendBookingConfirmation(
  appointment: Appointment,
  dentist: Dentist,
): Promise<void> {
  const cancelUrl = `${APP_URL}/cancel?token=${appointment.cancellationToken}`;
  const dateStr = formatDateEs(appointment.date);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 32px auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; }
  .header { background: #2563eb; color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; }
  .card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .label { color: #6b7280; font-size: 13px; }
  .value { font-weight: 600; font-size: 15px; }
  .cancel-btn { display: block; text-align: center; background: #fee2e2; color: #b91c1c; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>Cita Confirmada</h1>
    <p style="margin:8px 0 0;">Clínica Dental</p>
  </div>
  <p>Hola <strong>${appointment.patientName}</strong>,</p>
  <p>Tu cita ha sido reservada correctamente.</p>
  <div class="card">
    <div class="row"><span class="label">Dentista</span><span class="value">${dentist.name}</span></div>
    <div class="row"><span class="label">Especialidad</span><span class="value">${dentist.specialty}</span></div>
    <div class="row"><span class="label">Fecha</span><span class="value">${dateStr}</span></div>
    <div class="row"><span class="label">Hora</span><span class="value">${appointment.time} h</span></div>
    <div class="row"><span class="label">Duración</span><span class="value">30 minutos</span></div>
    ${appointment.reason ? `<div class="row"><span class="label">Motivo</span><span class="value">${appointment.reason}</span></div>` : ''}
  </div>
  <p style="font-size:14px; color:#374151;">Si necesitas cancelar tu cita, puedes hacerlo desde el siguiente enlace hasta 30 días después de la reserva:</p>
  <a href="${cancelUrl}" class="cancel-btn">Cancelar mi cita</a>
  <div class="footer"><p>Clínica Dental · Email enviado automáticamente.</p></div>
</div>
</body>
</html>`;

  await send(
    appointment.patientEmail,
    `Cita confirmada: ${appointment.time} h del ${dateStr} con ${dentist.name}`,
    html,
  );
}

// ─── Email al paciente: confirmación de cancelación ──────────────────────────

export async function sendCancellationConfirmation(
  appointment: Appointment,
  dentist: Dentist,
): Promise<void> {
  const dateStr = formatDateEs(appointment.date);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #1f2937; }
  .container { max-width: 560px; margin: 32px auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; }
  .header { background: #dc2626; color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; }
  .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>Cita Cancelada</h1></div>
  <p>Hola <strong>${appointment.patientName}</strong>,</p>
  <p>Tu cita del <strong>${dateStr}</strong> a las <strong>${appointment.time} h</strong> con <strong>${dentist.name}</strong> ha sido cancelada correctamente.</p>
  <p>Puedes volver a reservar una nueva cita cuando lo necesites.</p>
  <div class="footer"><p>Clínica Dental</p></div>
</div>
</body>
</html>`;

  await send(
    appointment.patientEmail,
    `Cita cancelada: ${appointment.time} h del ${dateStr}`,
    html,
  );
}

// ─── Email al dentista: resumen diario ───────────────────────────────────────

export async function sendDailyDigest(
  dentist: Dentist,
  appointments: Appointment[],
  date: string,
): Promise<void> {
  if (appointments.length === 0) return;

  const dateStr = formatDateEs(date);
  const rows = appointments
    .map(
      (a) => `
      <tr>
        <td style="padding:10px 12px; font-weight:700; color:#1d4ed8;">${a.time} h</td>
        <td style="padding:10px 12px;">${a.patientName}</td>
        <td style="padding:10px 12px; color:#6b7280;">${a.patientEmail}</td>
        <td style="padding:10px 12px; color:#6b7280;">${a.patientPhone}</td>
        <td style="padding:10px 12px; color:#6b7280;">${a.reason || '—'}</td>
      </tr>`,
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; }
  .container { max-width: 720px; margin: 32px auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; }
  .header { background: #2563eb; color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
  .header h1 { margin: 0 0 4px; font-size: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  thead { background: #eff6ff; }
  th { padding: 10px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 4px 12px; border-radius: 99px; font-weight: 700; }
  .footer { color: #9ca3af; font-size: 12px; margin-top: 24px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>Buenos días, ${dentist.name}</h1>
    <p style="margin:0; opacity:.85;">Tus citas para hoy · ${dateStr}</p>
  </div>
  <p>Tienes <span class="badge">${appointments.length} cita${appointments.length !== 1 ? 's' : ''}</span> programada${appointments.length !== 1 ? 's' : ''} para hoy.</p>
  <table>
    <thead><tr><th>Hora</th><th>Paciente</th><th>Email</th><th>Teléfono</th><th>Motivo</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">Clínica Dental · Resumen diario automático.</p>
</div>
</body>
</html>`;

  await send(
    dentist.email,
    `Tus citas para hoy (${appointments.length}) · ${dateStr}`,
    html,
  );
}
