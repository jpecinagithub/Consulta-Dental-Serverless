'use client';

import { useState, useEffect } from 'react';
import type { Dentist, Schedule } from '@/types';

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

const DEFAULT: Omit<Schedule, 'dentistId'> = {
  workDays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '18:00',
  breakStart: '14:00',
  breakEnd: '15:00',
};

export default function ScheduleEditor({ dentists }: { dentists: Dentist[] }) {
  const [selectedDentist, setSelectedDentist] = useState(dentists[0]?.id ?? '');
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!selectedDentist) return;
    setLoading(true);
    setSaved(false);

    fetch(`/api/schedules/${selectedDentist}`)
      .then((r) => r.json())
      .then((data: Schedule) => {
        setForm({
          workDays: data.workDays,
          startTime: data.startTime,
          endTime: data.endTime,
          breakStart: data.breakStart ?? '',
          breakEnd: data.breakEnd ?? '',
        });
      })
      .catch(() => setForm(DEFAULT))
      .finally(() => setLoading(false));
  }, [selectedDentist]);

  function toggleDay(day: number) {
    setForm((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/schedules/${selectedDentist}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workDays: form.workDays,
        startTime: form.startTime,
        endTime: form.endTime,
        breakStart: form.breakStart || null,
        breakEnd: form.breakEnd || null,
      }),
    });

    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuración de horarios</h2>
        <p className="text-sm text-gray-500">
          Define los días y horas de atención de cada dentista.
        </p>
      </div>

      {/* Selector de dentista */}
      <div className="flex gap-2">
        {dentists.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDentist(d.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
              selectedDentist === d.id
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Cargando horario…</div>
      ) : (
        <div className="card space-y-6 max-w-xl">
          {/* Días laborables */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Días de atención</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`w-12 h-12 rounded-xl text-sm font-semibold border-2 transition-all ${
                    form.workDays.includes(day.value)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horas de apertura */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de inicio</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de cierre</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          {/* Pausa */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Pausa del mediodía{' '}
              <span className="text-xs text-gray-400 font-normal">(dejar vacío si no hay pausa)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Inicio de la pausa</label>
                <input
                  type="time"
                  value={form.breakStart ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, breakStart: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin de la pausa</label>
                <input
                  type="time"
                  value={form.breakEnd ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, breakEnd: e.target.value }))}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Guardar */}
          <div className="flex items-center gap-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Guardando…' : 'Guardar horario'}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Guardado correctamente
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
