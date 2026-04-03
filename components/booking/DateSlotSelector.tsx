'use client';

import { useState, useEffect } from 'react';
import type { Dentist } from '@/types';

function todayStr(): string {
  const now = new Date();
  // Ajustamos a Madrid aproximadamente (para el min del input)
  const offset = 2; // UTC+2 en verano; en producción se puede afinar
  const local = new Date(now.getTime() + offset * 60 * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function DateSlotSelector({
  dentist,
  onSelect,
  onBack,
}: {
  dentist: Dentist;
  onSelect: (date: string, time: string) => void;
  onBack: () => void;
}) {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!date) return;
    setSlots([]);
    setSelectedTime('');
    setError('');
    setLoading(true);

    fetch(`/api/appointments?dentistId=${dentist.id}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        if ((data.slots ?? []).length === 0) {
          setError('No hay horarios disponibles para este día.');
        }
      })
      .catch(() => setError('Error al cargar los horarios. Inténtalo de nuevo.'))
      .finally(() => setLoading(false));
  }, [date, dentist.id]);

  const today = todayStr();

  return (
    <div className="card space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Selecciona fecha y hora</h2>
          <p className="text-sm text-gray-500">con {dentist.name} · {dentist.specialty}</p>
        </div>
      </div>

      {/* Selector de fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {/* Slots disponibles */}
      {date && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Hora disponible</label>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Cargando horarios…
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {!loading && !error && slots.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2 px-2 text-sm font-semibold rounded-lg border-2 transition-all ${
                    selectedTime === slot
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Continuar */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => onSelect(date, selectedTime)}
          disabled={!date || !selectedTime}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
