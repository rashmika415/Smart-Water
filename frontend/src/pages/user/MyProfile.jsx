import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usersApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { UserCircle2, Mail, ShieldCheck, KeyRound, Save, BadgeCheck, Fingerprint, Sparkles } from "lucide-react";

export function MyProfile() {
  const { user, token, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (!user?._id) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = { name, email };
      if (password.trim()) payload.password = password;
      await usersApi.update(token, user._id, payload);
      await refreshMe(token);
      setPassword("");
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-brand-200/40 bg-gradient-to-br from-brand-600 via-cyan-600 to-sky-600 p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">User Account Center</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">My Profile</h1>
            <p className="mt-2 text-sm text-cyan-50/95">Manage identity, login details, and account security.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/20">
            <ShieldCheck className="h-4 w-4" />
            Secure profile area
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
              <UserCircle2 className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</p>
              <p className="text-sm font-bold text-slate-900">{user?.name || "-"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
              <Mail className="h-5 w-5 text-sky-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</p>
              <p className="text-sm font-bold text-slate-900">{user?.email || "-"}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Role</p>
          <div className="mt-3 flex items-center gap-2 text-slate-900">
            <BadgeCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-extrabold capitalize">{user?.role || "user"}</span>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security Status</p>
          <div className="mt-3 flex items-center gap-2 text-slate-900">
            <ShieldCheck className="h-5 w-5 text-brand-700" />
            <span className="text-sm font-extrabold">Protected account</span>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile ID</p>
          <div className="mt-3 flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-violet-600" />
            <span className="truncate font-mono text-xs text-slate-700">{user?._id || "-"}</span>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-brand-700" />
          <h2 className="text-lg font-extrabold text-slate-900">Update Profile</h2>
        </div>
        {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Name</label>
            <input className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input type="email" className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700">New password (optional)</label>
            <input type="password" className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Leave blank to keep current password" />
            <p className="mt-1 text-xs text-slate-500">Use at least 6 characters for better account security.</p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="border border-brand-100 bg-gradient-to-r from-brand-50/80 to-cyan-50/80 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-brand-100">
            <Sparkles className="h-5 w-5 text-brand-700" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Profile tip</p>
            <p className="mt-1 text-sm text-slate-700">
              Keep your email and name updated so household notifications and account recovery work smoothly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
