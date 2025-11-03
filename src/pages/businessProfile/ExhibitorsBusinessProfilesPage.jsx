import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";

// ExhibitorsBusinessProfilesPage.jsx
export default function ExhibitorsBusinessProfilesPage({
  apiBase = process.env.REACT_APP_API_BASE || process.env.VITE_API_BASE || '',
  headerTop = topbar,
  headerNav = nav,
  headerCta = cta,
  footer = footerData,
}) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(12); // pagination: initial cards to show

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      const base = (apiBase || '').replace(/\/$/, '');
      const candidates = [
        base ? `${base}/profiles` : null,
        base ? `${base}/bp-public/profiles` : null,
        '/bp-public/profiles',
        '/profiles'
      ].filter(Boolean);

      let lastErr = null;
      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            credentials: 'include'
          });

          if (res.status === 404) {
            lastErr = new Error(`404 from ${url}`);
            continue;
          }
          if (!res.ok) {
            const text = await res.text().catch(() => '(no body)');
            throw new Error(`Server responded ${res.status} from ${url}: ${text}`);
          }
          const data = await res.json();
          if (mounted) setProfiles(Array.isArray(data) ? data : []);
          setLoading(false);
          return;
        } catch (err) {
          console.warn('[BP] fetch failed for', url, err.message);
          lastErr = err;
        }
      }

      if (mounted) {
        setLoading(false);
        setError(lastErr ? lastErr.message : 'Failed to fetch profiles (unknown)');
      }
    }
    load();
    return () => { mounted = false; };
  }, [apiBase]);

  // client-side filtering (search across name, tagline, industries, offering, countries)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(p => {
      if (!p) return false;
      const fields = [p.name, p.tagline, p.about]
        .concat(p.industries || [])
        .concat(p.offering || [])
        .concat(p.seeking || [])
        .concat(p.countries || []);
      return fields.some(f => String(f || '').toLowerCase().includes(q));
    });
  }, [profiles, query]);

  function resetAndShowMore() {
    setVisible(12);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openProfile(profile) {
    if (!profile || !profile.slug) return;
    navigate(`/business/${profile.slug}`);
  }

  function onMessage(e, profile) {
    e.stopPropagation();
    const to = profile?.owner?.actor;
    if (to) navigate(`/messages/compose?to=${to}`);
    else navigate(`/messages/compose?profile=${profile._id}`);
  }

  function onBookMeeting(e, profile) {
    e.stopPropagation();
    navigate(`/meetings/book?profile=${profile._id}`);
  }

  function onWebsiteClick(e, url) {
    e.stopPropagation();
    if (!url) return;
    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener');
  }

  return (
    <>
      <HeaderShell top={headerTop} nav={headerNav} cta={headerCta} />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Centered header */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-800">
            Exhibitors — Business Profiles
          </h1>
          <p className="text-base text-gray-600 mt-2">
            Explore published exhibitor business profiles. Use search to filter.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
            <div className="flex-1 sm:flex-none">
              <label htmlFor="bp-search" className="sr-only">Search profiles</label>
              <input
                id="bp-search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search exhibitors by name, industry, offering or country..."
                className="w-full sm:w-96 border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => { setQuery(''); resetAndShowMore(); }}
                className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
              <div className="text-sm text-gray-500">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </header>

        <main>
          {loading && <div className="py-12 text-center">Loading exhibitor profiles…</div>}
          {error && <div className="py-6 text-red-600">Error: {error}</div>}

          {!loading && !error && filtered.length === 0 && (
            <div className="py-12 text-center text-gray-600">No published exhibitor profiles found.</div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.slice(0, visible).map(profile => (
                  <article
                    key={profile._id || profile.slug}
                    onClick={() => openProfile(profile)}
                    onKeyDown={(e) => { if (e.key === 'Enter') openProfile(profile); }}
                    role="button"
                    tabIndex={0}
                    className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-transform transform hover:-translate-y-1"
                  >
                    <div className="flex-shrink-0 h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {profile.bannerUpload ? (
                        <img
                          src={profile.bannerUpload}
                          alt={`${profile.name} banner`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {profile.logoUpload ? (
                            <img
                              src={profile.logoUpload}
                              alt={`${profile.name} logo`}
                              className="max-h-28 max-w-full object-contain p-2"
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <svg width="220" height="80" viewBox="0 0 220 80" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                              <rect width="220" height="80" rx="6" fill="#EEF2FF" />
                              <text x="50%" y="50%" alignmentBaseline="middle" textAnchor="middle" fill="#6366F1" fontFamily="Arial,Helvetica,sans-serif" fontSize="14">No image</text>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-medium leading-tight">{profile.name}</h2>
                          {profile.tagline && <p className="mt-1 text-sm text-gray-600">{profile.tagline}</p>}
                        </div>
                        <div className="text-xs text-gray-500 self-start">{new Date(profile.createdAt).toLocaleDateString()}</div>
                      </div>

                      <div className="mt-3 flex-1">
                        <p className="text-sm text-gray-700 line-clamp-4" style={{ WebkitLineClamp: 4 }}>{profile.about || '—'}</p>
                      </div>

                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {(profile.industries || []).slice(0, 4).map((i, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 border rounded-full">{i}</span>
                          ))}
                          {(profile.countries || []).slice(0, 2).map((c, idx) => (
                            <span key={`c-${idx}`} className="text-xs px-2 py-1 border rounded-full">{c}</span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-5 flex flex-wrap gap-3 justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/business/${profile.slug || ''}`); }}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                          aria-label={`View ${profile.name} profile`}
                        >
                          Send Message
                        </button>

                        <button
                          onClick={(e) => onMessage(e, profile)}
                          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition"
                          aria-label={`Message ${profile.name}`}
                        >
                          Book meeting
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center">
                {visible < filtered.length ? (
                  <button
                    onClick={() => setVisible(v => v + 12)}
                    className="px-4 py-2 rounded-md border hover:bg-gray-50"
                  >
                    Load more
                  </button>
                ) : (
                  filtered.length > 0 && <div className="text-sm text-gray-500">End of results</div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <Footer
        brand={footer.brand}
        columns={footer.columns}
        socials={footer.socials}
        actions={footer.actions}
        bottomLinks={footer.bottomLinks}
      />
    </>
  );
}
