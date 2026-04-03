'use client';

import { useState } from 'react';
import type { Dentist } from '@/types';
import DentistSelector from './booking/DentistSelector';
import DateSlotSelector from './booking/DateSlotSelector';
import BookingForm from './booking/BookingForm';
import BookingConfirmation from './booking/BookingConfirmation';

type Step = 'dentist' | 'datetime' | 'form' | 'confirmation';

interface BookingState {
  dentist: Dentist | null;
  date: string;
  time: string;
}

interface ConfirmationData {
  cancellationToken: string;
  dentistName: string;
  date: string;
  time: string;
  patientName: string;
  patientEmail: string;
}

export default function BookingFlow({ dentists }: { dentists: Dentist[] }) {
  const [step, setStep] = useState<Step>('dentist');
  const [booking, setBooking] = useState<BookingState>({ dentist: null, date: '', time: '' });
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);

  const STEPS = ['dentist', 'datetime', 'form', 'confirmation'];
  const stepIndex = STEPS.indexOf(step);

  function selectDentist(dentist: Dentist) {
    setBooking({ dentist, date: '', time: '' });
    setStep('datetime');
  }

  function selectDateTime(date: string, time: string) {
    setBooking((prev) => ({ ...prev, date, time }));
    setStep('form');
  }

  function onConfirmed(data: ConfirmationData) {
    setConfirmation(data);
    setStep('confirmation');
  }

  function restart() {
    setBooking({ dentist: null, date: '', time: '' });
    setConfirmation(null);
    setStep('dentist');
  }

  return (
    <div className="space-y-6">
      {/* Barra de progreso */}
      {step !== 'confirmation' && (
        <div className="flex items-center gap-2">
          {['Dentista', 'Fecha y hora', 'Tus datos'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors ${
                  i < stepIndex
                    ? 'bg-blue-600 text-white'
                    : i === stepIndex
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < stepIndex ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  i <= stepIndex ? 'text-blue-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {i < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                    i < stepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contenido de cada paso */}
      {step === 'dentist' && (
        <DentistSelector dentists={dentists} onSelect={selectDentist} />
      )}

      {step === 'datetime' && booking.dentist && (
        <DateSlotSelector
          dentist={booking.dentist}
          onSelect={selectDateTime}
          onBack={() => setStep('dentist')}
        />
      )}

      {step === 'form' && booking.dentist && (
        <BookingForm
          dentist={booking.dentist}
          date={booking.date}
          time={booking.time}
          onConfirmed={onConfirmed}
          onBack={() => setStep('datetime')}
        />
      )}

      {step === 'confirmation' && confirmation && (
        <BookingConfirmation confirmation={confirmation} onNewBooking={restart} />
      )}
    </div>
  );
}
