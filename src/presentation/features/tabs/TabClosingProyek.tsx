"use client";

import React, { useState, useRef, useEffect } from "react";
import { CheckCircle2, Clock, Upload, FileText, Check, Loader2, Download } from "lucide-react";
import AttachmentModal from "@/presentation/components/AttachmentModal";
import type { Aktivitas } from "@/core/entities/Proyek"; 
import { ClosingRepository } from "@/infrastructure/repositories/closing.repo";
import SuccessClosingModal from "@/presentation/components/SuccessClosingModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TabClosingProyekProps {
  proyekId: string;
  proyekName?: string;
  initialActivities: Aktivitas[];
}

export default function TabClosingProyek({
  proyekId,
  proyekName = 'Proyek',
  initialActivities,
}: TabClosingProyekProps) {
  const [activities, setActivities] = useState<Aktivitas[]>(initialActivities);
  const storageKey = `verified-activities-${proyekId}`;
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set());
  
  const [bastFileName, setBastFileName] = useState<string | null>(null);
  const [bastFileUrl, setBastFileUrl] = useState<string | null>(null);
  const [isUploadingBast, setIsUploadingBast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const isClosedStorageKey = `is-project-closed-${proyekId}`;
  const [isProjectClosed, setIsProjectClosed] = useState(false);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setVerifiedIds(new Set(JSON.parse(saved)));
      }
      const closed = localStorage.getItem(isClosedStorageKey) === "true";
      if (closed) {
        setIsProjectClosed(true);
      }
    } catch (e) {}
    setHasLoadedStorage(true);
  }, [storageKey, isClosedStorageKey]);

  useEffect(() => {
    if (hasLoadedStorage) {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(verifiedIds)));
    }
  }, [verifiedIds, storageKey, hasLoadedStorage]);

  useEffect(() => {
    const fetchClosingData = async () => {
      try {
        const data = await ClosingRepository.getByProject(proyekId);
        if (data && data.bastUrl) {
          setBastFileUrl(data.bastUrl);
          setBastFileName(data.bastFileName || 'BAST.pdf');
        }
        if (data && (data.status === 'FINAL' || data.status === 'CLOSED')) {
          setIsProjectClosed(true);
          localStorage.setItem(isClosedStorageKey, "true");
        }
      } catch (error) {
        console.error("Gagal mengambil data closing proyek:", error);
      }
    };
    fetchClosingData();
  }, [proyekId]);



  // Kalkulasi Progress
  const totalActivities = activities.length;
  const verifiedCount = verifiedIds.size;
  const progressPercentage = totalActivities === 0 ? 0 : Math.round((verifiedCount / totalActivities) * 100);



  const handleVerify = (id: string) => {
    setVerifiedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingBast(true);
      
      try {
        const result = await ClosingRepository.uploadBast(proyekId, file);
        setBastFileName(file.name);
        setBastFileUrl(result?.bastUrl || null);
        setModalContent({
          title: "Upload Berhasil",
          message: "Dokumen BAST sukses diunggah dan disimpan ke dalam sistem."
        });
        setIsSuccessModalOpen(true);
      } catch (error) {
        console.error("Error upload BAST:", error);
        alert("❌ Gagal mengunggah BAST");
      } finally {
        setIsUploadingBast(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    }
  };

  const handleDownloadBast = async () => {
    if (!bastFileUrl) return;
    try {
      const response = await fetch(bastFileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = bastFileName || 'BAST.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Gagal mendownload BAST:', error);
      window.open(bastFileUrl, '_blank');
    }
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185); // Warna Biru
    doc.text("Laporan Akhir Penutupan Proyek", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`ID Proyek: ${proyekId}`, 14, 32);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 38);
    
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Daftar Aktivitas Terverifikasi", 14, 52);

    const tableData = activities.map((act, index) => [
      index + 1,
      act.nama || act.name,
      act.progress + "%",
      "Selesai & Terverifikasi"
    ]);

   autoTable(doc, {
    startY: 58,
      head: [['No', 'Nama Aktivitas', 'Progress', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 },
   });
   
    const fileName = `Laporan_Closing_${proyekName.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleSubmitClosing = async () => {
    if (verifiedCount !== totalActivities) {
      alert("Semua aktivitas harus diverifikasi sebelum menutup proyek!");
      return;
    }

    try {
      const response = await ClosingRepository.submitClosing({
        proyekId,
        handoverDate: new Date().toISOString(),
        notes: "Proyek diselesaikan dan diverifikasi.",
      });

      if (response) {
        localStorage.setItem(isClosedStorageKey, "true");
        
        setModalContent({
          title: "Proyek Ditutup!",
          message: "Semua aktivitas telah diverifikasi dan proyek resmi dinyatakan selesai."
        });
        setIsSuccessModalOpen(true);
        setIsProjectClosed(true);
      }
    } catch (error: any) {
      const pesanBackend = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`❌ Gagal Menutup Proyek: \n${JSON.stringify(pesanBackend, null, 2)}`);
    }
  };


  return (
  <div className="space-y-6">

    {/* Input File Tersembunyi buat BAST */}
      <input 
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

    {/* Banner Notifikasi */}
    <div className="flex items-center justify-between gap-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
      {/* Bagian Kiri: Ikon dan Teks */}
      <div className="flex items-start gap-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
        <div>
          <h3 className="font-semibold text-yellow-800">
            {verifiedCount} dari {totalActivities} aktivitas terverifikasi
          </h3>
          <p className="text-sm text-yellow-700">
            Verifikasi semua aktivitas sebelum menutup proyek
          </p>
        </div>
      </div>

      {/* Bagian Kanan: Tombol Lampiran */}
      <div className="flex items-center gap-3">
          {bastFileName ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadBast}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download BAST
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingBast}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isUploadingBast ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Ganti
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingBast}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isUploadingBast ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload BAST
            </button>
          )}
        </div>
    </div>

    {/* Progress Bar */}
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-600">Verifikasi Progress</span>
        <span className="font-bold text-gray-800">{progressPercentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>

    {/* List Aktivitas */}
    <div className="space-y-4">
      {activities.map((activity) => {
        const isVerified = verifiedIds.has(activity.id);

        return (
          <div
            key={activity.id}
            className={`flex flex-col justify-between rounded-xl border p-5 sm:flex-row sm:items-start ${
              isVerified
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              {isVerified ? (
                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <div className="mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-gray-300" />
              )}

              <div>
                <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                
                {isVerified ? (
                  <div className="mt-1 space-y-2">
                    <p className="text-sm text-emerald-600">
                      ✓ Diverifikasi oleh Anda pada {new Date().toLocaleDateString("id-ID")}
                    </p>
                    <p className="text-sm text-gray-800">{activity.description}</p>
                    
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">{activity.deskripsi}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0 sm:items-end">
              {!isVerified && (
                <button
                  onClick={() => handleVerify(activity.id)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Verifikasi
                </button>
              )}  
            </div>
          </div>
        );
      })}
    </div>

    {/* Submit Button (Muncul jika 100% verified) */}
    {progressPercentage === 100 && !isProjectClosed && (
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmitClosing}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Tutup Proyek
        </button>
      </div>     
    )}

    {isProjectClosed && (
      <div className="mt-6 flex justify-end">
        <button
          onClick={generatePDFReport}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Generate Laporan
        </button>
      </div>
    )}

    <SuccessClosingModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={modalContent.title}
        message={modalContent.message}
    />
    
  </div>
  
  );
}