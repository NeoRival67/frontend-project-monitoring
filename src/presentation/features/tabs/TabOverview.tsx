import React, { useState, useEffect } from 'react';
import { Activity, User, BarChart3 } from 'lucide-react';
import type { Proyek, Aktivitas, Deliverable } from '@/core/entities/Proyek'; 
import type { PenilaianResiko } from '@/core/entities/Risk';
import { ProjectDetailsChart, type ChartDataItem } from '@/presentation/components/ProjectDetailsChart';
import { getLogByProyek } from '@/infrastructure/repositories/proyek.repo';
interface TabOverviewProps {
  proyek: Proyek;
  activities: Aktivitas[];
  risks: PenilaianResiko[];
  deliverables: Deliverable[];
}

export const TabOverview: React.FC<TabOverviewProps> = ({ 
  proyek, 
  activities = [], 
  risks = [], 
  deliverables = [] 
}) => {

  // State untuk log aktivitas (realisasi biaya)
  const [logsByAktivitas, setLogsByAktivitas] = useState<Record<string, any[]>>({});

  // Fetch logs per proyek untuk mendapatkan costIncurred (realisasi biaya) yang sebenarnya
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const allLogs = await getLogByProyek(proyek.id);
        const grouped: Record<string, any[]> = {};
        if (Array.isArray(allLogs)) {
          allLogs.forEach((log: any) => {
            const aktId = log.aktivitasId;
            if (!grouped[aktId]) grouped[aktId] = [];
            grouped[aktId].push(log);
          });
        }
        setLogsByAktivitas(grouped);
      } catch (error) {
        console.error('Gagal mengambil log aktivitas:', error);
      }
    };
    if (proyek.id) fetchLogs();
  }, [proyek.id]);

  // Helper: Hitung total realisasi biaya dari log costIncurred
  const getRealisasiBiaya = (aktivitasId: string): number => {
    const logs = logsByAktivitas[aktivitasId] || [];
    return logs.reduce((total: number, log: any) => {
      return total + (Number(log.costIncurred) || 0);
    }, 0);
  };

  // 1. Kalkulasi Progress Aktivitas
  const completedActivities = activities.filter((a) => 
    a.status === 'selesai' || a.progress === 100
  ).length;
  
  // Gunakan progres dari entitas Proyek (jika ada), atau hitung rata-rata dari aktivitas
  const projectProgress = proyek.progres !== undefined 
    ? proyek.progres 
    : (activities.length > 0 ? Math.round((completedActivities / activities.length) * 100) : 0);

  // 2. Kalkulasi Risiko
  const criticalRisks = risks.filter((r: any) => r.level === 'CRITICAL').length;

  // 3. Kalkulasi Deliverables
