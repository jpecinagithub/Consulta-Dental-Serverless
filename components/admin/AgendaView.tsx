'use client';

import { useState, useEffect } from 'react';
import type { Dentist, Appointment } from '@/types';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const dateObj = new Date(y, m - 1, d);
  return `${days[dateObj.getDay()]}, ${d} de ${months[m - 1]} de ${y}`;
}

export default function AgendaView({ dentists }: { dentists: Dentist[] }) {
  const [selectedDentist, setSelectedDentist] = useState(dentists[0]?.id ?? '');
  const [date, setDate] = useState(todayStr());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDentist || !date) return;

    setLoading(true);
    fetch(`/api/admin/appointments?dentistId=${selectedDentist}&date=${date}`)
      .then((r) => r.json())
      .then((data) => setAppointments(data.appointments ?? []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [selectedDentist, date]);

  async function cancelAppointment(id: string) {
    if (!confirm('¿Cancelar esta cita?')) return;

    await fetch('/api/admin/appointments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: id }),
    });

    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  const dentist = dentists.find((d) => d.id === selectedDentist);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Agenda del día</h2>
        <p className="text-sm text-gray-500">Visualiza las citas de cada dentista por día.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dentista</label>
          <select
            value={selectedDentist}
            onChange={(e) => setSelectedDentist(e.target.value)}
            className="input w-auto"
          >
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto"
          />
        </div>
      </div>

      {/* Tabla de citas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{dentist?.name}</p>
            <p className="text-sm text-gray-500">{date ? formatDate(date) : ''}</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
            {loading ? '…' : appointments.length} cita{appointments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading && (
          <div className="p-8 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando…
          </div>
        )}

        {!loading && appointments.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">No hay citas para este día.</p>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="divide-y divide-gray-50">
            {appointments.map((appt) => (
              <div key={appt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                {/* Hora */}
                <div className="w-16 flex-shrink-0">
                  <span className="text-lg font-bold text-blue-700">{appt.time}</span>
                </div>

                {/* Datos del paciente */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{appt.patientName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-500">
                    <span>{appt.patientEmail}</span>
                    <span>{appt.patientPhone}</span>
                  </div>
                  {appt.reason && (
                    <p className="text-sm text-gray-400 mt-1 italic">"{appt.reason}"</p>
                  )}
                </div>

                {/* Cancelar */}
                <button
                  onClick={() => cancelAppointment(appt.id)}
                  className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
