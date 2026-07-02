import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function MarketingFooter() {
  return (
    <footer className="border-t border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-xl mt-xl">
      <div className="max-w-[1280px] mx-auto px-lg lg:px-xl py-xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-xl">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-sm">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold">
                G
              </div>
              <div className="font-headline-md text-lg font-bold text-on-surface">GhostShift</div>
            </Link>
            <p className="mt-md font-body-sm text-body-sm text-on-surface-variant max-w-xs">
              AI shift-swap and workload intelligence for any shift-based team — healthcare, operations, hospitality, and beyond.
            </p>
            <div className="mt-lg flex gap-sm">
              {['twitter', 'linkedin', 'github'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-surface-variant/60 hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors"
                  aria-label={s}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {s === 'twitter' ? 'flutter_dash' : s === 'linkedin' ? 'work' : 'code'}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: 'Product',
              items: ['Swap Matching', 'Burnout Prediction', 'Marketplace', 'AI Assistant', 'Use Cases'],
            },
            {
              title: 'Company',
              items: ['About', 'Customers', 'Careers', 'Press', 'Contact'],
            },
            {
              title: 'Resources',
              items: ['Docs', 'API', 'Security', 'Status', 'Changelog'],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">
                {col.title}
              </h4>
              <ul className="mt-md space-y-sm">
                {col.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-xl pt-lg border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-md">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            © 2026 GhostShift, Inc. · SOC 2 Type II · ISO 27001
          </p>
          <div className="flex gap-md">
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary">
              Privacy
            </a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary">
              Terms
            </a>
            <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary">
              BAA
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}