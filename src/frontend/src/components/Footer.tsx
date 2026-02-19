import { SiYoutube } from 'react-icons/si';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'concept-delta'
  );

  return (
    <footer className="border-t border-border bg-[oklch(0.145_0_240)] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <span className="text-2xl font-bold">Δ</span>
              </div>
              <span className="text-xl font-bold">Concept Delta</span>
            </div>
            <p className="text-sm text-white/70">
              Master MHT-CET with free mock tests and comprehensive practice materials.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a href="/" className="transition-colors hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/dashboard" className="transition-colors hover:text-white">
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com/@coep_conceptdelta2031"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <SiYoutube className="h-4 w-4" />
                  YouTube Channel
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Connect</h3>
            <p className="text-sm text-white/70">@coep_conceptdelta2031</p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-white/70">
          <p>
            © {currentYear} Concept Delta. All rights reserved.
          </p>
          <p className="mt-2">
            Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline transition-colors hover:text-white/80"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
