"use client";
 
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ApprovalRepository } from '@/infrastructure/repositories/approval.repo';
import { SubmitDeliverable } from '@/presentation/components/SubmitDeliverable';
import { ReviewApproval } from '@/presentation/components/ReviewApproval';
import type { Aktivitas, Deliverable } from '@/core/entities/Proyek';
import type { User } from '@/core/entities/User';
import { User as UserIcon, X, CheckCircle, Plus, Loader2, FileText, Download } from 'lucide-react';

interface TabApprovalProps {
  activities: Aktivitas[];
  currentUser: User; 
}

export const TabApproval: React.FC<TabApprovalProps> = ({ activities, currentUser }) => {
  const params = useParams();
  const proyekId = params?.id as string;

  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States untuk Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Deliverable | null >(null);


  // -------------------------------------------------------------
  // VALIDASI POV (HAK AKSES)
  // -------------------------------------------------------------
  const role = (currentUser?.role || (currentUser as any)?.tipe || '').toUpperCase();
  
  // 1. Yang bisa Tambah/Upload: Vendor, Tim, PM, Admin
  //const canSubmit = ['vendor', 'tim', 'pm', 'project manager', 'admin','ADMIN','VENDOR','PM','TIM'].includes(role);
  
  // 2. Yang bisa Review/Approve: Client, Admin
  
  const canReview = ['CLIENT', 'ADMIN', 'client', 'admin'].includes(role);
  const canSubmit = role !== 'CLIENT';

  console.log("=== DEBUG TAB APPROVAL (LEVEL KOMPONEN) ===");
  console.log("Data currentUser asli:", currentUser);
  console.log("Role yang berhasil di-extract:", role);
  console.log("Apakah punya akses canReview?:", canReview);
  console.log("==========================================");

  const fetchDeliverables = async () => {
    if (!proyekId) return;
    setIsLoading(true);
    try {
      const data = await ApprovalRepository.getByProject(proyekId);
      setDeliverables(data || []);
    } catch (error) {
      console.error("Gagal mengambil data approval:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Gagal mendownload file:', error);
      // Fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, [proyekId]);

  return (
    <div className="space-y-6 mt-6">
 
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-100">Daftar Approval & Dokumen</h3>
        {canSubmit && (
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Deliverable
          </button>
        )}
      </div>
 
      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : deliverables.length > 0 ? (
          deliverables.map((item) => {
            const status = (item.status || 'SUBMITTED').toUpperCase();
 
            const badgeUI =
              status === 'APPROVED' ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Disetujui</span>
              ) : status === 'REJECTED' ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">Ditolak</span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Disubmit</span>
              );
 
            const aktivitasName =
              (item as any).aktivitas?.name ||
              activities.find(a => a.id === item.aktivitasId)?.name ||
              'Tahapan Proyek';
 
            const latestReview = item.reviews?.[0];

            console.log(`--- DEBUG ITEM: ${item.title} ---`);
            console.log("Status dokumen saat ini:", status);
            console.log("Apakah status BUKAN APPROVED?:", status !== 'APPROVED');
            console.log("Apakah tombol harusnya muncul? (canReview && status !== 'APPROVED'):", canReview && status !== 'APPROVED');
            console.log("-----------------------------------------");
 
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
 
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      {badgeUI}
                      <span className="text-xs text-slate-400 font-medium">{aktivitasName}</span>
                    </div>
                    {/* ✅ Fix: field 'title' sesuai schema, bukan 'nama' */}
                    <h4 className="text-base font-bold text-slate-800">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.description || 'Tidak ada deskripsi'}</p>
                  </div>
 
                  {canReview && status !== 'APPROVED' && (
                    <button
                      onClick={() => { setSelectedItem(item); setIsReviewOpen(true); }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Review
                    </button>
                  )}
                </div>
 
                {/* Submitter & tanggal */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4">
                  {/* ✅ Fix: field 'submitter' ada di schema (relasi User?) */}
                  <span>Oleh: <span className="text-slate-700">{item.submitter?.name || 'Sistem'}</span></span>
                  <span>Dibuat: {new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                  {latestReview && (
                    <span>Review: {new Date(latestReview.reviewDate).toLocaleDateString('id-ID')}</span>
                  )}
                </div>
 
                {/* ✅ Fix: attachments adalah array, tampilkan semua file */}
                {item.attachments && item.attachments.length > 0 ? (
                  <div className="flex flex-col gap-1.5 mb-4">
                    {item.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <button
                          onClick={() => handleDownload(att.fileUrl, att.fileName || 'Dokumen')}
                          className="text-sm font-semibold text-rose-600 hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          {att.fileName || 'Dokumen'}
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-4">*Tidak ada file lampiran</p>
                )}
 
                {/* ✅ Fix: catatan dari item.reviews[0].comments, bukan item.reviewApproval.comments */}
                {latestReview?.comments && (
                  <div className={`p-3 rounded-lg text-sm ${
                    status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <span className="font-bold">Catatan Reviewer: </span>
                    {latestReview.comments}
                  </div>
                )}
 
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-xl">
            Belum ada deliverable yang diajukan.
          </div>
        )}
      </div>
 
      {/* Modals */}
      <SubmitDeliverable
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        proyekId={proyekId}
        activities={activities}
        onSuccess={fetchDeliverables}
      />
 
      <ReviewApproval
        isOpen={isReviewOpen}
        onClose={() => { setIsReviewOpen(false); setSelectedItem(null); }}
        deliverable={selectedItem}
        reviewerId={currentUser.id}
        onSuccess={fetchDeliverables}
      />
    </div>
  );
};