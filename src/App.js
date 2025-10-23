import logo from './logo.svg';
import { Routes, Route } from 'react-router-dom';
import Main from './pages/Main';
import "./index.css";
import "./styles/tokens.css";
import "leaflet/dist/leaflet.css";
import AdminShell from "./components/admin/AdminShell";
import { adminNav, adminUser } from "./pages/admin/admin.mock";
import RequireAuth from './features/auth/RequireAuth';
import Unauthorized from "./pages/Unauthorized";
import AdminHome from "./pages/admin/AdminHome";
import AdminEvents from "./pages/admin/events/AdminEvents";

import RegisterLanding from "./pages/register/RegisterLanding";
import AttendeeRegisterPage from "./pages/register/AttendeeRegisterPage";
import ExhibitorRegisterPage from "./pages/register/ExhibitorRegisterPage";
import LoginPage from './pages/Login';
import VerifEmail from './pages/register/VerifEmail';
import PersistLogin from './pages/Login/PersistLogin';

import ProfilePage from './pages/profile/ProfilePage';
import EventPage from './pages/event/EventPage';
import EventPageOld from './pages/event/EventPageOld';
import EventSpeakersPage from './pages/event/speakers/EventSpeakersPage';
import EventAttendeesPage from './pages/event/attendees/EventAttendeesPage';
import ExhibitorsPage from './pages/event/eshibitors/ExhibitorsPage';
import ProfilePP from './pages/actors/ProfilePP';
import MeetingPage from './pages/meetings/MeetingPage';
import MeetingsPage from './pages/meetings/MeetingsPage';
import EventTicketsPage from './pages/tickets/EventTicketsPage';
import TicketPurchasePage from './pages/tickets/TicketPurchasePage';
import GlobalSpeakersPage from './pages/globalSpeakers/GlobalSpeakersPage';
import EventsPage from './pages/events/EventsPage';
import AdminEventEditor from './pages/admin/events/AdminEventEditor';
import AdminMemberRequests from './pages/admin/members/AdminMemberRequests';
import AdminAttendees from './pages/admin/members/AdminAttendees';
import AdminExhibitors from './pages/admin/members/AdminExhibitors';
import AdminSpeakers from './pages/admin/members/AdminSpeakers';
import AdminMessages from './pages/admin/messages/AdminMessages';
import ActorsMessagesPage from './pages/messages/ActorsMessagesPage';
import SchedulePage from './pages/schedule/SchedulePage';
import AdminSelects from './pages/admin/tools/AdminSelects';
import SessionsPage from './pages/sessions/SessionsPage';
import NotFound from './pages/NotFound';
import { useStore } from 'react-redux';
import { useEffect } from 'react';
import { adminSocket } from './services/adminSocket';
import BusinessProfilePage from './pages/businessProfile/BusinessProfilePage';
import BusinessProfileFormPage from './pages/businessProfile/BusinessProfileFormPage';
import BusnessProfileEditor from './pages/businessProfile/BusnessProfileEditor';

import AIMatchmaking from './pages/landing/AIMatchmaking'
import EventManagementPlatform from './pages/landing/EventManagementPlatform'
import ExportConsultancy from './pages/landing/ExportConsultancy'
import TradeMissions from './pages/landing/TradeMissions'
import Marketplace from './pages/marketplace/MarketplacePage'
import Communities from './pages/landing/Communities'
import SingleCommunity from './pages/landing/SingleCommunity'
import CommunityPage from './pages/community/CommunityPage';
import { COMMUNITY_DEMO } from './pages/community/mockCommunityData';
import ProductPage from './pages/marketplace/ProductPage';
import FreightCalculator from './pages/FreightCalculatorPage/FreightCalculator';
import LoadCalculator from './pages/LoadCalculator/LoadCalculator';
import PopupBridge from './features/notifications/PopupBridge';
import PopupHost from './components/PopupHost';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import RestoreEmail from './pages/auth/RestoreEmail';
import OpenToMeetAttendeesPage from "./pages/attendees/OpenToMeetAttendeesPage";

