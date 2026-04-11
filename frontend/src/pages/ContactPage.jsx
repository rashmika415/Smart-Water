import React from "react";
import { Clock3, Mail, MapPin, Navigation, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar, Footer } from "../components/SiteShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/60 via-white to-slate-50">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="public-reveal rounded-3xl border border-slate-200/80 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-5 shadow-sm sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sky-800 ring-1 ring-sky-200">
            <Sparkles className="h-3.5 w-3.5" /> Public Support Center
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Let’s solve your water tracking questions quickly
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Reach our SmartWater team for setup help, product guidance, and account support.
            We usually respond within one business day.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Card className="public-card-hover border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Response Time</div>
              <div className="mt-1 text-2xl font-black text-slate-900">&lt; 24h</div>
            </Card>
            <Card className="public-card-hover border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Support Window</div>
              <div className="mt-1 text-2xl font-black text-slate-900">Mon - Sat</div>
            </Card>
            <Card className="public-card-hover border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Coverage</div>
              <div className="mt-1 text-2xl font-black text-slate-900">Islandwide</div>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-sky-500/20 via-transparent to-emerald-400/15" />
            <img
              src="/contact-us.jpg"
              alt="Customer support representative"
              className="h-[420px] w-full object-cover lg:h-[460px]"
            />

            <div className="absolute left-4 top-4 rounded-xl border border-white/60 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified SmartWater support
              </div>
            </div>
          </div>

          <Card className="public-reveal border border-slate-200/80 p-5 sm:p-6" style={{ animationDelay: "80ms" }}>
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 ring-1 ring-indigo-200">
              Contact form
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Send us a{" "}
              <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                message
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-sm font-normal leading-6 text-slate-600">
              Tell us what you need. The more detail you share, the faster we can help.
            </p>

            <form className="mt-5 space-y-3.5">
              <div>
                <label className="text-sm font-semibold tracking-wide text-slate-800">
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold tracking-wide text-slate-800">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold tracking-wide text-slate-800">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Phone"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold tracking-wide text-slate-800">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="How can we help you today?"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" className="w-full sm:w-auto">Send message</Button>
                <Button type="button" variant="ghost" className="w-full sm:w-auto">Schedule a call</Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="public-card-hover border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-amber-100">
              <MapPin className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Address</div>
            <div className="mt-1 text-xs text-slate-500">Colombo, Sri Lanka</div>
          </Card>

          <Card className="public-card-hover border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-4 text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-sky-100">
              <Phone className="h-4.5 w-4.5 text-cyan-600" />
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Contact</div>
            <div className="mt-1 text-xs text-slate-500">(+94)76 815 00 79</div>
          </Card>

          <Card className="public-card-hover border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-4 text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-emerald-100">
              <Mail className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Email</div>
            <div className="mt-1 text-xs text-slate-500">smartwater@gmail.com</div>
          </Card>

          <Card className="public-card-hover border border-slate-200 bg-gradient-to-br from-slate-50 to-zinc-100 p-4 text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-slate-200">
              <Navigation className="h-4.5 w-4.5 text-slate-600" />
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Business Hours</div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5" /> 8:30 AM - 6:00 PM
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
