"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateAktivitas } from '@/infrastructure/repositories/proyek.repo';

interface UpdateAktivitasProps {
  isOpen: boolean;
  onClose: () => void;
  proyekId: string;
  initialData: any; 
  teamMembers: Array<{ id: string; name: string; role?: string }>;
  onSuccess: () => void;
}

export const UpdateAktivitas: React.FC<UpdateAktivitasProps> = ({ isOpen, onClose, proyekId, initialData, teamMembers, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', startDate: '', dueDate: '',
    actualStartDate: '', actualEndDate: '',
    budget: 0, category: 'Development', progress: 0, status: 'Belum Mulai',
    weight: 10, assignees: [] as string[]
  });

  // Pre-fill form ketika modal dibuka dan ada initialData
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        // Potong ISO string untuk input type="date" (YYYY-MM-DD)
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : '',
        actualStartDate: initialData.actualStartDate ? initialData.actualStartDate.split('T')[0] : '',
        actualEndDate: initialData.actualEndDate ? initialData.actualEndDate.split('T')[0] : '',
        budget: initialData.budget || 0,
        category: initialData.category || 'Development',
        progress: initialData.progress || 0,
        status: initialData.status || 'Belum Mulai',
        weight: initialData.weight || 10,
        assignees: initialData.assignees?.map((a: any) => a.id || a) || []
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'budget' || name === 'progress' ? Number(value) : value }));
  };

  const handleCheckboxChange = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.assignees.includes(id);
      return { ...prev, assignees: isSelected ? prev.assignees.filter(a => a !== id) : [...prev.assignees, id] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

        try {
            setIsLoading(true);
        
            // Siapkan payload dengan format tanggal ISO
            const payload = {
                ...formData,
                status: formData.status,
                category: formData.category,
                budget: Number(formData.budget),
                progress: Number(formData.progress),
                weight: formData.weight ? Number(formData.weight) : 0,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
                actualStartDate: formData.actualStartDate ? new Date(formData.actualStartDate).toISOString() : null,
                actualEndDate: formData.actualEndDate ? new Date(formData.actualEndDate).toISOString() : null,
            };
            
            const targetId = initialData.id;
            // Panggil fungsi dari repo (nggak perlu nulis endpoint URL lagi!)
            console.log("ID Aktivitas yang mau diupdate:", targetId); 
            console.log("Payload yang dikirim:", payload);

            await updateAktivitas(targetId, payload);
        
            // Kalau sukses ngelewatin baris atas tanpa masuk catch:
            onSuccess(); // Refresh tabel
            onClose();   // Tutup modal
        
            } catch (error: any) {
            console.error("Error Update aktivitas:", error);
            
            // Bisa nampilin error message dari backend NestJS kalau ada
            const errorMsg = error.response?.data?.message || "Terjadi kesalahan sistem";
            alert(`Gagal mengupdate aktivitas: ${errorMsg}`);
            
            } finally {
            setIsLoading(false);
            }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Edit Aktivitas</h2>
          <button onClick={onClose} className="p-2 text-slate-800 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Form (Sama persis strukturnya dengan Create) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="edit-aktivitas-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Input Nama, Deskripsi, Tanggal, dll persis seperti CreateAktivitas.tsx */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Aktivitas *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deskripsi</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
            
            {/* Bagian Periode Rencana */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-3">
              <span className="text-xs font-bold text-slate-700 tracking-wide block uppercase">1. Periode Rencana</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal Mulai Rencana *</label>
                  <input required type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Deadline / Selesai Rencana *</label>
                  <input required type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            {/* Bagian Periode Aktual */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-3">
              <span className="text-xs font-bold text-slate-700 tracking-wide block uppercase">2. Periode Aktual</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal Mulai Aktual</label>
                  <input type="date" name="actualStartDate" value={formData.actualStartDate} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal Selesai Aktual</label>
                  <input type="date" name="actualEndDate" value={formData.actualEndDate} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Budget (Rp)</label>
                <input type="number" name="budget" value={formData.budget} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kategori</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white">
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
                <input type="number" min="0" max="100" name="progress" value={formData.progress} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border text-slate-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 bg-white">
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
                    <label key={member.id} className="flex items-center gap-3 p-3 border text-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={formData.assignees.includes(member.id)}
                        onChange={() => handleCheckboxChange(member.id)}
                        className="w-4 h-4 text-blue-600 rounded text-slate-800 focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <span className="font-semibold text-slate-700">{member.name}</span>
                        <span className="text-slate-800"> — {member.role || 'Anggota'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                /* Tampilan jika tim kosong */
                <div className="p-4 border border-dashed text-slate-800 rounded-xl text-center text-sm text-slate-500 bg-slate-50/50">
                  Belum ada anggota tim yang ditugaskan di proyek ini.
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">
            Batal
          </button>
          <button type="submit" form="edit-aktivitas-form" disabled={isLoading} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>

      </div>
    </div>
  );
};