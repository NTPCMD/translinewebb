import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import type { Page } from '../App';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const go = (page: Page) => {
    onNavigate(page);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-[#161616] text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-16 sm:px-8 lg:px-12 lg:pt-20 xl:px-20">
        <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
          <div>
            <button onClick={() => go('home')} className="text-left">
              <span className="block text-3xl font-black italic tracking-[-0.05em]">TRANSLINE</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.35em] text-[#ef3340]">Logistics</span>
            </button>
            <p className="mt-6 max-w-sm leading-7 text-white/55">
              Dependable freight, courier and removal solutions across Perth and surrounding areas.
            </p>
          </div>

          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Explore</p>
            <div className="space-y-3">
              {([['Services', 'services'], ['Our fleet', 'fleet'], ['FAQs', 'faq'], ['Contact', 'contact']] as [string, Page][]).map(([label, page]) => (
                <button key={page} onClick={() => go(page)} className="block text-sm text-white/65 transition-colors hover:text-white">{label}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Services</p>
            <ul className="space-y-3 text-sm text-white/65">
              <li>Freight delivery</li>
              <li>Courier services</li>
              <li>Removals</li>
              <li>Commercial transport</li>
            </ul>
          </div>

          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Get in touch</p>
            <a href="tel:0466582734" className="mb-3 flex items-center gap-3 text-sm text-white/70 hover:text-white"><Phone className="h-4 w-4 text-[#ef3340]" /> 0466 582 734</a>
            <a href="mailto:admin@translinelogistics.org" className="mb-3 flex items-center gap-3 break-all text-sm text-white/70 hover:text-white"><Mail className="h-4 w-4 shrink-0 text-[#ef3340]" /> admin@translinelogistics.org</a>
            <p className="flex items-center gap-3 text-sm text-white/70"><MapPin className="h-4 w-4 text-[#ef3340]" /> Perth, Western Australia</p>
            <button onClick={() => go('quote')} className="mt-7 inline-flex items-center text-sm font-semibold text-white hover:text-[#ef3340]">
              Request a quote <ArrowUpRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Transline Logistics. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => go('privacy')} className="hover:text-white">Privacy</button>
            <button onClick={() => go('terms')} className="hover:text-white">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
