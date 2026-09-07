// Main dashboard layout with sidebar and header
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Card, CardContent } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/app/components/ui/sheet';
import { formatPerthDateTime } from '@/lib/dateTime';
import { InboxProvider, useInbox } from '@/contexts/InboxContext';
import { supabase } from '@/lib/supabase';
import { listDrivers } from '@/lib/db/drivers';
import logo from '@/assets/transline-logo-lockup.png';
import {
  LayoutDashboard,
  Users,
  Truck,
  MapPin,
  Calendar,
  Droplets,
  Wrench,
  FileText,
  Camera,
  Settings,
  LogOut,
  RefreshCw,
  Bell,
  Inbox,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader,
  ClipboardCheck,
  Menu,
} from 'lucide-react';

const navigation = [
  { name: 'Dispatch board', href: '/', icon: LayoutDashboard, group: 'Operations' },
  { name: 'Live map', href: '/live-map', icon: MapPin, group: 'Operations' },
  { name: 'Drivers', href: '/drivers', icon: Users, group: 'Operations' },
  { name: 'Shifts', href: '/shifts', icon: Calendar, group: 'Operations' },
  { name: 'Vehicles', href: '/vehicles', icon: Truck, group: 'Fleet management' },
  { name: 'Odometer', href: '/odometer', icon: Camera, group: 'Fleet management' },
  { name: 'Fuel logs', href: '/fuel-logs', icon: Droplets, group: 'Fleet management' },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench, group: 'Fleet management' },
  { name: 'Checklist approvals', href: '/checklist-approvals', icon: ClipboardCheck, group: 'Administration' },
  { name: 'Activity logs', href: '/logs', icon: FileText, group: 'Administration' },
  { name: 'Settings', href: '/settings', icon: Settings, group: 'Administration' },
];

