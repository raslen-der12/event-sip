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
    ],
  },
  {
    id: "messagesGroup",
    label: "Messages",
    icon: "messages",
    href: "/admin/messages"
  },
  {
    id: "financeGroup",
    label: "Finance",
    icon: "finance",
    children: [
      { id: "bills",   label: "Bills",           href: "/admin/finance/bills" },
      { id: "refunds", label: "Refunds",         href: "/admin/finance/refunds" },
      { id: "pricing", label: "Ticket pricing",  href: "/admin/finance/pricing" },
    ],
  },
  {
    id : "forms",
    label: "Forms & Content",
    icon: "forms",
    children: [
      { id: "Selects",  label: "Selects",  href: "/admin/tools/selects" },
    ],
  },

  { id: "tickets",  label: "Tickets",  icon: "tickets",  href: "/admin/tickets" },
  { id: "settings", label: "Settings", icon: "settings", href: "/admin/settings" },
];

export const adminUser = {
  name: "Ayoub",
  role: "Super Admin",
  avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=256",
};
