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
  ArrowRightLeft
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

  // lock body scroll when drawer open (mobile)
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isMobileOpen]);



  // BASE ITEMS: Available to Everyone (Samity, Staff, Admin)
  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Children", path: "/children", icon: Baby },
    { label: "Finances", path: "/finance", icon: Wallet },
    { label: "Inventory", path: "/inventory", icon: Package },
    { label: "Guardians", path: "/guardians", icon: Shield },
  ];

  // ADMIN ONLY ITEMS: Only visible to roles allowed by the permission policy
  const adminItems = [
    { label: "Approvals", path: "/approvals", icon: ClipboardCheck },
    { label: "Payments", path: "/settlements", icon: ArrowRightLeft },
    { label: "Staff", path: "/staff", icon: UserCog },
    { label: "Categories", path: "/accounts_headers", icon: BookOpen },
    { label: "Team Members", path: "/usersmanagement", icon: Users2 },
    { label: "Money Accounts", path: "/payment-categories", icon: CreditCard },];

  const baseNav = navItems.filter((item) => canRead(item.path, actor));
  const adminNav = adminItems.filter((item) => canRead(item.path, actor));

  const renderLink = (item: any) => {
    const isActive = pathname === item.path;
    const Icon = item.icon;
    return (
      <Link key={item.path} href={item.path} title={isCollapsed ? item.label : undefined}>
        <div className={`flex items-center rounded-xl transition-all duration-200 group ${isCollapsed ? "md:justify-center px-3 py-2.5 md:p-3 gap-3" : "px-3.5 py-2.5 gap-3"
          } ${isActive
            ? "bg-primary text-white shadow-sm"
            : "text-text-muted hover:bg-card hover:text-text hover:shadow-sm border border-transparent hover:border-border"
          }`}>
          <Icon className={`flex-shrink-0 transition-transform group-hover:scale-105 ${isCollapsed ? "md:w-5 md:h-5 w-5 h-5" : "w-[18px] h-[18px]"}`} />
          <span className={`text-sm font-medium whitespace-nowrap ${isCollapsed ? "md:hidden" : ""}`}>
            {item.label}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <>
      <button onClick={() => setIsMobileOpen(true)} className="md:hidden fixed top-[calc(0.75rem+env(safe-area-inset-top))] left-3 z-40 p-2.5 bg-card border border-border rounded-xl text-text shadow-glow"><Menu size={20} /></button>
      {isMobileOpen && <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overscroll-contain" onClick={() => setIsMobileOpen(false)} />}

      <aside className={`flex flex-col w-64 max-w-[80vw] shrink-0 bg-card border-r border-border transition-all duration-300 md:relative max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[60] max-md:h-[100dvh] max-md:shadow-2xl max-md:transition-transform max-md:will-change-transform ${isCollapsed ? "md:w-[72px]" : "md:w-64"} ${isMobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`}>

        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex absolute -right-3 top-7 bg-card border border-border text-text-muted rounded-full p-1.5 z-50 shadow-md hover:text-primary hover:border-primary/20 transition-colors">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`px-5 py-5 border-b border-border flex items-center min-h-[72px] ${isCollapsed ? "md:justify-center md:px-2" : ""}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">TN</div>
            <div className={`flex flex-col overflow-hidden ${isCollapsed ? "md:hidden" : ""}`}>
              <h1 className="text-sm font-bold tracking-tight text-text leading-none">
                <span className="hidden md:inline">Tara Namaste</span>
                <span className="md:hidden">Tara Namaste Baal Gram</span>
              </h1>
              <p className="text-[11px] text-text-muted font-medium leading-none mt-1">Baal Gram</p>
            </div>
          </div>
          <span className={`ml-auto hidden md:inline-flex px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wide ${isCollapsed ? "md:hidden" : ""}`}>
            {userRoleLabel}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar [-webkit-overflow-scrolling:touch]">
          {baseNav.map(renderLink)}

          {adminNav.length > 0 && (
            <div className="pt-4 mt-4 border-t border-border">
              <p className={`text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2 px-3 ${isCollapsed ? "md:hidden" : ""}`}>
                Management
              </p>
              {adminNav.map(renderLink)}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-border bg-shaded/30">
          <button onClick={() => signOut()} className={`w-full flex items-center text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all group text-sm font-medium ${isCollapsed ? "md:justify-center px-3 py-2.5 md:p-2.5" : "px-3.5 py-2.5 gap-3"}`}>
            <LogOut className="flex-shrink-0 w-[18px] h-[18px]" />
            <span className={`${isCollapsed ? "md:hidden" : ""}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};