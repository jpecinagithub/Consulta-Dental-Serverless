import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentsByDentistAndDate } from '@/lib/kv';
import { sendDailyDigest } from '@/lib/email';
import { DENTISTS } from '@/lib/dentists';
import { todayMadrid } from '@/lib/slots';

/**
 * GET /api/notify/daily
 *
 * Endpoint llamado por el Cron de Vercel cada día a las 07:00 (Europa/Madrid).
 * Vercel lo configura en vercel.json: "0 6 * * *" (UTC = 07:00 Madrid invierno).
 *
 * Seguridad: Vercel envía el header Authorization: Bearer {CRON_SECRET}
 */
export async function GET(request: NextRequest) {
  // Verificar que la llamada viene de Vercel Cron (o de una llamada manual autorizada)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const today = todayMadrid();
  const results: { dentistId: string; sent: boolean; count: number }[] = [];

  await Promise.all(
    DENTISTS.map(async (dentist) => {
      const appointments = await getAppointmentsByDentistAndDate(dentist.id, today);

      if (appointments.length > 0) {
        await sendDailyDigest(dentist, appointments, today);
        results.push({ dentistId: dentist.id, sent: true, count: appointments.length });
      } else {
        results.push({ dentistId: dentist.id, sent: false, count: 0 });
      }
    }),
  );

  return NextResponse.json({ success: true, date: today, results });
}
