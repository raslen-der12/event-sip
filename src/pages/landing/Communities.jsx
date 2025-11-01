import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Requires: npm install bootstrap-icons
import Footer from '../../components/footer/Footer';
import { cta, footerData, nav, topbar } from '../main.mock';
import HeaderShell from '../../components/layout/HeaderShell';

// Note: Ensure Tailwind CSS is configured in your project and Poppins font is included via Google Fonts in your CSS or index.html

const Hero = () => (
  <section className="flex flex-col justify-center items-center text-center py-20 sm:py-28 px-5 bg-gradient-to-r from-[#1C3664] to-[#EB5434] text-white">
    <h1 className="text-3xl sm:text-5xl font-bold mb-4">Communities</h1>
    <p className="text-base sm:text-xl mb-6 max-w-[700px]">
      Eventra connects professionals, experts, students, and business owners in dedicated communities to network, learn, and grow together.
    </p>
    <a
      href="/register"
      className="px-7 py-3 bg-white text-[#1C3664] font-semibold rounded-lg transition-all duration-300 hover:bg-gray-100 hover:-translate-y-1"
    >
      Join a Community
    </a>
  </section>
);

const CommunityCard = ({ icon, title }) => (
  <div className="bg-white p-2 rounded-lg text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer">
    <i className={`bi ${icon} text-lg text-[#EB5434] mb-1`}></i>
    <h3 className="text-xs font-medium text-[#1C3664]">{title}</h3>
  </div>
);

const CommunityGrid = () => {
  const communities = [
    { icon: 'bi-lightning-charge', title: 'Coaches' },
    { icon: 'bi-person-badge', title: 'Experts' },
    { icon: 'bi-book', title: 'Students' },
    { icon: 'bi-briefcase', title: 'Employees' },
    { icon: 'bi-flask', title: 'Researchers' },
    { icon: 'bi-newspaper', title: 'Media' },
    { icon: 'bi-gavel', title: 'Lawyers' },
    { icon: 'bi-code-slash', title: 'Developers' },
    { icon: 'bi-person-lines-fill', title: 'Trainers' },
    { icon: 'bi-calculator', title: 'Audit & Accounting' },
    { icon: 'bi-currency-dollar', title: 'Investment' },
    { icon: 'bi-shield-check', title: 'Insurance' },
    { icon: 'bi-bank', title: 'Micro Finance' },
    { icon: 'bi-bullhorn', title: 'Marketing' },
    { icon: 'bi-camera-video', title: 'Audio Visual' },
    { icon: 'bi-cpu', title: 'AI & IoT' },
    { icon: 'bi-building', title: 'Universities' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5">
      <h2 className="text-center text-2xl sm:text-3xl font-semibold text-[#1C3664] my-10 sm:my-16">
        Our Community Actors
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {communities.map((community, index) => (
          <CommunityCard key={index} icon={community.icon} title={community.title} />
        ))}
      </div>
    </div>
  );
};

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

// ========= MembersAll (converted & integrated) ==========
const CATEGORIES = [
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

// small helper to generate placeholder members (replace with real data)
const makeMembers = (category, start = 1) => {
  const types = ['Attendee', 'Expert/Consultant', 'Student', 'Business Owner'];
  return Array.from({ length: 5 }).map((_, i) => ({
    id: `${category}-${i}`,
    name: `${category.split(' ')[0]} Member ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?img=${(start + i) % 70}`,
    memberType: types[(i + start) % types.length],
  }));
};

const categoriesWithMembers = CATEGORIES.map((c, idx) => ({
  name: c,
  members: makeMembers(c, idx * 5 + 3),
}));

function MembersAll({ className = '' }) {
  return (

    <section className={`max-w-7xl mx-auto px-5 py-10 ${className}`}>
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#1C3664]">All Community Members</h2>
        <p className="text-sm text-gray-500">Browse members by category — responsive, minimal cards with clear hierarchy.</p>
      </header>

      {/* Sections for each category */}
      <div className="space-y-10">
        {categoriesWithMembers.map((cat) => (
          <section key={cat.name}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-[#1C3664]">{cat.name}</h3>
              <button
                className="text-sm font-medium flex items-center gap-2 text-[#1C3664] hover:underline"
                aria-label={`See all ${cat.name}`}
              >
                See All
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {cat.members.map((m) => (
                <article
                  key={m.id}
                  className="relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition transform hover:-translate-y-1"
                >
                  <span className="absolute left-3 top-3 inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#1C3664] text-white">{cat.name}</span>

                  <div className="flex flex-col items-center text-center pt-6">
                    <img className="w-20 h-20 rounded-full object-cover" src={m.avatar} alt={`${m.name} avatar`} />
                    <h4 className="mt-3 text-sm font-semibold text-gray-900">{m.name}</h4>
                    <p className="mt-1 text-xs text-gray-500">{m.memberType}</p>
                  </div>

                  {/* Optional quick actions (minimal) */}
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button className="text-xs px-3 py-1 rounded-md border border-gray-200 text-[#1C3664] hover:bg-gray-50">Profile</button>
                    <button className="text-xs px-3 py-1 rounded-md bg-[#EB5434] text-white hover:brightness-95">Message</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-12 text-sm text-gray-500 text-center">Palette: <span className="font-medium text-[#1C3664]">#1C3664</span> &amp; <span className="font-medium text-[#EB5434]">#EB5434</span></footer>
    </section>
);
}

// ========== Final combined page component ===========
const Communities = () => (
          <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
  <div className="font-['Poppins'] bg-[#f9f9f9] text-[#333]">
    <Hero />


    {/* Members list placed under the icons as requested */}
    <MembersAll />

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

export default Communities;
