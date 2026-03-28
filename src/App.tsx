import { RouterProvider } from 'react-router-dom';
import { router } from './router';

/**
 * App Component
 *
 * Root component that provides routing for the application.
 * Page transitions are handled within individual routes using
 * Framer Motion's AnimatePresence.
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;
