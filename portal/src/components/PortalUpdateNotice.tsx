import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

// Keep refresh consent local to this tab. A worker activated by another tab
// must not reload an unfinished form here.
export function createPortalUpdateController(
  baseUrl: string,
  onAvailable: () => void,
  onRefreshError: () => void,
) {
  const serviceWorkers = navigator.serviceWorker;
  let registration: ServiceWorkerRegistration | undefined;
  let currentController = serviceWorkers.controller;
  let refreshRequested = false;
  let disposed = false;
  let lastChecked = Date.now();
  let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
  const workerListeners = new Map<ServiceWorker, () => void>();

  const onControllerChange = () => {
    const hadController = currentController !== null;
    currentController = serviceWorkers.controller;
    if (!currentController) return;
    if (refreshRequested) {
      clearTimeout(refreshTimeout);
      window.location.reload();
    } else if (hadController) onAvailable();
  };

  const watchInstalling = () => {
    const worker = registration?.installing;
    if (!worker || workerListeners.has(worker)) return;
    const onStateChange = () => {
      if (worker.state === 'installed' && serviceWorkers.controller) onAvailable();
      if (worker.state === 'installed' || worker.state === 'redundant') {
        worker.removeEventListener('statechange', onStateChange);
        workerListeners.delete(worker);
      }
    };
    workerListeners.set(worker, onStateChange);
    worker.addEventListener('statechange', onStateChange);
  };

  const checkForUpdate = () => {
    if (!registration || document.visibilityState === 'hidden') return;
    if (registration.waiting) onAvailable();
    if (!navigator.onLine || registration.installing || Date.now() - lastChecked < 60_000) return;
    lastChecked = Date.now();
    // Network failures must not interrupt the current portal session.
    void registration.update().catch(() => undefined);
  };

  serviceWorkers.addEventListener('controllerchange', onControllerChange);
  window.addEventListener('focus', checkForUpdate);
  window.addEventListener('online', checkForUpdate);
  document.addEventListener('visibilitychange', checkForUpdate);
  const updateInterval = window.setInterval(checkForUpdate, 60 * 60 * 1000);

  void serviceWorkers.register(`${baseUrl}sw.js`, {
    scope: baseUrl,
    updateViaCache: 'none',
  }).then((result) => {
    if (disposed) return;
    registration = result;
    if (registration.waiting) onAvailable();
    registration.addEventListener('updatefound', watchInstalling);
    watchInstalling();
  }).catch((error) => {
    if (!disposed) console.warn('Portal update checks are unavailable.', error);
  });

  return {
    refresh() {
      refreshRequested = true;
      const waitingWorker = registration?.waiting;
      if (!waitingWorker) {
        // Another tab may have already activated this update.
        window.location.reload();
        return;
      }
      const fail = () => {
        clearTimeout(refreshTimeout);
        refreshRequested = false;
        onRefreshError();
      };
      try {
        refreshTimeout = setTimeout(fail, 10_000);
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      } catch {
        fail();
      }
    },
    dispose() {
      disposed = true;
      clearTimeout(refreshTimeout);
      window.clearInterval(updateInterval);
      serviceWorkers.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('focus', checkForUpdate);
      window.removeEventListener('online', checkForUpdate);
      document.removeEventListener('visibilitychange', checkForUpdate);
      registration?.removeEventListener('updatefound', watchInstalling);
      workerListeners.forEach((listener, worker) => worker.removeEventListener('statechange', listener));
    },
  };
}

export function PortalUpdateNotice() {
  const [available, setAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const controller = useRef<ReturnType<typeof createPortalUpdateController> | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    controller.current = createPortalUpdateController(
      import.meta.env.BASE_URL,
      () => setAvailable(true),
      () => { setRefreshing(false); setFailed(true); },
    );
    return () => { controller.current?.dispose(); controller.current = null; };
  }, []);

  if (!available) return null;

  return (
    <section aria-label="Portal update" className="fixed bottom-4 left-4 right-4 z-[60] border border-border bg-card p-4 text-card-foreground shadow-lg sm:left-auto sm:w-96">
      <div role="status" aria-live="polite">
        <p className="text-sm font-semibold">A portal update is ready</p>
        <p className="mt-1 text-sm text-muted-foreground">Save your work, then refresh this tab to use the latest portal.</p>
        {failed && <p className="mt-2 text-sm text-destructive">The update could not finish. Please try again.</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" disabled={refreshing} onClick={() => {
          setRefreshing(true);
          setFailed(false);
          controller.current?.refresh();
        }}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {refreshing ? 'Refreshing…' : 'Refresh portal'}
        </Button>
        <Button type="button" variant="outline" disabled={refreshing} onClick={() => setAvailable(false)}>Later</Button>
      </div>
    </section>
  );
}
