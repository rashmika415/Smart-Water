import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usersApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { pdfEnsureSpace, pdfFooterLine, pdfHeaderBanner } from "../../lib/adminPdf";
import { Search, Pencil, Trash2, Eye, Download, Users, Shield, UserCircle, RefreshCw } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { jsPDF } from "jspdf";

const ROLE_COLORS = { admin: "#8b5cf6", user: "#0ea5e9", other: "#94a3b8" };

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

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function downloadUsersPdf(list, { filterNote }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toISOString().slice(0, 10);
  let y = pdfHeaderBanner(doc, {
    title: "Users directory",
    subtitle: `Generated ${today}${filterNote ? ` · ${filterNote}` : ""}`,
    left,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Name", left, y);
  doc.text("Email", left + 200, y);
  doc.text("Role", left + 380, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(226, 232, 240);
  doc.line(left, y - 6, pageWidth - left, y - 6);
  y += 8;

  list.forEach((u) => {
    y = pdfEnsureSpace(doc, y, 18, left, pageWidth);
    const name = String(u.name || "—").slice(0, 42);
    const email = String(u.email || "—").slice(0, 36);
    doc.text(name, left, y);
    doc.text(email, left + 200, y);
    doc.text(String(u.role || "—"), left + 380, y);
    y += 16;
  });

  pdfFooterLine(doc, left);
  doc.save(`admin-users-${today}.pdf`);
}

export function ManageUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user", password: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await usersApi.list(token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, query]);

  const stats = useMemo(() => {
    const total = users.length;
    let admins = 0;
    let regular = 0;
    let other = 0;
    users.forEach((u) => {
      const r = String(u.role || "").toLowerCase();
      if (r === "admin") admins += 1;
      else if (r === "user") regular += 1;
      else other += 1;
    });
    return { total, admins, regular, other };
  }, [users]);

  const pieData = useMemo(() => {
    const rows = [
      { name: "Admin", value: stats.admins, key: "admin" },
      { name: "User", value: stats.regular, key: "user" },
    ];
    if (stats.other > 0) rows.push({ name: "Other", value: stats.other, key: "other" });
    return rows.filter((d) => d.value > 0);
  }, [stats]);

  async function handleDelete(u) {
    if (!window.confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    try {
      await usersApi.delete(token, u._id);
      await load();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  }

  function openEdit(u) {
    setEditUser(u);
    setEditForm({
      name: u.name || "",
      email: u.email || "",
      role: u.role || "user",
      password: "",
    });
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const body = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.password.trim()) body.password = editForm.password;
      await usersApi.update(token, editUser._id, body);
      setEditUser(null);
      await load();
    } catch (err) {
      alert(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  function onDownloadPdf() {
    const filterNote = query.trim() ? `Filter: "${query.trim()}" · ${filtered.length} row(s)` : `All users · ${filtered.length} row(s)`;
    downloadUsersPdf(filtered, { filterNote });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Manage users</h1>
          <p className="mt-1 text-sm text-slate-600">Admin-only list with search, view, update, and delete.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" className="gap-2" onClick={onDownloadPdf} disabled={loading || filtered.length === 0}>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button type="button" variant="ghost" className="gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Total users"
          value={String(stats.total)}
          helper="In database"
          icon={Users}
          cardTone="from-sky-50 to-cyan-50 border-sky-100"
          iconTone="bg-sky-100 text-sky-700"
        />
        <SummaryMetric
          label="Administrators"
          value={String(stats.admins)}
          helper="Admin role"
          icon={Shield}
          cardTone="from-violet-50 to-indigo-50 border-violet-100"
          iconTone="bg-violet-100 text-violet-700"
        />
        <SummaryMetric
          label="Standard users"
          value={String(stats.regular)}
          helper="User role"
          icon={UserCircle}
          cardTone="from-emerald-50 to-teal-50 border-emerald-100"
          iconTone="bg-emerald-100 text-emerald-700"
        />
        <SummaryMetric
          label="Shown in table"
          value={String(filtered.length)}
          helper={query.trim() ? "After search filter" : "Same as total"}
          icon={Search}
          cardTone="from-amber-50 to-orange-50 border-amber-100"
          iconTone="bg-amber-100 text-amber-700"
        />
      </div>

      {pieData.length > 0 && stats.total > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card className="border border-slate-200/80 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Role distribution (pie)</h2>
            <p className="mt-1 text-xs text-slate-500">Share of accounts by role (all users).</p>
            <div className="mt-4 h-[260px] w-full min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={ROLE_COLORS[entry.key] || ROLE_COLORS.other} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} users`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="border border-slate-200/80 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Role counts (bar)</h2>
            <p className="mt-1 text-xs text-slate-500">Same data as a bar chart for quick comparison.</p>
            <div className="mt-4 h-[260px] w-full min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} users`, "Count"]} />
                  <Bar dataKey="value" name="Users" radius={[8, 8, 0, 0]}>
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={ROLE_COLORS[entry.key] || ROLE_COLORS.other} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none ring-brand-300 focus:ring-2"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      <Card className="mt-6 overflow-hidden border border-slate-200/80 p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewUser(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {viewUser ? (
        <Modal title="User details" onClose={() => setViewUser(null)}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">ID</dt>
              <dd className="font-mono text-xs text-slate-800">{viewUser._id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{viewUser.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-800">{viewUser.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Role</dt>
              <dd className="text-slate-800">{viewUser.role}</dd>
            </div>
            {viewUser.createdAt ? (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-slate-800">{new Date(viewUser.createdAt).toLocaleString()}</dd>
              </div>
            ) : null}
          </dl>
        </Modal>
      ) : null}

      {editUser ? (
        <Modal title="Edit user" onClose={() => setEditUser(null)}>
          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <select
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">New password (optional)</label>
              <input
                type="password"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={editForm.password}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
