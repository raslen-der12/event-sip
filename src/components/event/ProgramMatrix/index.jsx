import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info, BookOpen, Users, Briefcase, GraduationCap, Calendar } from "lucide-react";
import "./program-agenda.css";

export default function ProgramAgenda({ sessions, isLoading }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(1); // show day 2 by default
  const [filterType, setFilterType] = useState("");

  // Translate type labels
  const allTypes = [
    { key: "formation", label: t("formation"), icon: <BookOpen size={14} /> },
    { key: "panel", label: t("panel"), icon: <Users size={14} /> },
    { key: "atelier", label: t("atelier"), icon: <GraduationCap size={14} /> },
    { key: "masterclass", label: t("masterclass"), icon: <GraduationCap size={14} /> },
    { key: "b2b", label: t("b2b"), icon: <Briefcase size={14} /> },
    { key: "demo", label: t("demo"), icon: <Calendar size={14} /> },
  ];

  // Load program data from translation JSON
  const days = [
    {
      key: "2025-11-12",
      label: t("days.2025-11-12"),
      items: t("program.2025-11-12.items", { returnObjects: true }),
    },
    {
      key: "2025-11-13",
      label: t("days.2025-11-13"),
      sections: t("program.2025-11-13.sections", { returnObjects: true }),
    },
  ];

  const activeDay = days[active];

  const isMatching = (type) => !filterType || type === filterType;

  return (
    <section className="ag">
      <div className="container">
        <header className="ag__head">
          <h2 className="ag__title">{t("programme")}</h2>
          <div className="ag__tabs">
            {days.map((d, i) => (
              <button
                key={d.key}
                className={`ag__pill ${active === i ? "is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </header>

        <div className="ag__filter-bar">
          {allTypes.map((tItem) => (
            <button
              key={tItem.key}
              className={`ag__filter-tag ${filterType === tItem.key ? "is-active" : ""}`}
              onClick={() => setFilterType(filterType === tItem.key ? "" : tItem.key)}
            >
              {tItem.icon}
              <span>{tItem.label}</span>
            </button>
          ))}
          {filterType && (
            <button className="ag__filter-clear" onClick={() => setFilterType("")}>
              {t("clear")}
            </button>
          )}
        </div>

        <div className="ag__content">
          {activeDay.items ? (
            <ul className="ag__list">
              {activeDay.items.filter((s) => isMatching(s.type)).map((s, idx) => (
                <li key={idx} className="ag__item">
                  <div className="ag__card">
                    <div className="ag__time">{s.time}</div>
                    <div className="ag__main">
                      <div className="ag__chipline">
                        <span className="ag__type-tag">
                          {allTypes.find((tt) => tt.key === s.type)?.icon}{" "}
                          {allTypes.find((tt) => tt.key === s.type)?.label}
                        </span>
                      </div>
                      <h3 className="ag__name">{s.title}</h3>
                      <p className="ag__speaker">{s.speaker}</p>
                    </div>
                    <button className="ag__info-btn" aria-label={t("moreInfo")}>
                      <Info size={16} color="#64748b" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            activeDay.sections.map((section, idx) => (
              <div key={idx} className="ag__section">
                <h3 className="ag__sectionTitle" style={{ fontWeight: 600 }}>
                  {section.title}
                </h3>
                {section.moderator && <p className="ag__moderator">{section.moderator}</p>}
                <ul className="ag__list">
                  {section.sessions.filter((s) => isMatching(s.type)).map((s, i) => (
                    <li key={i} className="ag__item">
                      <div className={`ag__card ${s.highlight ? "ag__card--highlight" : ""}`}>
                        <div className="ag__time">{s.time}</div>
                        <div className="ag__main">
                          <div className="ag__chipline">
                            <span className="ag__type-tag">
                              {allTypes.find((tt) => tt.key === s.type)?.icon}{" "}
                              {allTypes.find((tt) => tt.key === s.type)?.label}
                            </span>
                          </div>
                          <h3 className="ag__name" style={{ fontWeight: 400 }}>
                            {s.title}
                          </h3>
                        </div>
                        <button className="ag__info-btn" aria-label={t("moreInfo")}>
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
