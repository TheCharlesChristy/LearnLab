/// <reference types="vite-plugin-pwa/client" />
// Service-worker registration (FR-PWA-001). Loaded dynamically from main.tsx
// in production builds only, so the virtual module stays out of dev/test.

import { registerSW } from 'virtual:pwa-register';

import { toast } from '../ui';

export function setupPwa(): void {
  if (!('serviceWorker' in navigator)) return;

  // With registerType 'autoUpdate' a new SW activates automatically; when it
  // takes control of an already-controlled page, an update has been
  // installed — offer "Reload to update" (FR-PWA-001).
  const hadController = navigator.serviceWorker.controller !== null;
  if (hadController) {
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        toast({
          message: 'A new version of LearnLab is ready.',
          actionLabel: 'Reload to update',
          onAction: () => window.location.reload(),
          durationMs: null,
        });
      },
      { once: true },
    );
  }

  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('[pwa] service worker registration failed', error);
    },
  });
}
