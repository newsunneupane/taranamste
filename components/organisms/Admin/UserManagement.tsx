"use client";

import React, { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { updateUserStatus, deleteUser } from "@/app/actions/users";

export const UserManagement = ({ pendingUsers, activeUsers }: { pendingUsers: any[], activeUsers: any[] }) => {
  const [activeTab, setActiveTab] = useState<"PENDING" | "ACTIVE">("PENDING");
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (id: string, status: boolean) => {
    startTransition(async () => {
      await updateUserStatus(id, status);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this user permanently?")) {
      startTransition(async () => {
        await deleteUser(id);
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-dashboard border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text uppercase tracking-widest">
              Team Members
            </h2>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-1 opacity-70">
              Manage who can log in and what they can do
            </p>
          </div>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex bg-shaded p-1 rounded-xl border border-border shrink-0">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-6 py-2 text-xs font-black rounded-lg transition-all duration-300 flex items-center gap-2 ${
              activeTab === "PENDING" ? "bg-card text-warning shadow-sm border border-border/50" : "text-text-muted hover:text-text"
            }`}
          >
            <ShieldAlert size={14} />
            PENDING ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-6 py-2 text-xs font-black rounded-lg transition-all duration-300 flex items-center gap-2 ${
              activeTab === "ACTIVE" ? "bg-card text-success shadow-sm border border-border/50" : "text-text-muted hover:text-text"
            }`}
          >
            <CheckCircle size={14} />
            ACTIVE ({activeUsers.length})
          </button>
        </div>
      </div>

      {/* DATA TRAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* PENDING VIEW */}
        {activeTab === "PENDING" && (
          pendingUsers.length === 0 ? (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-border/50 rounded-dashboard bg-card/50">
               <p className="text-sm font-black text-text-muted uppercase tracking-widest">No One Waiting</p>
            </div>
          ) : (
            pendingUsers.map(user => (
              <div key={user._id} className="bg-card p-6 rounded-2xl border border-warning/30 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 px-3 py-1 bg-warning/10 text-warning text-[8px] font-black uppercase rounded-bl-xl border-b border-l border-warning/20">
                  Waiting for Approval
                </div>
                <div>
                  <h3 className="text-lg font-black text-text">{user.name}</h3>
                  <p className="text-xs text-text-muted font-mono mt-1">{user.email}</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-2">Requested Job: {user.role}</p>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-4 border-t border-border/50">
                  <Button variant="ghost" onClick={() => handleDelete(user._id)} disabled={isPending} className="!text-danger hover:bg-danger/10 px-4">
                    <Trash2 size={16} />
                  </Button>
                  <Button onClick={() => handleStatusChange(user._id, true)} disabled={isPending} className="w-full bg-success hover:bg-success/90 text-white font-black tracking-widest text-[10px] uppercase">
                    Grant Access
                  </Button>
                </div>
              </div>
            ))
          )
        )}

        {/* ACTIVE VIEW */}
        {activeTab === "ACTIVE" && (
          activeUsers.map(user => (
            <div key={user._id} className="bg-shaded/30 p-6 rounded-2xl border border-border flex flex-col gap-4 group hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-text">{user.name}</h3>
                  <p className="text-xs text-text-muted font-mono mt-1">{user.email}</p>
                </div>
                <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg border border-primary/20">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" onClick={() => handleStatusChange(user._id, false)} disabled={isPending} className="text-warning hover:bg-warning/10 text-[10px] font-black uppercase">
                  Revoke Access
                </Button>
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
};