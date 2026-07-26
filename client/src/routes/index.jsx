import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts (small — load eagerly)
import PublicLayout  from '../components/layout/PublicLayout';
import MainLayout    from '../components/layout/MainLayout';
import ProtectedRoute from '../layouts/ProtectedRoute';

// ── Lazy-loaded pages (automatic code splitting) ─────────────────
const Landing      = lazy(() => import('../pages/Landing/Landing'));
const Login        = lazy(() => import('../pages/Auth/Login'));
const Signup       = lazy(() => import('../pages/Auth/Signup'));

const Dashboard    = lazy(() => import('../pages/Dashboard/Dashboard'));
const Feed         = lazy(() => import('../pages/Feed/Feed'));
const Jobs         = lazy(() => import('../pages/Jobs/Jobs'));
const Notifications = lazy(() => import('../pages/Notifications/Notifications'));
const Messaging    = lazy(() => import('../pages/Messaging/Messaging'));
const Profile      = lazy(() => import('../pages/Profile/Profile'));
const Networking   = lazy(() => import('../pages/Networking/Networking'));
const Companies    = lazy(() => import('../pages/Companies/Companies'));
const Search       = lazy(() => import('../pages/Search/Search'));
const AI           = lazy(() => import('../pages/AI/AI'));
const Premium      = lazy(() => import('../pages/Premium/Premium'));
const Admin        = lazy(() => import('../pages/Admin/Admin'));

// ── Skeleton fallback shown while each chunk loads ───────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse shadow-glow" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ── Placeholder for genuinely unimplemented routes ───────────────
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full min-h-[50vh]">
    <div className="text-center">
      <div className="text-5xl mb-4">🚧</div>
      <h1 className="text-2xl font-bold text-text-primary dark:text-white">{title}</h1>
      <p className="text-text-secondary dark:text-gray-400 mt-2 font-medium">This page is coming soon.</p>
    </div>
  </div>
);

export const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Public ────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/"                     element={<Landing />} />
        <Route path="/auth/login"           element={<Login />} />
        <Route path="/auth/signup"          element={<Signup />} />
        <Route path="/auth/forgot-password" element={<Placeholder title="Forgot Password" />} />
        <Route path="/auth/reset-password"  element={<Placeholder title="Reset Password" />} />
        <Route path="/auth/verify-email"    element={<Placeholder title="Verify Email" />} />
      </Route>

      {/* ── Protected App ─────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/app/dashboard"    element={<Dashboard />} />
          <Route path="/app/feed"         element={<Feed />} />
          <Route path="/app/jobs"         element={<Jobs />} />
          <Route path="/app/notifications" element={<Notifications />} />
          <Route path="/app/messaging"    element={<Messaging />} />
          <Route path="/app/profile"      element={<Profile />} />
          <Route path="/app/profile/:id"  element={<Profile />} />
          <Route path="/app/networking"   element={<Networking />} />
          <Route path="/app/companies"    element={<Companies />} />
          <Route path="/app/search"       element={<Search />} />
          <Route path="/app/ai"           element={<AI />} />
          <Route path="/app/premium"      element={<Premium />} />
          <Route path="/app/admin"        element={<Admin />} />
        </Route>
      </Route>

      {/* ── Fallback ──────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);
