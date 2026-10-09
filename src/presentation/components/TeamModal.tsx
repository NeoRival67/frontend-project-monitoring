import React, { useState, useEffect } from "react";
import type { User, CreateUserPayload, UpdateUserPayload } from "@/core/entities";
import { useCreateUser, useUpdateUser } from "@/use-cases/hooks/useUser";

interface TeamModalProps {
  user?: User; // if passed, it's Edit mode
  onClose: () => void;
  onSuccess?: () => void;
}

export function TeamModal({ user, onClose, onSuccess }: TeamModalProps) {
  const isEdit = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [formData, setFormData] = useState({
    name: "",
    role: "TIM",
    position: "",
    email: "",
    phone: "",
    departemen: "Engineering",
    status: "ACTIVE",
    skills: [] as string[],
  });

  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const updateFormData = () => {
      if (isEdit && user) {
        setFormData({
          name: user.name || "",
          role: user.role || "TIM",
          position: user.position || "",
          email: user.email || "",
          phone: user.phone || "",
          departemen: user.departemen || "Engineering",
          status: user.status || "ACTIVE",
          skills: Array.isArray(user.skills)
            ? user.skills
            : typeof user.skills === "string"
              ? (user.skills as string).split(",").map((s: string) => s.trim()).filter(Boolean)
              : [],
        });
      } else if (!isEdit) {
        // Reset form for add mode
        setFormData({
          name: "",
          role: "TIM",
          position: "",
          email: "",
          phone: "",
          departemen: "Engineering",
          status: "ACTIVE",
          skills: [],
        });
        setSkillInput("");
      }
    };

    updateFormData();
  }, [user, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
 //   const skillsString = formData.skills.join(", ");

    if (isEdit) {
      const payload: UpdateUserPayload = {
        name: formData.name,
        role: formData.role,
        status: formData.status,
        departemen: formData.departemen,
        phone: formData.phone,
        position: formData.position,
       skills: formData.skills,
      };
      updateUser.mutate({ id: user.id, payload }, {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { message?: string } } };
          alert(error?.response?.data?.message || "Gagal mengupdate pengguna");
        }
      });
    } else {
      const payload: CreateUserPayload = {
        name: formData.name,
        email: formData.email,
        role: formData.role || "TIM",
        departemen: formData.departemen,
        phone: formData.phone,
        position: formData.position,
        skills: formData.skills,
      };
      createUser.mutate(payload, {
        onSuccess: () => {
          onSuccess?.();
          onClose();
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { message?: string } } };
          alert(error?.response?.data?.message || "Gagal menambah pengguna");
        }
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? "Edit User" : "Tambah User"}</h2>
          <button className="modal-close-btn" onClick={onClose} type="button">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-scroll">
          <div className="form-row">
            <div className="form-group col-6">
              <label>Departemen</label>
              <select name="departemen" className="form-input form-select" value={formData.departemen} onChange={handleChange}>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="QA">QA</option>
                <option value="PMO">PMO</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="form-group col-6">
              <label>Status</label>
              <select name="status" className="form-input form-select" value={formData.status} onChange={handleChange} disabled={!isEdit}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Inaktif</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Nama Lengkap <span className="text-danger">*</span></label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className="form-group">
            <label>Role <span className="text-danger">*</span></label>
            <select
              name="role"
              className="form-input form-select"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="PM">PM</option>
              <option value="TIM">TIM</option>
            </select>
          </div>

          <div className="form-group">
            <label>Posisi / Position</label>
            <input
              type="text"
              name="position"
              className="form-input"
              value={formData.position}
              onChange={handleChange}
              placeholder="Backend Developer, UI/UX Designer, dll"
            />
          </div>

          <div className="form-group">
            <label>Email <span className="text-danger">*</span></label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@company.co.id"
              required
              disabled={isEdit} // Email usually shouldn't be edited freely
            />
          </div>

          <div className="form-group">
            <label>Telepon</label>
            <input
              type="text"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0812-xxxx-xxxx"
            />
          </div>

          <div className="form-group">
            <label>Skills</label>
            <div className="skills-input-wrapper">
              <input
                type="text"
                className="form-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Ketik skill, Enter untuk tambah"
              />
              <button type="button" className="btn-icon" onClick={handleAddSkill}>+</button>
            </div>
            {formData.skills.length > 0 && (
              <div className="skills-list">
                {formData.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">
                    {skill}
                    <button type="button" className="skill-tag-remove" onClick={() => handleRemoveSkill(skill)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={createUser.isPending || updateUser.isPending}>
              {createUser.isPending || updateUser.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
