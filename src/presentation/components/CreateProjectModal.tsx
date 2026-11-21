"use client";

import React, { useState } from "react";
import { X } from "lucide-react"; // Pake icon dari lucide-react biar cakep
import { useSemuaClient } from "@/use-cases/hooks/useClient";
import { useCreateProyek } from "@/use-cases/hooks/useProyek";
import { useSemuaUser } from "@/use-cases/hooks/useUser"; 
import type { CreateProyekPayload } from "@/core/entities";

interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { data: clientsAndVendors, isLoading: isClientsLoading } = useSemuaClient();
  
  const { data: usersData, isLoading: isUsersLoading } = useSemuaUser(); 
  const createProyek = useCreateProyek();

  const clientsData = clientsAndVendors || [];
  const clients = clientsData.filter((c: any) => c.type === "client" || c.tipe === "CLIENT" || c.tipe === "Client") || [];
  const vendors = clientsData.filter((c: any) => c.type === "vendor" || c.tipe === "VENDOR" || c.tipe === "Vendor") || [];
  
  const allUsers = usersData || [];
  const teamMembers = allUsers.filter((u: any) => {
    const role = (u.role || u.jabatan || '').toUpperCase();
    return role !== 'CLIENT' && role !== 'VENDOR' && role !== 'ADMIN';
  });

  const [formData, setFormData] = useState<CreateProyekPayload>({
    nameProyek: "",
    description: "",
    objectives: "",
    idClient: "",
    startDate: "",
    endDate: "",
    budget: 0,
    status: "inisiasi",
    vendorIds: [],
    teamMemberIds: [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "budget" ? Number(value) : value,
    }));
  };

  const toggleVendor = (id: string) => {
    setFormData(prev => ({
      ...prev,
      vendorIds: prev.vendorIds.includes(id) 
        ? prev.vendorIds.filter(v => v !== id)
        : [...prev.vendorIds, id]
    }));
  };

  const toggleTeamMember = (id: string) => {
    setFormData(prev => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(id)
        ? prev.teamMemberIds.filter(t => t !== id)
        : [...prev.teamMemberIds, id]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProyek.mutate(formData, {
      onSuccess: () => {
        onClose();
      },
      onError: (err: any) => {
        alert(err?.response?.data?.message || "Gagal membuat proyek");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0 bg-slate-900">
          <h2 className="text-xl font-bold text-white">Buat Proyek Baru</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* INFORMASI DASAR */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Informasi Dasar</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Nama Proyek <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="nameProyek"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Nama proyek yang jelas dan deskriptif"
                value={formData.nameProyek}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Deskripsi</label>
              <textarea
                name="description"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Deskripsi singkat proyek..."
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Tujuan / Objectives</label>
              <textarea
                name="objectives"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Tujuan dan target yang ingin dicapai dari proyek ini..."
                rows={2}
                value={formData.objectives}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full"></div>

          {/* CLIENT & TIMELINE */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client & Timeline</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Client <span className="text-rose-500">*</span>
              </label>
              <select
                name="idClient"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                value={formData.idClient}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Pilih Client</option>
                {isClientsLoading ? (
                  <option disabled>Memuat client...</option>
                ) : (
                  clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name || c.nama}</option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Tanggal Mulai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all style-color-scheme-dark"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Tanggal Selesai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all style-color-scheme-dark"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Total Budget (Rp)</label>
                <input
                  type="number"
                  name="budget"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  min="0"
                  placeholder="Contoh: 500000000"
                  value={formData.budget || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Status Awal</label>
                <select
                  name="status"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="inisiasi">Inisiasi</option>
                  <option value="perencanaan">Planning</option>
                  <option value="pelaksanaan">Pelaksanaan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full"></div>

          {/* VENDOR */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vendor (Opsional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vendors.length > 0 ? (
                vendors.map((v: any) => (
                  <div 
                    key={v.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.vendorIds.includes(v.id) ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                    onClick={() => toggleVendor(v.id)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${formData.vendorIds.includes(v.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-500'}`}>
                      {formData.vendorIds.includes(v.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200 line-clamp-1">{v.name || v.nama}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{v.contactPerson || v.industri || "-"}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-sm text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-800 text-center">
                  Tidak ada data vendor dari API.
                </div>
              )}
            </div>
          </div>

          {/* ASSIGN TIM */}
          <div className="space-y-4 pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Assign Tim</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isUsersLoading ? (
                <div className="col-span-2 text-sm text-slate-500">Memuat anggota tim...</div>
              ) : teamMembers.length > 0 ? (
                teamMembers.map((t: any) => (
                  <div 
                    key={t.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.teamMemberIds.includes(t.id) ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                    onClick={() => toggleTeamMember(t.id)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${formData.teamMemberIds.includes(t.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-500'}`}>
                      {formData.teamMemberIds.includes(t.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200 line-clamp-1">{t.name || t.nama}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{t.role || t.jabatan}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-sm text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-800 text-center">
                  Belum ada data anggota tim.
                </div>
              )}
            </div>
          </div>

        </form>

        {/* MODAL FOOTER */}
        <div className="p-6 border-t border-slate-800 shrink-0 bg-slate-900 flex justify-end gap-3">
          <button 
            type="button" 
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors" 
            onClick={onClose}
          >
            Batal
          </button>
          <button 
            type="submit" 
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2" 
            disabled={createProyek.isPending}
            onClick={handleSubmit}
          >
            {createProyek.isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {createProyek.isPending ? "Menyimpan..." : "Buat Proyek"}
          </button>
        </div>

      </div>
    </div>
  );
}