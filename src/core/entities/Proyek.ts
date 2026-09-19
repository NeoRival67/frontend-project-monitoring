import type { User } from "./User";

export interface ClientVendor {
  id: string;
  type: string;
  status: string;
  industry?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  users?: User[];
  createdAt: string;
  updatedAt: string;

  nama?: string;
  tipe?: string;
  kontak?: string;
  alamat?: string;
}

export interface ProyekTeamMember {
  id: string;
  proyekId: string;
  userId: string;
  teamId?: string | null;
  roleInProject?: string | null;
  user?: User;
}

export interface Proyek {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  status: StatusProyek;
  startDate: string;
  endDate: string;
  budget: string | number;
  clientId: string;
  client?: ClientVendor;
  vendors?: ClientVendor[];
  teams?: ProyekTeamMember[];
  activities?: Aktivitas[];
  deliverables?: Deliverable[];
  closing?: ClosingProyek;
  createdAt: string;
  updatedAt: string;

  nama?: string;
  deskripsi?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  progres?: number;
  clientName?: string;
}

export interface CreateProyekPayload {
  nameProyek: string;
  description: string;
  objectives: string;
  idClient: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: string;
  vendorIds: string[];
  teamMemberIds: string[];
}

export type StatusProyek =
  | "inisiasi"
  | "perencanaan"
  | "pelaksanaan"
  | "penutupan"
  | "INISIASI"
  | "ONGOING"
  | "berjalan"
  | "selesai"
  | "terhenti"
  | string;

export interface Aktivitas {
  id: string;
  proyekId: string;
  name: string;
  description?: string;
  status: StatusAktivitas;
  startDate?: string;
  dueDate?: string;
  category?: string;
  weight?: number;
  progress: number;
  budget?: number | string;
  assignees?: (User | string)[];
  logs?: LogAktivitas[];
  deliverables?: Deliverable[];
  createdAt: string;
  updatedAt: string;

  nama?: string;
  deskripsi?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
}

export type StatusAktivitas =
  | "Belum Mulai"
  | "Berjalan"
  | "Selesai"
  | "Terlambat"
  | "berjalan"
  | "selesai"
  | "terlambat"
  | string;

export interface LogAktivitas {
  id: string;
  aktivitasId: string;
  userId: string;
  user?: User;
  logDate?: string;
  description: string;
  progressAdded: number;
  costIncurred?: string | number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LogAktivitasPayload {
  aktivitasId: string;
  userId: string;
  description: string;
  logDate?: string;
  progressAdded: number;
  costIncurred?: number | null;
  status: string;
}

export interface Deliverable {
  id: string;
  proyekId: string;
  aktivitasId?: string | null;
  title: string;
  description?: string | null;
  status: StatusDeliverable;
  submitterId?: string | null;
  submitter?: { id: string; name: string } | null;
  attachments?: Attachment[];
  reviews?: ReviewApproval[];
  reviewApproval?: ReviewApproval;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliverablePayload {
  proyekId: string;
  aktivitasId?: string;
  title: string;
  description?: string;
}

export type StatusDeliverable =
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | string;

export interface ReviewApproval {
  id: string;
  deliverableId: string;
  reviewerId: string;
  status: StatusApproval;
  comments?: string | null;
  reviewDate: string;
  reviewer?: User;
  deliverable?: Deliverable;
}

export interface CreateReviewPayload {
  deliverableId: string;
  reviewerId: string;
  status: StatusApproval;
  comments?: string;
}

export interface Attachment {
  id: string;
  deliverableId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  createdAt: string;
}

export type StatusApproval = "APPROVED" | "REJECTED" | "PENDING";

export interface ClosingProyek {
  id: string;
  proyekId: string;
  bastUrl?: string | null;
  bastFileName?: string | null;
  finalReportUrl?: string | null;
  handoverDate?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  proyek?: Proyek;
}

export interface CreateClosingPayload {
  proyekId: string;
  handoverDate?: string;
  notes?: string;
}