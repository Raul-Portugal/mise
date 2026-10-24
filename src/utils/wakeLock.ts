export interface WakeLockManager {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
}

export function createWakeLockManager(onStateChange?: (active: boolean) => void): WakeLockManager {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  let sentinel: any = null;
  let active = false;

  const updateState = (newActive: boolean) => {
    active = newActive;
    onStateChange?.(active);
  };

  const request = async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      if (sentinel) {
        return true;
      }
      sentinel = await (navigator as any).wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        sentinel = null;
        updateState(false);
      });
      updateState(true);
      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      updateState(false);
      return false;
    }
  };

  const release = async (): Promise<void> => {
    if (sentinel) {
      try {
        await sentinel.release();
      } catch (err) {
        console.warn('Wake Lock release error:', err);
      } finally {
        sentinel = null;
        updateState(false);
      }
    }
  };

  // Re-acquire automatically if tab becomes visible again while active
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', async () => {
      if (active && document.visibilityState === 'visible' && !sentinel) {
        await request();
      }
    });
  }

  return {
    isSupported,
    get isActive() {
      return active;
    },
    request,
    release,
  };
}