const approvedDeliverables = deliverables.filter((d) => {
    return d.status && d.status.toLowerCase() === 'approved';
  }).length;

  // 4. Kalkulasi Budget
 
  const budgetTotal = Number(proyek.budget || 0);

  // Realisasi biaya: gunakan data costIncurred dari log aktivitas (bukan estimasi)
  const budgetTerpakai = activities.reduce((total, act) => {
    return total + getRealisasiBiaya(act.id);
  }, 0);

  // Hitung persentasenya
  const budgetPercentage = budgetTotal > 0 ? Math.round((budgetTerpakai / budgetTotal) * 100) : 0; 

  const chartData = activities.map((act: any) => {
  // 1. Ambil bobot (weight) dari schema lu. Kalau null, anggap 0.
  const persentaseBobot = Number(act.weight || 0) / 100;
  
  // 2. Budget Aktivitas = Total Budget Proyek * Bobot Aktivitas
  const budgetAktivitas = budgetTotal * persentaseBobot; 
  
  // 3. Realisasi dari log costIncurred yang sebenarnya
  const realisasiAktivitas = getRealisasiBiaya(act.id);

  return {
    name: act.name || act.nama || 'Aktivitas',
    // Key harus sama dengan <Bar dataKey="Budget" /> (Pakai huruf besar depannya)
    budget: budgetAktivitas / 1000000, 
    // Key harus sama dengan <Bar dataKey="Realisasi" />
    realisasi: realisasiAktivitas / 1000000 
        };
    });

  // 5. Informasi Klien (Menggunakan tipe ClientVendor dari entitas Proyek)
  const clientName = proyek?.client?.name || proyek?.client?.nama || proyek?.clientName || '-';
  const clientContact = proyek?.client?.kontak || proyek?.client?.contactPerson || '-';
  const clientEmail = proyek.client?.email || '-';

  // Helper function untuk format tanggal
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================= */}
      {/* 4 KOTAK KPI UTAMA                           */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{projectProgress}%</h3>
          <p className="text-sm font-medium text-slate-500">Progres</p>
          <p className="text-xs text-slate-400 mt-2">{completedActivities}/{activities.length} aktivitas selesai</p>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{budgetPercentage}%</h3>
          <p className="text-sm font-medium text-slate-500">Budget Terpakai</p>
          <p className="text-xs text-slate-400 mt-2">
            Rp {(budgetTerpakai/1000000).toFixed(1)}Jt dari Rp {(budgetTotal/1000000).toFixed(1)}Jt
          </p>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{risks.length}</h3>
          <p className="text-sm font-medium text-slate-500">Risiko Aktif</p>
          <p className="text-xs text-slate-400 mt-2">{criticalRisks} tingkat kritis</p>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="text-3xl font-bold text-slate-800 mb-1">{approvedDeliverables}/{deliverables.length}</h3>
          <p className="text-sm font-medium text-slate-500">Deliverable</p>
          <p className="text-xs text-slate-400 mt-2">berstatus approved</p>
        </div>
      </div>

        {/* CHART D3.JS SECTION                       */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        <h3 className="font-semibold text-slate-800 text-lg mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500"/> 
          Budget vs Realisasi per Aktivitas (Juta Rupiah)
        </h3>
        
        {chartData.length > 0 ? (
          <ProjectDetailsChart data={chartData} />
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm bg-slate-50/50">
            Belum ada data aktivitas untuk ditampilkan pada chart.
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* GRID KONTEN BAWAH (Info, Tim, Aktivitas)    */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM 1: Info Proyek */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="font-semibold text-slate-800 text-sm mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400"/> Info Proyek
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Klien</span>
              <span className="font-medium text-slate-800 text-right">{clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kontak / PIC</span>
              <span className="font-medium text-slate-800 text-right">{clientContact}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email Klien</span>
              <span className="font-medium text-slate-800 text-right">{clientEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mulai</span>
              <span className="font-medium text-slate-800 text-right">{formatDate(proyek.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Selesai</span>
              <span className="font-medium text-slate-800 text-right">{formatDate(proyek.endDate)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-4 mt-4">
              <span className="text-slate-500 font-medium">Total Budget</span>
              <span className="font-bold text-slate-800 text-right">
                Rp {budgetTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          
          {/* Menampilkan Objective */}
          {proyek.objective && (
             <div className="mt-6 pt-6 border-t border-slate-100">
               <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Objectives</h4>
               <p className="text-sm text-slate-600 leading-relaxed">{proyek.objective}</p>
             </div>
          )}
        </div>

        {/* KOLOM 2: Tim Proyek */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="font-semibold text-slate-800 text-sm mb-6 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400"/> Tim Proyek
          </h3>
          <div className="space-y-4">
            {proyek.teams && proyek.teams.length > 0 ? (
              proyek.teams.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                    {member.user?.name ? member.user.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {member.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {member.roleInProject || member.user?.role || 'Anggota Tim'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                Belum ada tim di-assign.
              </div>
            )}
          </div>
        </div>

        {/* KOLOM 3: Status Aktivitas */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="font-semibold text-slate-800 text-sm mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400"/> Status Aktivitas
          </h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((act) => {
                let barColor = 'bg-blue-600';
                const statusText = act.status.replace('_', ' ').toUpperCase();

                if (act.status === 'selesai' || act.progress === 100) { 
                  barColor = 'bg-emerald-500'; 
                } else if (act.status === 'terlambat') { 
                  barColor = 'bg-rose-500'; 
                }

                return (
                  <div key={act.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-slate-700 line-clamp-1 pr-2">
                        {act.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{statusText}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`${barColor} h-full rounded-full transition-all duration-500`} 
                        style={{ width: `${act.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-32 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                Belum ada aktivitas.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};