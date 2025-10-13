// Communities.jsx — drop-in replacement that preserves your design and injects CommunityPage logic
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Footer from '../../components/footer/Footer';
import { cta, footerData, nav, topbar } from '../main.mock';
import HeaderShell from '../../components/layout/HeaderShell';

/* ===================== Shared logic from CommunityPage ===================== */
const SUBROLE_LABELS = [
  'Students',
  'Researchers',
  'Coaches & Trainers',
  'Experts & Consultants',
  'Employees & Professionals',
  'Entrepreneurs & Startups',
  'Developers & Engineers',
  'Marketing & Communication',
  'Audit, Accounting & Finance',
  'Investment & Banking',
  'Insurance & Microfinance',
  'Legal & Lawyers',
  'AI, IoT & Emerging Tech',
  'Audiovisual & Creative Industries',
  'Media & Journalists',
  'Universities & Academies',
  'NGOs & Civil Society',
  'Public Sector & Government',
];

const slugOf = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SUBROLES = Array.from(new Set(SUBROLE_LABELS)).map((label) => ({
  label,
  slug: slugOf(label),
}));

function roleLikeForSubrole(label = '') {
  const s = label.toLowerCase();
  if (s.includes('student')) return 'Student';
  if (s.includes('coach') || s.includes('trainer') || s.includes('consultant')) return 'Consultant';
  if (s.includes('investment') || s.includes('bank')) return 'Investor';
  if (s.includes('entrepreneur') || s.includes('startup')) return 'Entrepreneur';
  if (s.includes('expert') || s.includes('research') || s.includes('developer') || s.includes('engineer') || s.includes('ai') || s.includes('iot'))
    return 'Expert';
  return 'Employee';
}

