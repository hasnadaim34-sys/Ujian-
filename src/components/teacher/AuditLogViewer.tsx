import React, { useState } from 'react';
import { ExamSettings, ExamSession, ViolationLog, ViolationType } from '../../types/exam';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  AlertCircle, 
  MonitorX, 
  Copy, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface AuditLogViewerProps {
  exams: ExamSettings[];
  sessions: ExamSession[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  exams,
  sessions,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Flatten all violation logs from all sessions
  const allLogs: Array<{
    session: ExamSession;
    examTitle: string;
    log: ViolationLog;
  }> = [];

  sessions.forEach(sess => {
    const exam = exams.find(e => e.id === sess.examId);
    sess.violations.forEach(v => {
      allLogs.push({
        session: sess,
        examTitle: exam?.title || 'Ujian',
        log: v,
      });
    });
  });

  // Sort newest first
  allLogs.sort((a, b) => new Date(b.log.timestamp).getTime() - new Date(a.log.timestamp).getTime());

  // Filter logs
  const filteredLogs = allLogs.filter(item => {
    if (selectedExamId !== 'all' && item.session.examId !== selectedExamId) return false;
    if (selectedType !== 'all' && item.log.type !== selectedType) return false;
    if (
      searchQuery.trim() &&
      !item.session.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.session.studentNis.includes(searchQuery) &&
      !item.log.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleExportAuditCSV = () => {
    const headers = [
      'Waktu Kejadian',
      'Nama Siswa',
      'NISN',
      'Kelas',
      'Paket Ujian',
      'Jenis Pelanggaran',
      'Keterangan Insiden',
      'Soal Ke-',
    ];

    const rows = filteredLogs.map(item => [
      `"${item.log.formattedTime}"`,
      `"${item.session.studentName}"`,
      item.session.studentNis,
      item.session.studentClass,
      `"${item.examTitle}"`,
      item.log.type,
      `"${item.log.description}"`,
      item.log.questionNumberAtTime,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_Integritas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getBadgeStyle = (type: ViolationType) => {
    switch (type) {
      case 'fullscreen_exit':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'tab_switch':
      case 'window_blur':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'blocked_key':
      case 'right_click':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Audit Trail & Log Integritas Asesmen</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekam jejak forensik keamanan ujian: keluar layar penuh, perpindahan jendela aplikasi, dan kombinasi tombol terlarang.
          </p>
        </div>

        <button
          onClick={handleExportAuditCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Log (CSV)</span>
        </button>
      </div>

      {/* Filter row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa atau insiden..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">Semua Paket Ujian</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">Semua Jenis Insiden</option>
            <option value="tab_switch">Perpindahan Tab / Window Blur</option>
            <option value="fullscreen_exit">Keluar Mode Layar Penuh</option>
            <option value="blocked_key">Tombol Pintas Terlarang (Alt+Tab/Copy)</option>
            <option value="right_click">Klik Kanan / Menu Konteks</option>
          </select>
        </div>
      </div>

      {/* Log timeline list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-semibold text-slate-800 text-sm">Tidak ada catatan pelanggaran</h4>
            <p className="text-slate-400 mt-1">Seluruh siswa mematuhi aturan Kiosk Mode atau filter tidak menghasilkan data.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(({ session, examTitle, log }) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-4">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                  <MonitorX className="w-5 h-5" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {session.studentName}
                      </span>
                      <span className="text-slate-400 text-xs">({session.studentNis} - {session.studentClass})</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getBadgeStyle(log.type)}`}>
                        {log.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.formattedTime}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    {log.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Ujian: <strong className="text-slate-600">{examTitle}</strong></span>
                    <span>·</span>
                    <span>Pada Soal Nomor: <strong className="text-slate-600">#{log.questionNumberAtTime}</strong></span>
                    <span>·</span>
                    <span>Total Pelanggaran Siswa: <strong className="text-rose-600">{session.violations.length}x</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
