import BookingFlow from '@/components/BookingFlow';
import { DENTISTS } from '@/lib/dentists';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            CD
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Clínica Dental</h1>
            <p className="text-xs text-gray-500">Tu salud oral, nuestra prioridad</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
          Reserva tu cita online
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Elige tu dentista, selecciona el día y la hora que mejor te venga. Recibirás
          la confirmación por email de forma inmediata.
        </p>
      </section>

      {/* Formulario de reserva */}
      <main className="max-w-3xl mx-auto px-4 pb-16">
        <BookingFlow dentists={DENTISTS} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Clínica Dental · Todos los derechos reservados
        </div>
      </footer>
    </div>
  );
}
