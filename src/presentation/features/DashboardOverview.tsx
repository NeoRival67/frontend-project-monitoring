"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DashboardChart } from './DashboardChart';
import { 
  FolderGit2, TrendingUp, AlertTriangle, CheckCircle2, 
  Clock, Zap, ArrowUpRight, ChevronLeft, ChevronRight, CalendarDays, Filter, X
} from 'lucide-react';
import { 
  useDashboardStats, useActiveProjects, 
  useDashboardCharts, usePredictions, useDashboardActivities, useVendorPerformance
} from '@/use-cases/hooks/useDashboard';
import { useSemuaProyek } from '@/use-cases/hooks/useProyek';

interface OverviewFilters {
  dateDoneFrom: string;
  dateDoneTo: string;
  durationFrom: string; // tanggal mulai durasi
  durationTo: string;   // tanggal selesai durasi
}

const EMPTY_FILTERS: OverviewFilters = {
  dateDoneFrom: '',
  dateDoneTo: '',
  durationFrom: '',
  durationTo: '',
};

function isDateInRange(dateStr: string | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to + 'T23:59:59')) return false;
  return true;
}

function hasActiveFilters(filters: OverviewFilters): boolean {
  return Object.values(filters).some(v => v !== '');
}

function countActiveFilters(filters: OverviewFilters): number {
  let count = 0;
  if (filters.dateDoneFrom || filters.dateDoneTo) count++;
  if (filters.durationFrom || filters.durationTo) count++;
  return count;
}

