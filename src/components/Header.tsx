import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { Page } from '../App';
import logo from '../assets/Translines (2).png';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems: { label: string; page: Page }[] = [
    { label: 'Home', page: 'home' },
    { label: 'Services', page: 'services' },
    { label: 'Fleet', page: 'fleet' },
    { label: 'FAQ', page: 'faq' },
    { label: 'Contact', page: 'contact' },
  ];

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0d0f10]/95 text-white shadow-[0_8px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-20">
        <button onClick={() => handleNavigate('home')} className="group flex items-center gap-3" aria-label="Transline Logistics home">
          <span className="h-11 w-11 overflow-hidden rounded-xl bg-[#c9182b] shadow-[0_8px_24px_rgba(201,24,43,0.18)]">
            <img src={logo} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </span>
          <span className="text-left">
            <span className="block text-lg font-black italic leading-none tracking-[-0.04em] text-white">TRANSLINE</span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.26em] text-white/40">Logistics</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => handleNavigate(item.page)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                currentPage === item.page ? 'bg-white text-[#111315]' : 'text-white/58 hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => handleNavigate('quote')}
          className="interactive-button hidden bg-[#ef3340] px-5 py-3 text-sm text-white hover:bg-[#d91f2c] lg:inline-flex"
        >
          Get a quote <ArrowUpRight className="ml-2 h-4 w-4" />
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-white/10 bg-[#111315] px-5 py-5 lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => handleNavigate(item.page)}
              className={`block w-full border-b border-white/10 px-2 py-4 text-left text-lg font-semibold ${currentPage === item.page ? 'text-[#ef3340]' : 'text-white'}`}
            >
              {item.label}
            </button>
          ))}
          <button onClick={() => handleNavigate('quote')} className="interactive-button mt-5 w-full bg-[#ef3340] px-5 py-4 text-white">
            Get a quote <ArrowUpRight className="ml-2 h-4 w-4" />
          </button>
        </nav>
      )}
    </header>
  );
}
