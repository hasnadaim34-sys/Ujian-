import React from 'react';
import { User } from '../../types/exam';
import { ShieldCheck, LogOut, RefreshCw } from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  allTeachers: User[];
  allStudents: User[];
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  allTeachers,
  allStudents,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">SIMAS-CBT</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                PROCTOR SHIELD
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Sistem Asesmen Digital & Ujian Terproteksi
            </p>
          </div>
        </div>

        {/* Right side controls */}
        {currentUser && (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Demo Switcher */}
            <div className="relative group">
              <button 
                title="Ganti akun pengujian cepat"
                className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Ganti Peran Uji</span>
              </button>
              
              <div className="hidden group-hover:block absolute right-0 top-full pt-1 w-64 shadow-xl rounded-lg bg-white border border-slate-200 py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Masuk Sebagai Guru
                </div>
                {allTeachers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onSwitchUser(t)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentUser.id === t.id ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-400">Guru</span>
                  </button>
                ))}

                <div className="border-t border-slate-100 my-1"></div>
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Masuk Sebagai Siswa
                </div>
                {allStudents.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onSwitchUser(s)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentUser.id === s.id ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{s.name} ({s.classGroup})</span>
                    <span className="text-[10px] text-slate-400">NISN</span>
                  </button>
                ))}

                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    if (confirm('Reset semua data simulator ke default awal?')) {
                      StorageService.resetToDefault();
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Data Demo CBT</span>
                </button>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-xs border border-slate-300">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentUser.role === 'guru' ? 'Guru Pengampu / Pengawas' : `Siswa Kelas ${currentUser.classGroup}`}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Keluar"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
