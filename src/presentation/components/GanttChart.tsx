"use client";

import React, { useMemo } from 'react';
import type { Aktivitas } from '@/core/entities/Proyek';

interface GanttChartProps {
  activities: Aktivitas[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ activities }) => {
  const timeline = useMemo(() => {
    if (!activities || activities.length === 0) return { days: [], startDate: new Date() };

    const allDates: Date[] = [];
    activities.forEach((act) => {
      if (act.startDate) allDates.push(new Date(act.startDate));
      if (act.dueDate) allDates.push(new Date(act.dueDate));
      if (act.actualStartDate) allDates.push(new Date(act.actualStartDate));
      if (act.actualEndDate) allDates.push(new Date(act.actualEndDate));
    });

    if (allDates.length === 0) {
      allDates.push(new Date());
    }

    let minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    let maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Padding tanggal agar bar tidak terpotong di tepi
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 4);

    const days = [];
    const currentDate = new Date(minDate);

    while (currentDate <= maxDate) {
      days.push({
        date: new Date(currentDate),
        dayNum: currentDate.getDate(),
        monthStr: currentDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { days, startDate: minDate };
  }, [activities]);

  const { days, startDate } = timeline;

  // Menghitung posisi (offset) dan lebar bar berdasarkan tanggal
  const getBarStyles = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr || !endStr) return { left: '0%', width: '0%', display: 'none' };

    const start = new Date(startStr);
    const end = new Date(endStr);
  
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { left: '0%', width: '0%', display: 'none' };
    }

    const totalMsInDay = 1000 * 60 * 60 * 24;
    const offsetDays = (start.getTime() - startDate.getTime()) / totalMsInDay;
    // Minimal 1 hari agar bar tetap terlihat
    const rawDiff = (end.getTime() - start.getTime()) / totalMsInDay;
    const durationDays = Math.max(rawDiff + 1, 1);

    const leftPercent = Math.max(0, (offsetDays / days.length) * 100);
    const widthPercent = Math.min(100 - leftPercent, (durationDays / days.length) * 100);

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 1.5)}%`,
      display: 'flex'
    };
  };

  // Helper Warna Bar Aktual Sesuai Requirement:
  // - on-going: warna biru
  // - gagal (terlambat): warna merah
  // - sukses (selesai): warna hijau
  const getActualBarColor = (status: string, progress: number) => {
    const s = (status || '').toLowerCase();
    if (s === 'selesai' || s === 'done' || s === 'sukses' || progress === 100) {
      return 'bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white';
    }
    if (s === 'terlambat' || s === 'late' || s === 'gagal') {
      return 'bg-rose-500 hover:bg-rose-600 border border-rose-600 text-white';
    }
    // on-going / berjalan
    return 'bg-blue-500 hover:bg-blue-600 border border-blue-600 text-white';
  };

  const getStatusDotColor = (status: string, progress: number) => {
    const s = (status || '').toLowerCase();
    if (s === 'selesai' || s === 'done' || progress === 100) return 'bg-emerald-500';
    if (s === 'terlambat' || s === 'late' || s === 'gagal') return 'bg-rose-500';
    if (s === 'berjalan' || s === 'in progress' || s === 'ongoing') return 'bg-blue-500';
    return 'bg-slate-300';
  };

  const months = days.reduce((acc, curr) => {
    if (!acc.includes(curr.monthStr)) acc.push(curr.monthStr);
    return acc;
  }, [] as string[]);

  if (!activities || activities.length === 0) {
    return <div className="p-8 text-center text-slate-400">Belum ada data Gantt Chart.</div>;
  }

  return (
    <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white mt-4 shadow-sm">
      
      {/* KIRI: Panel List Aktivitas (Fixed Width) */}
      <div className="w-64 shrink-0 border-r border-slate-200 bg-white z-20 flex flex-col shadow-[2px_0_6px_-2px_rgba(0,0,0,0.05)]">
        {/* Header Kiri */}
        <div className="h-14 border-b border-slate-200 flex items-end p-3 pb-2 bg-slate-50/70">
          <span className="text-[11px] font-bold text-slate-500 tracking-wider">AKTIVITAS</span>
        </div>
        
        {/* Body Kiri */}
        <div className="flex-1 divide-y divide-slate-100">
          {activities.map((act, i) => {
            const currentProgress = act.progress ?? 0;
            const dotColor = getStatusDotColor(act.status, currentProgress);
            
            const assigneesText = act.assignees && act.assignees.length > 0 
              ? act.assignees.map((user: any) => (typeof user === 'string' ? user : user.name)).join(', ') 
              : (act.category || 'Belum ada tim');

            return (
              <div key={act.id || i} className="h-16 flex items-center justify-between px-3 group hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`}></div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1" title={act.name}>{act.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1" title={assigneesText}>{assigneesText}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 ml-2 shrink-0">{currentProgress}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KANAN: Grid Timeline & Bars */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="min-w-[850px] relative">
          
          {/* Header Kanan (Bulan & Tanggal) */}
          <div className="h-14 border-b border-slate-200 bg-slate-50/70 flex flex-col sticky top-0 z-10">
            <div className="flex text-[11px] font-bold text-slate-600 px-3 pt-1.5 border-b border-slate-200">
              {months.map(m => <div key={m} className="mr-10 mb-1">{m}</div>)}
            </div>
            <div className="flex flex-1 relative">
              {days.map((d, i) => (
                <div key={i} className="flex-1 flex justify-center items-center text-[10px] font-medium text-slate-400 border-r border-slate-100 last:border-0 relative">
                  {d.dayNum}
                </div>
              ))}
            </div>
          </div>

          {/* Body Kanan (Grid & Dual-Bars) */}
          <div className="relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((_, i) => (
                <div key={i} className="flex-1 border-r border-slate-100 last:border-0 h-full"></div>
              ))}
            </div>

            {/* Activity Bars (2 Bar per Baris: Rencana Abu-abu & Aktual Berwarna) */}
            {activities.map((act, i) => {
              // 1. Bar Rencana (Abu-abu)
              const plannedStyle = getBarStyles(act.startDate, act.dueDate);
              
              // 2. Bar Aktual (Biru/Hijau/Merah)
              const hasActual = Boolean(act.actualStartDate);
              const actualEndDateForPlot = act.actualEndDate || act.dueDate || act.startDate;
              const actualStyle = hasActual 
                ? getBarStyles(act.actualStartDate, actualEndDateForPlot) 
                : { left: '0%', width: '0%', display: 'none' };
              
              const currentProgress = act.progress ?? 0;
              const actualColor = getActualBarColor(act.status, currentProgress);

              // Label Durasi Aktual (seperti '8 hours' pada gambar referensi)
              const durasiLabel = act.durasiAktual 
                ? `${act.durasiAktual} hari` 
                : (currentProgress > 0 ? `${currentProgress}%` : '');

              return (
                <div key={act.id || i} className="h-16 border-b border-slate-100 flex items-center relative hover:bg-slate-50/40 transition-colors">
                  
                  {/* BAR 1: PERIODE RENCANA (Warna Abu-abu, background/outer bar) */}
                  <div 
                    className="absolute h-9 rounded-lg bg-slate-200/90 border border-slate-300 shadow-xs flex items-center px-2 z-10 transition-all duration-300 group/planned"
                    style={plannedStyle}
                    title={`Rencana: ${act.startDate ? new Date(act.startDate).toLocaleDateString('id-ID') : '-'} s/d ${act.dueDate ? new Date(act.dueDate).toLocaleDateString('id-ID') : '-'} (${act.durasiRencana || '-'} hari)`}
                  >
                    {/* Jika bar aktual belum ada, tampilkan label rencana kecil */}
                    {!hasActual && (
                      <span className="text-[10px] font-semibold text-slate-500 truncate">
                        {act.durasiRencana ? `${act.durasiRencana} hari` : 'Rencana'}
                      </span>
                    )}
                  </div>

                  {/* BAR 2: PERIODE AKTUAL (Warna Biru / Hijau / Merah dengan Label Durasi di dalam bar) */}
                  {hasActual && (
                    <div 
                      className={`absolute h-6 rounded-md shadow-sm flex items-center justify-center px-2 z-20 transition-all duration-300 ${actualColor} font-bold text-[10px]`}
                      style={actualStyle}
                      title={`Aktual: ${act.actualStartDate ? new Date(act.actualStartDate).toLocaleDateString('id-ID') : '-'} s/d ${act.actualEndDate ? new Date(act.actualEndDate).toLocaleDateString('id-ID') : 'Berjalan'} (${durasiLabel || act.status})`}
                    >
                      {/* Label durasi seperti di gambar referensi ("64 hours", "24 hours", dst) */}
                      <span className="truncate drop-shadow-xs">
                        {durasiLabel || `${currentProgress}%`}
                      </span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};