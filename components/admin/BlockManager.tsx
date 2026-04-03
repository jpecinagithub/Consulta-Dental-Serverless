'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Dentist } from '@/types';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BlockManager({ dentists }: { dentists: Dentist[] }) {
  const [selectedDentist, setSelectedDentist] = useState(dentists[0]?.id ?? '');
  const [date, setDate] = useState(todayStr());
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!selectedDentist || !date) return;
    setLoading(true);

    fetch(`/api/blocks/${selectedDentist}?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setAllSlots(data.allSlots ?? []);
        setBlocks(data.blocks ?? []);
      })
      .catch(() => {
        setAllSlots([]);
        setBlocks([]);
      })
      .finally(() => setLoading(false));
  }, [selectedDentist, date]);

  useEffect(() => { loadData(); }, [loadData]);

  async function toggleBlock(time: string) {
    setSaving(time);
    const isBlocked = blocks.includes(time);

    const res = await fetch(`/api/blocks/${selectedDentist}`, {
      method: isBlocked ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time }),
    });

    if (res.ok) {
      setBlocks((prev) =>
        isBlocked ? prev.filter((t) => t !== time) : [...prev, time],
      );
    }

    setSaving(null);
  }

  async function blockAllDay() {
    if (!allSlots.length) return;
    if (!confirm(`¿Bloquear todo el día ${date} para ${dentists.find(d => d.id === selectedDentist)?.name}?`)) return;

    setSaving('all');
    await Promise.all(
      allSlots
        .filter((t) => !blocks.includes(t))
        .map((time) =>
          fetch(`/api/blocks/${selectedDentist}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, time }),
          }),
        ),
    );
    setBlocks([...allSlots]);
    setSaving(null);
  }

  async function unblockAllDay() {
    if (!blocks.length) return;
    setSaving('all');
    await Promise.all(
      blocks.map((time) =>
        fetch(`/api/blocks/${selectedDentist}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, time }),
        }),
      ),
    );
    setBlocks([]);
    setSaving(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Gestión de bloqueos</h2>
        <p className="text-sm text-gray-500">
          Bloquea slots individuales o días completos (vacaciones, formación, etc.).
        </p>
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

      {/* Acciones rápidas */}
      {!loading && allSlots.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={blockAllDay}
            disabled={saving !== null || blocks.length === allSlots.length}
            className="btn-secondary text-sm px-4 py-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            Bloquear todo el día
          </button>
          <button
            onClick={unblockAllDay}
            disabled={saving !== null || blocks.length === 0}
            className="btn-secondary text-sm px-4 py-2"
          >
            Desbloquear todo el día
          </button>
        </div>
      )}

      {/* Grid de slots */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading && (
          <div className="text-center py-8 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando slots…
          </div>
        )}

        {!loading && allSlots.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">🗓️</p>
            <p>No hay horario de trabajo configurado para este día.</p>
            <p className="text-sm mt-1">Configúralo en la pestaña <strong>Horarios</strong>.</p>
          </div>
        )}

        {!loading && allSlots.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Haz clic en un slot para bloquearlo o desbloquearlo.{' '}
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-red-200 rounded-sm inline-block" /> Bloqueado
              </span>{' '}
              <span className="inline-flex items-center gap-1 ml-2">
                <span className="w-3 h-3 bg-green-100 border border-green-300 rounded-sm inline-block" /> Disponible
              </span>
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {allSlots.map((slot) => {
                const isBlocked = blocks.includes(slot);
                const isSaving = saving === slot || saving === 'all';

                return (
                  <button
                    key={slot}
                    onClick={() => toggleBlock(slot)}
                    disabled={isSaving}
                    className={`py-2 px-2 text-sm font-semibold rounded-lg border-2 transition-all relative ${
                      isBlocked
                        ? 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                        : 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
                    } ${isSaving ? 'opacity-50' : ''}`}
                  >
                    {slot}
                    {isBlocked && (
                      <span className="absolute top-0.5 right-0.5 text-red-400 text-xs leading-none">✕</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
