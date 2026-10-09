"use client";

import React, { useState , useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, User, FileText, CheckCircle2, Activity, Clock } from 'lucide-react';
import { useProyekDetail } from '@/use-cases/hooks/useProyek';

// Nanti pastikan path import ini disesuaikan dengan folder strukturmu
import { TabOverview } from './tabs/TabOverview';
import { TabPlanningGantt } from './tabs/TabPlanningGantt';
import { TabMonitoring } from './tabs/TabMonitoring';
import { TabApproval } from './tabs/TabApproval';
import { TabTeamProject } from './tabs/TabTeamProject';
import { userAgent } from 'next/server';
import TabClosingProyek from './tabs/TabClosingProyek'; 
import { Client } from '@/core/entities/Client';
import { ClientVendor, ClosingProyek } from '../../core/entities/Proyek';
import { active } from 'd3';
import { updateProyek } from '@/infrastructure/repositories/proyek.repo';


export const ProjectDetailFeature = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string; 

  const [activeTab, setActiveTab] = useState('overview');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    try {
      const usr = localStorage.getItem("user");
      if (usr) {
        setCurrentUser(JSON.parse(usr));
      }
    } catch (e) {
      console.error("Gagal mengambil session user:", e);
    }
  }, []);

  const currentUserRole = currentUser?.role?.toUpperCase() || "";
  const canChangeStatus = ["PM", "CLIENT"].includes(currentUserRole);

  if (currentUserRole === "ADMIN") {
    return (
      <div className="w-full py-20 text-center">
        <div className="max-w-md mx-auto p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            ✕
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Role Admin tidak memiliki izin untuk melihat atau mengelola detail proyek.
          </p>
          <button 
            onClick={() => router.push('/master-tim')} 
            className="mt-4 bg-slate-800 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-700 transition-colors"
          >
            Kembali ke Master Data
          </button>
        </div>
      </div>
    );
  }

  // TARIK DATA API
  const { data: response, isLoading, refetch } = useProyekDetail(projectId);

  const proyek = (response as any)?.proyek || response || {};

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-slate-400 text-sm">Menarik detail proyek dari API...</p>
      </div>
    );
  }

  if (!proyek || Object.keys(proyek).length === 0) {
    return (
      <div className="w-full p-10 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl">
        <p className="text-slate-500">Data proyek tidak ditemukan atau API gagal mengambil data.</p>
        <button onClick={() => router.back()} className="mt-4 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm">Kembali</button>
      </div>
    );
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const confirmUpdate = window.confirm(`Yakin ingin mengubah status proyek menjadi ${newStatus}?`);
    
    if (!confirmUpdate) return;

    setIsUpdatingStatus(true);
    try {
      await updateProyek(projectId, { status: newStatus });
      alert("✅ Status proyek berhasil diperbarui!");
      window.location.reload(); // Refresh halaman biar data status & badge ikut berubah
    } catch (error: any) {
      const pesanBackend = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`❌ Gagal merubah status proyek:\n${pesanBackend}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Data Preparation 
  const activities = proyek.activities || proyek.aktivitas || [];
  const team = proyek.tim || proyek.teamMember || proyek.users || [];
  const risks = proyek.risks || proyek.risiko || []; 
  const deliverables = proyek.deliverables || proyek.dokumen || [];
  const clientName = proyek.client?.name || proyek.Client?.name || "-";
  const LogAktivitas = proyek.LogAktivitas || proyek.logAktivitas || [];
  const Approval = proyek.ReviewApproval || [];

  return (
    <div className="w-full space-y-6 pb-10">
      
      {/* HEADER SECTION TETAP DI SINI */}
      <div className="bg-white border border-slate-100 rounded-t-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        <div className="p-6 pb-0 flex items-start justify-between gap-4"> {/* Tambahin justify-between & gap-4 */}
          
          {/* KIRI: Info Proyek (Bungkus dalam div & kasih flex-1 biar gak kegeser aneh) */}
          <div className="flex gap-4 flex-1">
            <button onClick={() => router.back()} className="mt-1 p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-slate-400">PRJ-{proyek.kode || proyek.id?.substring(0,4)}</span>
                <span className="bg-purple-50 text-purple-600 text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase">
                  {proyek.status || 'Berjalan'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{proyek.nama || proyek.name || 'Nama Proyek'}</h1>
              <p className="text-sm text-slate-500 mt-1">{clientName}</p>
            </div>
          </div>

          {/* KANAN: Dropdown Status dengan Latar Putih Bersih */}
          {canChangeStatus && (
            <div className="shrink-0 min-w-[160px]"> {/* Biar lebarnya pas & gak gepeng */}
              <div className="relative">
                <select
                  value={proyek.status?.toUpperCase() || "PERENCANAAN"}
                  onChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                  className="appearance-none w-full bg-slate-800 border border-slate-700 text-slate-200 py-2 px-4 pr-10 rounded-xl text-sm font-semibold shadow-sm hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="INISIASI" className="bg-slate-800 text-slate-200">Inisiasi</option>
                  <option value="PERENCANAAN" className="bg-slate-800 text-slate-200">Planning</option>
                  <option value="PELAKSANAAN" className="bg-slate-800 text-slate-200">Pelaksanaan</option>
                  <option value="MONITORING" className="bg-slate-800 text-slate-200">Monitoring</option>
                  <option value="CLOSING" className="bg-slate-800 text-slate-200">Closing</option>
                </select>
                
                {/* Ikon panah kecil biar lebih cantik (Opsional) */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-8 mt-6 px-6 border-b border-slate-100 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
            { id: 'planning', label: 'Planning & Gantt', icon: <Calendar className="w-4 h-4" />, roleAllowed: ["ADMIN", "PM", "CLIENT"] },
            { id: 'monitoring', label: 'Monitoring', icon: <Clock className="w-4 h-4" /> },
            { id: 'approval', label: 'Approval', icon: <CheckCircle2 className="w-4 h-4" /> },
            { id: 'team', label: 'Tim Proyek', icon: <User className="w-4 h-4" />, roleAllowed: ["ADMIN", "PM"] },
            { id: 'closing', label: 'Closing', icon: <FileText className="w-4 h-4" />, roleAllowed: ["ADMIN", "PM", "CLIENT"] },
          ].filter(tab => {
             if (!tab.roleAllowed) return true;
             return tab.roleAllowed.includes(currentUserRole);
          }).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* COMPONENT TAB RENDERING */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'overview' && (
          <TabOverview 
            proyek={proyek} 
            activities={activities} 
            risks={risks} 
            deliverables={deliverables} 
          />
        )}
        {activeTab === 'planning' && (
          <TabPlanningGantt
            proyek={proyek} 
            activities={activities} 
            risks={risks} 
            onRefresh={refetch}
          />
        )}

       {activeTab === 'monitoring' && (
          <TabMonitoring 
            activities={activities} 
            onRefresh={refetch}
          />
        )}

        {activeTab === 'approval' && (
          <TabApproval 
            activities={activities} 
            currentUser={currentUser} 
          />
        )}

        {activeTab === 'team' && (
          <TabTeamProject 
            proyekId={projectId}
            team={team}
          />
        )}

        {activeTab === 'closing' && (
          <TabClosingProyek
            proyekId={projectId}
            proyekName={proyek.nama || proyek.name || 'Proyek'}
            initialActivities={activities}
          />
        )}
        {/* Render tab lainnya di sini... */} 
      </div>

    </div>
  );
};