function SocketBootstrap() {
  const s = useStore();
  useEffect(() => {
    adminSocket.enableDebug(true);           // optional
    adminSocket.init(s).ensureConnected();   // connect once
    return () => adminSocket.disconnect();   // cleanup on app exit
  }, [s]);

  return null;
}

function App() {

  return (
    <>
    <Routes>
      <Route path="*" element={<NotFound />} />
      
      {/* Public route - NO LOGIN REQUIRED */}
      <Route element={<PersistLogin />}>
        <Route path="/" element={<Main />} />
        <Route path="/attendees/open-to-meet" element={<OpenToMeetAttendeesPage />} />
        <Route path="/register" element={<RegisterLanding  />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/reset-password" element={<ResetPassword/>} />
        <Route path="/restore-email" element={<RestoreEmail/>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/communities" element={<CommunityPage initialActors={COMMUNITY_DEMO} />} />
        <Route path="/communities/:role" element={<CommunityPage initialActors={COMMUNITY_DEMO}/>} />
        <Route path="/register/attendee" element={<AttendeeRegisterPage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/register/exhibitor" element={<ExhibitorRegisterPage />} />\
        <Route path="/verify-email" element={<VerifEmail />} />
        <Route path="/event/:eventId" element={<EventPage />} />
        <Route path="/event/:eventId/old" element={<EventPageOld />} />
        <Route path="/event/:eventId/speakers" element={<EventSpeakersPage />} />
        <Route path="/event/:eventId/attendees" element={<EventAttendeesPage />} />
        <Route path="/event/:eventId/exhibitors" element={<ExhibitorsPage />} />
        <Route path="event/:eventId/schedule" element={<SchedulePage />} />
        <Route path="/event/:eventId/tickets" element={<EventTicketsPage />} />
        <Route path="/speakers" element={<GlobalSpeakersPage />} />
        <Route path="/profile/:id" element={<ProfilePP />} />
        <Route path="/BusinessProfile/:BPI" element={<BusinessProfilePage />} />
        <Route path="/BusinessProfile/form" element={<BusinessProfileFormPage />} />
        <Route path="/purchase" element={<TicketPurchasePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/services/ai-matchmaking" element={<AIMatchmaking />} />
        <Route path="/services/event-management" element={<EventManagementPlatform/>} />
        <Route path="/services/export-consultancy" element={<ExportConsultancy/>} />
        <Route path="/services/trade-missions" element={<TradeMissions/>} />
        <Route path="/marketplace" element={<Marketplace/>} />
        <Route path="/communities" element={<Communities/>} />
        <Route path="/communities/students" element={<SingleCommunity/>} />
        <Route path="/logistics/freight-calculator" element={<FreightCalculator />} />
        <Route path="/logistics/load-calculator" element={<LoadCalculator />} />
        <Route element={<RequireAuth allowedRoles={['attendee', 'speaker', 'exhibitor']} />}>
          <Route path="/messages" element={<ActorsMessagesPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/BusinessProfile/dashboard" element={<BusnessProfileEditor />} />
          <Route path="/BusinessProfile" element={<BusinessProfilePage />} />
          <Route path="/meeting/:actorId" element={<MeetingPage />} />
          <Route path="/sessions/:actorId" element={<SessionsPage />} />


        </Route>
        <Route element={<RequireAuth allowedRoles={['admin', 'super']} />}>

          <Route path="/admin" element={<AdminShell nav={adminNav} user={adminUser} />}>
            <Route index element={<AdminHome />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="events/new" element={<AdminEventEditor />} />
            <Route path="members/requests" element={<AdminMemberRequests />} />
            <Route path="members/attendees" element={<AdminAttendees />} />
            <Route path="members/exhibitors" element={<AdminExhibitors />} />
            <Route path="members/speakers" element={<AdminSpeakers />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="tools/selects" element={<AdminSelects />} />

          </Route>
        </Route>
        
      </Route>

    </Routes>
        <PopupBridge />
      <PopupHost />

  </>);
}

export default App;