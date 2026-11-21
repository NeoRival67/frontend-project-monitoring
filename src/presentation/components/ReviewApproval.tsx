"use client";

import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { ApprovalRepository } from '@/infrastructure/repositories/approval.repo';
import { Deliverable, CreateReviewPayload } from '@/core/entities';

interface ReviewApprovalProps {
  isOpen: boolean;
  onClose: () => void;
  deliverable: Deliverable | null; 
  reviewerId?: string;
  onSuccess: () => void;
}

export const ReviewApproval: React.FC<ReviewApprovalProps> = ({ isOpen, onClose, deliverable, reviewerId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState('');

  if (!isOpen || !deliverable) return null;

  const handleReview = async (status: 'APPROVED' | 'REJECTED' ) => {
    setIsLoading(true);
    try {
        const payload: CreateReviewPayload = {
            deliverableId: deliverable.id,
            status: status,
            comments: comments || "",
        }
      await ApprovalRepository.reviewDeliverable(deliverable.id, payload)
      onSuccess();
      onClose();
      setComments('');
    } catch (error:any) {
      console.error("Detail Error NestJS:", error.response?.data); 
      alert("Gagal mengirim hasil review. Cek console untuk detail.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Review Deliverable</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm">
            <span className="text-slate-500">Dokumen: </span>
            <span className="font-semibold text-slate-800">{deliverable.title}</span>
          </div>

          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan Review *</label>
          <textarea 
            required 
            value={comments} 
            onChange={(e) => setComments(e.target.value)} 
            placeholder="Berikan catatan, revisi, atau alasan persetujuan..." 
            rows={4} 
            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 bg-white resize-none outline-none focus:border-blue-500" 
          />
        </div>

        <div className="p-6 flex gap-3 rounded-b-2xl bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} disabled={isLoading} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">
            Batal
          </button>
          
          <div className="flex-1 flex gap-3 justify-end">
            <button 
              onClick={() => handleReview('REJECTED')} 
              disabled={isLoading} 
              className="px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Tolak
            </button>
            <button 
              onClick={() => handleReview('APPROVED')} 
              disabled={isLoading} 
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Setujui
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};