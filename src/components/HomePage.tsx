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
import premiumHero from '../assets/transline-premium-hero.jpg';

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
      <section className="hero-grid relative min-h-[760px] bg-[#0c0d0e] text-white lg:min-h-[840px]">
        <img
          src={premiumHero}
          alt="Modern freight truck travelling at dusk"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,9,0.98)_0%,rgba(7,8,9,0.91)_32%,rgba(7,8,9,0.55)_58%,rgba(7,8,9,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,8,9,0.94)_0%,transparent_48%,rgba(7,8,9,0.18)_100%)]" />

        <div className="relative mx-auto flex min-h-[760px] max-w-[1440px] flex-col justify-center px-5 pb-24 pt-20 sm:px-8 lg:min-h-[840px] lg:px-12 xl:px-20">
          <div className="scroll-reveal max-w-4xl">
            <div className="mb-9 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md">
                <MapPin className="h-3.5 w-3.5 text-[#ef3340]" />
              </span>
              Perth · Western Australia
            </div>
            <h1 className="hero-title max-w-3xl text-white">
              Transport,
              <span className="block font-light italic text-white/55">elevated.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-white/66 sm:text-xl">
              Precision freight and logistics for Perth businesses that expect more—from first contact to final handover.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleNavigate('quote')}
                className="interactive-button group bg-[#ef3340] px-8 py-4 text-white hover:bg-[#d91f2c]"
              >
                Request a quote
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => handleNavigate('services')}
                className="interactive-button border border-white/18 bg-white/[0.06] px-8 py-4 text-white backdrop-blur-md hover:bg-white hover:text-[#171717]"
              >
                Explore services
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.08] bg-black/20 backdrop-blur-xl">
            <div className="mx-auto grid max-w-[1440px] grid-cols-1 px-5 sm:grid-cols-3 sm:px-8 lg:px-12 xl:px-20">
              {[
                ['Perth & surrounds', 'Local knowledge'],
                ['6–14 tonne', 'Pantech capacity'],
                ['One-off or ongoing', 'Flexible service'],
              ].map(([value, label], index) => (
                <div
                  key={value}
                  className={`flex items-center gap-4 py-5 sm:px-6 ${index > 0 ? 'hidden border-l border-white/[0.08] sm:flex' : ''}`}
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

      <section className="relative py-28 sm:py-36">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-20">
          <div className="scroll-reveal grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="eyebrow">Considered logistics</p>
              <h2 className="display-heading mt-5">The right move, every time.</h2>
            </div>
            <div className="flex flex-col justify-end">
              <p className="max-w-2xl text-lg leading-8 text-[#66635f]">
                Every job is planned with intent. Tell us what needs moving and when—we’ll match the vehicle, route and handling plan to the brief.
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

      <section className="premium-dark relative overflow-hidden bg-[#111315] py-28 text-white sm:py-36">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-20">
          <div className="scroll-reveal grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="eyebrow text-[#ff5963]">Purpose-built fleet</p>
              <h2 className="display-heading mt-5 max-w-xl text-white">Capability, without compromise.</h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-white/60 lg:justify-self-end">
              From nimble vans to 14-tonne pantechs, every vehicle is maintained, ready and selected around the freight—not the other way around.
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

      <section className="relative bg-[#fbfaf7] py-28 sm:py-36">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[#f7f4ee]" />
        <div className="relative mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 xl:px-20">
          <div className="scroll-reveal">
            <p className="eyebrow">Quietly dependable</p>
            <h2 className="display-heading mt-5 max-w-xl">Service you can feel.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#69655f]">
              Calm communication, considered handling and a team that takes ownership from collection to delivery.
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
                Premium service is everything you notice—and everything you don’t have to.
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
