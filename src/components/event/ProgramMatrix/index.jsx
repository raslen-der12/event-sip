import React, { useState } from "react";
import { Info, BookOpen, Users, Briefcase, GraduationCap, Calendar } from 'lucide-react'; // Added relevant icons
import "./program-agenda.css";

export default function ProgramAgenda({ sessions, isLoading }) {
  const [active, setActive] = React.useState(1); // Show day 2 first by default
  const [filterType, setFilterType] = useState(''); // New: filter state

  // Extract unique types for filters
  const allTypes = [
    { key: 'formation', label: 'Formation', icon: <BookOpen size={14} /> },
    { key: 'panel', label: 'Panel', icon: <Users size={14} /> },
    { key: 'atelier', label: 'Atelier', icon: <GraduationCap size={14} /> },
    { key: 'masterclass', label: 'Masterclass', icon: <GraduationCap size={14} /> },
    { key: 'b2b', label: 'B2B', icon: <Briefcase size={14} /> },
    { key: 'demo', label: 'Demo', icon: <Calendar size={14} /> },
  ];

  const days = [
    {
      key: "2025-11-12",
      label: "Mercredi 12 Novembre 2025",
      items: [
        { time: "09:00 - 16:00", title: "Formation 1", speaker: "AfriStart", type: "formation" },
        { time: "09:00 - 16:00", title: "Formation 2", speaker: "WIDU.AFRICA – GIZ", type: "formation" },
        { time: "09:00 - 16:00", title: "Formation 3", speaker: "Women Go Green", type: "formation" },
        { time: "09:00 - 16:00", title: "Formation 4", speaker: "Green Hubs", type: "formation" }
      ]
    },
    {
      key: "2025-11-13",
      label: "Jeudi 13 Novembre 2025",
      sections: [
        {
          title: "PLÉNIÈRE",
          moderator: "Modérateur : Mr. Wassim Laaribi - Journaliste et animateur Express FM",
          sessions: [
            { time: "09:00 - 09:30", title: "Mots d'ouverture", type: "panel" },
            { time: "09:30 - 10:30", title: "Panel 1 – Stratégie d’accès aux marchés internationaux : enjeux critiques et leviers opérationnels", type: "panel" },
            { time: "10:30 - 11:30", title: "Panel 2 - Think global, act local… avec nous", type: "panel" },
            { time: "11:30 - 12:30", title: "Panel 3 - Export 2.0 : maîtrisez les outils digitaux pour conquérir l’international", type: "panel" },
            { time: "12:30 - 13:00", title: "DEMO GITS THE PLATFORM", type: "demo" }
          ]
        },
        {
          title: "AFTERNOON - B2B & MATCHMAKING",
          sessions: [
            { time: "14:00 – 18:00", title: "Afternoon - B2B & Matchmaking via GITS (physique et virtual)", type: "b2b", highlight: true }
          ]
        },
        {
          title: "ATELIERS",
          sessions: [
            { time: "14:00 - 17:00", title: "Atelier 1 – Allez plus loin, plus vite : les plateformes digitales au service de votre internationalisation", type: "atelier" },
            { time: "14:00 - 17:00", title: "Atelier 2 – Négociation de contrats à l’international", type: "atelier" },
            { time: "14:00 - 17:00", title: "Atelier 3 – Clés techniques pour ouvrir les portes du monde", type: "atelier" },
            { time: "14:00 - 17:00", title: "Atelier 4 – Branding et communication orientés export", type: "atelier" }
          ]
        },
        {
          title: "MASTERCLASSES",
          sessions: [
            { time: "14:00 - 15:00", title: "Masterclass 1 – Comment financer vos activités à l’export ?", type: "masterclass" },
            { time: "15:00 - 16:00", title: "Masterclass 2 – Du local au global : maximisez votre portée avec le e-commerce et les plateformes digitales, quelle place pour l’IA ?", type: "masterclass" },
            { time: "16:00 - 17:00", title: "Masterclass 3 – Go Global, the Right Way…", type: "masterclass" },
            { time: "17:00 - 18:00", title: "Masterclass 4 – GITS Community : what next ?", type: "masterclass" }
          ]
        }
      ]
    }
  ];

  const activeDay = days[active];

  // Filter helper
  const isMatching = (type) => !filterType || type === filterType;

  return (
    <section className="ag">
      <div className="container">
        <header className="ag__head">
          <h2 className="ag__title">Programme</h2>
          <div className="ag__tabs">
            {days.map((d, i) => (
              <button
                key={d.key}
                className={`ag__pill ${active === i ? 'is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </header>

        {/* New: Filter Tags Bar */}
        <div className="ag__filter-bar">
          {allTypes.map(t => (
            <button
              key={t.key}
              className={`ag__filter-tag ${filterType === t.key ? 'is-active' : ''}`}
              onClick={() => setFilterType(filterType === t.key ? '' : t.key)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
          {filterType && (
            <button className="ag__filter-clear" onClick={() => setFilterType('')}>
              Clear
            </button>
          )}
        </div>

        <div className="ag__content">
          {activeDay.items ? (
            <ul className="ag__list">
              {activeDay.items.filter(s => isMatching(s.type)).map((s, idx) => (
                <li key={idx} className="ag__item">
                  <div className="ag__card">
                    <div className="ag__time">{s.time}</div>
                    <div className="ag__main">
                      <div className="ag__chipline">
                        <span className="ag__type-tag">{allTypes.find(tt => tt.key === s.type)?.icon} {allTypes.find(tt => tt.key === s.type)?.label}</span>
                      </div>
                      <h3 className="ag__name">{s.title}</h3>
                      <p className="ag__speaker">{s.speaker}</p>
                    </div>
                    <button className="ag__info-btn" aria-label="More info">
                      <Info size={16} color="#64748b" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            activeDay.sections.map((section, idx) => (
              <div key={idx} className="ag__section">
                <h3 className="ag__sectionTitle" style={{ fontWeight: 600 }}>{section.title}</h3>
                {section.moderator && <p className="ag__moderator">{section.moderator}</p>}
                <ul className="ag__list">
                  {section.sessions.filter(s => isMatching(s.type)).map((s, i) => (
                    <li key={i} className="ag__item">
                      <div
                        className={`ag__card ${s.highlight ? 'ag__card--highlight' : ''}`}
                      >
                        <div className="ag__time">{s.time}</div>
                        <div className="ag__main">
                          <div className="ag__chipline">
                            <span className="ag__type-tag">{allTypes.find(tt => tt.key === s.type)?.icon} {allTypes.find(tt => tt.key === s.type)?.label}</span>
                          </div>
                          <h3 className="ag__name" style={{ fontWeight: 400 }}>{s.title}</h3>
                        </div>
                        <button className="ag__info-btn" aria-label="More info">
                          <Info size={16} color="#64748b" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
