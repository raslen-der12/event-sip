// src/pages/landing/SingleCommunity.jsx
import React, { useMemo, useState } from 'react';
import Lottie from 'lottie-react';
import HeaderShell from '../../components/layout/HeaderShell';
import { cta, footerData, nav, topbar } from '../main.mock';
import Footer from '../../components/footer/Footer';
// import studentAnimation from '../../assets/lottie/students.json'; // optional

const defaultTypes = ['Attendee', 'Expert/Consultant', 'Student', 'Business Owner'];

const makeMembers = (category, start = 1, count = 20) =>
  Array.from({ length: count }).map((_, i) => ({
    id: `${category}-${i}`,
    name: `${category.split(' ')[0]} Member ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?img=${(start + i) % 70}`,
    memberType: defaultTypes[(i + start) % defaultTypes.length],
  }));

export default function SingleCommunity({ categoryName = 'Students', members }) {
  // --- Hooks are invoked unconditionally here (always in the same order) ---
  const allMembers = useMemo(
    () => (members == null ? makeMembers(categoryName, 3, 25) : members),
    [members, categoryName]
  );

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allMembers.filter((m) => {
      const matchesQuery = m.name.toLowerCase().includes(q);
      const matchesType = typeFilter === 'All' ? true : m.memberType === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [allMembers, query, typeFilter]);

  const typesOptions = useMemo(
    () => ['All', ...Array.from(new Set(allMembers.map((m) => m.memberType)))],
    [allMembers]
  );

  // --- render ---
  return (
            <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="flex items-center gap-4 mb-6">
        <a href="/communities" className="inline-flex items-center gap-2 text-sm text-[#1C3664] hover:underline">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>

        <div className="flex items-center gap-3 ml-auto">
          {/* Lottie animation (optional) */}
          <div className="flex items-center gap-3">
            {/* Uncomment to use lottie animation */}
            {/* <Lottie animationData={studentAnimation} loop className="w-14 h-14" /> */}

            <div className="w-12 h-12 rounded-full bg-white shadow flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1C3664]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM3 21v-1c0-2.761 4.239-5 9-5s9 2.239 9 5v1" />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-[#1C3664]">{categoryName}</h1>
              <p className="text-sm text-gray-500">{allMembers.length} members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <input
            placeholder={`Search ${categoryName} by name...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3664] text-sm"
          />
        </div>

        <div className="w-44">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3664]"
          >
            {typesOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setQuery('');
              setTypeFilter('All');
            }}
            className="text-sm px-3 py-2 rounded-md border border-gray-200 bg-white text-[#1C3664]"
          >
            Reset
          </button>

          <button className="text-sm px-3 py-2 rounded-md bg-[#EB5434] text-white" onClick={() => alert('Export / Invite action')}>
            Invite
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filtered.map((m) => (
          <article key={m.id} className="relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition transform hover:-translate-y-1">
            <span className="absolute left-3 top-3 inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#1C3664] text-white">
              {categoryName}
            </span>

            <div className="flex flex-col items-center text-center pt-6">
              <img className="w-20 h-20 rounded-full object-cover" src={m.avatar} alt={`${m.name}`} />
              <h4 className="mt-3 text-sm font-semibold text-gray-900">{m.name}</h4>
              <p className="mt-1 text-xs text-gray-500">{m.memberType}</p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={() => setSelected(m)} className="text-xs px-3 py-1 rounded-md border border-gray-200 text-[#1C3664]">
                Profile
              </button>
              <button className="text-xs px-3 py-1 rounded-md bg-[#EB5434] text-white">Message</button>
            </div>
          </article>
        ))}

        {filtered.length === 0 && <div className="col-span-full py-12 text-center text-gray-500">No members found.</div>}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img className="w-16 h-16 rounded-full object-cover" src={selected.avatar} alt={selected.name} />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selected.name}</h4>
                  <p className="text-sm text-gray-500">{selected.memberType}</p>
                </div>
              </div>

              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              <p>This is a placeholder profile. Replace with actual fields (bio, links, skills) fetched from your API.</p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-md border border-gray-200">
                Close
              </button>
              <button className="px-4 py-2 rounded-md bg-[#EB5434] text-white">Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
          <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>);
}
