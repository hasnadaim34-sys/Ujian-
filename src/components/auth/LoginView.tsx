import React, { useState } from 'react';
import { User, UserRole } from '../../types/exam';
import { ShieldCheck, BookOpen, UserCheck, KeyRound, ArrowRight, Lock, School } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  teachers: User[];
  students: User[];
  onDirectExamToken?: (token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  teachers,
  students,
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>('guru');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (activeTab === 'guru') {
      const match = teachers.find(
        t => t.identifier.toLowerCase() === identifier.trim().toLowerCase()
      );
      if (match) {
        onLogin(match);
      } else {
        // Allow fallback or prompt
        const customGuru: User = {
          id: `custom-guru-${Date.now()}`,
          name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
          role: 'guru',
          identifier: identifier,
          schoolName: 'SMP Negeri 1 Nusantara',
        };
        onLogin(customGuru);
      }
    } else {
      const match = students.find(
        s => s.identifier.trim() === identifier.trim()
      );
      if (match) {
        onLogin(match);
      } else {
        // Register or fallback student
        const customSiswa: User = {
          id: `custom-siswa-${Date.now()}`,
          name: identifier.length > 5 ? `Siswa (${identifier})` : 'Peserta Ujian Baru',
          role: 'siswa',
          identifier: identifier,
          schoolName: 'SMP Negeri 1 Nusantara',
          classGroup: 'IX-A',
        };
        onLogin(customSiswa);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Portal Asesmen Digital
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          SMP Negeri 1 Nusantara · Ujian Berbasis Komputer & Kiosk Mode
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {/* Role Tab Selector */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('guru');
                setIdentifier(teachers[0]?.identifier || '');
                setPassword('••••••••');
                setErrorMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'guru'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Portal Guru / Pengawas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('siswa');
                setIdentifier(students[0]?.identifier || '');
                setPassword('1234');
                setErrorMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'siswa'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Portal Siswa</span>
            </button>
          </div>

          {/* Quick Demo Acccount Selector */}
          <div className="mb-6 p-3 bg-blue-50/70 border border-blue-200/70 rounded-lg">
            <div className="text-xs font-semibold text-blue-900 mb-1.5 flex items-center justify-between">
              <span>Akun Demo Cepat (1-Klik Masuk):</span>
              <span className="text-[10px] text-blue-600 font-mono">Pilih satu</span>
            </div>
            {activeTab === 'guru' ? (
              <div className="space-y-1.5">
                {teachers.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onLogin(t)}
                    className="w-full text-left text-xs bg-white hover:bg-blue-50/50 border border-slate-200 p-2 rounded flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-blue-700">{t.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{t.identifier}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {students.slice(0, 3).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onLogin(s)}
                    className="w-full text-left text-xs bg-white hover:bg-blue-50/50 border border-slate-200 p-2 rounded flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-blue-700">{s.name} ({s.classGroup})</div>
                      <div className="text-[11px] text-slate-500 font-mono">NISN: {s.identifier}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Atau Masuk Manual</span>
            </div>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeTab === 'guru' ? 'Email Belajar.id / NIP Guru' : 'Nomor Induk Siswa Nasional (NISN)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={
                    activeTab === 'guru'
                      ? 'contoh: hasnadaim34@guru.smp.belajar.id'
                      : 'contoh: 0084729103'
                  }
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeTab === 'guru' ? 'Kata Sandi' : 'PIN / Token Peserta'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={activeTab === 'guru' ? '••••••••' : 'PIN 4-6 digit'}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>{activeTab === 'guru' ? 'Masuk ke Dasbor Guru' : 'Masuk ke Ruang Ujian Siswa'}</span>
            </button>
          </form>

          {/* Security notice footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2 text-slate-500 text-[11px] leading-relaxed">
            <School className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Sistem mematuhi standar integritas Asesmen Nasional. Sesi pengerjaan diproteksi dengan Kiosk Fullscreen Lock dan audit log anti-kecurangan.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
