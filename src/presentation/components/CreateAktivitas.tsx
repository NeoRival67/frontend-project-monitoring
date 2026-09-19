"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createAktivitas } from "@/infrastructure/repositories/proyek.repo";
import type { StatusAktivitas, Aktivitas } from "@/core/entities/Proyek";

interface CreateAktivitasProps {
  isOpen: boolean;
  onClose: () => void;
  proyekId: string;
  teamMembers: Array<{ id: string; name: string; role?: string }>;
  onSuccess: () => void; 
}

export const CreateAktivitas: React.FC<CreateAktivitasProps> = ({ isOpen, onClose, proyekId, teamMembers, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    dueDate: '',
    budget: 0,
    category: 'Development',
    progress: 0,
    status: 'Belum Mulai',
    weight: 10,  
    assignees: [] as string[]
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'budget' || name === 'progress' ? Number(value) : value }));
  };

  const handleCheckboxChange = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.assignees.includes(id);
      return {
        ...prev,
        assignees: isSelected ? prev.assignees.filter(a => a !== id) : [...prev.assignees, id]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      setIsLoading(true);

      const payload: Partial<Aktivitas> = {
        ...formData,
        status: formData.status as StatusAktivitas,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      };

      await createAktivitas(proyekId, payload);

      onSuccess(); // Refresh table
      onClose();   // close modal

    } catch (error: any) {
      console.error("Error creating aktivitas:", error);
      
      const errorMsg = error.response?.data?.message || "Terjadi kesalahan sistem";
      alert(`Gagal menambahkan aktivitas: ${errorMsg}`);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Tambah Aktivitas</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Form */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="create-aktivitas-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Aktivitas *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nama aktivitas" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deskripsi</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal Mulai *</label>
                <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deadline *</label>
                <input required type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Budget (Rp)</label>
                <input type="number" name="budget" value={formData.budget} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kategori</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white">
                  <option value="Analisis">Analisis</option>
                  <option value="Desain">Desain</option>
                  <option value="Development">Development</option>
                  <option value="Testing">Testing</option>
                  <option value="Deployment">Deployment</option>
                  <option value="Training">Training</option>
                  <option value="Dokumentasi">Dokumentasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Progress (%)</label>
                <input type="number" min="0" max="100" name="progress" value={formData.progress} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 bg-white">
                  <option value="Belum Mulai">Belum Mulai</option>
                  <option value="Berjalan">Berjalan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Terlambat">Terlambat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Assign Tim</label>
              
              {/* Cek apakah ada anggota tim */}
              {teamMembers && teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teamMembers.map(member => (
                    <label key={member.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={formData.assignees.includes(member.id)}
                        onChange={() => handleCheckboxChange(member.id)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <span className="font-semibold text-slate-700">{member.name}</span>
                        <span className="text-slate-400"> — {member.role || 'Anggota'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                /* Tampilan jika tim kosong */
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-sm text-slate-500 bg-slate-50/50">
                  Belum ada anggota tim yang ditugaskan di proyek ini.
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Batal
          </button>
          <button type="submit" form="create-aktivitas-form" disabled={isLoading} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
                
      </div>
      
    </div>
  );
};