'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dentist } from '@/types';
import AgendaView from './AgendaView';
import ScheduleEditor from './ScheduleEditor';
import BlockManager from './BlockManager';

type Tab = 'agenda' | 'schedules' | 'blocks';

export default function AdminPanel({ dentists }: { dentists: Dentist[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('agenda');
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'agenda',    label: 'Agenda',    icon: '📅' },
    { id: 'schedules', label: 'Horarios',  icon: '🕐' },
    { id: 'blocks',    label: 'Bloqueos',  icon: '🚫' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              CD
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-xs text-gray-500">Clínica Dental</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver web ↗
            </a>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-secondary text-sm px-4 py-2"
            >
              {loggingOut ? 'Saliendo…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'agenda'    && <AgendaView dentists={dentists} />}
        {activeTab === 'schedules' && <ScheduleEditor dentists={dentists} />}
        {activeTab === 'blocks'    && <BlockManager dentists={dentists} />}
      </main>
    </div>
  );
}
