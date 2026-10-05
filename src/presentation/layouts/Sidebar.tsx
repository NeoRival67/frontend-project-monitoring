"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/use-cases/hooks/useAuth";
import type { UserRole } from "@/core/entities/User";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[]; // Jika undefined, bisa diakses semua role
}

interface NavGroup {
  title?: string;
  items: NavItem[];
  collapsible?: boolean;
  roles?: UserRole[]; // Jika undefined, bisa diakses semua role
}

const navGroups: NavGroup[] = [
  {
    roles: ["PM", "CLIENT"], // ADMIN tidak boleh melihat Dashboard Overview
    items: [
      { label: "Overview", href: "/overview", icon: "📊" },
    ],
  },
  {
    title: "Master Data",
    collapsible: true,
    roles: ["ADMIN"], // Hanya ADMIN yang bisa melihat Master Data
    items: [
      { label: "Client / Vendor", href: "/clients", icon: "🏢" },
      { label: "Master User & Tim", href: "/master-tim", icon: "👥" },
    ],
  },
  {
    roles: ["PM", "CLIENT", "VENDOR", "TIM"], // ADMIN tidak boleh Create, Read, Update, Delete Proyek
    items: [
      { label: "Projects", href: "/proyek", icon: "📁" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Master Data": true,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const [isMounted, setIsMounted] = useState(false);

 useEffect(() => {
    const timer = setTimeout(() => {
       setIsMounted(true);
    }, 0);
    
      return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return <aside className="w-64 bg-[#11111d] min-h-screen border-r border-gray-800"></aside>; 
    // ^ Atur class width dan warna agar tampilannya tidak "berkedip" saat render
  }

  const isActive = (href: string) => pathname === href;

  // Filter groups dan items berdasarkan role user saat ini
  const userRole = user?.role || "CLIENT"; // Default ke CLIENT jika undefined untuk keamanan
  
  const filteredGroups = navGroups
    .filter((group) => !group.roles || group.roles.includes(userRole))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="sidebar" id="main-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-wrap">
          <span className="sidebar-logo-icon">◆</span>
          <h2 className="sidebar-logo">Monitoring</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredGroups.map((group, gi) => (
          <div key={gi} className="sidebar-group">
            {group.title && (
              <button
                className="sidebar-group-title"
                onClick={() => group.collapsible && toggleGroup(group.title!)}
                aria-expanded={openGroups[group.title] ?? true}
              >
                <span>{group.title}</span>
                {group.collapsible && (
                  <span className={`sidebar-chevron ${openGroups[group.title] ? "open" : ""}`}>
                    ›
                  </span>
                )}
              </button>
            )}
            <div
              className={`sidebar-group-items ${
                group.title && group.collapsible && !openGroups[group.title] ? "collapsed" : ""
              }`}
            >
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? "sidebar-link-active" : ""}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