function InboxDialogButton() {
  const { notifications, checklistPendingCount, loading, busyId, unreadCount, refresh, acknowledge, complete } = useInbox();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="portalInboxButton"
        aria-label={unreadCount > 0 ? `Inbox, ${unreadCount} unread` : 'Inbox'}
        onClick={() => setOpen(true)}
      >
        <Bell className="w-4 h-4" />
        <span className="hidden sm:inline">Inbox</span>
        {unreadCount > 0 && (
          <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Inbox className="w-5 h-5" />
              Notification Centre
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Service alerts and maintenance notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Loading notifications...
              </div>
            ) : unreadCount === 0 ? (
              <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                No unacknowledged notifications.
              </div>
            ) : (
              <>
                {checklistPendingCount > 0 && (
                  <Card className="border-border bg-background">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-red-800">Failed checklist approvals pending</p>
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {checklistPendingCount} pending checklist approval request(s) require admin action.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-[#BE1C2D] text-white hover:bg-[#A81828]"
                          onClick={() => { setOpen(false); navigate('/checklist-approvals'); }}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Review checklist approvals
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {notifications.map((notification) => {
                  const busy = busyId === notification.maintenance_item_id;
                  return (
                    <Card key={notification.maintenance_item_id} className="border-border bg-background">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-amber-800">Service due soon</p>
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-muted-foreground">Vehicle rego: <span className="text-foreground">{notification.vehicle_rego ?? notification.vehicle_id ?? 'Unknown'}</span></p>
                          <p className="text-muted-foreground">Current km: <span className="text-foreground">{notification.current_km != null ? `${Math.round(notification.current_km).toLocaleString()} km` : '—'}</span></p>
                          <p className="text-muted-foreground">Target service km: <span className="text-foreground">{notification.target_service_km != null ? `${Math.round(notification.target_service_km).toLocaleString()} km` : '—'}</span></p>
                          <p className="text-muted-foreground">KM remaining: <span className="text-foreground">{notification.km_remaining != null ? `${Math.round(notification.km_remaining).toLocaleString()} km` : '—'}</span></p>
                          <p className="text-muted-foreground sm:col-span-2">Created: <span className="text-foreground">{formatPerthDateTime(notification.created_at)}</span></p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="bg-[#BE1C2D] text-white hover:bg-[#A81828]"
                            disabled={busy}
                            onClick={() => acknowledge(notification.maintenance_item_id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-700 text-white hover:bg-green-800"
                            disabled={busy}
                            onClick={() => complete(notification.maintenance_item_id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Mark completed
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => { setOpen(false); navigate('/maintenance'); }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Go to Maintenance
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineDrivers, setOnlineDrivers] = useState<number | null>(null);

  const currentPage = navigation.find(item => location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(`${item.href}/`))) || navigation[0];

  useEffect(() => {
    setSidebarOpen(false);
    document.title = `${currentPage.name} | Transline Admin`;
  }, [location.pathname, currentPage.name]);

  useEffect(() => {
    let cancelled = false;

    const refreshOnlineDrivers = async () => {
      try {
        const drivers = await listDrivers();
        if (cancelled) return;
        setOnlineDrivers(drivers.filter((d) => d.online_status === 'online').length);
      } catch (err) {
        console.error('Failed to fetch online driver count:', err);
        if (!cancelled) setOnlineDrivers(null);
      }
    };

    refreshOnlineDrivers();
    const intervalId = setInterval(refreshOnlineDrivers, 30000);

    const presenceChannel = supabase
      .channel('dashboard-driver-presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_presence' }, () => {
        refreshOnlineDrivers();
      })
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  const handleLogout = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const source = event.currentTarget;
    const clickedElement = event.target instanceof HTMLElement ? event.target : null;
    const clickedTag = clickedElement?.tagName ?? 'unknown';
    const clickedId = clickedElement?.id ?? '';
    const clickedClass = clickedElement?.className ?? '';
    const clickedText = clickedElement?.textContent?.trim().slice(0, 80) ?? '';

    console.error('[AUTH LOGOUT CLICK]', {
      trusted: event.nativeEvent.isTrusted,
      clickedTag,
      clickedId,
      clickedClass,
      clickedText,
      sourceTag: source.tagName,
      sourceDataAttr: source.dataset.logoutTrigger,
    });

    if (!event.nativeEvent.isTrusted) {
      console.error('[AUTH LOGOUT SOURCE]', 'blocked-untrusted-logout-click');
      return;
    }

    if (source.dataset.logoutTrigger !== 'true') {
      console.error('[AUTH LOGOUT SOURCE]', 'blocked-non-logout-click-source');
      return;
    }

    console.error('[AUTH LOGOUT SOURCE]', 'dashboard-layout-logout-button');
    await signOut();
    setSidebarOpen(false);
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <>
      <Link to="/" className="portalBrand" aria-label="Transline dispatch board">
        <img src={logo} alt="Transline Logistics" />
        <span>ADMIN / OPERATIONS</span>
      </Link>
      <nav className="portalNavigation" aria-label="Admin navigation">
        {['Operations', 'Fleet management', 'Administration'].map(group => (
          <div className="portalNavGroup" key={group}>
            <p>{group}</p>
            {navigation.filter(item => item.group === group).map(item => {
              const Icon = item.icon;
              const active = currentPage.href === item.href;
              return (
                <Link key={item.href} to={item.href} aria-current={active ? 'page' : undefined}
                  className={`portalNavLink ${active ? 'isActive' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="portalSidebarFoot">
        <a href="/" className="portalWebsiteLink">Public website <ExternalLink size={14} /></a>
        <Button data-logout-trigger="true" onClick={handleLogout} variant="ghost" className="portalLogout">
          <LogOut size={17} /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <InboxProvider>
      <div className="portalShell portalNumbers">
        <a href="#portal-content" className="portalSkipLink">Skip to content</a>
        <aside className="portalSidebar">{sidebar}</aside>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="portalMobileSidebar" onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById('portal-menu-button')?.focus();
          }}>
            <SheetTitle className="sr-only">Transline admin navigation</SheetTitle>
            <SheetDescription className="sr-only">Manage drivers, vehicles and shifts.</SheetDescription>
            {sidebar}
          </SheetContent>
        </Sheet>
        <div className="portalMain">
          <header className="portalTopbar">
            <div className="flex min-w-0 items-center gap-3">
              <Button id="portal-menu-button" variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"
                aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>
                <Menu size={21} />
              </Button>
              <div className="portalBreadcrumb">
                <span>Workspace</span><span aria-hidden="true">/</span><strong>{currentPage.name}</strong>
              </div>
            </div>
            <div className="portalTopbarActions">
              <div className="hidden md:block"><GlobalSearch /></div>
              <InboxDialogButton />
              <Link to="/drivers" className="portalPresence" aria-label={onlineDrivers == null ? 'Driver presence unavailable. Open drivers.' : `${onlineDrivers} drivers online. Open drivers.`}>
                <span className={onlineDrivers != null && onlineDrivers > 0 ? 'isOnline' : ''} />
                {onlineDrivers == null ? '—' : onlineDrivers}<span className="hidden xl:inline"> online</span>
              </Link>
              <Link to="/settings" className="portalAccount" aria-label="Account settings" title={user?.email || 'Administrator'}>
                {user?.email?.[0].toUpperCase() || 'A'}
              </Link>
            </div>
          </header>
          <div className="portalMobileSearch md:hidden"><GlobalSearch /></div>
          <main id="portal-content" tabIndex={-1} className="portalWorkspace">
            <Outlet />
          </main>
          <footer className="portalWorkspaceFooter">
            <span>Transline Logistics</span><span>Admin workspace · Perth, WA</span>
          </footer>
        </div>
      </div>
    </InboxProvider>
  );
}
