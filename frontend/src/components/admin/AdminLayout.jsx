import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../ui/Button";
import { BrandLogo } from "../BrandLogo";
import { Bell, CheckCheck, LogOut, UserPlus } from "lucide-react";
import { AdminSidebar, AdminMobileNav } from "../Sidebar";
import { adminNotificationsApi, usersApi } from "../../lib/api";

function formatRelativeTime(isoDate) {
  if (!isoDate) return "just now";
  const deltaSec = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  if (deltaSec < 60) return `${deltaSec}s ago`;
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`;
  return `${Math.floor(deltaSec / 86400)}d ago`;
}

export function AdminLayout() {
  const { user, token, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsError, setNotifsError] = useState("");
  const [notifMode, setNotifMode] = useState("api");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setNotifsLoading(true);
    setNotifsError("");
    try {
      const data = await adminNotificationsApi.list(token, { limit: 20 });
      setNotifMode("api");
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch (err) {
      if (Number(err?.status) === 404) {
        try {
          const users = await usersApi.list(token);
          const fallbackItems = (Array.isArray(users) ? users : [])
            .filter((u) => String(u?.role || "").toLowerCase() === "user" && u?.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20)
            .map((u) => ({
              _id: `legacy-${u._id}`,
              title: "New user registered",
              message: `${u.name || "User"} joined the system with ${u.email || "unknown email"}`,
              createdAt: u.createdAt,
              isRead: false,
            }));
          setNotifMode("legacy");
          setNotifications(fallbackItems);
          setUnreadCount(fallbackItems.length);
          setNotifsError("");
        } catch (fallbackErr) {
          setNotifsError(fallbackErr?.message || "Failed to load notifications");
        }
      } else {
        setNotifsError(err?.message || "Failed to load notifications");
      }
    } finally {
      setNotifsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 30000);
    return () => clearInterval(t);
  }, [loadNotifications]);

  async function onOpenNotifications() {
    const next = !notifOpen;
    setNotifOpen(next);
    if (!next) return;
    await loadNotifications();
  }

  async function onClickNotification(id, isRead) {
    if (!id || isRead) return;
    if (notifMode === "legacy") {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return;
    }
    try {
      await adminNotificationsApi.markRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore action error
    }
  }

  async function onMarkAllRead() {
    if (notifMode === "legacy") {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return;
    }
    try {
      await adminNotificationsApi.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore action error
    }
  }

  const visibleNotifications = useMemo(
    () => (notifications.length ? notifications : []),
    [notifications]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <BrandLogo className="h-9 w-9 shrink-0" alt="" />
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">Admin</div>
                  <div className="truncate text-xs text-slate-500">{user?.email}</div>
                </div>
              </div>
              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <BrandLogo className="h-9 w-9 shrink-0" alt="" />
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">
                    Welcome, {user?.name || "Admin"}
                  </div>
                  <div className="truncate text-xs text-slate-500">{user?.email}</div>
                </div>
              </div>
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                  aria-label="Open notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>
                <Button onClick={logout} variant="dark" size="sm" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            {notifOpen ? (
              <div className="absolute right-4 top-[68px] z-50 w-[360px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:right-6 lg:right-8">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">New user registrations</p>
                    <p className="text-xs text-slate-500">Admin alerts for newly joined users</p>
                  </div>
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all
                  </button>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {notifsLoading ? (
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Loading notifications...</div>
                  ) : notifsError ? (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600">{notifsError}</div>
                  ) : visibleNotifications.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">No new user notifications yet.</div>
                  ) : (
                    visibleNotifications.map((n) => (
                      <button
                        type="button"
                        key={n._id}
                        onClick={() => onClickNotification(n._id, n.isRead)}
                        className={`w-full rounded-xl p-3 text-left ring-1 transition ${
                          n.isRead
                            ? "bg-white text-slate-600 ring-slate-200"
                            : "bg-sky-50 text-slate-800 ring-sky-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-white ring-1 ring-slate-200">
                            <UserPlus className="h-4 w-4 text-brand-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">{n.title}</p>
                            <p className="mt-1 text-xs">{n.message}</p>
                            <p className="mt-1 text-[11px] font-semibold text-brand-700">
                              {formatRelativeTime(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            <AdminMobileNav />
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
