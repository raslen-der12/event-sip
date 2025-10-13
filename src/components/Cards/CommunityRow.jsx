// src/components/Cards/CommunityRow.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * CommunityRow
 * Props:
 *  - title: string (section title shown on the left)
 *  - seeAllHref: string | null (optional link for "See All")
 *  - onSeeAll: function (optional handler instead of href)
 *  - members: array of member objects { id, name, avatar, memberType } (max 5 shown)
 *
 * Example usage:
 *  <CommunityRow
 *    title="Students"
 *    seeAllHref="/community/students"
 *    members={[ {id:'s1', name:'Amina', avatar:'...', memberType:'Student'}, ... ]}
 *  />
 */
export default function CommunityRow({ title, seeAllHref, onSeeAll, members = [] }) {
  // show up to 5 cards; if fewer provided, fill with placeholders
  const placeholders = Array.from({ length: Math.max(0, 5 - members.length) }).map((_, i) => ({
    id: `ph-${i}`,
    name: `Member ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?img=${10 + i}`,
    memberType: 'Attendee',
  }));

  const shown = [...members.slice(0, 5), ...placeholders].slice(0, 5);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1C3664]">{title}</h3>

        {seeAllHref || onSeeAll ? (
          seeAllHref ? (
            <a
              href={seeAllHref}
              className="text-sm font-medium text-[#1C3664] hover:underline flex items-center gap-2"
              aria-label={`See all ${title}`}
            >
              See All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ) : (
            <button
              onClick={onSeeAll}
              className="text-sm font-medium text-[#1C3664] hover:underline flex items-center gap-2"
              aria-label={`See all ${title}`}
              type="button"
            >
              See All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )
        ) : (
          <div /> // keep layout stable if no control provided
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {shown.map((m) => (
          <article
            key={m.id}
            className="relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition transform hover:-translate-y-1"
          >
            <span className="absolute left-3 top-3 inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#1C3664] text-white">
              {title}
            </span>

            <div className="flex flex-col items-center text-center pt-6">
              <img className="w-20 h-20 rounded-full object-cover" src={m.avatar} alt={`${m.name} avatar`} />
              <h4 className="mt-3 text-sm font-semibold text-gray-900">{m.name}</h4>
              <p className="mt-1 text-xs text-gray-500">{m.memberType}</p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button className="text-xs px-3 py-1 rounded-md border border-gray-200 text-[#1C3664]">Profile</button>
              <button className="text-xs px-3 py-1 rounded-md bg-[#EB5434] text-white">Message</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

CommunityRow.propTypes = {
  title: PropTypes.string.isRequired,
  seeAllHref: PropTypes.string,
  onSeeAll: PropTypes.func,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string,
      memberType: PropTypes.string,
    })
  ),
};

CommunityRow.defaultProps = {
  seeAllHref: null,
  onSeeAll: null,
  members: [],
};
