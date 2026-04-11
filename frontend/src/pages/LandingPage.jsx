import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BadgePercent,
  BarChart3,
  BellRing,
  Droplet,
  Leaf,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Navbar, Footer } from "../components/SiteShell";
import { BrandLogo } from "../components/BrandLogo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

function Wave({ flip = false }) {
  return (
    <div className={flip ? "rotate-180" : ""} aria-hidden="true">
      <svg viewBox="0 0 1440 120" className="h-[84px] w-full" preserveAspectRatio="none">
        <path
          d="M0,64 C240,120 360,10 720,64 C1080,118 1200,20 1440,74 L1440,120 L0,120 Z"
          fill="rgba(14, 116, 144, 0.08)"
        />
        <path
          d="M0,54 C240,108 360,14 720,54 C1080,94 1200,18 1440,64 L1440,120 L0,120 Z"
          fill="rgba(34, 211, 238, 0.16)"
        />
      </svg>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-left">
      <div className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, body, iconBg }) {
  const getIconStyles = () => {
    switch(iconBg) {
      case 'blue':
        return "bg-blue-100 text-blue-600";
      case 'light-green':
        return "bg-green-50 text-green-600";
      case 'green':
        return "bg-emerald-100 text-emerald-600";
      case 'neutral':
        return "bg-white text-slate-700 ring-1 ring-slate-200/80";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
      <Card className="h-full p-6 bg-white shadow-md border border-gray-100">
        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 place-items-center rounded-xl ${getIconStyles()}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900">{title}</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">{body}</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function TipCard({ icon: Icon, title, body, save }) {
  return (
    <Card className="p-5 hover:shadow-glow transition">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-slate-200/70">
          <Icon className="h-5 w-5 text-brand-700" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-slate-900">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-600">{body}</div>
          <div className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            {save}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PricingCard({ name, price, tagline, bullets, cta, highlighted }) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={highlighted ? "lg:-mt-6" : ""}
    >
      <Card className="relative overflow-hidden p-7 bg-white shadow-md border border-gray-100">
        {highlighted ? (
          <div className="absolute right-6 top-6 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700 shadow-sm">
            Most Popular
          </div>
        ) : null}

        <div className="text-sm font-extrabold text-slate-900">{name}</div>
        <div className="mt-2 text-sm text-slate-600">{tagline}</div>

        <div className="mt-5 flex items-end gap-2">
          <div className="text-4xl font-extrabold tracking-tight text-slate-900">{price}</div>
          <div className="pb-1 text-sm text-slate-500">{price === "Free" ? "forever" : "/month"}</div>
        </div>

        <div className="mt-6 space-y-3">
          {bullets.map((b) => (
            <div key={b} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 inline-block h-5 w-5 rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <span className="grid h-5 w-5 place-items-center text-emerald-700">✓</span>
              </span>
              <span>{b}</span>
            </div>
          ))}
        </div>

        <div className="mt-7">
          <Button className="w-full" variant={highlighted ? "primary" : "outline"}>
            {cta}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function Testimonial({ quote, name, title }) {
  return (
    <Card className="p-7">
      <div className="text-4xl leading-none text-brand-300">“</div>
      <div className="mt-2 text-sm leading-7 text-slate-600">{quote}</div>
      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-sky-100 ring-1 ring-slate-200/70">
          <Users className="h-5 w-5 text-brand-700" />
        </div>
        <div>
          <div className="text-sm font-extrabold text-slate-900">{name}</div>
          <div className="text-xs text-slate-500">{title}</div>
        </div>
      </div>
    </Card>
  );
}

export function LandingPage() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/70 shadow-sm">
                <Sparkles className="h-4 w-4 text-brand-600" />
                Smart tracking for everyday households
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Track Your Water, <br />
                <span className="bg-gradient-to-r from-brand-700 to-sky-500 bg-clip-text text-transparent">
                  Save The Planet
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Monitor your household water consumption in real-time, get personalized conservation
                tips, and create saving plans that help you reduce usage by up to 40%.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg">Start Tracking Free</Button>
                <Button size="lg" variant="ghost">
                  Watch Demo
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-8">
                <Stat value="25K+" label="Households" />
                <Stat value="40%" label="Avg. Savings" />
                <Stat value="5M+" label="Liters Saved" />
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-brand-200/50 via-sky-200/30 to-white/10 blur-2xl" />

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative rounded-[34px] overflow-hidden shadow-glow"
              >
                <img 
                  src="/3.jpg" 
                  alt="SmartWater hero"
                  className="w-full h-auto object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Wave />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-emerald-100 px-6 py-3 text-sm font-bold text-emerald-700 ring-2 ring-emerald-200 shadow-lg">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                Features
              </span>
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent bg-clip-text">Save Water</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Comprehensive tools to monitor, analyze, and reduce your household water consumption
              effectively.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={BrandLogo}
              title="Virtual Water Meter"
              body="Track your real-time water consumption with our smart virtual meter. Get instant readings for every tap and appliance."
              iconBg="neutral"
            />
            <FeatureCard
              icon={Leaf}
              title="Conservation Tips"
              body="Receive personalized water-saving tips based on your usage patterns. Learn easy ways to reduce consumption daily."
              iconBg="green"
            />
            <FeatureCard
              icon={BadgePercent}
              title="Saving Plans"
              body="Set water-saving goals and track your progress. Our smart plans help you reduce usage by up to 40%."
              iconBg="light-green"
            />
            <FeatureCard
              icon={BarChart3}
              title="Usage Analytics"
              body="Detailed charts and reports showing your daily, weekly, and monthly water consumption trends."
              iconBg="blue"
            />
            <FeatureCard
              icon={BellRing}
              title="Smart Alerts"
              body="Get notified about unusual usage, leaks, or when you exceed your daily water budget."
              iconBg="light-green"
            />
            <FeatureCard
              icon={Users}
              title="Family Tracking"
              body="Monitor water usage for your entire household. Set individual goals for each family member."
              iconBg="green"
            />
          </div>
        </div>
      </section>

      <Wave flip />

      {/* Virtual Meter */}
      <section id="virtual-meter" className="relative">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-brand-200/60 to-sky-200/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl">
                <img 
                  src="/virtualmeter.jpg" 
                  alt="Virtual Water Meter Display"
                  className="w-full h-auto object-cover"
                />
                
                {/* Animated Info Cards Overlay */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse shadow-lg"></div>
                    <div className="text-sm font-bold text-white">Active</div>
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <Droplet className="h-5 w-5 text-emerald-600 animate-bounce" />
                    <div className="text-xl font-bold text-emerald-700">2.4 L/min</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-emerald-200">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-emerald-700 mb-2">Daily Goal</div>
                    <div className="text-2xl font-bold text-emerald-600">70%</div>
                    <div className="text-xs text-emerald-600/80">84/120L</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-emerald-600 animate-bounce" />
                    <div className="text-sm font-semibold text-emerald-700">Optimal</div>
                  </div>
                </div>
                
                {/* Corner Status Card */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full p-3 shadow-2xl animate-bounce">
                  <div className="text-center">
                    <Zap className="h-6 w-6 text-white mb-1" />
                    <div className="text-xs font-bold text-white">Smart</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-100 to-green-100 px-6 py-3 text-sm font-bold text-emerald-700 ring-2 ring-emerald-200 shadow-lg">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                  Virtual Meter
                </span>
              </div>
              <h3 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Real-Time Water{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent bg-clip-text">Monitoring</span>
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Our virtual water meter gives you instant visibility into your household's water
                usage. Track consumption patterns, identify waste, and take control of your water
                footprint.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Per-Tap Tracking",
                    body: "Monitor each water source individually.",
                    logo: true,
                  },
                  { title: "Leak Detection", body: "Instant alerts for unusual flow.", Icon: ShieldCheck },
                  { title: "Usage History", body: "Compare trends over time.", Icon: Activity },
                  { title: "Live Dashboard", body: "Real-time updates every second.", Icon: BarChart3 },
                ].map((x) => (
                  <Card key={x.title} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-slate-200/70">
                        {x.logo ? (
                          <BrandLogo className="h-6 w-6" alt="" />
                        ) : (
                          <x.Icon className="h-5 w-5 text-brand-700" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">{x.title}</div>
                        <div className="mt-1 text-sm text-slate-600">{x.body}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conservation tips */}
      <section id="conservation" className="bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-100 to-green-100 px-6 py-3 text-sm font-bold text-emerald-700 ring-2 ring-emerald-200 shadow-lg">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                  Conservation Tips
                </span>
              </div>
              <h3 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Smart Ways to{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent bg-clip-text">Save Water</span>
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Small changes in daily habits can lead to significant water savings. Our
                personalized tips help you reduce consumption without sacrificing comfort.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <TipCard
                  icon={Activity}
                  title="Shorter Showers"
                  body="Reduce shower time by 2 minutes to save up to 20 liters per shower."
                  save="Save 20L/day"
                />
                <TipCard
                  icon={ShieldCheck}
                  title="Full Loads Only"
                  body="Run washing machines only with full loads to maximize efficiency."
                  save="Save 50L/week"
                />
                <TipCard
                  icon={Leaf}
                  title="Smart Dishwashing"
                  body="Use a basin instead of running water when washing dishes by hand."
                  save="Save 15L/day"
                />
                <TipCard
                  icon={BrandLogo}
                  title="Garden Wisely"
                  body="Water plants early morning or evening to reduce evaporation."
                  save="Save 30L/week"
                />
              </div>

              </div>

            <div className="relative">
              <div className="absolute -inset-8 rounded-[48px] bg-gradient-to-br from-emerald-200/60 to-sky-200/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl">
                <img 
                  src="/2.jpg" 
                  alt="Conservation Tips Display"
                  className="w-full h-auto object-cover"
                />
                
                {/* Animated Info Cards Overlay */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse shadow-lg"></div>
                    <div className="text-sm font-bold text-white">Active</div>
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <Droplet className="h-5 w-5 text-emerald-600 animate-bounce" />
                    <div className="text-xl font-bold text-emerald-700">15 Tips</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-emerald-200">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-emerald-700 mb-2">Monthly</div>
                    <div className="text-2xl font-bold text-emerald-600">250L</div>
                    <div className="text-xs text-emerald-600/80">Saved</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-xl px-4 py-3 shadow-2xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-emerald-600 animate-bounce" />
                    <div className="text-sm font-semibold text-emerald-700">Efficient</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Saving plans */}
      <section id="plans" className="relative">
        <div className="mt-6">
          <Wave />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-6 py-3 text-sm font-bold text-indigo-700 ring-2 ring-indigo-200 shadow-lg">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  Saving Plans
                </span>
            </div>
            <h3 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Choose Your <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent bg-clip-text">Saving Plan</span>
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Select the plan that fits your household needs and start saving water today.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-end">
            <PricingCard
              name="Starter"
              price="Free"
              tagline="Perfect for individuals starting their water-saving journey."
              bullets={[
                "Basic water meter tracking",
                "Daily usage reports",
                "5 conservation tips/week",
                "Email notifications",
                "Basic analytics dashboard",
              ]}
              cta="Get Started"
            />
            <PricingCard
              name="Family"
              price="$9"
              tagline="Ideal for households wanting to maximize their savings."
              highlighted
              bullets={[
                "Unlimited device tracking",
                "Real-time leak detection",
                "Personalized saving plans",
                "Family member profiles",
                "Advanced analytics & reports",
                "Priority support",
              ]}
              cta="Start 14-Day Trial"
            />
            <PricingCard
              name="Community"
              price="$29"
              tagline="For neighborhoods and housing complexes."
              bullets={[
                "Up to 50 households",
                "Community leaderboard",
                "Collective saving goals",
                "Admin dashboard",
                "Custom reports & exports",
                "API access",
              ]}
              cta="Contact Sales"
            />
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            All plans include a 30-day money-back guarantee. No credit card required for free tier.
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 text-sm font-bold text-purple-700 ring-2 ring-purple-200 shadow-lg">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                  Testimonials
                </span>
            </div>
            <h3 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Trusted by <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent bg-clip-text">Thousands</span> of Families
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              See how households across the country are saving water and money with SmartWater.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <Testimonial
              quote="SmartWater helped us reduce our water bill by 35% in just two months! The virtual meter makes it so easy to spot where we were wasting water."
              name="Sarah Mitchell"
              title="Homeowner, California"
            />
            <Testimonial
              quote="As someone who works in sustainability, I recommend SmartWater to all my clients. The conservation tips are science-backed and actually work."
              name="David Chen"
              title="Environmental Engineer"
            />
            <Testimonial
              quote="Teaching my kids about water conservation has become so much easier with SmartWater. They love tracking their progress and earning badges!"
              name="Emily Rodriguez"
              title="Mother of Three"
            />
          </div>

          <div className="mt-14 grid gap-6 rounded-3xl bg-white/70 p-8 ring-1 ring-slate-200/70 sm:grid-cols-4 sm:items-center">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-brand-700">25,000+</div>
              <div className="text-xs text-slate-500">Active Households</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-brand-700">5M+</div>
              <div className="text-xs text-slate-500">Liters Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-brand-700">4.9/5</div>
              <div className="text-xs text-slate-500">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-brand-700">40%</div>
              <div className="text-xs text-slate-500">Avg. Water Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-gradient-to-br from-blue-50 to-sky-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden p-10 sm:p-12 bg-white shadow-lg">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-brand-200/60 to-sky-200/20 blur-2xl" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-gradient-to-br from-sky-200/40 to-brand-200/10 blur-2xl" />

            <div className="relative mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <BrandLogo className="h-16 w-16" alt="" />
              </div>
              <h3 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Ready to Start <span className="text-brand-700">Saving Water?</span>
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Join thousands of households already conserving water and reducing their bills. Start
                tracking your water usage today — it’s free to get started!
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg">Get Started Free</Button>
                <Button size="lg" variant="ghost">
                  Contact Sales
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  No credit card required
                </div>
                <div className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                  14-day trial
                </div>
                <div className="inline-flex items-center gap-2">
                  <BadgePercent className="h-4 w-4 text-sky-600" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}

