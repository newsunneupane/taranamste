"use client";

import React, { useActionState, useEffect, useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, Trash2, Edit3, KeyRound, Save, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { FormField } from "@/components/molecules/FormField";
import { updateUserStatus, deleteUser, createUserWithPermissions, updateUserPermissions, updateUserDetails, resetUserPassword } from "@/app/actions/users";
import { PAGE_GROUPS, PAGE_LABELS, PAGE_KEYS, type PermissionsMap } from "@/lib/permission";

function emptyPerms(): PermissionsMap {
  const m: PermissionsMap = {};
  for (const k of PAGE_KEYS) m[k] = { read: false, write: false };
  return m;
}

function PermMatrix({ value, onChange, disabled }: { value: PermissionsMap; onChange: (v: PermissionsMap) => void; disabled?: boolean }) {
  const toggle = (key: string, field: "read" | "write") => {
    const cur = value[key] || { read: false, write: false };
    let next = { ...cur } as any;
    if (field === "write") {
      next.write = !cur.write;
      if (next.write) next.read = true;
    } else {
      next.read = !cur.read;
      if (!next.read) next.write = false;
    }
    onChange({ ...value, [key]: next });
  };
  return (
    <div className="space-y-4">
      {PAGE_GROUPS.map((g) => (
        <div key={g.label} className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-black tracking-[0.18em] text-primary/70 uppercase mb-2">{g.label}</p>
          <div className="space-y-1.5">
            {g.keys.map((k) => {
              const p = value[k] || { read: false, write: false };
              return (
                <label key={k} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-shaded/50 border border-transparent hover:border-border transition-colors">
                  <span className="text-[12px] font-semibold text-text">{PAGE_LABELS[k] || k}</span>
                  <span className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <input type="checkbox" checked={!!p.read} onChange={() => toggle(k, "read")} disabled={disabled} className="h-4 w-4 accent-primary" />
                      <span className="text-[11px] font-bold text-text-muted">Read</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <input type="checkbox" checked={!!p.write} onChange={() => toggle(k, "write")} disabled={disabled} className="h-4 w-4 accent-primary" />
                      <span className="text-[11px] font-bold text-text-muted">Write</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export const UserManagement = ({ pendingUsers, activeUsers }: { pendingUsers: any[]; activeUsers: any[] }) => {
  const all = [...pendingUsers, ...activeUsers];
  const [activeTab, setActiveTab] = useState<"PENDING" | "ACTIVE" | "CREATE">("ACTIVE");
  const [isPendingT, startTransition] = useTransition();

  // create form
  const [perms, setPerms] = useState<PermissionsMap>(emptyPerms());
  const [createState, createAction, isCreating] = useActionState(createUserWithPermissions as any, { success: false, error: null });

  useEffect(() => {
    if (createState?.success) {
      setPerms(emptyPerms());
      // reset form via DOM
      const f = document.getElementById("create-user-form") as HTMLFormElement | null;
      f?.reset();
    }
  }, [createState?.success]);

  // per-user editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [permEditId, setPermEditId] = useState<string | null>(null);
  const [permEditVal, setPermEditVal] = useState<PermissionsMap>(emptyPerms());
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");

  const startEdit = (u: any) => {
    setEditingId(u._id);
    setEditName(u.name || "");
    setEditEmail(u.email || "");
    setEditPhone(u.phone || "");
  };
  const startPermEdit = (u: any) => {
    setPermEditId(u._id);
    const base = emptyPerms();
    const cur = (u.permissions || {}) as PermissionsMap;
    for (const k of Object.keys(cur)) base[k] = { read: !!cur[k].read, write: !!cur[k].write };
    setPermEditVal(base);
  };

  const handleStatusChange = (id: string, status: boolean) => {
    startTransition(async () => { await updateUserStatus(id, status); });
  };
  const handleDelete = (id: string) => {
    if (confirm("Delete this user permanently?")) startTransition(async () => { await deleteUser(id); });
  };
  const saveDetails = (id: string) => {
    startTransition(async () => {
      const r: any = await updateUserDetails(id, { name: editName, email: editEmail, phone: editPhone });
      if (r?.success) setEditingId(null);
      else alert(r?.error || "Failed");
    });
  };
  const savePerms = (id: string) => {
    startTransition(async () => {
      const r: any = await updateUserPermissions(id, permEditVal);
      if (r?.success) setPermEditId(null);
      else alert(r?.error || "Failed");
    });
  };
  const doReset = (id: string) => {
    if (!newPass || newPass.length < 6) { alert("Password must be >=6 chars"); return; }
    startTransition(async () => {
      const r: any = await resetUserPassword(id, newPass);
      if (r?.success) { setResetId(null); setNewPass(""); alert("Password reset."); }
      else alert(r?.error || "Failed");
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-dashboard border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text uppercase tracking-widest">Team Members</h2>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter mt-1 opacity-70">SuperAdmin — create every account, set passwords, set Read/Write per page</p>
          </div>
        </div>
        <div className="flex bg-shaded p-1 rounded-xl border border-border shrink-0">
          <button onClick={() => setActiveTab("ACTIVE")} className={`px-5 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 ${activeTab === "ACTIVE" ? "bg-card text-success shadow-sm border border-border/50" : "text-text-muted hover:text-text"}`}>
            <CheckCircle size={14} /> ACTIVE ({activeUsers.length})
          </button>
          <button onClick={() => setActiveTab("PENDING")} className={`px-5 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 ${activeTab === "PENDING" ? "bg-card text-warning shadow-sm border border-border/50" : "text-text-muted hover:text-text"}`}>
            <ShieldAlert size={14} /> PENDING ({pendingUsers.length})
          </button>
          <button onClick={() => setActiveTab("CREATE")} className={`px-5 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 ${activeTab === "CREATE" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"}`}>
            + Create
          </button>
        </div>
      </div>

      {activeTab === "CREATE" && (
        <form id="create-user-form" action={createAction} className="bg-card rounded-2xl border border-border p-5 md:p-6 space-y-5 shadow-sm">
          <input type="hidden" name="permissions" value={JSON.stringify(perms)} />
          <h3 className="text-[11px] font-black tracking-[0.2em] text-primary/70 uppercase">Create New Account — ID &amp; Password controlled by SuperAdmin</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Full Name (staff name)" name="name" required placeholder="e.g. Ram Thapa" />
            <FormField label="Email (login ID)" name="email" type="email" required placeholder="name@example.com" />
            <FormField label="Phone" name="phone" placeholder="98XXXXXXXX" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Password" name="password" type="password" required placeholder="min 6 chars" />
            <FormField label="Confirm Password" name="confirmPassword" type="password" required placeholder="repeat password" />
          </div>
          <div>
            <p className="text-[11px] font-black tracking-[0.14em] text-text-muted uppercase mb-2">Permissions — check Read and/or Write for each page (Write implies Read)</p>
            <PermMatrix value={perms} onChange={setPerms} />
          </div>
          {createState?.error && <p className="text-xs font-bold text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{createState.error}</p>}
          {createState?.success && <p className="text-xs font-bold text-success bg-success/10 border border-success/20 rounded-xl px-3 py-2">Account created and active.</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isCreating} className="px-8">{isCreating ? "Creating..." : "Create Account"}</Button>
          </div>
          <p className="text-[11px] text-text-muted">All other staff are made by admin here. Roles are now these per-page Read/Write checkboxes — no SAMITY/STAFF/TEACHER dropdown.</p>
        </form>
      )}

      {activeTab === "PENDING" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingUsers.length === 0 ? (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-border/50 rounded-dashboard bg-card/50"><p className="text-sm font-black text-text-muted uppercase tracking-widest">No One Waiting</p></div>
          ) : pendingUsers.map((user) => (
            <div key={user._id} className="bg-card p-5 rounded-2xl border border-warning/30 shadow-sm flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-black text-text">{user.name}</h3>
                <p className="text-xs text-text-muted font-mono mt-1">{user.email}</p>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Legacy role: {user.role} {user.isSuperAdmin ? "· SuperAdmin" : ""}</p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                <Button variant="ghost" onClick={() => handleDelete(user._id)} disabled={isPendingT} className="!text-danger hover:bg-danger/10 px-4"><Trash2 size={16} /></Button>
                <Button onClick={() => handleStatusChange(user._id, true)} disabled={isPendingT} className="w-full bg-success hover:bg-success/90 text-white font-black tracking-widest text-[10px] uppercase">Grant Access</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "ACTIVE" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeUsers.length === 0 && <div className="col-span-full p-8 text-center text-sm text-text-muted">No active accounts.</div>}
          {activeUsers.map((user) => (
            <div key={user._id} className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-4 group hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  {editingId === user._id ? (
                    <div className="space-y-3">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
                      <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
                      <div className="flex gap-2">
                        <Button onClick={() => saveDetails(user._id)} disabled={isPendingT} className="px-4"><Save size={14} /> Save</Button>
                        <Button variant="ghost" onClick={() => setEditingId(null)}><X size={14} /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-[13px] font-black text-text truncate">{user.name} {user.isSuperAdmin && <span className="ml-2 px-2 py-0.5 bg-primary text-white text-[9px] rounded-full align-middle">SUPERADMIN</span>}</h3>
                      <p className="text-xs text-text-muted font-mono mt-1 truncate">{user.email}</p>
                      {user.phone && <p className="text-xs text-text-muted mt-0.5">{user.phone}</p>}
                      <p className="text-[10px] text-text-muted mt-1">Staff name is editable by SuperAdmin — use Edit.</p>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {user.isSuperAdmin ? (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-lg border border-primary/20">SuperAdmin</span>
                  ) : (
                    <span className="px-2 py-1 bg-shaded text-text-muted text-[9px] font-black uppercase rounded-lg border border-border">{Object.values(user.permissions || {}).filter((p: any) => p?.read || p?.write).length} pages</span>
                  )}
                </div>
              </div>

              {!user.isSuperAdmin && permEditId !== user._id && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(user.permissions || {}).filter(([_, p]: any) => (p as any)?.read || (p as any)?.write).map(([k, p]: any) => (
                    <span key={k} className={`px-2 py-1 rounded-full text-[10px] font-bold border ${p.write ? "bg-success/10 text-success border-success/20" : "bg-shaded text-text-muted border-border"}`}>{PAGE_LABELS[k] || k}: {p.write ? "Read+Write" : "Read"}</span>
                  ))}
                  {Object.keys(user.permissions || {}).length === 0 && <span className="text-[11px] text-warning font-bold">No permissions — set via Edit Permissions</span>}
                </div>
              )}

              {permEditId === user._id && (
                <div className="rounded-xl border border-primary/20 bg-shaded/20 p-3 space-y-3">
                  <PermMatrix value={permEditVal} onChange={setPermEditVal} />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setPermEditId(null)}>Cancel</Button>
                    <Button onClick={() => savePerms(user._id)} disabled={isPendingT}>Save Permissions</Button>
                  </div>
                </div>
              )}

              {resetId === user._id && (
                <div className="rounded-xl border border-border bg-shaded/20 p-3 flex gap-2 items-center">
                  <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password (min 6)" className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm" />
                  <Button onClick={() => doReset(user._id)} disabled={isPendingT}>Set</Button>
                  <Button variant="ghost" onClick={() => setResetId(null)}>Cancel</Button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                {editingId !== user._id && !user.isSuperAdmin && <Button variant="ghost" onClick={() => startEdit(user)} className="text-[11px]"><Edit3 size={14} /> Edit name/email</Button>}
                {!user.isSuperAdmin && permEditId !== user._id && <Button variant="ghost" onClick={() => startPermEdit(user)} className="text-[11px]"><ShieldCheck size={14} /> Edit Permissions</Button>}
                {!user.isSuperAdmin && <Button variant="ghost" onClick={() => { setResetId(user._id); setNewPass(""); }} className="text-[11px]"><KeyRound size={14} /> Reset Password</Button>}
                {!user.isSuperAdmin && <Button variant="ghost" onClick={() => handleStatusChange(user._id, false)} disabled={isPendingT} className="text-warning text-[11px]">Revoke</Button>}
                {!user.isSuperAdmin && <Button variant="ghost" onClick={() => handleDelete(user._id)} disabled={isPendingT} className="!text-danger text-[11px]"><Trash2 size={14} /> Delete</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
