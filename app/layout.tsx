import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clínica Dental — Reserva de Citas',
  description: 'Reserva tu cita en nuestra clínica dental de forma rápida y sencilla.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
