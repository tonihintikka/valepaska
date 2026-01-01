# Progressive Web App (PWA) Implementation Plan

## Overview

Convert Valepaska web app into a Progressive Web App with automatic update notifications.

## Why PWA?

- 📱 **Installable** - Add to home screen on iOS/Android
- 🔌 **Offline play** - Works without internet after first load
- 🔄 **Auto-updates** - "New version available" prompt
- ⚡ **Fast loading** - Cached assets for instant start

## Prerequisites

The app is already well-suited for PWA:
- Vite + React (modern build system)
- Client-side only gameplay (no server required)
- Single Page Application architecture

## Implementation Steps

### 1. Install vite-plugin-pwa (~15 min)

```bash
pnpm add -D vite-plugin-pwa
```

Update `vite.config.ts`:
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Valepaska',
        short_name: 'Valepaska',
        description: 'Suomalainen bluffauskorttipeli',
        theme_color: '#1a1a2e',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

### 2. Create App Icons (~30 min)

Required icons in `public/`:
- `pwa-192x192.png` - Android home screen
- `pwa-512x512.png` - Android splash screen
- `apple-touch-icon.png` - iOS home screen
- `favicon.ico` - Browser tab

Can generate from a single high-res source using tools like:
- https://realfavicongenerator.net/
- https://maskable.app/

### 3. Update Notification Component (~30 min)

Create `src/components/UpdatePrompt.tsx`:
```typescript
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="update-prompt">
      <span>Uusi versio saatavilla!</span>
      <button onClick={() => updateServiceWorker(true)}>
        Päivitä nyt
      </button>
    </div>
  )
}
```

Add to `App.tsx`:
```typescript
import { UpdatePrompt } from './components/UpdatePrompt'

function App() {
  return (
    <>
      <UpdatePrompt />
      {/* ... rest of app */}
    </>
  )
}
```

### 4. Service Worker Configuration

The plugin auto-generates the service worker. Key options:

```typescript
VitePWA({
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
        }
      }
    ]
  }
})
```

### 5. Testing (~30 min)

1. Build production: `pnpm build`
2. Preview: `pnpm preview`
3. Check DevTools > Application > Service Workers
4. Test offline mode
5. Deploy to Vercel, verify update prompt works

## Estimated Time

| Task | Time |
|------|------|
| Plugin setup | 15 min |
| Icons | 30 min |
| Update UI | 30 min |
| Testing | 30 min |
| **Total** | **~2 hours** |

## Files to Create/Modify

- `apps/web/vite.config.ts` - Add VitePWA plugin
- `apps/web/public/pwa-*.png` - App icons
- `apps/web/src/components/UpdatePrompt.tsx` - New component
- `apps/web/src/App.tsx` - Include UpdatePrompt
- `apps/web/src/vite-env.d.ts` - TypeScript types for virtual module

## Notes

- Vercel automatically serves correct headers for PWA
- No backend changes needed
- Game state is already in localStorage/memory
