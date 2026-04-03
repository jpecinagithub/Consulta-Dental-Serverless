'use client';

import type { Dentist } from '@/types';

const COLOR_MAP: Record<string, { bg: string; ring: string; badge: string }> = {
  blue:   { bg: 'bg-blue-600',   ring: 'ring-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  teal:   { bg: 'bg-teal-600',   ring: 'ring-teal-200',   badge: 'bg-teal-100 text-teal-700' },
  violet: { bg: 'bg-violet-600', ring: 'ring-violet-200', badge: 'bg-violet-100 text-violet-700' },
};

export default function DentistSelector({
  dentists,
  onSelect,
}: {
  dentists: Dentist[];
  onSelect: (d: Dentist) => void;
}) {
  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Elige tu dentista</h2>
      <p className="text-sm text-gray-500 mb-6">
        Selecciona el profesional con el que quieres consultar.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {dentists.map((dentist) => {
          const colors = COLOR_MAP[dentist.color] ?? COLOR_MAP.blue;
          const initials = dentist.name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('');

          return (
            <button
              key={dentist.id}
              onClick={() => onSelect(dentist)}
              className={`group flex flex-col items-center text-center p-6 rounded-xl border-2 border-transparent bg-gray-50 hover:border-blue-300 hover:bg-white hover:shadow-md transition-all ring-0 hover:ring-4 ${colors.ring}`}
            >
              {/* Avatar */}
              <div
                className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-xl mb-4 shadow-md`}
              >
                {initials}
              </div>

              {/* Nombre */}
              <p className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors">
                {dentist.name}
              </p>

              {/* Especialidad */}
              <span className={`mt-2 inline-block text-xs font-medium px-3 py-1 rounded-full ${colors.badge}`}>
                {dentist.specialty}
              </span>

              {/* CTA */}
              <span className="mt-4 text-xs text-gray-400 group-hover:text-blue-600 transition-colors font-medium">
                Seleccionar →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
