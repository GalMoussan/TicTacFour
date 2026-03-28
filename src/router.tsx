/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LoadingSpinner } from './components/ui';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const SinglePlayerPage = lazy(() => import('./pages/SinglePlayerPage').then(m => ({ default: m.SinglePlayerPage })));
const RoomLobby = lazy(() => import('./components/RoomLobby').then(m => ({ default: m.RoomLobby })));
const MultiplayerPage = lazy(() => import('./pages/MultiplayerPage').then(m => ({ default: m.MultiplayerPage })));
const DesignSystemTest = lazy(() => import('./pages/DesignSystemTest'));
const ComponentShowcase = lazy(() => import('./pages/ComponentShowcase').then(m => ({ default: m.ComponentShowcase })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <LoadingSpinner size="lg" color="cyan" />
    </div>
  );
}

// Wrap lazy components with Suspense
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <LazyPage><HomePage /></LazyPage>,
  },
  {
    path: '/single-player',
    element: <LazyPage><SinglePlayerPage /></LazyPage>,
  },
  {
    path: '/multiplayer',
    element: <LazyPage><RoomLobby /></LazyPage>,
  },
  {
    path: '/room/:roomId',
    element: <LazyPage><MultiplayerPage /></LazyPage>,
  },
  {
    path: '/design-test',
    element: <LazyPage><DesignSystemTest /></LazyPage>,
  },
  {
    path: '/components',
    element: <LazyPage><ComponentShowcase /></LazyPage>,
  },
]);

export { router };
