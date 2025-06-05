import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Home from './pages/Home';
import LoadingFallback from './components/ui/LoadingFallback';
import ErrorFallback from './components/ui/ErrorFallback';
import { useAuth } from './hooks/useAuth';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const RoutePlanner = lazy(() => import('./pages/RoutePlanner'));
// const CostEstimator = lazy(() => import('./pages/CostEstimator'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PlacesPage = lazy(() => import('./pages/PlacesPage'));
const PlaceDetailPage = lazy(() => import('./pages/PlaceDetailPage'));
const PlacesManager = lazy(() => import('./pages/admin/PlacesManager'));

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login\" replace />;
  }

  return <>{children}</>;
};

// Admin route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/\" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Main app routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route 
                path="/route-planner" 
                element={
                  <ProtectedRoute>
                    <RoutePlanner />
                  </ProtectedRoute>
                } 
              />
              <Route path="/reviews" element={<Reviews />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/*" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/places" 
                element={
                  <AdminRoute>
                    <PlacesManager />
                  </AdminRoute>
                } 
              />
              
              {/* Places routes */}
              <Route path="/places" element={<PlacesPage />} />
              <Route path="/places/:id" element={<PlaceDetailPage />} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default App;