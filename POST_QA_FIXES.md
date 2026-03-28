# Post-QA Priority Fixes

This document outlines the high-priority fixes identified during Sprint 9 QA testing, organized by urgency and impact.

---

## Critical Fixes (Block Release)

### 1. TypeScript Compilation Errors

**Issue:** Test files have TypeScript errors preventing production builds
**Impact:** Cannot run `npm run build` successfully
**Priority:** CRITICAL

**Affected Files:**
- All test files using `@testing-library/react`
- Issue: `screen`, `fireEvent`, `waitFor` imports not recognized

**Fix Options:**

**Option A: Update Testing Library Imports** (Recommended)
```typescript
// Change from:
import { render, screen, fireEvent } from '@testing-library/react';

// To:
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
```

**Option B: Skip Type Checking in Build**
```json
// In package.json, change:
"build": "tsc -b && vite build",

// To:
"build": "vite build",
"build:check": "tsc -b && vite build",
```

**Implementation Steps:**
1. Choose Option A (cleaner) or Option B (faster)
2. If Option A: Update all test files with correct imports
3. If Option B: Update package.json scripts
4. Run `npm run build` to verify
5. Commit changes

**Estimated Time:** 1-2 hours

---

### 2. Update HTML Title and Meta Tags

**Issue:** HTML title is "temp-vite" (placeholder)
**Impact:** Poor SEO, unprofessional browser tabs
**Priority:** HIGH

**Current (index.html):**
```html
<title>temp-vite</title>
```

**Fix:**
```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Update title -->
  <title>4×4×4 Tic-Tac-Toe | Tic-Tac-For</title>

  <!-- Add meta description -->
  <meta name="description" content="Experience 4D Tic-Tac-Toe with stunning futuristic graphics. Play single-player AI or multiplayer battles in real-time." />

  <!-- Add Open Graph tags -->
  <meta property="og:title" content="4×4×4 Tic-Tac-Toe | Tic-Tac-For" />
  <meta property="og:description" content="Experience 4D Tic-Tac-Toe with stunning futuristic graphics." />
  <meta property="og:type" content="website" />

  <!-- Add theme color -->
  <meta name="theme-color" content="#0a0118" />
</head>
```

**File:** `/Users/galmoussan/projects/claude/tictacfor/index.html`

**Estimated Time:** 15 minutes

---

## High-Priority Fixes (Should Fix Before Launch)

### 3. Bundle Size Optimization - Code Splitting

**Issue:** 1.6 MB bundle size exceeds recommendations
**Impact:** Slow initial load, poor performance on slow connections
**Priority:** HIGH

**Current Bundle:**
```
dist/assets/index-D1D4sm7l.js   1,603.06 kB │ gzip: 445.81 kB
```

**Target Bundle:**
```
Main chunk:     < 300 KB gzipped
3D chunk:       < 200 KB gzipped (lazy loaded)
Route chunks:   < 100 KB each
```

**Implementation Plan:**

**Step 1: Lazy Load Routes**
```typescript
// src/router.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/ui';

// Lazy load heavy pages
const HomePage = lazy(() => import('./pages/HomePage'));
const SinglePlayerPage = lazy(() => import('./pages/SinglePlayerPage'));
const MultiplayerPage = lazy(() => import('./pages/MultiplayerPage'));

// Wrap routes with Suspense
export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/single-player" element={<SinglePlayerPage />} />
        <Route path="/multiplayer" element={<RoomLobby />} />
        <Route path="/room/:roomId" element={<MultiplayerPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Step 2: Lazy Load 3D Components**
```typescript
// src/pages/SinglePlayerPage.tsx
import { lazy, Suspense } from 'react';

const Scene3D = lazy(() => import('../components/Scene3D'));

// In component:
<Suspense fallback={<div className="glass p-8">Loading 3D view...</div>}>
  <Scene3D board={board} winningLine={winningLine} />
</Suspense>
```

**Step 3: Configure Vite Code Splitting**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'animation-vendor': ['framer-motion'],
          'multiplayer-vendor': ['ably', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
```

**Expected Results:**
- Main bundle: ~200-250 KB gzipped
- 3D vendor chunk: ~150-200 KB gzipped (lazy loaded)
- React vendor chunk: ~50 KB gzipped
- Total initial load: ~300-350 KB gzipped

**Estimated Time:** 3-4 hours

---

### 4. Add Comprehensive ARIA Labels

**Issue:** Missing screen reader support for game board and buttons
**Impact:** Poor accessibility for visually impaired users
**Priority:** HIGH

**Areas to Fix:**

