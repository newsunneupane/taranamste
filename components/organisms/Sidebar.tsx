"use client";

import React, { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react"; // Added useSession
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  Baby,
  UserCog,
  Wallet,
  Package,
  BookOpen,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ClipboardCheck, // New icon for Approvals
  Users2,          // New icon for User Management
  ArrowRightLeft,
  Banknote
} from "lucide-react";
import { canRead } from "@/lib/permission";

export const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const actor = {
    isSuperAdmin: !!(session?.user as any)?.isSuperAdmin,
    permissions: ((session?.user as any)?.permissions as any) || {},
  };
  const userRoleLabel = (session?.user as any)?.isSuperAdmin ? "SUPERADMIN" : (session?.user?.role || "STAFF");

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);



  // BASE ITEMS: Available to Everyone (Samity, Staff, Admin)
  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Children", path: "/children", icon: Baby },
    { label: "Finances", path: "/finance", icon: Wallet },
    { label: "Inventory", path: "/inventory", icon: Package },
    { label: "Guardians", path: "/guardians", icon: Shield },
    { label: "My Transactions", path: "/my-finances", icon: Wallet },
  ];

  // ADMIN ONLY ITEMS: Only visible to roles allowed by the permission policy
  const adminItems = [
    { label: "Approvals", path: "/approvals", icon: ClipboardCheck },
    { label: "Payments", path: "/settlements", icon: ArrowRightLeft },
    { label: "Staff", path: "/staff", icon: UserCog },
    { label: "Categories", path: "/accounts_headers", icon: BookOpen },
    { label: "Team Members", path: "/usersmanagement", icon: Users2 },
    { label: "Payroll", path: "/payroll", icon: Banknote },
    { label: "Money Accounts", path: "/payment-categories", icon: CreditCard },];

  const baseNav = navItems.filter((item) => canRead(item.path, actor));
  const adminNav = adminItems.filter((item) => canRead(item.path, actor));

  const renderLink = (item: any) => {
    const isActive = pathname === item.path;
    const Icon = item.icon;
    return (
      <Link key={item.path} href={item.path} title={isCollapsed ? item.label : undefined}>
        <div className={`flex items-center rounded-xl transition-all duration-200 group ${isCollapsed ? "md:justify-center px-4 py-3 md:p-3 gap-3" : "px-4 py-3 gap-3"
          } ${isActive
            ? "bg-primary text-white shadow-glow"
            : "text-text-muted hover:bg-shaded hover:text-text"
          }`}>
          <Icon className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isCollapsed ? "md:w-6 md:h-6 w-5 h-5" : "w-5 h-5"}`} />
          <span className={`font-ubuntu text-sm font-bold whitespace-nowrap ${isCollapsed ? "md:hidden" : ""}`}>
            {item.label}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <>
      <button onClick={() => setIsMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-40 p-2 bg-card border border-border rounded-xl text-text shadow-glow"><Menu size={24} /></button>
      {isMobileOpen && <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setIsMobileOpen(false)} />}

      <aside className={`flex flex-col w-64 shrink-0 bg-bg border-r border-border transition-all duration-300 md:relative max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[60] max-md:h-full max-md:shadow-2xl max-md:transition-transform ${isCollapsed ? "md:w-20" : "md:w-64"} ${isMobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`}>

        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:block absolute -right-3 top-8 bg-card border border-border text-text-muted rounded-full p-1 z-50 shadow-sm">
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`p-6 border-b border-border flex items-center min-h-[80px] ${isCollapsed ? "md:justify-center" : ""}`}>
          <div className="flex flex-col overflow-hidden">
            <h1 className={`font-ubuntu font-black tracking-tight ${isCollapsed ? "md:text-xl text-lg md:text-primary" : "text-lg text-text"}`}>
              <span className="hidden md:inline">{isCollapsed ? "TNBG" : "Tara Namaste Baal Gram"}</span>
              <span className="md:hidden">Tara Namaste Baal Gram</span>
            </h1>
            <p className={`font-ubuntu text-[9px] text-primary font-black mt-1 ${isCollapsed ? "md:hidden" : ""}`}>
              {userRoleLabel} PROTOCOL
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {/* STANDARD LINKS */}
          {baseNav.map(renderLink)}

          {/* SENSITIVE ADMIN LINKS */}
          {adminNav.length > 0 && (
            <div className="pt-4 mt-4 border-t border-border/50">
              <p className={`text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 px-4 ${isCollapsed ? "md:hidden" : ""}`}>
                Management
              </p>
              {adminNav.map(renderLink)}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border space-y-3 bg-shaded/10">
          <button onClick={() => signOut()} className={`w-full flex items-center text-danger hover:bg-danger/10 rounded-xl transition-all group ${isCollapsed ? "md:justify-center px-4 py-3 md:p-3" : "px-4 py-3 gap-3"}`}>
            <LogOut className="flex-shrink-0 group-hover:scale-110 w-5 h-5" />
            <span className={`font-ubuntu text-sm font-bold ${isCollapsed ? "md:hidden" : ""}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};