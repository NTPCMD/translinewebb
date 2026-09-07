import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPortalUpdateController } from './PortalUpdateNotice';

class Worker extends EventTarget {
  state = 'installing';
  postMessage = vi.fn();
}

describe('portal update consent', () => {
  let registration: EventTarget & { waiting: Worker | null; installing: Worker | null; update: ReturnType<typeof vi.fn> };
  let serviceWorkers: EventTarget & { controller: Worker | null; register: ReturnType<typeof vi.fn> };
  let browserWindow: EventTarget & { location: { reload: ReturnType<typeof vi.fn> }; setInterval: typeof setInterval; clearInterval: typeof clearInterval };
  let browserDocument: EventTarget & { visibilityState: string };
  let browserNavigator: { serviceWorker: typeof serviceWorkers; onLine: boolean };
  let controller: ReturnType<typeof createPortalUpdateController>;
  const available = vi.fn();
  const failed = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    registration = Object.assign(new EventTarget(), { waiting: null, installing: null, update: vi.fn().mockResolvedValue(undefined) });
    serviceWorkers = Object.assign(new EventTarget(), { controller: new Worker(), register: vi.fn().mockResolvedValue(registration) });
    browserWindow = Object.assign(new EventTarget(), { location: { reload: vi.fn() }, setInterval, clearInterval });
    browserDocument = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    browserNavigator = { serviceWorker: serviceWorkers, onLine: true };
    vi.stubGlobal('window', browserWindow);
    vi.stubGlobal('document', browserDocument);
    vi.stubGlobal('navigator', browserNavigator);
  });

  afterEach(() => {
    controller?.dispose();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  async function start() {
    controller = createPortalUpdateController('/portal/', available, failed);
    await Promise.resolve();
  }

  function activateUpdate() {
    registration.waiting = null;
    serviceWorkers.controller = new Worker();
    serviceWorkers.dispatchEvent(new Event('controllerchange'));
  }

  it('announces an already waiting update without activating or reloading it', async () => {
    registration.waiting = new Worker();
    await start();
    expect(serviceWorkers.register).toHaveBeenCalledWith('/portal/sw.js', { scope: '/portal/', updateViaCache: 'none' });
    expect(available).toHaveBeenCalledOnce();
    expect(registration.waiting.postMessage).not.toHaveBeenCalled();
    expect(browserWindow.location.reload).not.toHaveBeenCalled();
  });

  it('announces a newly installed update for an existing portal session', async () => {
    await start();
    registration.installing = new Worker();
    registration.dispatchEvent(new Event('updatefound'));
    registration.installing.state = 'installed';
    registration.installing.dispatchEvent(new Event('statechange'));
    expect(available).toHaveBeenCalledOnce();
    expect(browserWindow.location.reload).not.toHaveBeenCalled();
  });

  it('does not announce or reload first-time offline setup', async () => {
    serviceWorkers.controller = null;
    registration.installing = new Worker();
    await start();
    registration.installing.state = 'installed';
    registration.installing.dispatchEvent(new Event('statechange'));
    activateUpdate();
    expect(available).not.toHaveBeenCalled();
    expect(browserWindow.location.reload).not.toHaveBeenCalled();
  });

  it('preserves a form when another tab activates the update', async () => {
    registration.waiting = new Worker();
    await start();
    activateUpdate();
    expect(available).toHaveBeenCalledTimes(2);
    expect(browserWindow.location.reload).not.toHaveBeenCalled();
    controller.refresh();
    expect(browserWindow.location.reload).toHaveBeenCalledOnce();
  });

  it('activates and reloads only after this tab explicitly requests refresh', async () => {
    const waiting = new Worker();
    registration.waiting = waiting;
    await start();
    controller.refresh();
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(browserWindow.location.reload).not.toHaveBeenCalled();
    activateUpdate();
    expect(browserWindow.location.reload).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(failed).not.toHaveBeenCalled();
  });

  it('allows retry after a stalled activation and revokes the old refresh request', async () => {
    registration.waiting = new Worker();
    await start();
    controller.refresh();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(failed).toHaveBeenCalledOnce();
    activateUpdate();
    expect(browserWindow.location.reload).not.toHaveBeenCalled();
  });

  it('honors explicit refresh when this tab is not yet controlled', async () => {
    serviceWorkers.controller = null;
    registration.waiting = new Worker();
    await start();
    controller.refresh();
    activateUpdate();
    expect(browserWindow.location.reload).toHaveBeenCalledOnce();
  });

  it('checks when returning to the portal, throttles duplicates, and tolerates offline work', async () => {
    await start();
    await vi.advanceTimersByTimeAsync(60_000);
    browserWindow.dispatchEvent(new Event('focus'));
    browserDocument.dispatchEvent(new Event('visibilitychange'));
    expect(registration.update).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60_000);
    browserNavigator.onLine = false;
    browserWindow.dispatchEvent(new Event('focus'));
    expect(registration.update).toHaveBeenCalledOnce();
    browserNavigator.onLine = true;
    browserWindow.dispatchEvent(new Event('online'));
    expect(registration.update).toHaveBeenCalledTimes(2);
    expect(browserWindow.location.reload).not.toHaveBeenCalled();
  });

  it('removes listeners when the component unmounts', async () => {
    await start();
    controller.dispose();
    await vi.advanceTimersByTimeAsync(60_000);
    activateUpdate();
    browserWindow.dispatchEvent(new Event('focus'));
    expect(available).not.toHaveBeenCalled();
    expect(registration.update).not.toHaveBeenCalled();
  });
});
