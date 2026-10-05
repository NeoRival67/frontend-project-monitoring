"use client";

import React from "react";
import Link from "next/link";
import { FolderGit2, ChevronRight, Edit2, Trash2 } from "lucide-react";

interface ProjectCardProps {
  proyek: Record<string, any>; 
  onEdit?: (proyek: any) => void;
  onDelete?: (id: string, namaProyek: string) => void;
  canManage?: boolean;
}

const safeString = (value: unknown): string => typeof value === 'string' ? value : '';
const getStatusColor = (status: unknown): string => {
  const statusStr = safeString(status).toLowerCase();
  if (statusStr.includes('pelaksanaan') || statusStr.includes('ongoing') || statusStr.includes('berjalan')) 
    return "bg-purple-100 text-purple-700";
  if (statusStr.includes('planning') || statusStr.includes('perencanaan')) 
    return "bg-blue-100 text-blue-700";
  if (statusStr.includes('closing') || statusStr.includes('selesai') || statusStr.includes('penutupan')) 
    return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-600";
};
const getClientName = (proyek: Record<string, unknown>): string => {
  const klien = proyek.klien as Record<string, unknown> | undefined;
  if (klien && typeof klien.nama === 'string') return klien.nama;
  const client = proyek.client as Record<string, unknown> | undefined;
  if (client && typeof client.name === 'string') return client.name;
  if (typeof proyek.klienNama === 'string') return proyek.klienNama;
  if (typeof proyek.clientName === 'string') return proyek.clientName;
  return 'Tidak ada klien';
};
const getTeamMembers = (proyek: Record<string, unknown>): Array<{ name: string; avatar: string }> => {
  const members = proyek.tim || proyek.team || proyek.teamMembers;
  if (Array.isArray(members) && members.length > 0) {
    return members.map(m => {
      const u = m.user || m;
      return {
        name: typeof u.name === 'string' ? u.name : 'Team Member',
        avatar: typeof u.avatar === 'string' ? u.avatar : '',
      };
    });
  }
  return [];
};
const formatDate = (date: unknown): string => {
  try {
    if (!date) return '-';
    const dateStr = safeString(date);
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
};
const getInitials = (name: string): string => {
  try {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return trimmed.substring(0, 2).toUpperCase();
  } catch {
    return '?';
  }
};
const calculateDaysLeft = (endDate: unknown): { text: string; isLate: boolean } => {
  try {
    if (!endDate) return { text: 'Belum diset', isLate: false };
    const dateStr = safeString(endDate);
    if (!dateStr) return { text: 'Belum diset', isLate: false };
    const end = new Date(dateStr);
    if (isNaN(end.getTime())) return { text: 'Belum diset', isLate: false };
    const today = new Date();
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} hari terlambat`, isLate: true };
    return { text: `${diffDays} hari tersisa`, isLate: false };
  } catch {
    return { text: 'Belum diset', isLate: false };
  }
};


export const ProjectCard: React.FC<ProjectCardProps> = ({ proyek, onEdit, onDelete, canManage }) => {
  // Derived values
  const clientName = getClientName(proyek);
  const teamMembers = getTeamMembers(proyek);
  const status = safeString(proyek.status);
  const statusColor = getStatusColor(proyek.status);
  const displayName = safeString(proyek.nama || proyek.name || 'Project Name');
  const description = safeString(proyek.deskripsi || proyek.description || 'Pengembangan proyek sesuai dengan kesepakatan...');
  const displayCode = safeString(proyek.kode || proyek.code || (typeof proyek.id === 'string' ? proyek.id.substring(0, 4) : ''));
  
  let progress = Number(proyek.progress || proyek.progressPercentage || 0);
  const arrAktivitas = (proyek.activities || proyek.aktivitas) as any[];
  if (progress === 0 && Array.isArray(arrAktivitas) && arrAktivitas.length > 0) {
    const totalProg = arrAktivitas.reduce((sum, act) => sum + (Number(act.progress) || 0), 0);
    progress = Math.round(totalProg / arrAktivitas.length);
  }

  // --- 3. Budget ---
  const budget = Number(proyek.budget || proyek.budgetTotal || 0);
  
  const listAktivitas = (proyek.activities || proyek.aktivitas || []) as any[];

  const budgetTerpakai = listAktivitas.reduce((total, act) => {
    const bobot = Number(act.weight || 0) / 100;
    const budgetPerAktivitas = budget * bobot;
    const progresAktivitas = Number(act.progress || 0) / 100;
    
    return total + (budgetPerAktivitas * progresAktivitas);
  }, 0);

  const budgetPercentage = budget > 0 ? Math.round((budgetTerpakai / budget) * 100) : 0;
  
  const startDate = formatDate(proyek.tanggalMulai || proyek.startDate);
  const endDate = formatDate(proyek.tanggalSelesai || proyek.endDate);
  const daysLeft = calculateDaysLeft(proyek.tanggalSelesai || proyek.endDate);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();  
    e.stopPropagation(); 
    action();
  };

  return (
    <Link href={`/proyek/${proyek.id}`} className="block group">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700 relative">
        
        {canManage && (
          <div className="absolute right-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button 
                onClick={(e) => handleActionClick(e, () => onEdit(proyek))}
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                title="Edit Proyek"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => handleActionClick(e, () => onDelete(proyek.id as string, displayName))}
                className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                title="Hapus Proyek"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex gap-5 mt-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <FolderGit2 className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-semibold text-slate-400">
                PRJ-{displayCode}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase ${statusColor}`}>
                {status || 'BERJALAN'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 group-hover:underline decoration-2 underline-offset-2 pr-12">
              {displayName}
            </h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-1">
              {description}
            </p>

            {/* Grid 4 Kolom */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">🏢 Client</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{clientName}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">📅 Timeline</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {startDate} — {endDate}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">👥 Tim</p>
                <div className="flex -space-x-2 mt-1">
                  {teamMembers.slice(0, 3).map((t: any, i: number) => {
                    const namaAnggota = t.user?.name || t.name || t.nama || 'U';
                    return (
                      <div 
                        key={i} 
                        title={namaAnggota}
                        className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 text-[9px] font-bold text-white flex items-center justify-center uppercase"
                      >
                        {namaAnggota.charAt(0)}
                      </div>
                    );
                  })}
                  {teamMembers.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 text-[9px] font-bold text-slate-600 flex items-center justify-center">
                      +{teamMembers.length - 3}
                    </div>
                  )}
                  {teamMembers.length === 0 && <span className="text-xs text-slate-400">Belum ada</span>}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">⏳ Sisa Waktu</p>
                <p className={`text-sm font-semibold mt-1 ${daysLeft.isLate ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                  {daysLeft.text}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-4 w-full"></div>

            {/* Progress & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-slate-800 dark:text-slate-200">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-500">Budget Terpakai</span>
                  <span className="text-slate-800 dark:text-slate-200">{budgetPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${budgetPercentage}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-right">
                  Rp {(budgetTerpakai/1000000).toFixed(1)}Jt / Rp {(budget/1000000).toFixed(1)}Jt
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
};