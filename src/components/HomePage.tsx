import {
  ArrowRight,
  Check,
  Clock3,
  Headphones,
  Home,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import type { Page } from '../App';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const services = [
  {
    number: '01',
    icon: Truck,
    title: 'Freight delivery',
    copy: 'Palletised, bulk and general freight moved across Perth and regional WA with the right vehicle for every load.',
  },
  {
    number: '02',
    icon: Package,
    title: 'Courier services',
    copy: 'Responsive delivery for parcels, documents and time-sensitive items—handled carefully from pickup to handover.',
  },
  {
    number: '03',
    icon: Home,
    title: 'Removals',
    copy: 'Reliable residential and commercial moves for furniture, equipment and valuable goods of all shapes and sizes.',
  },
];

const fleet = [
  { title: 'Vans', detail: 'Quick metro delivery', capacity: 'Small loads' },
  { title: 'Flatbeds', detail: 'Oversized & irregular freight', capacity: 'Open access' },
  { title: 'Curtainsiders', detail: 'Fast side loading', capacity: 'Flexible loads' },
  { title: 'Pantechs', detail: 'Protected heavy transport', capacity: '6–14 tonne' },
];

export function HomePage({ onNavigate }: HomePageProps) {
  const handleNavigate = (page: Page) => {
    onNavigate(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="overflow-hidden bg-[#f7f4ee]">
      <section className="hero-grid relative min-h-[760px] bg-[#171717] text-white lg:min-h-[820px]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1766608422198-5be9ac0aac9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVpZ2h0JTIwdHJ1Y2slMjBoaWdod2F5fGVufDF8fHx8MTc2NzQ1MTY1MXww&ixlib=rb-4.1.0&q=88&w=1800)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,15,15,0.97)_0%,rgba(15,15,15,0.78)_47%,rgba(15,15,15,0.25)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(15,15,15,0.88)_0%,transparent_45%)]" />

        <div className="relative mx-auto flex min-h-[760px] max-w-[1440px] flex-col justify-center px-5 pb-24 pt-20 sm:px-8 lg:min-h-[820px] lg:px-12 xl:px-20">
          <div className="scroll-reveal max-w-4xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
              <MapPin className="h-4 w-4 text-[#ef3340]" />
              Perth owned · WA moving
            </div>
            <h1 className="hero-title max-w-4xl text-white">
              Freight that keeps
              <span className="block text-[#ef3340]">business moving.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
              Smart, dependable transport for anything from a single parcel to a full commercial load—delivered by a local team that picks up the phone.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleNavigate('quote')}
                className="interactive-button group bg-[#ef3340] px-7 py-4 text-white hover:bg-[#d91f2c]"
              >
                Get a fast quote
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => handleNavigate('services')}
                className="interactive-button border border-white/25 bg-white/10 px-7 py-4 text-white backdrop-blur-md hover:bg-white hover:text-[#171717]"
              >
                Explore services
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 backdrop-blur-md">
            <div className="mx-auto grid max-w-[1440px] grid-cols-1 px-5 sm:grid-cols-3 sm:px-8 lg:px-12 xl:px-20">
              {[
                ['Perth & surrounds', 'Local knowledge'],
                ['6–14 tonne', 'Pantech capacity'],
                ['One-off or ongoing', 'Flexible service'],
              ].map(([value, label], index) => (
                <div
                  key={value}
                  className={`flex items-center gap-4 py-5 sm:px-6 ${index > 0 ? 'hidden border-l border-white/10 sm:flex' : ''}`}
                >
                  <Check className="h-5 w-5 shrink-0 text-[#ef3340]" />
                  <div>
                    <p className="font-semibold text-white">{value}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/50">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-20">
          <div className="scroll-reveal grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="eyebrow">What we move</p>
              <h2 className="display-heading mt-5">Every load deserves the right solution.</h2>
            </div>
            <div className="flex flex-col justify-end">
              <p className="max-w-2xl text-lg leading-8 text-[#66635f]">
                No scripts, no one-size-fits-all transport. Tell us what needs moving and when—it’s our job to match the right vehicle, route and handling plan.
              </p>
              <button
                onClick={() => handleNavigate('services')}
                className="text-link group mt-8 w-fit"
              >
                See all transport services
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            {services.map(({ number, icon: Icon, title, copy }, index) => (
              <article
                key={title}
                className="service-card scroll-reveal group relative min-h-[380px] overflow-hidden p-7 sm:p-9"
                style={{ '--reveal-delay': `${index * 0.08}s` } as React.CSSProperties}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ef3340] text-white shadow-[0_12px_30px_rgba(239,51,64,0.25)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold tracking-[0.2em] text-[#aba7a0]">{number}</span>
                </div>
                <div className="absolute inset-x-7 bottom-8 sm:inset-x-9">
                  <h3 className="text-2xl text-[#1e1d1b]">{title}</h3>
                  <p className="mt-4 leading-7 text-[#6d6963]">{copy}</p>
                  <button onClick={() => handleNavigate('services')} className="text-link mt-6">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1b1b1a] py-24 text-white sm:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-20">
          <div className="scroll-reveal grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="eyebrow text-[#ff5963]">Built for the job</p>
              <h2 className="display-heading mt-5 max-w-xl text-white">A fleet with range. A team with drive.</h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-white/60 lg:justify-self-end">
              From nimble vans to 14-tonne pantechs, our company-owned vehicles are maintained, ready and matched to your freight—not the other way around.
            </p>
          </div>

          <div className="mt-16 grid border-y border-white/12 sm:grid-cols-2 lg:grid-cols-4">
            {fleet.map((vehicle, index) => (
              <div
                key={vehicle.title}
                className={`fleet-cell scroll-reveal py-9 sm:p-8 ${index > 0 ? 'border-t border-white/12 sm:border-t-0 sm:border-l' : ''}`}
              >
                <span className="mb-12 block text-xs font-semibold uppercase tracking-[0.18em] text-[#ef3340]">
                  {vehicle.capacity}
                </span>
                <Truck className="mb-5 h-9 w-9 text-white/30" strokeWidth={1.5} />
                <h3 className="text-2xl text-white">{vehicle.title}</h3>
                <p className="mt-2 text-sm text-white/50">{vehicle.detail}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleNavigate('fleet')}
            className="interactive-button mt-10 bg-white px-7 py-4 text-[#1b1b1a] hover:bg-[#ef3340] hover:text-white"
          >
            View the full fleet <ArrowRight className="ml-3 h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="relative bg-white py-24 sm:py-32">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[#f7f4ee]" />
        <div className="relative mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 xl:px-20">
          <div className="scroll-reveal">
            <p className="eyebrow">The Transline difference</p>
            <h2 className="display-heading mt-5 max-w-xl">Transport without the runaround.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#69655f]">
              Clear communication, professional handling and a team that takes ownership from collection to delivery.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                [Clock3, 'On-time focus', 'Planned routes and responsive updates.'],
                [ShieldCheck, 'Handled with care', 'Professional handling at every step.'],
                [Headphones, 'Real local support', 'Talk to a person who knows the job.'],
                [Sparkles, 'Flexible by design', 'Built around your freight and schedule.'],
              ].map(([Icon, title, copy]) => {
                const FeatureIcon = Icon as typeof Clock3;
                return (
                  <div key={title as string} className="rounded-2xl border border-[#e5e0d8] bg-white p-6">
                    <FeatureIcon className="h-6 w-6 text-[#ef3340]" />
                    <h3 className="mt-5 text-lg">{title as string}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#74706a]">{copy as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="scroll-reveal flex items-center lg:pl-10">
            <div className="quote-panel w-full overflow-hidden rounded-[2rem] bg-[#ef3340] p-8 text-white shadow-[0_30px_80px_rgba(239,51,64,0.2)] sm:p-12">
              <span className="text-7xl font-black leading-none text-white/20">“</span>
              <p className="-mt-3 text-2xl font-semibold leading-relaxed sm:text-3xl">
                The best delivery is the one you don’t have to worry about.
              </p>
              <div className="mt-10 h-px bg-white/20" />
              <p className="mt-7 text-sm uppercase tracking-[0.18em] text-white/70">
                Reliable by route. Personal by nature.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band relative overflow-hidden bg-[#ef3340] py-20 text-white sm:py-24">
        <div className="relative mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-10 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-12 xl:px-20">
          <div className="scroll-reveal max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Ready when you are</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-6xl">
              Let’s get it moving.
            </h2>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Share the pickup, destination and load details. We’ll take it from there.
            </p>
          </div>
          <button
            onClick={() => handleNavigate('quote')}
            className="interactive-button group shrink-0 bg-white px-8 py-4 text-[#1b1b1a] hover:bg-[#1b1b1a] hover:text-white"
          >
            Request a quote
            <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
}
