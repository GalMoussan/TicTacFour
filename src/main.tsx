import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './debug'

// TEMPORARILY DISABLED StrictMode to debug double-mount issue
// StrictMode causes intentional double-mounting in development
// which may trigger the bug where Tab 1 disconnects when Tab 2 joins
createRoot(document.getElementById('root')!).render(
  <App />
)
