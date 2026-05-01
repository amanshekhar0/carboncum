/**
 * coldStart.ts
 * Tracks in-flight network operations and shows a sticky loading toast
 * if any of them takes longer than COLD_START_THRESHOLD_MS to resolve.
 *
 * This is here to give the user a friendly hint when Render's free-tier
 * dyno is spinning up from cold (~30–60s on the first request after idle).
 */

import { toast } from 'sonner';

const COLD_START_THRESHOLD_MS = 2000;
const TOAST_ID = 'carbontwin-cold-start';

let inFlight = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let toastVisible = false;

const showToast = () => {
  if (toastVisible) return;
  toastVisible = true;
  toast.loading('Waking the server up...', {
    id: TOAST_ID,
    description:
      'The backend is hosted on a free Render dyno and goes to sleep when idle. ' +
      'First request after a nap can take ~30 seconds. Hang tight!',
    duration: Infinity,
  });
};

const dismissToast = () => {
  if (!toastVisible) return;
  toastVisible = false;
  toast.dismiss(TOAST_ID);
};

const armTimer = () => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    if (inFlight > 0) showToast();
  }, COLD_START_THRESHOLD_MS);
};

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

/**
 * Wraps an async operation so a "server warming up" toast appears if it
 * doesn't resolve within COLD_START_THRESHOLD_MS. The toast is shared
 * across all concurrent operations and disappears once the last one
 * settles.
 */
export const withColdStartHint = async <T>(op: () => Promise<T>): Promise<T> => {
  inFlight += 1;
  armTimer();
  try {
    const result = await op();
    if (toastVisible) {
      toast.success('Server is awake', { id: TOAST_ID, duration: 1500 });
      toastVisible = false;
    }
    return result;
  } finally {
    inFlight = Math.max(0, inFlight - 1);
    if (inFlight === 0) {
      clearTimer();
      dismissToast();
    }
  }
};

/**
 * Manually mark a long-running connection (e.g. a socket handshake)
 * as started; call the returned function when it succeeds or gives up.
 */
export const beginColdStartProbe = (): (() => void) => {
  inFlight += 1;
  armTimer();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    inFlight = Math.max(0, inFlight - 1);
    if (inFlight === 0) {
      clearTimer();
      dismissToast();
    }
  };
};
