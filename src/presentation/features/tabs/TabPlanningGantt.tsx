import React from 'react';
import { Plus, Edit2, Trash2, Calendar, AlertTriangle, ListTodo } from 'lucide-react';
import type { Proyek, Aktivitas} from '@/core/entities/Proyek';
import { PenilaianResiko } from '@/core/entities';
import { GanttChart } from '@/presentation/components/GanttChart';
import { useState, useEffect, useMemo } from 'react';
import { CreateAktivitas } from '@/presentation/components/CreateAktivitas';
import { UpdateAktivitas } from '@/presentation/components/UpdateAktivitas';
import { deleteAktivitas } from '@/infrastructure/repositories/proyek.repo';
import { DeleteAktivitas } from '@/presentation/components/DeleteAktivitas';
import { CreateRisk } from '@/presentation/components/CreateRisk';
import { DeleteRisk } from '@/presentation/components/DeleteRisk';
import { RiskRepository } from '@/infrastructure/repositories/risk.repo';
import { getLogByProyek } from '@/infrastructure/repositories/proyek.repo';

interface TabPlanningProps {
  proyek: Proyek;
  activities: Aktivitas[];
  risks: PenilaianResiko[];
}

export const TabPlanningGantt: React.FC<TabPlanningProps> = ({ proyek, activities = [], risks = [] }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateRiskOpen, setIsCreateRiskOpen] = useState(false);
  const [isDeleteRiskOpen, setIsDeleteRiskOpen] = useState(false); // Mengganti isEditRiskOpen
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [logsByAktivitas, setLogsByAktivitas] = useState<Record<string, any[]>>({});

  // Fetch logs per proyek untuk mendapatkan costIncurred (realisasi biaya) yang sebenarnya
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const allLogs = await getLogByProyek(proyek.id);
        // Group logs by aktivitasId
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

  const rawTeams = proyek.teams || (proyek as any).users || (proyek as any).teamMembers || [];
  // Data tim proyek 
  const teamMembersList = proyek.teams?.map(t => ({
    id: t.userId || t.user?.id || t.id,
    name: t.user?.name || 'Unknown',
    role: t.roleInProject || t.user?.role || 'Anggota'
  })) || [];

  const handleSuccess = () => {
    console.log("Data berhasil disimpan, silakan refresh data!");
  };

  // Fungsi untuk handle perubahan status risiko
  const handleStatusChange = async (riskId: string, newStatus: string) => {
    try {
      await RiskRepository.updateRiskStatus(riskId, newStatus);
      
      
    } catch (error) {
      console.error("Gagal update status risiko:", error);
      alert("Gagal mengubah status risiko.");
    }
  };

    const handleConfirmDelete = async () => {
    if (!deleteTarget.id) return;
    
    setIsDeleting(true);
    try {
      await deleteAktivitas(deleteTarget.id); 
      
  
      
      setIsDeleteOpen(false); 
    } catch (error) {
      console.error("Error Delete aktivitas:", error);
      alert("Gagal menghapus aktivitas.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format mata uang
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Format Tanggal (Misal: 1 Apr - 30 Apr 24)
  const formatPeriode = (start?: string, end?: string) => {
    if (!start || !end) return '-';
    const s = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const e = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
    return (
      <div className="flex flex-col">
        <span className="text-slate-800">{s}</span>
        <span className="text-slate-500">— {e}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string, progres: number) => {
    const safeStatus = (status || '').toLowerCase();

    if (safeStatus === 'selesai' || safeStatus === 'done' || progres === 100) 
      return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold">Selesai</span>;
    if (safeStatus === 'terlambat' || safeStatus === 'late') 
      return <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-xs font-semibold">Terlambat</span>;
    if (safeStatus === 'berjalan' || safeStatus === 'in progress' || safeStatus === 'ongoing') 
      return <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-semibold">Berjalan</span>;
    
    return <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-xs font-semibold">Belum Mulai</span>;
  };

  const budgetTotal = Number(proyek.budget || 0);

  console.log("🕵️‍♂️ DATA AKTIVITAS DI REACT:", risks);

  return (
    <div className="space-y-6">

      {/* ========================================= */}
      {/* SECTION 1: DAFTAR AKTIVITAS                 */}
      {/* ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-blue-500" /> Daftar Aktivitas
          </h3>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Aktivitas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="pb-3 pr-4">Aktivitas</th>
                <th className="pb-3 px-4">Periode</th>
                <th className="pb-3 px-4">Tim Assign</th>
                <th className="pb-3 px-4">Budget</th>
                <th className="pb-3 px-4">Realisasi</th>
                <th className="pb-3 px-4">Progress</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.length > 0 ? activities.map((act) => {
                
                const budgetAct = act.budget ? Number(act.budget) : (budgetTotal * ((act.weight || 0) / 100));
                
                // Gunakan act.progress sesuai nama field dari API (atau act.progres jika di interface lama)
                const currentProgress = act.progress ?? act.progress ?? 0;
                
                // Realisasi biaya: gunakan data costIncurred dari log aktivitas (bukan estimasi dari progress)
                const realisasiAct = getRealisasiBiaya(act.id);

                return (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      {/* Gunakan act.name (dari API baru) atau fallback ke act.nama */}
                      <p className="font-semibold text-slate-800">{act.name}</p>
                      <p className="text-xs text-slate-800 mt-0.5 max-w-[200px] truncate" title={act.description}>
                        {act.deskripsi}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {/* Gunakan startDate & dueDate dari API baru, fallback ke format lama */}
                      <p className="font-semibold text-slate-800"> {act.startDate ? new Date(act.startDate).toLocaleDateString('id-ID') : '-'} - {act.dueDate ? new Date(act.dueDate).toLocaleDateString('id-ID') : '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      {/* Tampilkan inisial Assignee yang sebenarnya (dari API) */}
                      <div className="flex -space-x-2">
                        {act.assignees && act.assignees.length > 0 ? (
                          act.assignees.slice(0, 3).map((assignee: any, i: number) => {
                            // Antisipasi tipe assignees berbentuk object atau sekedar ID string
                            const nameStr = typeof assignee === 'string' ? 'U' : (assignee.name || assignee.nama || 'U');
                            return (
                              <div key={i} className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white text-[10px] font-bold text-white flex items-center justify-center uppercase" title={nameStr}>
                                {nameStr.charAt(0)}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400">Belum ada</span>
                        )}
                        
                        {act.assignees && act.assignees.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white text-[10px] font-bold text-slate-600 flex items-center justify-center">
                            +{act.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-600">{formatRupiah(budgetAct)}</td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-600">{formatRupiah(realisasiAct)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${currentProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${currentProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{currentProgress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(act.status, currentProgress)}</td>
                    <td className="py-4 pl-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* 1. TOMBOL EDIT - Memicu Modal UpdateAktivitas */}
                        <button 
                          onClick={() => {
                            setSelectedActivity(act);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Aktivitas"
                        >
                          <Edit2 className="w-4 h-4"/>
                        </button>

                        {/* 2. TOMBOL DELETE - Memicu fungsi handleDelete */}

                       <button 
                          onClick={() => {
                            setDeleteTarget({ id: act.id, name: act.name }); // Simpan data yang mau dihapus
                            setIsDeleteOpen(true); // Buka modal
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Hapus Aktivitas"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">Belum ada aktivitas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================= */}
      {/* SECTION 2: GANTT CHART                      */}
      {/* ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Gantt Chart
          </h3>
          
          {/* Legenda */}
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-4 py-2 rounded-lg">
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Selesai</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Berjalan</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div> Belum Mulai</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Terlambat</span>
          </div>
        </div>

        {/* Render Chart */}
        <GanttChart activities={activities} />
      </div>

      {/* ========================================= */}
      {/* SECTION 3: RISK REGISTER                    */}
      {/* ========================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Risk Register
          </h3>
          
          {/* TOMBOL TAMBAH RISIKO */}
          <button 
            onClick={() => setIsCreateRiskOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Risiko
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="pb-3 pr-4">Risiko</th>
                <th className="pb-3 px-4">Kategori</th>
                <th className="pb-3 px-2 text-center">P</th>
                <th className="pb-3 px-2 text-center">I</th>
                <th className="pb-3 px-4">Level</th>
                <th className="pb-3 px-4">Mitigasi</th>
                <th className="pb-3 px-4">Owner</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {risks.length > 0 ? risks.map((risk) => {
                
                // Styling Badge Level Risiko sesuai data API ("LOW", "MEDIUM", "HIGH", "CRITICAL")
                const safeLevel = (risk.level || '').toUpperCase();
                let levelBadge = <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded font-bold text-[10px]">-</span>;
                
                if (safeLevel === 'CRITICAL') {
                  levelBadge = <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded font-bold text-[10px]">CRITICAL</span>;
                } else if (safeLevel === 'HIGH') {
                  levelBadge = <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded font-bold text-[10px]">HIGH</span>;
                } else if (safeLevel === 'MEDIUM') {
                  levelBadge = <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold text-[10px]">MEDIUM</span>;
                } else if (safeLevel === 'LOW') {
                  levelBadge = <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-bold text-[10px]">LOW</span>;
                }

                return (
                  <tr key={risk.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4 w-1/4">
                      <p className="font-semibold text-slate-800 text-xs line-clamp-2">{risk.riskName}</p>
                    </td>
                    
                    <td className="py-4 px-4 text-xs text-slate-500">{risk.kategori || '-'}</td>
                    
                    <td className="py-4 px-2 text-center text-xs font-bold text-slate-700">{risk.probability || 0}</td>
                    
                    <td className="py-4 px-2 text-center text-xs font-bold text-slate-700">{risk.impact || 0}</td>
                    
                    <td className="py-4 px-4 uppercase">{levelBadge}</td>
                    
                    <td className="py-4 px-4 w-1/4">
                      <p className="text-xs text-slate-500 line-clamp-2">{risk.mitigation || '-'}</p>
                    </td>
                    
                    <td className="py-4 px-4 text-xs text-slate-600 font-medium">
                      {risk.owner?.name ? risk.owner.name : <span className="text-slate-400 italic">Belum di-assign</span>}
                    </td>
                    
                    <td className="py-4 px-4">
                      <select
                        value={risk.status || 'OPEN'}
                        onChange={(e) => handleStatusChange(risk.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded cursor-pointer outline-none appearance-none text-center border-none transition-colors
                          ${(risk.status || 'OPEN') === 'CLOSED' ? 'bg-slate-100 text-slate-500' : 
                            (risk.status || 'OPEN') === 'MITIGASI' ? 'bg-blue-100 text-blue-700' : 
                            'bg-orange-100 text-orange-700'} // Warna OPEN
                        `}
                      >
                        <option value="OPEN" className="text-slate-800 bg-white text-xs font-medium">OPEN</option>
                        <option value="MITIGASI" className="text-slate-800 bg-white text-xs font-medium">MITIGASI</option>
                        <option value="CLOSED" className="text-slate-800 bg-white text-xs font-medium">CLOSED</option>
                      </select>
                    </td>
                    
                    <td className="py-4 pl-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* TOMBOL DELETE RISIKO */}
                        <button 
                          onClick={() => {
                            setSelectedRisk(risk);
                            setIsDeleteRiskOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={9} className="text-center py-8 text-slate-400">Belum ada risiko tercatat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Create */}
       <CreateAktivitas 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        proyekId={proyek.id}
        teamMembers={teamMembersList}
        onSuccess={handleSuccess}
      />
      {/* Update */}
      <UpdateAktivitas 
        isOpen={isEditOpen} 
        onClose={() => { setIsEditOpen(false); setSelectedActivity(null); }} 
        proyekId={proyek.id}
        initialData={selectedActivity}
        teamMembers={teamMembersList}
        onSuccess={handleSuccess}
      />

      {/* Modal Delete */}
      <DeleteAktivitas 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        activityName={deleteTarget.name}
        isLoading={isDeleting}
      />  


         {/* Modal Resiko Create*/}
      <CreateRisk 
        isOpen={isCreateRiskOpen} 
        onClose={() => setIsCreateRiskOpen(false)} 
        proyekId={proyek.id}
        teamMembers={teamMembersList}
        onSuccess={handleSuccess}
      />
           
           
         {/* Modal Resiko Delete*/}
         <DeleteRisk 
          isOpen={isDeleteRiskOpen} 
          onClose={() => { setIsDeleteRiskOpen(false); setSelectedRisk(null); }} 
          riskId={selectedRisk?.id || ''}
          riskDesc={selectedRisk?.riskName || ''}
          onSuccess={handleSuccess}
        />
    </div>
  );
};