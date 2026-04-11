import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usersApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { UserCircle2, Mail, ShieldCheck, KeyRound, Save, BadgeCheck, Fingerprint, Sparkles } from "lucide-react";

function SummaryMetric({ label, value, helper, icon: Icon, cardTone = "from-sky-50 to-cyan-50 border-sky-100", iconTone = "bg-sky-100 text-sky-700" }) {
  return (
    <Card className={`border bg-gradient-to-br p-4 ${cardTone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</div>
          {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

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
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">My profile</h1>
          <p className="mt-1 text-sm text-slate-600">Manage identity, login details, and account security.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Secure account area
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SummaryMetric
          label="Full name"
          value={user?.name || "—"}
          helper="Displayed across the app"
          icon={UserCircle2}
          cardTone="from-sky-50 to-cyan-50 border-sky-100"
          iconTone="bg-sky-100 text-sky-700"
        />
        <SummaryMetric
          label="Email"
          value={user?.email || "—"}
          helper="Login & notifications"
          icon={Mail}
          cardTone="from-violet-50 to-indigo-50 border-violet-100"
          iconTone="bg-violet-100 text-violet-700"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Role"
          value={(user?.role || "user").replace(/\b\w/g, (c) => c.toUpperCase())}
          helper="Access level"
          icon={BadgeCheck}
          cardTone="from-emerald-50 to-lime-50 border-emerald-100"
          iconTone="bg-emerald-100 text-emerald-700"
        />
        <SummaryMetric
          label="Security"
          value="Protected"
          helper="JWT session"
          icon={ShieldCheck}
          cardTone="from-amber-50 to-orange-50 border-amber-100"
          iconTone="bg-amber-100 text-amber-700"
        />
        <SummaryMetric
          label="Account status"
          value={user?._id ? "Active" : "—"}
          helper="Signed in"
          icon={Sparkles}
          cardTone="from-cyan-50 to-sky-50 border-cyan-100"
          iconTone="bg-cyan-100 text-cyan-700"
        />
        <SummaryMetric
          label="Profile ID"
          value={user?._id ? "Stored" : "—"}
          helper="See below"
          icon={Fingerprint}
          cardTone="from-slate-50 to-zinc-100 border-slate-200"
          iconTone="bg-slate-200 text-slate-700"
        />
      </div>
      {user?._id ? (
        <Card className="mt-3 border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Full profile ID</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-700">{String(user._id)}</p>
        </Card>
      ) : null}

      <Card className="mt-6 border border-slate-200/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-brand-700">
            <KeyRound className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Update profile</h2>
            <p className="text-xs text-slate-500">Change name, email, or password</p>
          </div>
        </div>
        {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div> : null}
        {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">{message}</div> : null}
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
            <input className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <input type="email" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">New password (optional)</label>
            <input type="password" className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} placeholder="Leave blank to keep current password" />
            <p className="mt-1 text-xs text-slate-500">At least 6 characters.</p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-5 border border-sky-100 bg-gradient-to-br from-sky-50/90 to-cyan-50/60 p-5 ring-1 ring-sky-100/80">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-700 ring-1 ring-sky-100">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Profile tip</p>
            <p className="mt-1 text-sm text-slate-600">
              Keep your email and name updated so household notifications and account recovery work smoothly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
