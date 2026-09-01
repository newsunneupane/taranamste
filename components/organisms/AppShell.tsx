"use client";
import React from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation'; // ✨ IMPORT THIS
import { Sidebar } from './Sidebar';
import { Login } from './Login';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useSession();
  const pathname = usePathname(); // ✨ GET CURRENT URL

  const isPublicRoute = false;

  // 1. Loading State (Theme-Aware)
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-text transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner using primary color and glow effect */}
          <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin shadow-glow" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted animate-pulse">
            Loading
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    // ✨ IF THEY ARE ON THE REGISTER PAGE, LET THEM THROUGH
    if (isPublicRoute) {
      return (
        // ✨ THE FIX: Removed 'flex' and 'h-screen' so the child can center itself properly
        <main className="w-full min-h-screen bg-bg text-text transition-colors duration-500">
          {children}
        </main>
      );
    }
    // OTHERWISE, TRAP THEM IN THE LOGIN SCREEN
    return <Login />;
  }

  // 3. Authenticated Dashboard Shell
  return (
    <div className="flex h-screen w-full bg-bg text-text overflow-hidden transition-colors duration-500">

      {/* Sidebar remains fixed width */}
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-shaded/50 transition-colors duration-500">
        <div className="max-w-[1600px] mx-auto p-3 md:p-5">
          {children}
        </div>
      </main>

    </div>
  );
};