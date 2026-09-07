// Main dashboard page with real data from Supabase
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Users, Truck, Calendar, Wrench, AlertCircle, Loader, Activity, ShieldAlert, ClipboardList, MapPin, ArrowUpRight, ArrowRight } from 'lucide-react';
import { getDashboardStats, DashboardStats } from '@/lib/db/dashboard';
import { supabase } from '@/lib/supabase';
import { PERTH_TIME_LABEL } from '@/lib/dateTime';
import { useInbox } from '@/contexts/InboxContext';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    notifications,
    checklistPendingCount,
    busyId: alertBusyId,
    acknowledge,
    complete,
  } = useInbox();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeShiftCount, setActiveShiftCount] = useState<number | null>(null);
  const [forceEndedToday, setForceEndedToday] = useState<number | null>(null);
  const [adminActionsToday, setAdminActionsToday] = useState<number | null>(null);
  const [serviceAlertOpen, setServiceAlertOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  const fetchActiveShiftCount = useCallback(async () => {
    const { count, error: err } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    if (err) { console.error('fetchActiveShiftCount:', err); setActiveShiftCount(null); return; }
    setActiveShiftCount(count || 0);
  }, []);

  const fetchForceEndedToday = useCallback(async () => {
    const { count, error: err } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'force_ended')
      .gte('ended_at', startOfToday().toISOString());
    if (err) { console.error('fetchForceEndedToday:', err); setForceEndedToday(null); return; }
    setForceEndedToday(count || 0);
  }, []);

  const fetchAdminActionsToday = useCallback(async () => {
    const { count, error: err } = await supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday().toISOString());
    if (err) { console.error('fetchAdminActionsToday:', err); setAdminActionsToday(null); return; }
    setAdminActionsToday(count || 0);
  }, []);

  // Auto-open popup once on first load if there are unacknowledged alerts
  useEffect(() => {
    if (!autoOpenedRef.current && notifications.length > 0) {
      autoOpenedRef.current = true;
      setServiceAlertOpen(true);
    }
  }, [notifications.length]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setStats(await getDashboardStats());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('We could not load the dispatch board. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      void fetchData();
      void fetchActiveShiftCount();
      void fetchForceEndedToday();
      void fetchAdminActionsToday();
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchActiveShiftCount, fetchForceEndedToday, fetchAdminActionsToday]);

  // Realtime subscription: auto-update monitor stats when shifts or audit logs change
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        () => {
          fetchActiveShiftCount();
          fetchForceEndedToday();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_audit_logs' },
        () => {
          fetchAdminActionsToday();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveShiftCount, fetchForceEndedToday, fetchAdminActionsToday]);

  const heading = (
    <div className="portalPageHeading">
      <div>
        <p className="portalEyebrow">Perth operations / Admin</p>
        <h1>Dispatch board<span className="text-primary">.</span></h1>
        <p>Your drivers, vehicles and shifts. One working view.</p>
      </div>
      <Button onClick={() => navigate('/live-map')} className="gap-2"><MapPin size={17} /> Open live map <ArrowUpRight size={16} /></Button>
    </div>
  );

  if (loading) return (
    <div className="portalPage space-y-7">
      {heading}
      <div className="portalLoading" role="status"><Loader className="animate-spin text-primary" size={25} /><p>Loading your operations…</p></div>
    </div>
  );

  if (error || !stats) return (
    <div className="portalPage space-y-7">
      {heading}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <AlertCircle className="text-red-800" /><p className="flex-1 text-red-800" role="alert">{error || 'Dispatch data is unavailable.'}</p>
          <Button onClick={() => { setLoading(true); void fetchData(); }}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );

  const statsCards = [
    { name: 'Drivers', value: stats.totalDrivers, icon: Users, detail: `${stats.activeDrivers} on active shifts`, href: '/drivers' },
    { name: 'Vehicles', value: stats.totalVehicles, icon: Truck, detail: `${stats.activeVehicles} in active shifts`, href: '/vehicles' },
    { name: 'Active shifts', value: stats.activeShifts, icon: Calendar, detail: `${stats.todayShifts} shifts today`, href: '/shifts' },
    { name: 'Due for service', value: stats.vehiclesInMaintenance, icon: Wrench, detail: `${stats.pendingMaintenance} pending items`, href: '/maintenance' },
  ];

  return (
    <div className="portalPage space-y-7">
      {heading}
      <section className="portalStatsGrid" aria-label="Operations summary">
        {statsCards.map(stat => {
          const Icon = stat.icon;
          return (
            <button key={stat.name} onClick={() => navigate(stat.href)} className="portalStat">
              <span className="portalStatLabel"><span>{stat.name}</span><Icon size={19} /></span>
              <strong>{stat.value}</strong>
              <span className="portalStatDetail">{stat.detail}<ArrowUpRight size={16} aria-hidden="true" /></span>
            </button>
          );
        })}
      </section>

      <div className="portalDispatchGrid">
        <section className="portalTrackingPanel" aria-labelledby="tracking-title">
          <div className="portalTrackingTop"><span><Activity size={15} /> Driver tracking</span><span>01 / OPERATIONS</span></div>
          <div className="portalTrackingBody">
            <div>
              <h2 id="tracking-title">Know who’s<br />on the road.</h2>
              <p>Open the live map for driver positions and active shift details. Location availability depends on driver updates.</p>
              <Button onClick={() => navigate('/live-map')} className="gap-3">Track drivers <ArrowRight size={17} /></Button>
            </div>
            <div className="portalShiftCounter"><strong>{activeShiftCount ?? '—'}</strong><span>active shifts now</span></div>
          </div>
          <div className="portalTrackingLinks">
            <button onClick={() => navigate('/drivers')}><Users size={16} /> Manage drivers <ArrowUpRight size={16} /></button>
            <button onClick={() => navigate('/shifts')}><Calendar size={16} /> View shifts <ArrowUpRight size={16} /></button>
          </div>
        </section>

        <Card className="portalAttention">
          <CardHeader><p className="portalEyebrow">Action queue</p><CardTitle>Needs your attention</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <button className="portalQueueItem" onClick={() => navigate('/checklist-approvals')}>
              <span className="portalQueueIcon"><ClipboardList size={19} /></span>
              <span><strong>Checklist approvals</strong><small>{checklistPendingCount} awaiting review</small></span>
              <ArrowUpRight size={16} />
            </button>
            <button className="portalQueueItem" onClick={() => setServiceAlertOpen(true)}>
              <span className="portalQueueIcon"><Wrench size={19} /></span>
              <span><strong>Service alerts</strong><small>{notifications.length} open notifications</small></span>
              <ArrowUpRight size={16} />
            </button>
            <p className="text-xs leading-5 text-muted-foreground">Review failed pre-start checks and upcoming vehicle servicing here.</p>
          </CardContent>
        </Card>
      </div>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2" aria-label="Fleet and activity">
        <Card>
          <CardHeader><p className="portalEyebrow">Fleet utilisation</p><CardTitle>Ready for the next shift</CardTitle></CardHeader>
          <CardContent>
            <dl className="portalDetailRows">
              <div><dt>Drivers on active shifts</dt><dd>{stats.activeDrivers} <span>/ {stats.totalDrivers}</span></dd></div>
              <div><dt>Vehicles in active shifts</dt><dd>{stats.activeVehicles} <span>/ {stats.totalVehicles}</span></dd></div>
              <div><dt>Vehicles due for service</dt><dd>{stats.vehiclesInMaintenance}</dd></div>
              <div><dt>Pending maintenance items</dt><dd>{stats.pendingMaintenance}</dd></div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><p className="portalEyebrow">Activity monitor</p><CardTitle>Today at a glance</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="portalActivityGrid">
              <button onClick={() => navigate('/shifts')}><ShieldAlert size={20} /><strong>{forceEndedToday ?? '—'}</strong><span>Force-ended shifts</span></button>
              <button onClick={() => navigate('/logs')}><ClipboardList size={20} /><strong>{adminActionsToday ?? '—'}</strong><span>Admin actions</span></button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Summary refreshes every 30 seconds. Open a record for its latest details.</p>
          </CardContent>
        </Card>
      </section>

      <Dialog open={serviceAlertOpen} onOpenChange={setServiceAlertOpen}>
        <DialogContent className="bg-card border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Service due soon</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Open maintenance alerts. Times shown in {PERTH_TIME_LABEL}.
            </DialogDescription>
          </DialogHeader>

          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open service alerts.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {notifications.map((notification) => {
                const itemId = notification.maintenance_item_id;
                const busy = alertBusyId === itemId;
                return (
                  <div key={itemId} className="rounded-lg border border-border bg-background p-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vehicle</p>
                        <p className="text-foreground">{notification.vehicle_rego ?? notification.vehicle_id ?? 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current km</p>
                        <p className="text-foreground">{notification.current_km != null ? `${Math.round(notification.current_km).toLocaleString()} km` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target service km</p>
                        <p className="text-foreground">{notification.target_service_km != null ? `${Math.round(notification.target_service_km).toLocaleString()} km` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">KM remaining</p>
                        <p className="text-foreground">{notification.km_remaining != null ? `${Math.round(notification.km_remaining).toLocaleString()} km` : '—'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-[#BE1C2D] text-white hover:bg-[#A81828]"
                        disabled={busy}
                        onClick={() => acknowledge(itemId)}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-700 text-white hover:bg-green-800"
                        disabled={busy}
                        onClick={() => complete(itemId)}
                      >
                        Mark completed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setServiceAlertOpen(false);
                          navigate('/maintenance');
                        }}
                      >
                        Go to Maintenance page
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
