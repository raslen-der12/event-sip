export const adminNav = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/admin" },

  {
    id: "eventsGroup",
    label: "Events",
    icon: "events",
    children: [
      { id: "list",   label: "All events",    href: "/admin/events" },
      { id: "create", label: "Create event",  href: "/admin/events/new" },
      { id: "cats",   label: "Categories",    href: "/admin/events/categories" },
    ],
  },
  {
    id : " requests",
    label: "Member Requests",
    icon: "requests",
    href: "/admin/members/requests"
  },
  {
    id: "peopleGroup",
    label: "People",
    icon: "actors",
    children: [
      { id: "speakers",   label: "Speakers",   href: "/admin/members/speakers" },
      { id: "exhibitors", label: "Exhibitors", href: "/admin/members/exhibitors" },
      { id: "attendees",  label: "attendees",  href: "/admin/members/attendees" },
      { id: "invites",  label: "generate invites codes",  href: "/admin/invites" },
    ],
  },
  {
    id: "messagesGroup",
    label: "Messages",
    icon: "messages",
    href: "/admin/messages"
  },
  // {
  //   id: "financeGroup",
  //   label: "Finance",
  //   icon: "finance",
  //   children: [
  //     { id: "bills",   label: "Bills",           href: "/admin/finance/bills" },
  //     { id: "refunds", label: "Refunds",         href: "/admin/finance/refunds" },
  //     { id: "pricing", label: "Ticket pricing",  href: "/admin/finance/pricing" },
  //   ],
  // },
  {
    id: "B2B managment",
    label: "B2B",
    icon: "dashboard",
    children: [
      { id: "stats",   label: "B2B stats",           href: "/admin/b2b" },
      { id: "b2bmm",   label: "B2B match make",           href: "/admin/b2b/matchMake" },
      { id: "scanActor", label: "confirm attandee QR",         href: "/admin/scanActor" },
      { id: "scanMeet", label: "confirm meet QR",  href: "/admin/scanMeet" },
      { id: "scanSession", label: "confirm session",  href: "/admin/scanSession" },
    ],
  },
  {
    id: "BP",
    label: "Business Profiles managment",
    icon: "tickets",
    children: [
      { id: "overview",   label: "overview",           href: "/admin/bp/overview" },
      { id: "publishbp", label: "publish business profiles",         href: "/admin/bp/queue" },
      { id: "adminTools", label: "admin tools",  href: "/admin/bp/tools" },
    ],
  },
  { id: "polls", label: "polls management", icon: "finance", href: "/admin/polls" },
  {
    id : "forms",
    label: "Forms & Content",
    icon: "forms",
    children: [
      { id: "Selects",  label: "Selects",  href: "/admin/tools/selects" },
    ],
  },

  // { id: "tickets",  label: "Tickets",  icon: "tickets",  href: "/admin/tickets" },
  { id: "settings", label: "Settings", icon: "settings", href: "/admin/settings" },
];

export const adminUser = {
  name: "Raslen",
  role: "Super Admin",
  avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=256",
};
