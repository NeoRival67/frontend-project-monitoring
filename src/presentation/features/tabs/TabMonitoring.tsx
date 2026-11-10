"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, DollarSign, TrendingUp, FileText, Flag, Loader2 } from 'lucide-react';
import { CreateLogAktivitas } from '@/presentation/components/CreateLogAktivitas'; 
import apiClient from "@/infrastructure/api/apiClient";
import type { Aktivitas } from '@/core/entities/Proyek'; 
import { getLogByProyek } from '@/infrastructure/repositories/proyek.repo'; 
import { useQueryClient } from '@tanstack/react-query';

interface TabMonitoringProps {
  activities: Aktivitas[]; 
  onRefresh?: () => void;
}

export const TabMonitoring: React.FC<TabMonitoringProps> = ({ activities, onRefresh }) => {
  const params = useParams();
  const proyekId = params?.id as string;
  const queryClient = useQueryClient();

  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filters = ['Semua', 'Update Progress', 'Realisasi Biaya', 'Catatan'];

  const fetchLogs = async () => {
    if (!proyekId) return;
    setIsLoading(true);
    try {
      const dataLogs = await getLogByProyek(proyekId);
      setLogs(dataLogs);
    } catch (error) {
      console.log("gagal mengambil data log: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["proyek"] });
    fetchLogs();
    if (onRefresh) onRefresh();
  };
    
  useEffect(() => {
    fetchLogs();
  }, [proyekId]);

  const getTipeLogUI = (log: any) => {
    if (log.costIncurred && Number(log.costIncurred) > 0) return 'Realisasi Biaya';
    if (log.progressAdded && Number(log.progressAdded) > 0) return 'Update Progress';
    return 'Catatan';
  };

  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'Semua') return true;
    return getTipeLogUI(log) === activeFilter;
  });

  const getLogStyle = (type: string) => {
    switch(type) {
      case 'Realisasi Biaya': return { icon: <DollarSign className="w-5 h-5"/>, bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' };
      case 'Update Progress': return { icon: <TrendingUp className="w-5 h-5"/>, bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' };
      default: return { icon: <FileText className="w-5 h-5"/>, bg: 'bg-amber-100', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' };
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full border transition-all ${
                activeFilter === filter 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Log
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const tipeLog = getTipeLogUI(log);
            const style = getLogStyle(tipeLog);
            
            // Format format tanggal DB
            const formattedDate = log.logDate ? new Date(log.logDate).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            }) : '-';
            
            return (
              <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                  {style.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${style.badge}`}>
                        {tipeLog}
                      </span>
                      {/* Tampilkan nama aktivitas jika di-include dari backend, jika tidak, tampilkan ID */}
                      <h3 className="text-sm font-semibold text-slate-800">
                        {log.aktivitas?.name || 'Aktivitas'}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium shrink-0">{formattedDate}</span>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 leading-relaxed whitespace-pre-wrap">
                    {log.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="text-slate-400">oleh: <span className="text-slate-600">{log.user?.name || '-'}</span></span>
                    
                    {log.progressAdded > 0 && (
                      <span className={`flex items-center gap-1 ${style.text}`}>
                        <TrendingUp className="w-3.5 h-3.5" /> +{log.progressAdded}% Progress
                      </span>
                    )}

                    {log.costIncurred > 0 && (
                      <span className={`flex items-center gap-1 ${style.text}`}>
                        <DollarSign className="w-3.5 h-3.5" /> Rp {Number(log.costIncurred).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-xl">
            Belum ada log aktivitas.
          </div>
        )}
      </div>

      <CreateLogAktivitas 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        activities={activities} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
};