/* Mock dataset (fallback when no real data is passed in) */
const FN = ['Sana', 'Amine', 'Yara', 'Luis', 'Meriem', 'Jon', 'Aya', 'Tarek', 'Ines', 'Malek', 'Ziyad', 'Omar', 'Rania', 'Nora', 'Noah'];
const LN = ['Weber', 'Gomez', 'Hassan', 'Zhou', 'Kim', 'Ben Ali', 'Khan', 'Martin', 'Costa', 'Youssef', 'Ren', 'Mejia', 'Sato'];
const COUNTRIES = ['Tunisia', 'Germany', 'France', 'USA', 'Italy', 'Spain', 'Morocco', 'Egypt', 'UAE', 'KSA', 'Canada', 'UK'];
const CITIES = ['Tunis', 'Berlin', 'Paris', 'SF', 'Milan', 'Madrid', 'Casablanca', 'Cairo', 'Dubai', 'Riyadh', 'Toronto', 'London'];
const ORGS = ['NexLabs', 'BluePeak', 'Innova', 'DataForge', 'GreenBuild', 'Solaris', 'OptiCore', 'NorthBay', 'HelioGrid', 'FlowOps'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function makeMockActor(sr) {
  const name = `${rand(FN)} ${rand(LN)}`;
  return {
    id: `a_${sr.slug}_${Math.random().toString(36).slice(2, 10)}`,
    name,
    org: rand(ORGS),
    country: rand(COUNTRIES),
    city: rand(CITIES),
    subrole: sr.label,
    subroleSlug: sr.slug,
    roleLike: roleLikeForSubrole(sr.label),
    avatar: '', // keep empty to use initials elsewhere if needed
  };
}

function buildMockActors() {
  const out = [];
  for (const sr of SUBROLES) {
    const n = randInt(16, 28);
    for (let i = 0; i < n; i++) out.push(makeMockActor(sr));
  }
  return out;
}

/* Normalize any incoming dataset (real API data or mock) to the same shape */
function normalizeActors(initialActors) {
  const list = Array.isArray(initialActors) ? initialActors : buildMockActors();
  return list.map((x, i) => {
    const inferredSub =
      x.subrole ||
      x.roleLike ||
      x.role ||
      rand(SUBROLES).label;

    const sr =
      SUBROLES.find((s) => s.label === inferredSub) ||
      SUBROLES.find((s) => s.slug === x.subroleSlug) ||
      rand(SUBROLES);

    return {
      id: x.id || `mock_${i}_${Math.random().toString(36).slice(2, 8)}`,
      name: x.name || x.fullName || x.personal?.fullName || 'Anonymous User',
      org: x.org || x.organization?.orgName || x.identity?.orgName || '',
      country: x.country || x.personal?.country || x.identity?.country || '',
      city: x.city || x.personal?.city || x.identity?.city || '',
      avatar: x.avatar || x.personal?.profilePic || '',
      subrole: sr.label,
      subroleSlug: sr.slug,
      roleLike: x.roleLike || roleLikeForSubrole(sr.label),
    };
  });
}

/* ===================== Your original visual components (unchanged) ===================== */
const Hero = () => (
  <section className="flex flex-col justify-center items-center text-center py-20 sm:py-28 px-5 bg-gradient-to-r from-[#1C3664] to-[#EB5434] text-white">
    <h1 className="text-3xl sm:text-5xl font-bold mb-4">Communities</h1>
    <p className="text-base sm:text-xl mb-6 max-w-[700px]">
      GITS connects professionals, experts, students, and business owners in dedicated communities to network, learn, and grow together.
    </p>
    <a
      href="/register"
      className="px-7 py-3 bg-white text-[#1C3664] font-semibold rounded-lg transition-all duration-300 hover:bg-gray-100 hover:-translate-y-1"
    >
      Join a Community
    </a>
  </section>
);

const CommunityCard = ({ icon, title, onClick }) => (
  <div
    className="bg-white p-2 rounded-lg text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    title={`Open ${title}`}
  >
    <i className={`bi ${icon} text-lg text-[#EB5434] mb-1`}></i>
    <h3 className="text-xs font-medium text-[#1C3664]">{title}</h3>
  </div>
);

const CtaFooter = () => (
  <section className="bg-[#1C3664] text-white text-center py-16 px-5 mt-20 rounded-xl m-5 ">
    <h3 className="text-2xl sm:text-3xl font-semibold mb-5">Connect with Your Community</h3>
    <a
      href="/register"
      className="px-7 py-3 bg-[#EB5434] text-white font-semibold rounded-lg transition-all duration-300 hover:bg-[#ff6b4f] hover:-translate-y-1"
    >
      Join Now
    </a>
  </section>
);

/* ===================== MembersAll (keeps your design; fed by real logic) ===================== */
function MembersAll({ className = '', dataset, activeSlug, onRequestSeeAll }) {
  // Group by subroleSlug
  const bySubrole = useMemo(() => {
    const m = new Map();
    for (const a of dataset) {
      const k = a.subroleSlug || slugOf(a.subrole);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(a);
    }
    return m;
  }, [dataset]);

  // Determine the sections to render (all or just one), but keep the same look
  const sections = useMemo(() => {
    if (!activeSlug || activeSlug === 'all') return SUBROLES;
    const one = SUBROLES.find((s) => s.slug === activeSlug);
    return one ? [one] : SUBROLES;
  }, [activeSlug]);

  return (
    <section className={`max-w-7xl mx-auto px-5 py-10 ${className}`}>
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#1C3664]">All Community Members</h2>
        <p className="text-sm text-gray-500">Browse members by category — responsive, minimal cards with clear hierarchy.</p>
      </header>

      <div className="space-y-10">
        {sections.map((cat) => {
          const members = bySubrole.get(cat.slug) || [];
          return (
            <section key={cat.slug} id={`sub-${cat.slug}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#1C3664]">{cat.label}</h3>
                <button
                  className="text-sm font-medium flex items-center gap-2 text-[#1C3664] hover:underline"
                  aria-label={`See all ${cat.label}`}
                  onClick={() => onRequestSeeAll?.(cat.slug)}
                >
                  See All
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {members.map((m) => (
                  <article
                    key={m.id}
                    className="relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition transform hover:-translate-y-1"
                  >
                    <span className="absolute left-3 top-3 inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#1C3664] text-white">
                      {cat.label}
                    </span>

                    <div className="flex flex-col items-center text-center pt-6">
                      {m.avatar ? (
                        <img className="w-20 h-20 rounded-full object-cover" src={m.avatar} alt={`${m.name} avatar`} />
                      ) : (
                        <div className="w-20 h-20 rounded-full grid place-items-center bg-[#1C3664] text-white text-lg font-bold">
                          {String(m.name || 'AA')
                            .split(' ')
                            .map((p) => p[0]?.toUpperCase())
                            .join('')
                            .slice(0, 2)}
                        </div>
                      )}
                      <h4 className="mt-3 text-sm font-semibold text-gray-900">{m.name}</h4>
                      <p className="mt-1 text-xs text-gray-500">
                        {m.roleLike} {m.org ? `• ${m.org}` : ''}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {[m.city, m.country].filter(Boolean).join(', ')}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-3">
                      <Link
                        to={`/profile/${m.id}`}
                        className="text-xs px-3 py-1 rounded-md border border-gray-200 text-[#1C3664] hover:bg-gray-50"
                      >
                        Profile
                      </Link>
                      <Link
                        to={`/messages`}
                        className="text-xs px-3 py-1 rounded-md bg-[#EB5434] text-white hover:brightness-95"
                      >
                        Message
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-12 text-sm text-gray-500 text-center">
        Palette: <span className="font-medium text-[#1C3664]">#1C3664</span> &amp;{' '}
        <span className="font-medium text-[#EB5434]">#EB5434</span>
      </footer>
    </section>
  );
}

/* ===================== Final page (design unchanged, logic injected) ===================== */
export default function Communities({ initialActors }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useParams();
  const urlRole = (searchParams.get('role') || role || '').toLowerCase();

  // normalized dataset
  const dataset = useMemo(() => normalizeActors(initialActors), [initialActors]);

  // community icons (unchanged visual), but now wired to set `?role=<slug>` + scroll
  const communities = [
    { icon: 'bi-lightning-charge', title: 'Coaches & Trainers' },
    { icon: 'bi-person-badge', title: 'Experts & Consultants' },
    { icon: 'bi-book', title: 'Students' },
    { icon: 'bi-briefcase', title: 'Employees & Professionals' },
    { icon: 'bi-flask', title: 'Researchers' },
    { icon: 'bi-newspaper', title: 'Media & Journalists' },
    { icon: 'bi-gavel', title: 'Legal & Lawyers' },
    { icon: 'bi-code-slash', title: 'Developers & Engineers' },
    { icon: 'bi-person-lines-fill', title: 'Coaches & Trainers' }, // trainer alias
    { icon: 'bi-calculator', title: 'Audit, Accounting & Finance' },
    { icon: 'bi-currency-dollar', title: 'Investment & Banking' },
    { icon: 'bi-shield-check', title: 'Insurance & Microfinance' },
    { icon: 'bi-bank', title: 'Insurance & Microfinance' }, // close relative
    { icon: 'bi-bullhorn', title: 'Marketing & Communication' },
    { icon: 'bi-camera-video', title: 'Audiovisual & Creative Industries' },
    { icon: 'bi-cpu', title: 'AI, IoT & Emerging Tech' },
    { icon: 'bi-building', title: 'Universities & Academies' },
  ];

  const [activeSlug, setActiveSlug] = useState('all');
  useEffect(() => {
    if (!urlRole) { setActiveSlug('all'); return; }
    const exists = SUBROLES.some((s) => s.slug === urlRole);
    setActiveSlug(exists ? urlRole : 'all');
  }, [urlRole]);

  const setRoleAndScroll = (slug) => {
    const next = new URLSearchParams(searchParams);
    if (!slug || slug === 'all') next.delete('role');
    else next.set('role', slug);
    setSearchParams(next, { replace: true });

    // scroll after a tick
    requestAnimationFrame(() => {
      const id = slug && slug !== 'all' ? `sub-${slug}` : null;
      if (id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <div className="font-['Poppins'] bg-[#f9f9f9] text-[#333]">
        <Hero />

        {/* Community icons grid — same visuals, now wired */}
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-center text-2xl sm:text-3xl font-semibold text-[#1C3664] my-10 sm:my-16">
            Our Community Actors
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {communities.map((c, i) => {
              const sr = SUBROLES.find((s) => s.label === c.title) || SUBROLES[0];
              return (
                <CommunityCard
                  key={`${c.title}-${i}`}
                  icon={c.icon}
                  title={c.title}
                  onClick={() => setRoleAndScroll(sr.slug)}
                />
              );
            })}
          </div>
        </div>

        {/* Members list (your layout), fed by logic */}
        <MembersAll
          dataset={dataset}
          activeSlug={activeSlug}
          onRequestSeeAll={(slug) => setRoleAndScroll(slug)}
        />

        <CtaFooter />
      </div>

      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );
}