**4.1: Game Board Grid**
```typescript
// src/components/FlatBoard.tsx
<div
  role="grid"
  aria-label={`Layer ${layer + 1} game board`}
  className="grid grid-cols-4 gap-2"
>
  {board[layer].map((row, y) =>
    row.map((cell, x) => (
      <button
        key={`${y}-${x}`}
        role="gridcell"
        aria-label={`Layer ${layer + 1}, Row ${y + 1}, Column ${x + 1}. ${
          cell ? `Occupied by ${cell}` : 'Empty'
        }`}
        aria-disabled={isGameOver || cell !== null}
        onClick={() => handleCellClick(layer, y, x)}
        className="..."
      >
        {cell}
      </button>
    ))
  )}
</div>
```

**4.2: Icon-Only Buttons**
```typescript
// src/pages/SinglePlayerPage.tsx
<NeonButton
  color="cyan"
  onClick={() => navigate('/')}
  className="hexagon"
  aria-label="Back to home page"
>
  {/* Back arrow icon */}
</NeonButton>

// src/components/RoomStatus.tsx
<button
  onClick={handleCopyRoomCode}
  aria-label="Copy room code to clipboard"
  className="..."
>
  {/* Copy icon */}
</button>
```

**4.3: Game State Announcements**
```typescript
// src/components/GameInfo.tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {winner
    ? `Game over. ${winner} wins!`
    : isDraw
    ? 'Game over. It\'s a draw.'
    : `Current turn: ${currentPlayer}`}
</div>

// Add to index.css:
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**4.4: Form Labels**
```typescript
// src/components/RoomLobby.tsx
// Already has proper labels ✓
<label htmlFor="room-id-input" className="...">
  ENTER ROOM CODE
</label>
<CyberInput
  id="room-id-input"
  aria-describedby="room-id-help"
  // ...
/>
<span id="room-id-help" className="sr-only">
  Enter an 8-character room code to join an existing game
</span>
```

**Estimated Time:** 2-3 hours

---

### 5. Focus Management for Modals

**Issue:** No focus trap in RoomLobby, poor keyboard navigation
**Impact:** Difficult for keyboard-only users
**Priority:** MEDIUM-HIGH

**Implementation:**

**Option A: Manual Focus Management**
```typescript
// src/components/RoomLobby.tsx
import { useEffect, useRef } from 'react';

export function RoomLobby() {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Focus first element on mount
    firstFocusableRef.current?.focus();

    // Trap focus within modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), a[href]'
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={modalRef} className="...">
      {/* Content */}
    </div>
  );
}
```

**Option B: Use Library** (Recommended for robustness)
```bash
npm install react-focus-lock
```

```typescript
// src/components/RoomLobby.tsx
import FocusLock from 'react-focus-lock';

export function RoomLobby() {
  return (
    <FocusLock>
      <div className="...">
        {/* Existing content */}
      </div>
    </FocusLock>
  );
}
```

**Estimated Time:** 1-2 hours

---

## Medium-Priority Fixes (Nice to Have)

### 6. Mobile Game Cell Size Optimization

**Issue:** Game board cells may be too small on 375px screens
**Impact:** Difficult touch targets on small mobile devices
**Priority:** MEDIUM

**Investigation:**
1. Open DevTools, set to iPhone SE (375px)
2. Measure cell size in game board
3. If < 44px, adjust grid gap or cell sizing

**Fix:**
```typescript
// src/components/FlatBoard.tsx
<div
  className={`
    grid grid-cols-4
    ${
      // Reduce gap on small screens for larger cells
      'gap-1 sm:gap-2'
    }
  `}
>
  {/* Cells */}
</div>
```

**Estimated Time:** 1 hour

---

### 7. Add High-Contrast Mode

**Issue:** Some users may need higher contrast for accessibility
**Impact:** WCAG AAA compliance, better for visually impaired
**Priority:** MEDIUM

**Implementation:**
```typescript
// src/store/uiStore.ts
import { create } from 'zustand';

interface UIStore {
  highContrast: boolean;
  toggleHighContrast: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  highContrast: false,
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
}));
```

```typescript
// src/App.tsx
import { useUIStore } from './store/uiStore';

export function App() {
  const highContrast = useUIStore((state) => state.highContrast);

  return (
    <div className={highContrast ? 'high-contrast' : ''}>
      {/* App content */}
    </div>
  );
}
```

```css
/* src/index.css */
.high-contrast {
  --color-neon-cyan: #00ffff;
  --color-neon-pink: #ff00ff;
  --color-neon-purple: #cc00ff;
  --glass-background: rgba(0, 0, 0, 0.8);
  --glass-border: rgba(255, 255, 255, 0.5);
}

.high-contrast .glass {
  background: var(--glass-background);
  border-width: 2px;
}
```

**Add Toggle in Settings:**
```typescript
// src/components/SettingsMenu.tsx (create if needed)
import { useUIStore } from '../store/uiStore';

