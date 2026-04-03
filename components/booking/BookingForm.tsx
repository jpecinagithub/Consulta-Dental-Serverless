'use client';

import { useState, FormEvent } from 'react';
import type { Dentist } from '@/types';

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${d} de ${months[m - 1]} de ${y}`;
}

interface BookingFormProps {
  dentist: Dentist;
  date: string;
  time: string;
  onConfirmed: (data: {
    cancellationToken: string;
    dentistName: string;
    date: string;
    time: string;
    patientName: string;
    patientEmail: string;
  }) => void;
  onBack: () => void;
}

export default function BookingForm({ dentist, date, time, onConfirmed, onBack }: BookingFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dentistId: dentist.id,
        date,
        time,
        patientName: name,
        patientEmail: email,
        patientPhone: phone,
        reason,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      onConfirmed({
        cancellationToken: data.cancellationToken,
        dentistName: dentist.name,
        date,
        time,
        patientName: name,
        patientEmail: email,
      });
    } else {
      setError(data.error ?? 'Error al reservar la cita. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-6">
      {/* Cabecera */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors mt-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Tus datos</h2>
          <p className="text-sm text-gray-500">
            {dentist.name} · {formatDate(date)} · {time} h
          </p>
        </div>
      </div>

      {/* Resumen de la cita */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
        <span className="text-gray-500">Dentista</span>
        <span className="font-semibold text-gray-900">{dentist.name}</span>
        <span className="text-gray-500">Especialidad</span>
        <span className="font-semibold text-gray-900">{dentist.specialty}</span>
        <span className="text-gray-500">Fecha</span>
        <span className="font-semibold text-gray-900">{formatDate(date)}</span>
        <span className="text-gray-500">Hora</span>
        <span className="font-semibold text-gray-900">{time} h · 30 min</span>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Juan García López"
            required
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="juan@email.com"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Recibirás la confirmación y el enlace de cancelación en este email.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="612 345 678"
            required
            maxLength={20}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de la consulta <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input resize-none"
            rows={3}
            placeholder="Dolor de muelas, revisión anual, blanqueamiento…"
            maxLength={500}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="btn-secondary flex-1">
            Atrás
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Reservando…' : 'Confirmar cita'}
          </button>
        </div>
      </form>
    </div>
  );
}
