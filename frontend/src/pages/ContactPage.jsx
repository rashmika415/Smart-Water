import React from "react";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { Navbar, Footer } from "../components/SiteShell";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-sky-100/40">
      <Navbar />

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-sky-500/20 via-transparent to-blue-600/15" />
            <img
              src="/contact-us.jpg"
              alt="Customer support representative"
              className="h-[420px] w-full object-cover lg:h-[460px]"
            />
          </div>

          <div className="p-2 sm:p-3">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 ring-1 ring-indigo-200">
              Contact Support
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Send us a{" "}
              <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                message
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-sm font-normal leading-6 text-slate-400">
              Your satisfaction is our top priority, and we are committed to providing exceptional service and support
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
                  Phone Number <span className="text-rose-500">*</span>
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
                <input
                  type="text"
                  placeholder="Message"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white/95 px-3.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <button
                type="button"
                className="h-10 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-sm font-semibold tracking-wide text-white shadow-md transition hover:brightness-110"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-amber-50">
              <MapPin className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Address</div>
            <div className="mt-1 text-xs text-slate-500">Colombo,Sri Lanka</div>
          </div>

          <div className="text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-cyan-50">
              <Phone className="h-4.5 w-4.5 text-cyan-600" />
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Contact</div>
            <div className="mt-1 text-xs text-slate-500">(+94)76 815 00 79</div>
          </div>

          <div className="text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-emerald-50">
              <Mail className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Email</div>
            <div className="mt-1 text-xs text-slate-500">smartwater@gmail.com</div>
          </div>

          <div className="text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-fuchsia-50">
              <Navigation className="h-4.5 w-4.5 text-fuchsia-500" />
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Google Map</div>
            <div className="mt-1 text-xs text-slate-500">
              Discover our prime location{" "}
              <a href="#contact" className="font-medium text-blue-600 hover:text-blue-700">
                View More
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
