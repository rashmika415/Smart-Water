import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usersApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">My profile</h1>
      <p className="mt-1 text-sm text-slate-600">View your account details and update profile information.</p>

      <Card className="mt-6 p-6">
        <div className="grid gap-2 text-sm">
          <div><span className="font-semibold text-slate-700">Role:</span> {user?.role || "user"}</div>
          <div><span className="font-semibold text-slate-700">User ID:</span> <span className="font-mono text-xs">{user?._id}</span></div>
        </div>
      </Card>

      <Card className="mt-4 p-6">
        {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Name</label>
            <input className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input type="email" className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">New password (optional)</label>
            <input type="password" className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Leave blank to keep current password" />
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </form>
      </Card>
    </div>
  );
}