export function SettingsMenu() {
  const { highContrast, toggleHighContrast } = useUIStore();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={highContrast}
          onChange={toggleHighContrast}
        />
        High Contrast Mode
      </label>
    </div>
  );
}
```

**Estimated Time:** 2-3 hours

---

### 8. Reduce Particle Effects on Mobile

**Issue:** Particle animations may cause performance issues on low-end devices
**Impact:** Better performance, smoother gameplay on mobile
**Priority:** MEDIUM

**Implementation:**
```typescript
// src/hooks/useReducedMotion.ts
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
```

```typescript
// src/components/ui/ParticleBackground.tsx
import { useReducedMotion, useIsMobile } from '../../hooks/useReducedMotion';

export function ParticleBackground({ intensity = 'medium' }: Props) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Reduce or disable particles on mobile or when user prefers reduced motion
  if (reducedMotion) return null;

  const particleCount = isMobile
    ? intensity === 'high' ? 30 : intensity === 'medium' ? 20 : 10
    : intensity === 'high' ? 80 : intensity === 'medium' ? 50 : 30;

  // Render fewer particles...
}
```

**Estimated Time:** 2 hours

---

## Low-Priority Fixes (Polish)

### 9. Add Favicon

**Issue:** Placeholder favicon.svg may not exist
**Impact:** Generic browser tab icon
**Priority:** LOW

**Steps:**
1. Create or obtain favicon SVG with futuristic design
2. Place in `/public/favicon.svg`
3. Optionally add multiple sizes for PWA support

**Estimated Time:** 30 minutes (design) + 15 minutes (implementation)

---

### 10. Add Loading States for Route Transitions

**Issue:** No visual feedback during lazy route loading
**Impact:** User may think app is frozen
**Priority:** LOW

**Implementation:**
```typescript
// src/components/ui/PageLoader.tsx
export function PageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-dark via-cyber-medium to-cyber-dark flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" color="cyan" />
        <p className="mt-4 text-neon-cyan font-display uppercase tracking-wider">
          Loading...
        </p>
      </div>
    </div>
  );
}
```

```typescript
// src/router.tsx
import { PageLoader } from './components/ui/PageLoader';

<Suspense fallback={<PageLoader />}>
  <Routes>
    {/* Routes */}
  </Routes>
</Suspense>
```

**Estimated Time:** 30 minutes

---

## Implementation Roadmap

### Phase 1: Critical (Before Release) - 4-5 hours
1. ✅ Fix TypeScript compilation errors (1-2h)
2. ✅ Update HTML title and meta tags (15min)
3. ✅ Add essential ARIA labels (2-3h)

### Phase 2: High Priority (Week 1) - 8-10 hours
4. ✅ Implement code splitting (3-4h)
5. ✅ Add focus management (1-2h)
6. ✅ Optimize mobile cell sizes (1h)
7. ✅ Add high-contrast mode (2-3h)

### Phase 3: Polish (Week 2-3) - 5-6 hours
8. ✅ Reduce mobile particle effects (2h)
9. ✅ Add favicon (45min)
10. ✅ Add route loading states (30min)
11. ✅ Additional accessibility testing (2h)

**Total Estimated Time:** 17-21 hours

---

## Testing After Fixes

After implementing each fix, verify:

1. **TypeScript Errors:**
   ```bash
   npm run build
   # Should complete without errors
   ```

2. **Bundle Size:**
   ```bash
   npm run build
   # Check dist/ folder sizes
   # Main bundle should be < 350 KB gzipped
   ```

3. **Accessibility:**
   - Run Lighthouse audit (target: Accessibility > 90)
   - Test with screen reader
   - Verify keyboard navigation

4. **Performance:**
   - Run Lighthouse audit (target: Performance > 85)
   - Test on mobile device
   - Monitor FPS during gameplay

5. **Functional:**
   - Run all manual tests from MANUAL_TESTING_GUIDE.md
   - Verify no regressions

---

## Commit Strategy

Commit fixes in logical groups:

```bash
# Fix 1: TypeScript errors
git add .
git commit -m "fix: resolve TypeScript compilation errors in test files"

# Fix 2: Meta tags
git add index.html
git commit -m "feat: update HTML title and add SEO meta tags"

# Fix 3: ARIA labels
git add src/components/
git commit -m "a11y: add comprehensive ARIA labels for screen readers"

# Fix 4: Code splitting
git add vite.config.ts src/router.tsx src/pages/
git commit -m "perf: implement code splitting to reduce bundle size"

# Continue for each major fix...
```

---

## Success Criteria

Fixes are complete when:

- [ ] `npm run build` succeeds without errors
- [ ] Bundle size < 350 KB gzipped for main chunk
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Lighthouse Performance score ≥ 85
- [ ] All critical ARIA labels present
- [ ] Keyboard navigation works smoothly
- [ ] Manual testing checklist passes

**Sign-off:** _________________
**Date:** _________________
