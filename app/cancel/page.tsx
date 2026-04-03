'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface AppointmentInfo {
  appointment: { date: string; time: string; patientName: string };
  dentistName: string;
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${d} de ${months[m - 1]} de ${y}`;
}

function CancelContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<'loading' | 'found' | 'notfound' | 'cancelling' | 'cancelled' | 'error'>('loading');
  const [info, setInfo] = useState<AppointmentInfo | null>(null);

  useEffect(() => {
    if (!token) {
      setState('notfound');
      return;
    }

    fetch(`/api/appointments/cancel?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setInfo(data);
          setState('found');
        } else {
          setState('notfound');
        }
      })
      .catch(() => setState('notfound'));
  }, [token]);

  async function handleCancel() {
    if (!token) return;
    setState('cancelling');

    const res = await fetch('/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (res.ok) {
      setState('cancelled');
    } else {
      setState('error');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center">

        {state === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando información de la cita…</p>
          </>
        )}

        {state === 'notfound' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
            <p className="text-gray-600 text-sm">
              El enlace de cancelación no es válido o ha expirado (válido durante 30 días tras la reserva).
            </p>
            <a href="/" className="mt-6 btn-primary inline-block">Volver al inicio</a>
          </>
        )}

        {state === 'found' && info && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cancelar cita</h2>
            <p className="text-gray-600 text-sm mb-6">
              ¿Estás seguro de que quieres cancelar la siguiente cita?
            </p>

            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
              <Row label="Paciente" value={info.appointment.patientName} />
              <Row label="Dentista" value={info.dentistName} />
              <Row label="Fecha" value={formatDate(info.appointment.date)} />
              <Row label="Hora" value={`${info.appointment.time} h`} />
            </div>

            <div className="flex gap-3">
              <a href="/" className="flex-1 btn-secondary text-center">
                No cancelar
              </a>
              <button onClick={handleCancel} className="flex-1 btn-danger">
                Sí, cancelar
              </button>
            </div>
          </>
        )}

        {state === 'cancelling' && (
          <>
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cancelando cita…</p>
          </>
        )}

        {state === 'cancelled' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cita cancelada</h2>
            <p className="text-gray-600 text-sm mb-6">
              Tu cita ha sido cancelada correctamente. Recibirás un email de confirmación.
            </p>
            <a href="/" className="btn-primary inline-block">Reservar una nueva cita</a>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cancelar</h2>
            <p className="text-gray-600 text-sm mb-6">
              Ha ocurrido un error. Por favor, inténtalo de nuevo o contacta con la clínica.
            </p>
            <button onClick={() => setState('found')} className="btn-secondary">Reintentar</button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  );
}
