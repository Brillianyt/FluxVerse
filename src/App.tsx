import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useAuthStore } from './store/authStore';
import { EventSidebar } from './components/EventSidebar';
import { Loading } from './components/Loading';

// Lazy load pages
const Landing = lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })));
const DiscoveryHome = lazy(() => import('./pages/DiscoveryHome').then(module => ({ default: module.DiscoveryHome })));
const MyEventsTimeline = lazy(() => import('./pages/MyEventsTimeline').then(module => ({ default: module.MyEventsTimeline })));
const EventDetails = lazy(() => import('./pages/EventDetails').then(module => ({ default: module.EventDetails })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const CommunityProfile = lazy(() => import('./pages/CommunityProfile').then(module => ({ default: module.CommunityProfile })));
const CreateEvent = lazy(() => import('./pages/CreateEvent').then(module => ({ default: module.CreateEvent })));
const CategoryDetail = lazy(() => import('./pages/CategoryDetail').then(module => ({ default: module.CategoryDetail })));
const CityEvents = lazy(() => import('./pages/CityEvents').then(module => ({ default: module.CityEvents })));
const AllCommunities = lazy(() => import('./pages/AllCommunities').then(module => ({ default: module.AllCommunities })));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      <ScrollToTop />
      <Navbar />
      <EventSidebar />
      <main className="flex-grow">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<DiscoveryHome />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<CommunityProfile />} />
            <Route path="/my-events" element={<MyEventsTimeline />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/city-events" element={<CityEvents />} />
            <Route path="/city-events/:cityName" element={<CityEvents />} />
            <Route path="/communities" element={<AllCommunities />} />
            <Route path="/categories/:id" element={<CategoryDetail />} />
            {/* Add more routes as needed */}
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
