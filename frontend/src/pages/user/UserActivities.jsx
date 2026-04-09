import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { activitiesApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Calendar, MapPin, Clock, CheckCircle2, Timer, AlertCircle, Info, Shovel, X, PlusCircle } from "lucide-react";
import clsx from "clsx";

const STATUS_THEMES = {
  Pending: { bg: "bg-amber-50", text: "text-amber-700", border: "ring-amber-100", icon: Timer, label: "Scheduled" },
  "In-Progress": { bg: "bg-sky-50", text: "text-sky-700", border: "ring-sky-100", icon: AlertCircle, label: "In Progress" },
  Completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "ring-emerald-100", icon: CheckCircle2, label: "Finished" },
};

export function UserActivities() {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    activityType: "",
    location: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "12:00",
    notes: "",
  });

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const resp = await activitiesApi.list(token);
      setActivities(resp?.success ? resp.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load maintenance updates");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReportIssue = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      await activitiesApi.create(token, formData);
      setIsModalOpen(false);
      setFormData({
        activityType: "",
        location: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        scheduledTime: "12:00",
        notes: "",
      });
      load(); // Refresh list
    } catch (err) {
      setFormError(err?.message || "Failed to report issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = activities.filter(a => {
    if (filter === "all") return true;
    return a.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="mx-auto max-w-5xl pb-20 px-4 md:px-0">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-700 ring-1 ring-brand-100 mb-3">
             <Shovel className="h-3 w-3" /> System Maintenance
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Maintenance Updates</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Keep track of plumbing repairs, pump maintenance, and system upgrades happening across the network.
            This helps you stay informed about potential service interruptions.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all hover:-translate-y-0.5"
          >
             <PlusCircle className="h-4 w-4" /> Report New Issue
          </Button>

          <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200 w-full sm:w-auto overflow-x-auto">
            {["all", "Pending", "In-Progress", "Completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                  filter === f
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl bg-rose-50 p-4 flex items-start gap-3 ring-1 ring-rose-100">
           <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
           <div>
             <div className="text-sm font-bold text-rose-900">Unable to load updates</div>
             <div className="text-xs text-rose-700 mt-0.5">{error}</div>
             <button onClick={load} className="mt-2 text-xs font-bold text-rose-900 underline underline-offset-2">Try again</button>
           </div>
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-100 ring-1 ring-slate-200" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-20">
             <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400">
                <div className="relative">
                  <Info className="h-6 w-6" />
                  <Shovel className="absolute -bottom-1 -right-1 h-3 w-3" />
                </div>
             </div>
             <div className="mt-4 text-sm font-bold text-slate-900">No updates to show</div>
             <p className="mt-1 text-xs text-slate-500 text-center px-4">There are no maintenance activities matching your filter.</p>
          </div>
        ) : (
          filtered.map((a) => {
            const theme = STATUS_THEMES[a.status] || STATUS_THEMES.Pending;
            const StatusIcon = theme.icon;
            
            return (
              <Card key={a._id} className="relative group overflow-hidden border-none shadow-sm ring-1 ring-slate-200/60 hover:ring-brand-200 hover:shadow-md transition-all duration-300 rounded-3xl p-6">
                <div className="flex items-start justify-between">
                  <div className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1", theme.bg, theme.text, theme.border)}>
                    <StatusIcon className="h-3 w-3" />
                    {theme.label}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {a._id.substring(18)}</div>
                </div>

                <div className="mt-5">
                   <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-700 transition-colors uppercase tracking-tight leading-tight">
                     {a.activityType}
                   </h3>
                   <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 font-medium italic">
                      <MapPin className="h-4 w-4 text-brand-500/70" />
                      {a.location}
                   </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 group-hover:bg-brand-50/50 group-hover:ring-brand-100 transition-colors">
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                         <Calendar className="h-3 w-3" /> Date
                      </div>
                      <div className="text-sm font-black text-slate-700">{a.scheduledDate}</div>
                   </div>
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                         <Clock className="h-3 w-3" /> Time
                      </div>
                      <div className="text-sm font-black text-slate-700">{a.scheduledTime}</div>
                   </div>
                </div>

                {a.notes && (
                  <div className="mt-4">
                     <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1">Update Details</div>
                     <div className="rounded-xl bg-white p-3 text-xs text-slate-600 leading-relaxed shadow-sm ring-1 ring-slate-100">
                        {a.notes}
                     </div>
                  </div>
                )}
                
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-brand-50 rounded-full opacity-0 group-hover:opacity-10 scale-0 group-hover:scale-100 transition-all duration-500" />
              </Card>
            );
          })
        )}
      </div>

      <div className="mt-12 rounded-3xl bg-brand-600 p-8 text-white shadow-xl shadow-brand-200 relative overflow-hidden group cursor-pointer" onClick={() => setIsModalOpen(true)}>
         <div className="relative z-10 transition-transform group-hover:translate-x-1 duration-300">
            <h2 className="text-xl font-black tracking-tight">Need to report a problem?</h2>
            <p className="mt-2 text-sm text-brand-100 max-w-md">
              If you notice a leak or system issue that isn't listed here, please report it immediately so our staff can take action.
            </p>
            <Button variant="white" className="mt-6 text-brand-700 font-black flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg ring-4 ring-brand-500/30">
               <PlusCircle className="h-4 w-4" /> Report Issue Now
            </Button>
         </div>
         <Droplet className="absolute right-[-20px] bottom-[-20px] h-48 w-48 text-white/10 -rotate-12 transition-all group-hover:scale-110 group-hover:rotate-0 duration-500" />
      </div>

      {/* Report Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <Card className="relative w-full max-w-md bg-white p-8 shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Report Problem</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-brand-500" /> Maintenance Request
              </p>
            </div>

            <form onSubmit={handleReportIssue} className="mt-8 space-y-6">
              {formError && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 ring-1 ring-rose-100">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Issue Type</label>
                  <select 
                    required
                    value={formData.activityType}
                    onChange={(e) => setFormData({...formData, activityType: e.target.value})}
                    className="w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-500 transition-all"
                  >
                    <option value="" disabled>Select type</option>
                    <option value="Water Leakage">Water Leakage</option>
                    <option value="Pipe Damage">Pipe Damage</option>
                    <option value="Tank Cleaning">Tank Cleaning</option>
                    <option value="Pump Malfunction">Pump Malfunction</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location</label>
                  <input 
                    required
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Near main building roof"
                    className="w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                    <input 
                      required
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                      className="w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Time</label>
                    <input 
                      required
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                      className="w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Provide some details about the issue..."
                    className="w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-brand-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-100 hover:bg-brand-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Report..." : "Submit Maintenance Report"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function Droplet(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
        </svg>
    )
}
