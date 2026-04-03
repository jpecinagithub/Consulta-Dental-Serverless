'use client';

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${d} de ${months[m - 1]} de ${y}`;
}

interface ConfirmationData {
  cancellationToken: string;
  dentistName: string;
  date: string;
  time: string;
  patientName: string;
  patientEmail: string;
}

export default function BookingConfirmation({
  confirmation,
  onNewBooking,
}: {
  confirmation: ConfirmationData;
  onNewBooking: () => void;
}) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const cancelUrl = `${appUrl}/cancel?token=${confirmation.cancellationToken}`;

  return (
    <div className="card text-center space-y-6">
      {/* Icono de éxito */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">¡Cita confirmada!</h2>
        <p className="text-gray-500 mt-2">
          Hola {confirmation.patientName}, tu cita ha sido reservada correctamente.
        </p>
      </div>

      {/* Detalles */}
      <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 text-sm">
        <Row label="Dentista" value={confirmation.dentistName} />
        <Row label="Fecha" value={formatDate(confirmation.date)} />
        <Row label="Hora" value={`${confirmation.time} h`} />
        <Row label="Duración" value="30 minutos" />
        <Row label="Confirmación enviada a" value={confirmation.patientEmail} />
      </div>

      {/* Info cancelación */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-left">
        <p className="font-semibold text-amber-800 mb-1">¿Necesitas cancelar?</p>
        <p className="text-amber-700">
          Puedes cancelar tu cita en cualquier momento desde el enlace que hemos enviado a tu email.
          El enlace es válido durante 30 días.
        </p>
        <a
          href={cancelUrl}
          className="block mt-3 text-xs text-amber-600 underline break-all"
        >
          {cancelUrl}
        </a>
      </div>

      <button onClick={onNewBooking} className="btn-secondary w-full">
        Reservar otra cita
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
