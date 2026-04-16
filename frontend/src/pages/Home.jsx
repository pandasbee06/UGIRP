import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = {
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
      <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{label}</div>
    </div>
  );
}

function FeatureCard({ title, body }) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-950">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{body}</div>
      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />
      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Premium-ready UI • Extendable components</div>
    </div>
  );
}

function Step({ n, title, body }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-2xl bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
          {n}
        </div>
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
      </div>
      <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{body}</div>
    </div>
  );
}

function Testimonial({ name, role, quote }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="text-sm text-slate-700 dark:text-slate-200">“{quote}”</div>
      <div className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">{name}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{role}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-[520px] max-w-6xl blur-3xl">
        <div className="h-full w-full bg-gradient-to-br from-sky-400/25 via-fuchsia-400/20 to-emerald-400/20 dark:from-sky-400/15 dark:via-fuchsia-400/10 dark:to-emerald-400/10" />
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:px-6">
        {/* Hero */}
        <section className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <Motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Government-ready grievance intake starter
            </Motion.div>

            <Motion.h1
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
              className="text-balance text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl"
            >
              Smart Complaints, Faster Solutions, Transparent Governance
            </Motion.h1>

            <Motion.p
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="max-w-xl text-pretty text-slate-600 dark:text-slate-300"
            >
              UGIRP helps citizens submit grievances with clarity, helps teams prioritize faster, and keeps every step
              transparent with timelines, SLAs, and proof-based closure.
            </Motion.p>

            <Motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                to="/login"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-white/5"
              >
                Register
              </Link>
              <a href="#features" className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300">
                See features
              </a>
            </Motion.div>
          </div>

          <Motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="relative rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40"
          >
            <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-sky-400/30 via-fuchsia-400/25 to-emerald-400/25 blur-2xl" />
            <div className="relative grid gap-3 sm:grid-cols-2">
              <FeatureCard title="Auto-triage" body="Route to the right department with smarter categorization." />
              <FeatureCard title="Priority & SLA" body="Make urgency visible and enforce resolution timelines." />
              <FeatureCard title="Attachments" body="Photos/docs help validate complaints and close with proof." />
              <FeatureCard title="Transparency" body="Timeline-driven updates for citizens and officers." />
            </div>
          </Motion.div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40 md:grid-cols-4">
          <Stat value="24×7" label="Citizen intake" />
          <Stat value="≤ 2 min" label="Avg. submission time" />
          <Stat value="+40%" label="Faster routing (target)" />
          <Stat value="100%" label="Auditable timeline" />
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Features</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Premium UI with a scalable foundation.
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <FeatureCard title="Citizen portal" body="Simple intake flow with clear metadata and evidence." />
            <FeatureCard title="Officer dashboard" body="Track queues, statuses, and performance at a glance." />
            <FeatureCard title="Policy insights" body="See trends across departments and identify bottlenecks." />
          </div>
        </section>

        {/* How it works */}
        <section>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">How It Works</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            A clean flow that maps to real governance operations.
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Step n="1" title="Submit grievance" body="Citizen enters details + optional attachments/location." />
            <Step n="2" title="Triage & assign" body="System routes to department and sets priority/SLA." />
            <Step n="3" title="Resolve & verify" body="Officer resolves, uploads proof, citizen gets notified." />
          </div>
        </section>

        {/* Testimonials */}
        <section>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Testimonials</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">What stakeholders expect from UGIRP.</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Testimonial
              name="Citizen, Ward 12"
              role="Resident"
              quote="The status timeline made the process finally feel transparent."
            />
            <Testimonial
              name="Municipal Officer"
              role="Operations"
              quote="Routing and SLAs reduced back-and-forth and helped us prioritize."
            />
            <Testimonial
              name="Supervisor"
              role="Compliance"
              quote="Auditability and proof-based closure improved accountability."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

