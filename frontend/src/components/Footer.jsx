function SocialIcon({ label, href, pathD }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
        <path d={pathD} />
      </svg>
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">UGIRP</div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            A modern grievance intake portal starter. Built with React + Tailwind.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-slate-900 dark:text-white">About</div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <a className="hover:text-slate-900 dark:hover:text-white" href="/#features">
                  Features
                </a>
              </li>
              <li>
                <a className="hover:text-slate-900 dark:hover:text-white" href="/">
                  Home
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-slate-900 dark:text-white">Contact</div>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <a className="hover:text-slate-900 dark:hover:text-white" href="mailto:support@ugirp.local">
                  support@ugirp.local
                </a>
              </li>
              <li className="text-slate-500 dark:text-slate-400">Mon–Fri, 10am–6pm</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Social</div>
          <div className="flex items-center gap-2">
            <SocialIcon
              label="GitHub"
              href="https://github.com/"
              pathD="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.833.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.923.678 1.86 0 1.343-.012 2.425-.012 2.755 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.523 2 12 2z"
            />
            <SocialIcon
              label="X"
              href="https://x.com/"
              pathD="M18.9 2H22l-6.8 7.77L23 22h-6.7l-5.24-6.82L4.9 22H2l7.33-8.38L1 2h6.86l4.73 6.16L18.9 2zm-1.18 18h1.86L7.2 3.95H5.2L17.72 20z"
            />
            <SocialIcon
              label="LinkedIn"
              href="https://www.linkedin.com/"
              pathD="M6.94 6.5A2.44 2.44 0 1 1 7 1.62a2.44 2.44 0 0 1-.06 4.88zM2.5 22h4.9V8.98H2.5V22zM9.24 8.98H14v1.78h.07c.66-1.25 2.27-2.57 4.67-2.57 4.99 0 5.91 3.28 5.91 7.55V22h-4.9v-5.52c0-1.32-.03-3.01-1.84-3.01-1.84 0-2.12 1.43-2.12 2.91V22H9.24V8.98z"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/70 py-4 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        © {new Date().getFullYear()} UGIRP. All rights reserved.
      </div>
    </footer>
  );
}