export const DashboardOverview = () => {
  const { data: statsAPI, isLoading: loadingStats } = useDashboardStats();
  const { data: activeProjectsAPI, isLoading: loadingProjects } = useActiveProjects();
  const { data: chartDataAPI, isLoading: loadingCharts } = useDashboardCharts();
  const { data: predictionsAPI, isLoading: loadingPredictions } = usePredictions();
  const { data: activitiesAPI, isLoading: loadingActivities } = useDashboardActivities();
  const { data: vendorData, isLoading: loadingVendor } = useVendorPerformance();
  const { data: allProjectsAPI } = useSemuaProyek();

  // Slider state
  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Overview filter state
  const [filters, setFilters] = useState<OverviewFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  let currentUser: any = null;
  if (typeof window !== "undefined") {
    try {
      const usr = localStorage.getItem("user");
      if (usr) currentUser = JSON.parse(usr);
    } catch(e) {}
  }

  const userRole = currentUser?.role?.toUpperCase() || "";
  const isVendorOrTim = userRole === "VENDOR" || userRole === "TIM" || userRole === "STAFF";

  if (isVendorOrTim) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-sm text-slate-500">
            Maaf, role {currentUser?.role || 'Anda'} tidak memiliki akses untuk melihat Dashboard Overview.
          </p>
        </div>
      </div>
    );
  }

  const isRestricted = userRole !== "ADMIN" && userRole !== "PM";
  const isClient = userRole === "CLIENT";

  const rawAllProjects = (allProjectsAPI as any)?.data || allProjectsAPI || [];
  const allProjects = Array.isArray(rawAllProjects) ? rawAllProjects : [];

  const safeProjects = allProjects.filter((p: any) => {
    if (!currentUser) return false;
    if (currentUser.role === "ADMIN" || currentUser.role === "PM") return true;
    
    if (isClient) {
      const pClientObj = p.client || p.klien;
      const pClientId = p.clientId || p.klienId || (pClientObj as any)?.id;
      
      if (pClientId && pClientId === currentUser.companyId) return true;
      
      if (pClientObj) {
        const clientEmail = (pClientObj as any).email?.toLowerCase();
        const userEmail = currentUser.email?.toLowerCase();
        if (clientEmail && userEmail && clientEmail === userEmail) return true;
        
        const clientPic = ((pClientObj as any).pic || (pClientObj as any).kontak || (pClientObj as any).namaPIC || (pClientObj as any).contactPerson)?.toLowerCase();
        const userName = currentUser.name?.toLowerCase();
        if (clientPic && userName && clientPic === userName) return true;
      }
      return false;
    }

    if (currentUser.role?.toUpperCase() === "VENDOR") {
      const vendorList = Array.isArray(p.vendors) ? p.vendors : [];
      if (vendorList.some((v: any) => 
        v.id === currentUser.companyId || 
        v.email === currentUser.email || 
        v.kontak === currentUser.name || 
        v.pic === currentUser.name
      )) return true;
      return false;
    }

    const teamMembers = Array.isArray(p.teams) ? p.teams : 
                        Array.isArray(p.tim) ? p.tim : 
                        Array.isArray(p.team) ? p.team : 
                        Array.isArray(p.teamMembers) ? p.teamMembers : [];
    
    return teamMembers.some((member: any) => 
      (member.userId === currentUser.id) || 
      (member.user?.id === currentUser.id) ||
      (member.id === currentUser.id)
    );
  });

  const allowedProjectIds = safeProjects.map((p: any) => p.id);
  const allowedProjectNames = safeProjects.map((p: any) => (p.nama || p.name || '').toLowerCase());
  const allowedVendors = new Set<string>();
  safeProjects.forEach((p: any) => {
    const vList = p.vendors || p.vendor || [];
    if (Array.isArray(vList)) {
      vList.forEach((v: any) => {
        if (v.nama) allowedVendors.add(v.nama.toLowerCase());
        if (v.name) allowedVendors.add(v.name.toLowerCase());
      });
    }
  });

  const stats = statsAPI?.overview || {};
  const keuangan = statsAPI?.keuangan || {};

  const rawActiveProjects = Array.isArray(activeProjectsAPI) ? activeProjectsAPI : [];
  const activeProjects = isRestricted 
    ? rawActiveProjects.filter((p: any) => allowedProjectIds.includes(p.id) || allowedProjectNames.includes((p.nama || p.name || '').toLowerCase()))
    : rawActiveProjects;

  const rawChartBudget = chartDataAPI?.komparasiKeuangan || [];
  const chartDataBudget = isRestricted
    ? rawChartBudget.filter((d: any) => allowedProjectNames.includes((d.label || '').toLowerCase()) || allowedProjectIds.includes(d.label))
    : rawChartBudget;

  const rawChartTarget = chartDataAPI?.targetVsAktual || [];
  const chartDataTarget = isRestricted
    ? rawChartTarget.filter((d: any) => allowedProjectNames.includes((d.label || '').toLowerCase()) || allowedProjectIds.includes(d.label))
    : rawChartTarget;

  const rawEvm = Array.isArray(predictionsAPI) ? predictionsAPI : [];
  const evmPredictions = isRestricted
    ? rawEvm.filter((p: any) => allowedProjectIds.includes(p.proyekId) || allowedProjectNames.includes((p.proyek || '').toLowerCase()))
    : rawEvm;
  
  const rawActivitiesFromEndpoint = Array.isArray(activitiesAPI) ? activitiesAPI : [];
  const rawActivitiesFromStats = statsAPI?.aktivitasTerkini || [];
  const rawActivities = rawActivitiesFromEndpoint.length > 0 ? rawActivitiesFromEndpoint : rawActivitiesFromStats; 
  const recentActivities = isRestricted
    ? rawActivities.filter((a: any) => allowedProjectIds.includes(a.proyekId) || allowedProjectNames.includes((a.namaProyek || '').toLowerCase()))
    : rawActivities;

  const rawRiskDist = statsAPI?.distribusiRisiko || [];
  const riskDistribution = isRestricted 
    ? rawRiskDist.filter((r: any) => r.proyekId ? allowedProjectIds.includes(r.proyekId) : false) 
    : rawRiskDist;

  const rawVendorPerf = Array.isArray(vendorData) ? vendorData : (vendorData?.vendorPerformance || vendorData?.data || []);
  const vendorPerformance = isRestricted
    ? rawVendorPerf.filter((v: any) => allowedVendors.has((v.vendorName || '').toLowerCase()))
    : rawVendorPerf;

  // Manual calculation for stats
  const displayTotalProyek = isRestricted ? safeProjects.length : (stats.proyek || 0);
  const displayTotalBudget = isRestricted ? safeProjects.reduce((acc: number, p: any) => acc + (Number(p.budget) || 0), 0) : (keuangan.totalBudget || 0);
  const displayTotalDokumen = isRestricted ? safeProjects.reduce((acc: number, p: any) => acc + ((p.deliverables || p.dokumen || []).length || 0), 0) : (stats.dokumen || 0);

  // Kalkulasi total risiko untuk Donut Chart
  const totalRisks = riskDistribution.reduce((sum: number, r: any) => sum + (r.count || 0), 0);
  const displayTotalRisks = isRestricted ? totalRisks : ((stats.risiko ?? 0) || totalRisks);
  
  let currentSvgAngle = 0; // Untuk rotasi dinamis Donut Chart

  // Overview filter logic
  const filteredActiveProjects = useMemo(() => {
    if (!hasActiveFilters(filters)) return activeProjects;
    return activeProjects.filter((p: any) => {
      // Filter by Date Done (tanggal selesai)
      const doneDate = p.tanggalSelesai || p.endDate;
      if (!isDateInRange(doneDate, filters.dateDoneFrom, filters.dateDoneTo)) return false;

      // Filter by Project Duration (range tanggal mulai s/d selesai)
      const startDate = p.tanggalMulai || p.startDate;
      if (!isDateInRange(startDate, filters.durationFrom, filters.durationTo)) return false;

      return true;
    });
  }, [activeProjects, filters]);

  // Slider logic - slide one card at a time
  const CARDS_PER_VIEW = 3;
  const maxSlideIndex = Math.max(0, filteredActiveProjects.length - CARDS_PER_VIEW);
  const canSlideLeft = sliderIndex > 0;
  const canSlideRight = sliderIndex < maxSlideIndex;

  // Reset slider when filter changes
  useEffect(() => { setSliderIndex(0); }, [filters]);

  const slideLeft = () => {
    if (canSlideLeft) setSliderIndex(prev => Math.max(0, prev - 1));
  };
  const slideRight = () => {
    if (canSlideRight) setSliderIndex(prev => Math.min(maxSlideIndex, prev + 1));
  };

  const updateFilter = (key: keyof OverviewFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  return (
    <div className="w-full space-y-6 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pemantauan proyek real-time
          </p>
        </div>
        {/* Overview Filters Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 shadow-sm ${
              hasActiveFilters(filters)
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {countActiveFilters(filters) > 0 && (
              <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {countActiveFilters(filters)}
              </span>
            )}
          </button>
          {hasActiveFilters(filters) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Overview Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            Overview Filters
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date Done Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Date Done
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.dateDoneFrom}
                  onChange={e => updateFilter('dateDoneFrom', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                  placeholder="Dari"
                />
                <span className="text-xs text-slate-400 font-medium">s/d</span>
                <input
                  type="date"
                  value={filters.dateDoneTo}
                  onChange={e => updateFilter('dateDoneTo', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                  placeholder="Sampai"
                />
              </div>
            </div>

            {/* Project Duration Filter (Date Range) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Project Duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.durationFrom}
                  onChange={e => updateFilter('durationFrom', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                  placeholder="Dari"
                />
                <span className="text-xs text-slate-400 font-medium">s/d</span>
                <input
                  type="date"
                  value={filters.durationTo}
                  onChange={e => updateFilter('durationTo', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                  placeholder="Sampai"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATS CARDS (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><FolderGit2 className="w-5 h-5"/></div>
          <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-slate-300" />
          <h2 className="text-3xl font-bold text-slate-800">{loadingStats ? "..." : displayTotalProyek}</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Total Proyek</p>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><TrendingUp className="w-5 h-5"/></div>
          <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-slate-300" />
          <h2 className="text-3xl font-bold text-slate-800">
            {loadingStats ? "..." : `Rp ${(displayTotalBudget / 1000000 || 0).toFixed(1)}M`}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Total Budget</p>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-4"><AlertTriangle className="w-5 h-5"/></div>
          <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-slate-300" />
        <h2 className="text-3xl font-bold text-slate-800">{loadingStats || loadingActivities ? "..." : displayTotalRisks}</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Total Risiko</p>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-4"><CheckCircle2 className="w-5 h-5"/></div>
          <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-slate-300" />
          <h2 className="text-3xl font-bold text-slate-800">{loadingStats ? "..." : displayTotalDokumen}</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Total Deliverable</p>
        </div>
      </div>

      {/* ACTIVE PROJECTS (Second Row) - SLIDER */}
      <div className="relative">
        {/* Slider Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-slate-600">Proyek Aktif ({filteredActiveProjects.length})</h3>
          {filteredActiveProjects.length > CARDS_PER_VIEW && (
            <div className="flex items-center gap-2">
              <button
                onClick={slideLeft}
                disabled={!canSlideLeft}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                  canSlideLeft
                    ? 'border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 cursor-pointer'
                    : 'border-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-400 min-w-[40px] text-center">
                {sliderIndex + 1} / {maxSlideIndex + 1}
              </span>
              <button
                onClick={slideRight}
                disabled={!canSlideRight}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                  canSlideRight
                    ? 'border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 cursor-pointer'
                    : 'border-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Slider Content */}
        <div className="overflow-hidden" ref={sliderRef}>
          {loadingProjects ? (
            <div className="text-center text-slate-400 py-4 border border-dashed rounded-xl">Memuat data proyek dari API...</div>
          ) : filteredActiveProjects.length > 0 ? (
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${sliderIndex * (100 / CARDS_PER_VIEW)}%)` }}
            >
              {filteredActiveProjects.map((proyek: any) => (
                <div
                  key={proyek.id}
                  className="w-full md:w-1/3 flex-shrink-0 px-2 first:pl-0 last:pr-0"
                >
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] h-full">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-slate-400">PRJ-{proyek.id.substring(0,4)}</span>
                      <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-full font-semibold tracking-wide uppercase">
                        {proyek.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{proyek.nama}</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-5">
                      {proyek.tanggalSelesai ? new Date(proyek.tanggalSelesai).toLocaleDateString() : 'Belum set timeline'}
                    </p>
                    
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
                      <span>Progress</span><span>{proyek.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-700" style={{ width: `${proyek.progress}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-3">
                      <span className="text-[11px] font-medium text-slate-400">Budget: Rp {(proyek.budget / 1000000 || 0).toFixed(1)}M</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-4 border border-dashed rounded-xl">Belum ada proyek aktif dalam periode ini.</div>
          )}
        </div>
      </div>

      {/* CHARTS AREA - FULL API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] min-h-[350px]">
          {loadingCharts ? (
             <div className="animate-pulse w-full h-48 bg-slate-100 rounded mt-10"></div>
          ) : chartDataBudget.length > 0 ? (
            <DashboardChart 
              title="Budget vs Realisasi"
              data={chartDataBudget.map((d:any) => ({ ...d, fullLabel: `Proyek ${d.label}` }))}
              label1="Budget" label2="Realisasi"
              color1="#3b82f6" color2="#10b981" 
              valuePrefix="Rp "
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">Tidak ada data visualisasi keuangan</div>
          )}
        </div>
        
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] min-h-[350px]">
          {loadingCharts ? (
             <div className="animate-pulse w-full h-48 bg-slate-100 rounded mt-10"></div>
          ) : chartDataTarget.length > 0 ? (
            <DashboardChart 
              title="Target vs Aktual Progress (%)"
              data={chartDataTarget.map((d:any) => ({ ...d, fullLabel: `Proyek ${d.label}` }))}
              label1="Target" label2="Aktual"
              color1="#8b5cf6" color2="#06b6d4" 
              valueSuffix="%"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">Tidak ada data progress proyek</div>
          )}
        </div>
      </div>

      {/* PREDICTIVE ANALYTICS SECTION - FULL API */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Forecast Keterlambatan (Dari EVM / SPI Backend) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-500" /></div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Forecast Kinerja</h3>
              <p className="text-[11px] text-slate-400 font-medium">Berdasarkan CPI/SPI</p>
            </div>
          </div>
          <div className="space-y-3">
            {loadingPredictions ? (
              <div className="text-sm text-slate-400">Memuat analisis EVM...</div>
            ) : evmPredictions.length > 0 ? (
              evmPredictions.map((pred: any) => (
                <div key={`forecast-${pred.proyekId}`} className="border p-3 rounded-xl bg-slate-50 border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-700 line-clamp-1">{pred.proyek}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Target EV: Rp {(pred.metrics.EV / 1000000 || 0).toFixed(1)}M</span>
                    <span>Aktual Progress: {pred.progress}%</span>
                  </div>
                </div>
              ))
            ) : (
               <div className="text-sm text-slate-400">Data EVM belum tersedia</div>
            )}
          </div>
        </div>

        {/* Prediksi Overbudget (Dari EAC Backend) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-rose-500" /></div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Prediksi Overbudget</h3>
              <p className="text-[11px] text-slate-400 font-medium">Estimate At Completion (EAC)</p>
            </div>
          </div>
          <div className="space-y-3">
            {loadingPredictions ? (
              <div className="text-sm text-slate-400">Mengkalkulasi anggaran...</div>
            ) : evmPredictions.length > 0 ? (
              evmPredictions.map((pred: any) => {
                const isOver = pred.status === 'POTENSI OVERBUDGET';
                return (
                  <div key={`budget-${pred.proyekId}`} className={`${isOver ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'} border p-3 rounded-xl flex flex-col justify-center`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-700 truncate pr-2">{pred.proyek}</span>
                      <span className={`text-[11px] font-bold flex items-center gap-1 shrink-0 ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isOver ? <AlertTriangle className="w-3 h-3"/> : <CheckCircle2 className="w-3 h-3"/>} 
                        {isOver ? 'Overbudget' : 'Aman'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>BAC: Rp {(pred.metrics.BAC / 1000000 || 0).toFixed(1)}M</p>
                      <p>Prediksi (EAC): <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>Rp {(pred.metrics.EAC / 1000000 || 0).toFixed(1)}M</span></p>
                    </div>
                  </div>
                );
              })
            ) : (
               <div className="text-sm text-slate-400">Data anggaran belum tersedia</div>
            )}
          </div>
        </div>

        {/* Analisis Performa Vendor - Dari Risk Distribution */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center"><Zap className="w-4 h-4 text-purple-500" /></div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Analisis Vendor</h3>
              <p className="text-[11px] text-slate-400 font-medium">Ringkasan Risiko per Level</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {loadingVendor ? (
                <p className="text-xs text-slate-400 text-center py-10">Menghitung performa...</p>
            ) : vendorPerformance?.length > 0 ? (
              vendorPerformance.map((vendor: any, idx: number) => (
                <div key={idx} className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">{vendor.vendorName}</h4>
                            <p className="text-[10px] text-slate-400">{vendor.projectCount} proyek aktif</p>
                        </div>
                        <span className="text-lg font-bold text-emerald-500">{vendor.overallScore}</span>
                    </div>
                    <div className="space-y-2">
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${vendor.metrics.progress}%` }}></div>
                        </div>
                    </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs text-center py-10 border border-dashed rounded-xl">
                Belum ada data performa vendor.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RISIKO & AKTIVITAS BAWAH - FULL API */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribusi Risiko - Dynamic Donut Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="font-semibold text-slate-800 text-sm mb-8">Distribusi Risiko</h3>
          
          {loadingActivities ? (
             <div className="text-center text-slate-400 text-sm py-10">Memuat matriks risiko...</div>
          ) : totalRisks === 0 ? (
             <div className="text-center text-slate-400 text-sm py-10">Belum ada risiko teridentifikasi di sistem.</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                  {riskDistribution.map((risk: any, index: number) => {
                    const pct = risk.count / totalRisks;
                    const dashOffset = 251.2 * (1 - pct);
                    const rotation = currentSvgAngle;
                    currentSvgAngle += (pct * 360); // Accumulate rotation for next slice
                    
                    // Assign warna berdasar level
                    let color = '#3b82f6'; // Default Low/Dimitigasi
                    if(risk.level === 'Critical' || risk.level === 'Kritis') color = '#ef4444';
                    if(risk.level === 'High' || risk.level === 'Tinggi') color = '#f97316';
                    if(risk.level === 'Medium' || risk.level === 'Sedang') color = '#eab308';

                    return (
                      <circle 
                        key={index}
                        cx="50" cy="50" r="40" 
                        fill="transparent" stroke={color} 
                        strokeWidth="16" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={dashOffset} 
                        className="origin-center transition-all duration-1000 ease-out"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      />
                    );
                  })}
                </svg>
              </div>

              <div className="space-y-3 w-full sm:w-auto">
                {riskDistribution.map((risk: any, index: number) => {
                    let colorClass = 'bg-blue-500'; 
                    if(risk.level === 'Critical' || risk.level === 'Kritis') colorClass = 'bg-rose-500';
                    if(risk.level === 'High' || risk.level === 'Tinggi') colorClass = 'bg-orange-500';
                    if(risk.level === 'Medium' || risk.level === 'Sedang') colorClass = 'bg-yellow-500';

                    return (
                      <div key={index} className="flex justify-between items-center text-xs w-full gap-8">
                        <span className="flex items-center gap-2 text-slate-600">
                          <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></div> {risk.level}
                        </span>
                        <span className="font-semibold text-slate-800">{risk.count}</span>
                      </div>
                    );
                })}
                <div className="pt-3 mt-2 border-t border-slate-100 text-[10px] text-slate-400">Total: {totalRisks} risiko</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Aktivitas Terkini - DARI API */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <h3 className="font-semibold text-slate-800 text-sm mb-6">Aktivitas Terkini</h3>
          <div className="space-y-6">
            {recentActivities.length > 0 ? (
              recentActivities.map((act: any) => (
                <div key={act.id} className="flex justify-between items-center group">
                  <div className="flex gap-4 items-start">
                    {/* Dot Hijau (Indikator Status) */}
                    <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                    
                    <div>
                      {/* Nama Aktivitas (Contoh: Analisis & Desain Sistem) */}
                      <h4 className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {act.namaAktivitas}
                      </h4>
                      
                      {/* Nama Proyek & Progress (Contoh: Proyek Pertamina • Progress 100%) */}
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        <span className="uppercase">{act.namaProyek}</span> • Progress {act.progress}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar Mini di Sisi Kanan (Sesuai gambar image_2bc17e.png) */}
                  <div className="flex flex-col items-end">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${act.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400 py-10 italic text-center border border-dashed rounded-xl">
                Belum ada aktivitas terekam.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};