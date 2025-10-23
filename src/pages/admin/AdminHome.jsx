import React from "react";
import StatsTopFilters from "../../components/admin/dashboard/StatsTopFilters";
import AttendeeKpiRow from "../../components/admin/dashboard/AttendeeKpiRow";
import RegistrationsOverTime from "../../components/admin/dashboard/RegistrationsOverTime";
import LanguagesDonut from "../../components/admin/dashboard/LanguagesDonut";
import RecentActivity from "../../components/admin/dashboard/RecentActivity"; // keep for now
import EventsTable from "../../components/admin/dashboard/EventsTable";       // keep for now as placeholder row
import TopSpeakers from "../../components/admin/dashboard/TopSpeakers";       // placeholder (will replace later)
import "../../components/admin/dashboard/admin.dashboard.css";
import TopCountriesCard from "../../components/admin/dashboard/TopCountriesCard";
import TopCitiesCard from "../../components/admin/dashboard/TopCitiesCard";
import ActorTypeCard from "../../components/admin/dashboard/ActorTypeCard";
import TopOrgsCard from "../../components/admin/dashboard/TopOrgsCard";
import TopJobTitlesCard from "../../components/admin/dashboard/TopJobTitlesCard";
import LinksCoverageCard from "../../components/admin/dashboard/LinksCoverageCard";
import OpenToMeetingsCard from "../../components/admin/dashboard/OpenToMeetingsCard";
import ObjectivesCard from "../../components/admin/dashboard/ObjectivesCard";
import VerificationCard from "../../components/admin/dashboard/VerificationCard";
import AttendeesPerEventCard from "../../components/admin/dashboard/AttendeesPerEventCard";
import EventGrowthCard from "../../components/admin/dashboard/EventGrowthCard";
import RetentionCard from "../../components/admin/dashboard/RetentionCard";
import BestBusinessProfiles from "../../components/admin/dashboard/BestBusinessProfiles";
import DataCompletenessCard from "../../components/admin/dashboard/DataCompletenessCard";


import { useGetAttendeeStatsQuery } from "../../features/stats/statsApiSlice";
import { useGetEventsQuery } from "../../features/events/eventsApiSlice";
export default function AdminHome() {
  const [filters, setFilters] = React.useState({ eventId: "", countries: [] });
  const { data: eventsRes } = useGetEventsQuery(); // used to populate event select
  const eventsList = Array.isArray(eventsRes?.data) ? eventsRes.data : (eventsRes || []);
  const { data: stats, isFetching } = useGetAttendeeStatsQuery({
    eventId: filters.eventId || undefined,
    countries: filters.countries && filters.countries.length ? filters.countries : undefined,
  });
 const kpiData = isFetching ? undefined : stats;
const growthSingle =
    stats?.eventsOverview?.single?.growthPct ??
    0;
const retentionSingle =
    stats?.eventsOverview?.single?.retentionPct ??
    0;
    // Build a lightweight "recent activity" feed from the available stats
  const activity = React.useMemo(() => {
    if (!stats) return [];

    const items = [];

    // New registrations (last 7d / 30d)
    if (typeof stats.new7d === "number") {
      items.push({
        type: "signup",
        title: `${stats.new7d} new registrations`,
        sub: "Last 7 days",
        time: "recent",
      });
    }
    if (typeof stats.new30d === "number") {
      items.push({
        type: "signup",
        title: `${stats.new30d} new registrations`,
        sub: "Last 30 days",
        time: "recent",
      });
    }

    // Top country shout-out
    const topCountry = stats.topCountries && stats.topCountries[0];
    if (topCountry) {
      items.push({
        type: "checkin",
        title: `Top country: ${topCountry.label}`,
        sub: `${topCountry.value} attendees`,
        time: "updated",
      });
    }

    // Top organization highlight (acts like “best profile cluster” signal)
    const topOrg = stats.topOrgs && stats.topOrgs[0];
    if (topOrg) {
      items.push({
        type: "comment",
        title: `Most represented org: ${topOrg.label}`,
        sub: `${topOrg.value} attendees`,
        time: "updated",
      });
    }

    // Event growth / retention glimpses (if present)
    const growthAny = Array.isArray(stats.eventsOverview?.growthPerEventPct) && stats.eventsOverview.growthPerEventPct[0];
    if (growthAny && typeof growthAny.value === "number") {
      items.push({
        type: "checkin",
        title: `Growth: ${growthAny.value}%`,
        sub: growthAny.label || "Top event last 30d",
        time: "trend",
      });
    }
    const retentionAny = Array.isArray(stats.eventsOverview?.retentionPct) && stats.eventsOverview.retentionPct[0];
    if (retentionAny && typeof retentionAny.value === "number") {
      items.push({
        type: "comment",
        title: `Returning attendees: ${retentionAny.value}%`,
        sub: retentionAny.label || "Across events",
        time: "trend",
      });
    }

    // Fallback if everything is zero/empty
    if (!items.length) {
      items.push({
        type: "comment",
        title: "No recent changes",
        sub: "Data will appear as activity occurs",
        time: "—",
      });
    }

    // Keep it tidy: top 5
    return items.slice(0, 5);
  }, [stats]);


 
  return (
    <div className="d-grid">
      <StatsTopFilters
        events={eventsList}
        onChange={(st) => {
          // st: { eventId, countries } (plus optional action)
          setFilters({ eventId: st.eventId || "", countries: st.countries || [] });
        }}
      />
      <AttendeeKpiRow stats={kpiData} />

      <div className="overview-grid">
        <RegistrationsOverTime data={stats?.registrationsOverTime || []} />
        <LanguagesDonut data={stats?.languages || []} />
        <RecentActivity items={activity} />
      </div>
      <div className="overview-grid">
        <TopCountriesCard data={stats?.topCountries || []} />
        <TopCitiesCard data={stats?.topCities || []} />
        <ActorTypeCard data={stats?.actorTypes || []} />
        <TopOrgsCard data={stats?.topOrgs || []} />
        <TopJobTitlesCard data={stats?.jobTitles || []} />
        <LinksCoverageCard
          linkedinPct={stats?.linksCoverage?.linkedinPct || 0}
          websitePct={stats?.linksCoverage?.websitePct || 0}
        />
      </div>
            <div className="overview-grid">
        <OpenToMeetingsCard pct={stats?.engagement?.openToMeetingsPct || 0} />
        <ObjectivesCard data={stats?.engagement?.objectives || []} />
        <VerificationCard total={stats?.total || 0} verification={stats?.verification || {}} />
      </div>

      {/* === EVENT COMPARISON (optional / only if multi-event) === */}
      <div className="overview-grid">
        <AttendeesPerEventCard data={stats?.eventsOverview?.attendeesPerEvent || []} />
        <EventGrowthCard data={stats?.eventsOverview?.growthPerEventPct || []} />
        <RetentionCard data={stats?.eventsOverview?.retentionPct || []} />
      </div>

      <div className="bottom-grid">
        <DataCompletenessCard data={stats?.dataQuality || { withPhotoPct: 0, withLinksPct: 0, completeProfilePct: 0 }} />
        <BestBusinessProfiles items={stats?.topOrgs || []} />
      </div>

    </div>
  );
}
