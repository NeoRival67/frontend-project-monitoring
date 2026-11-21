"use client";

import React, { useState } from "react";
import { useSemuaUser } from "@/use-cases/hooks/useUser";
import { TeamCard } from "@/presentation/components/TeamCard";
import { TeamModal } from "@/presentation/components/TeamModal";
import { DeleteConfirmationModal } from "@/presentation/components/DeleteConfirmationModal";
import type { User } from "@/core/entities";

export function TeamManager() {
  const { data: users, isLoading, isError } = useSemuaUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("Semua Departemen");

  const safeUsers = (users || []).filter(u => {
    const role = (u.role || '').toUpperCase();
    const tipe = ((u as any).tipe || '').toUpperCase();
    return role !== 'CLIENT' && role !== 'ADMIN' && tipe !== 'CLIENT' && tipe !== 'ADMIN';
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedUser(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setSelectedUser(undefined);
  };

  const handleDeleteSuccess = () => {
    handleCloseDelete();
  };

  const filteredUsers = safeUsers.filter(u => {
    const searchMatch = 
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    const deptMatch = filterDept === "Semua Departemen" || (u.departemen || "") === filterDept;

    return searchMatch && deptMatch;
  });

  return (
    <div className="team-manager">
      <div className="tm-header">
        <div>
          <h1 className="tm-title">Master Users</h1>
          <p className="tm-subtitle">Kelola anggota tim proyek</p>
        </div>
        <button className="btn btn-primary btn-add" onClick={handleAdd}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Anggota
        </button>
      </div>

      <div className="tm-filters-container">
        <div className="tm-search">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Cari nama, jabatan, email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select 
          className="tm-select-dept" 
          value={filterDept} 
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="Semua Departemen">Semua Departemen</option>
          <option value="Engineering">Engineering</option>
          <option value="Design">Design</option>
          <option value="Business">Business</option>
          <option value="QA">QA</option>
          <option value="PMO">PMO</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      <div className="tm-content">
        {isLoading ? (
          <div className="text-muted">Memuat data tim...</div>
        ) : isError ? (
          <div className="text-danger">Terjadi kesalahan saat memuat data.</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-muted">Tidak ada anggota tim yang ditemukan.</div>
        ) : (
          <div className="team-grid">
            {filteredUsers.map(user => (
              <TeamCard key={user.id} user={user} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <TeamModal 
          user={selectedUser} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        userId={selectedUser?.id}
        isOpen={isDeleteOpen}
        onClose={handleCloseDelete}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
