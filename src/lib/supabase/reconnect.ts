// Wraps a Supabase Realtime channel subscription with automatic
// resubscription on drop (CHANNEL_ERROR / TIMED_OUT / CLOSED), using
// exponential backoff. Recreating the channel on error (rather than
// re-calling .subscribe() on the same instance) is the safe recovery
// path — a channel that has errored isn't guaranteed to rejoin cleanly.
export type ConnStatus = "connecting" | "connected" | "reconnecting";

export function createReconnectingSubscription(
  connect: (onStatus: (status: "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED") => void) => { remove: () => void },
  setStatus: (status: ConnStatus) => void
): () => void {
  let cancelled = false;
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let current: { remove: () => void } | null = null;

  function start() {
    setStatus(attempt === 0 ? "connecting" : "reconnecting");
    current = connect((status) => {
      if (cancelled) return;
      if (status === "SUBSCRIBED") {
        attempt = 0;
        setStatus("connected");
      } else {
        current?.remove();
        attempt++;
        const delay = Math.min(1000 * 2 ** attempt, 15000);
        retryTimer = setTimeout(() => { if (!cancelled) start(); }, delay);
      }
    });
  }

  start();

  return () => {
    cancelled = true;
    if (retryTimer) clearTimeout(retryTimer);
    current?.remove();
  };
}
