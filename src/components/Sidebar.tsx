"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  History,
  Users,
  LogOut,
  Menu,
  X,
  CalendarCheck,
  ChevronLeft,
  ScanFace as ScanFaceIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  role: "student" | "admin";
}

const studentLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
  {
    href: "/dashboard/face-registration",
    icon: ScanFaceIcon,
    label: "Face Registration",
  },
  { href: "/dashboard/attendance-history", icon: History, label: "Attendance History" },
];

const adminLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Home" },
  { href: "/admin/profile", icon: User, label: "Profile" },
  { href: "/admin/attendance", icon: CalendarCheck, label: "Attendance" },
  { href: "/admin/students", icon: Users, label: "Students" },
  {
    href: "/admin/face-register-students",
    icon: ScanFaceIcon,
    label: "Face Register",
  },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = role === "admin" ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <img
            src="/smart_attendance.png"
            alt="Smart Attendance"
            className="w-full h-full object-cover"
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white whitespace-nowrap">
              Smart Attendance
            </p>
            <p className="text-[10px] text-gray-500 capitalize">{role}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {link.label}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl glass text-gray-400 hover:text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-64 h-full glass border-r border-white/10"
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden md:block relative">
        <motion.aside
          animate={{ width: collapsed ? 72 : 240 }}
          className="h-screen glass border-r border-white/10 overflow-hidden sticky top-0"
        >
          {sidebarContent}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <ChevronLeft
              className={`w-3 h-3 transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </motion.aside>
      </aside>
    </>
  );
}
