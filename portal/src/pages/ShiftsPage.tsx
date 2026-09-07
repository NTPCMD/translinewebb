// Shifts management page
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Search, Clock, Loader } from 'lucide-react';
import { listShifts, Shift, countActiveShifts, countTodayShifts } from '@/lib/db/shifts';
import { supabase } from '@/lib/supabase';
import { formatPerthDateTime, PERTH_TIME_LABEL } from '@/lib/dateTime';
import { computeWorkingSeconds, summarizeBreakAllowance } from '@/lib/breakAllowance';

const formatChecklistLabel = (key: string) =>
  key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

type ShiftEvent = {
  id?: string;
  shift_id: string;
  event_type: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  latitude?: number;
  longitude?: number;
};

type TimelineItem = {
  id: string;
  eventType: string;
  label: string;
  timestamp: string;
  details?: string;
};

type ChecklistDisplayStatus = 'pass' | 'fail' | 'pending';

type ChecklistDisplayItem = {
  key: string;
  label: string;
  status: ChecklistDisplayStatus;
  statusLabel: string;
  valueLabel: string | null;
  notes: string | null;
};

type ChecklistSummary = {
  total: number;
  pass: number;
  fail: number;
  pending: number;
  submittedAt: string | null;
  answerCount: number;
  hasFailures: boolean | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const formatTimestamp = (value?: string | null) => {
  if (!value) return '—';
  return formatPerthDateTime(value);
};

const formatDurationSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

const toDisplayText = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value.map((entry) => toDisplayText(entry)).filter(Boolean) as string[];
    return parts.length > 0 ? parts.join(', ') : null;
  }
  if (isRecord(value)) {
    const preview = Object.entries(value)
      .slice(0, 3)
      .map(([k, v]) => `${formatChecklistLabel(k)}: ${toDisplayText(v) ?? 'Not recorded'}`)
      .join(' | ');
    return preview || null;
  }
  return null;
};

const parseChecklistStatus = (value: unknown): ChecklistDisplayStatus => {
  if (value == null) return 'pending';
  if (typeof value === 'boolean') return value ? 'pass' : 'fail';
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['pass', 'passed', 'ok', 'true', 'yes'].includes(normalized)) return 'pass';
    if (['fail', 'failed', 'false', 'no'].includes(normalized)) return 'fail';
  }
  return 'pending';
};

const getChecklistItem = (key: string, rawValue: unknown): ChecklistDisplayItem => {
  const label = formatChecklistLabel(key);

  if (!isRecord(rawValue)) {
    const status = parseChecklistStatus(rawValue);
    return {
      key,
      label,
      status,
      statusLabel: status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'Pending',
      valueLabel: status === 'pending' ? toDisplayText(rawValue) ?? 'Not recorded' : null,
      notes: null,
    };
  }

  const statusCandidate = rawValue.status ?? rawValue.result ?? rawValue.outcome ?? rawValue.state ?? rawValue.pass;
  const valueCandidate = rawValue.value ?? rawValue.reading ?? rawValue.answer ?? rawValue.level;
  const notesCandidate = rawValue.notes ?? rawValue.note ?? rawValue.comment ?? rawValue.details;
  const status = parseChecklistStatus(statusCandidate);

  return {
    key,
    label,
    status,
    statusLabel: status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'Pending',
    valueLabel: toDisplayText(valueCandidate) ?? (status === 'pending' ? 'Not recorded' : null),
    notes: toDisplayText(notesCandidate),
  };
};

const normalizeChecklist = (checklist: Shift['checklist'] | null | undefined): ChecklistDisplayItem[] => {
  if (!isRecord(checklist)) return [];
  return Object.entries(checklist).map(([key, value]) => getChecklistItem(key, value));
};

const CHECKLIST_EVENT_TYPES = ['checklist_submitted', 'checklist_completed', 'shift_checklist_submitted'];

const getChecklistAnswersFromMetadata = (metadata: Record<string, unknown> | null | undefined): Record<string, unknown> | null => {
  if (!metadata) return null;

  const directAnswers = metadata.answers;
  if (isRecord(directAnswers)) return directAnswers;

  const directChecklist = metadata.checklist;
  if (isRecord(directChecklist)) return directChecklist;

  return null;
};

const getLatestChecklistEvent = (events: ShiftEvent[]): ShiftEvent | null => {
  const checklistEvents = events.filter((event) => CHECKLIST_EVENT_TYPES.includes(event.event_type));
  if (checklistEvents.length === 0) return null;

  return checklistEvents.reduce<ShiftEvent | null>((latest, event) => {
    if (!latest) return event;
    return new Date(event.created_at).getTime() >= new Date(latest.created_at).getTime() ? event : latest;
  }, null);
};

const getChecklistSummary = (items: ChecklistDisplayItem[] | null | undefined): ChecklistSummary => {
  const safeItems = Array.isArray(items) ? items : [];

  if (safeItems.length === 0) {
    return {
      total: 0,
      pass: 0,
      fail: 0,
      pending: 0,
      submittedAt: null,
      answerCount: 0,
      hasFailures: null,
    };
  }

  let pass = 0;
  let fail = 0;
  let pending = 0;
  safeItems.forEach((item) => {
    if (item.status === 'pass') pass += 1;
    else if (item.status === 'fail') fail += 1;
    else pending += 1;
  });

  return {
    total: safeItems.length,
    pass,
    fail,
    pending,
    submittedAt: null,
    answerCount: safeItems.length,
    hasFailures: fail > 0,
  };
};

const getDurationSecondsFromMetadata = (metadata: Record<string, unknown> | null | undefined): number | null => {
  if (!metadata) return null;
  const candidate = metadata.duration_seconds;
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return Math.max(0, candidate);
  if (typeof candidate === 'string') {
    const parsed = Number(candidate);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return null;
};

const getMetadataDuration = (metadata: Record<string, unknown> | null | undefined): string | null => {
  const seconds = getDurationSecondsFromMetadata(metadata);
  return seconds == null ? null : formatDurationSeconds(seconds);
};

const getLocationSummary = (metadata: Record<string, unknown> | null | undefined): string | null => {
  if (!metadata) return null;
  const lat = metadata.lat ?? metadata.latitude;
  const lng = metadata.lng ?? metadata.longitude;
  const speed = metadata.speed;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const isDefaultGps = Math.abs(lat - 37.422) <= 0.005 && Math.abs(lng - -122.084) <= 0.005;
  const suffix = isDefaultGps ? ' (Invalid/default coordinate)' : '';
  if (typeof speed === 'number') {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)} (${speed} km/h)${suffix}`;
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}${suffix}`;
};

const isLikelyDefaultCoordinate = (lat?: number | null, lng?: number | null) => {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return true;
  if (Math.abs(lat) < 0.00001 && Math.abs(lng) < 0.00001) return true;
  return Math.abs(lat - 37.422) <= 0.005 && Math.abs(lng - -122.084) <= 0.005;
};

const getEventLabel = (eventType: string) => {
  switch (eventType) {
    case 'shift_start':
      return 'Shift started';
    case 'shift_end':
      return 'Shift ended';
    case 'break_start':
      return 'Break started';
    case 'break_end':
      return 'Break ended';
    case 'location':
      return 'Location update';
    default:
      return eventType
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
  }
};

const buildTimeline = (shift: Shift, events: ShiftEvent[]): TimelineItem[] => {
  const timeline: TimelineItem[] = [];
  let locationBuffer: ShiftEvent[] = [];

  const flushLocationBuffer = () => {
    if (locationBuffer.length === 0) return;

    const first = locationBuffer[0];
    const last = locationBuffer[locationBuffer.length - 1];
    const firstMetadata = isRecord(first.metadata) ? first.metadata : null;
    const lastMetadata = isRecord(last.metadata) ? last.metadata : null;

    if (locationBuffer.length <= 2) {
      locationBuffer.forEach((event, index) => {
        const metadata = isRecord(event.metadata) ? event.metadata : null;
        timeline.push({
          id: event.id ?? `${event.shift_id}-${event.event_type}-${event.created_at}-${index}`,
          eventType: event.event_type,
          label: getEventLabel(event.event_type),
          timestamp: event.created_at,
          details: getLocationSummary(metadata) ?? undefined,
        });
      });
    } else {
      timeline.push({
        id: `${shift.id}-location-summary-${last.created_at}`,
        eventType: 'location_summary',
        label: `${locationBuffer.length} location updates`,
        timestamp: last.created_at,
        details: [
          getLocationSummary(firstMetadata),
          getLocationSummary(lastMetadata),
        ]
          .filter(Boolean)
          .join(' -> ') || 'Location updates condensed for readability.',
      });
    }

    locationBuffer = [];
  };

  if (shift.started_at) {
    timeline.push({
      id: `${shift.id}-started`,
      eventType: 'shift_start',
      label: 'Shift started',
      timestamp: shift.started_at,
    });
  }

  events.forEach((event, index) => {
    if (event.event_type === 'location') {
      locationBuffer.push(event);
      return;
    }

    flushLocationBuffer();

    const metadata = isRecord(event.metadata) ? event.metadata : null;
    const durationLabel = event.event_type === 'break_end' ? getMetadataDuration(metadata) : null;
    const locationLabel = event.event_type === 'location' ? getLocationSummary(metadata) : null;
    const details = durationLabel
      ? `Duration: ${durationLabel}`
      : locationLabel ?? undefined;

    timeline.push({
      id: event.id ?? `${event.shift_id}-${event.event_type}-${event.created_at}-${index}`,
      eventType: event.event_type,
      label: getEventLabel(event.event_type),
      timestamp: event.created_at,
      details,
    });
  });

  flushLocationBuffer();

  if (shift.ended_at) {
    timeline.push({
      id: `${shift.id}-ended`,
      eventType: 'shift_end',
      label: 'Shift ended',
      timestamp: shift.ended_at,
    });
  }

  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return timeline;
};

const mergeChecklistSources = (
  eventChecklist: Record<string, unknown> | null,
  shiftChecklist: Shift['checklist'] | null | undefined,
): ChecklistDisplayItem[] => {
  const merged = new Map<string, unknown>();

  if (isRecord(shiftChecklist)) {
    Object.entries(shiftChecklist).forEach(([key, value]) => merged.set(key, value));
  }

  if (isRecord(eventChecklist)) {
    Object.entries(eventChecklist).forEach(([key, value]) => merged.set(key, value));
  }

  return Array.from(merged.entries()).map(([key, value]) => getChecklistItem(key, value));
};

export function ShiftsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ended'>('all');
  const [activeCount, setActiveCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [endShiftDialog, setEndShiftDialog] = useState(false);
  const [endShiftReason, setEndShiftReason] = useState('');
  const [deleteShiftTarget, setDeleteShiftTarget] = useState<Shift | null>(null);
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [shiftEvents, setShiftEvents] = useState<ShiftEvent[]>([]);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const [shiftsList, active, today] = await Promise.all([
        listShifts(),
        countActiveShifts(),
        countTodayShifts(),
      ]);
      setShifts(shiftsList);
      setActiveCount(active);
      setTodayCount(today);
      setError(null);
    } catch (err) {
      setError('Failed to load shifts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  useEffect(() => {
    const channel = supabase
      .channel('shifts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => {
        fetchShifts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchShifts]);

  useEffect(() => {
    const channel = supabase
      .channel('shift-events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shift_events' }, () => {
        fetchShifts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchShifts]);

  const normalizedQuery = searchQuery.toLowerCase();
  const getDriverDisplay = (shift: Shift) => {
    if (shift.driver_name) return shift.driver_name;
    if (shift.driver_id) return `Missing driver record (${shift.driver_id.slice(0, 8)}...)`;
    return 'No driver linked';
  };
  const getVehicleDisplay = (shift: Shift) => {
    if (shift.vehicle_rego) return shift.vehicle_rego;
    if (shift.vehicle_id) return `Missing vehicle record (${shift.vehicle_id.slice(0, 8)}...)`;
    return 'No vehicle linked';
  };

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch =
      getDriverDisplay(shift).toLowerCase().includes(normalizedQuery) ||
      getVehicleDisplay(shift).toLowerCase().includes(normalizedQuery) ||
      shift.driver_id.toLowerCase().includes(normalizedQuery) ||
      (shift.vehicle_id ?? '').toLowerCase().includes(normalizedQuery);
    const matchesStatus = filterStatus === 'all' || shift.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEndShift = async () => {
    if (!selectedShift) return;
    const shiftId = selectedShift.id;

    try {
      const { data, error } = await supabase.rpc('force_end_shift', {
        p_shift_id: shiftId,
        p_reason: 'Force ended by admin',
      });
      if (error) {
        console.error('force_end_shift RPC error', {
          shiftId,
          params: {
            p_shift_id: shiftId,
            p_reason: 'Force ended by admin',
          },
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.info('force_end_shift RPC success', {
        shiftId,
        result: data,
      });

      await fetchShifts();
      setEndShiftDialog(false);
      setSelectedShift(null);
      setEndShiftReason('');
      setError(null);
    } catch (err) {
      setError('Failed to end shift');
      console.error('handleEndShift failed', {
        shiftId,
        error: err,
      });
    }
  };

  const handleEndShiftDialogChange = (open: boolean) => {
    setEndShiftDialog(open);
    if (!open) setEndShiftReason('');
  };

  const handleDeleteShift = async () => {
    if (!deleteShiftTarget) return;

    const shiftId = deleteShiftTarget.id;
    setDeletingShiftId(shiftId);

    try {
      const { error: deleteError } = await supabase.rpc('delete_shift_admin', {
        p_shift_id: shiftId,
      });

      if (deleteError) {
        console.error('delete_shift_admin RPC error', {
          shiftId,
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
        });
        throw deleteError;
      }

      await fetchShifts();
      setDeleteShiftTarget(null);
      setError(null);
    } catch (err) {
      console.error('handleDeleteShift failed', { shiftId, error: err });
      setError('Failed to delete shift');
    } finally {
      setDeletingShiftId(null);
    }
  };

  const loadShiftDetails = useCallback(async (shift: Shift) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      setDetailShift(shift);
      setDetailsOpen(true);

      const { data, error: fetchError } = await supabase
        .from('shift_events')
        .select('id, shift_id, event_type, created_at, metadata, latitude, longitude')
        .eq('shift_id', shift.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setShiftEvents((data as ShiftEvent[]) ?? []);
    } catch (err) {
      console.error('loadShiftDetails error:', err);
      setDetailsError('Failed to load shift events');
      setShiftEvents([]);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleDetailsOpenChange = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      setDetailShift(null);
      setDetailsError(null);
      setShiftEvents([]);
    }
  };

  const latestChecklistEvent = getLatestChecklistEvent(shiftEvents);
  const checklistItems = mergeChecklistSources(
    getChecklistAnswersFromMetadata(isRecord(latestChecklistEvent?.metadata) ? latestChecklistEvent.metadata : null),
    detailShift?.checklist,
  );
  const checklistSummary = {
    ...getChecklistSummary(checklistItems),
    submittedAt: latestChecklistEvent?.created_at ?? null,
    answerCount: checklistItems.length,
    hasFailures: checklistItems.length > 0 ? checklistItems.some((item) => item.status === 'fail') : null,
  };
  const timelineItems = detailShift ? buildTimeline(detailShift, shiftEvents) : [];
  const breakSummary = summarizeBreakAllowance(shiftEvents);
  const workingSeconds = computeWorkingSeconds(
    detailShift?.started_at ?? null,
    detailShift?.ended_at ?? null,
    breakSummary,
  );
  const locationItems = shiftEvents
    .filter((event) => event.event_type === 'location');
  const latestLocationItems = locationItems.slice(-5).reverse();

  return (
    <div className="portalPage space-y-6">
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Shifts</h1>
          <p className="text-muted-foreground">Track driver shifts and checklists. All times shown in {PERTH_TIME_LABEL}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Active Shifts</p>
            <p className="text-3xl font-bold text-green-700">{loading ? '-' : activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Today's Shifts</p>
            <p className="text-3xl font-bold text-foreground">{loading ? '-' : todayCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Shifts</p>
            <p className="text-3xl font-bold text-blue-700">{loading ? '-' : shifts.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">All Shifts</CardTitle>
                <CardDescription className="text-muted-foreground">
                  View shift history and current shifts
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search shifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'ended'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  className={
                    filterStatus === status
                      ? 'bg-[#BE1C2D] hover:bg-[#A81828] text-white'
                      : 'border-input text-muted-foreground hover:text-foreground'
                  }
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 text-[#BE1C2D] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Driver</TableHead>
                    <TableHead className="text-muted-foreground">Vehicle</TableHead>
                    <TableHead className="text-muted-foreground">Start Time</TableHead>
                    <TableHead className="text-muted-foreground">End Time</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Checklist</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No shifts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShifts.map((shift) => {
                      const checklistEntries = normalizeChecklist(shift.checklist);

                      return (
                        <TableRow key={shift.id} className="border-border align-top">
                          <TableCell className="font-medium text-foreground">
                            {getDriverDisplay(shift)}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {getVehicleDisplay(shift)}
                          </TableCell>
                          <TableCell className="text-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {formatPerthDateTime(shift.started_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {shift.ended_at
                              ? formatPerthDateTime(shift.ended_at)
                              : <span className="text-yellow-800">In progress</span>}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                shift.status === 'active'
                                  ? 'bg-green-50 text-green-700 border-green-200 capitalize'
                                  : 'bg-muted text-muted-foreground border-input capitalize'
                              }
                            >
                              {shift.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[280px]">
                            {checklistEntries.length === 0 ? (
                              <span className="text-sm text-muted-foreground">No checklist saved</span>
                            ) : (
                              <div className="space-y-1">
                                {checklistEntries.map((item) => (
                                  <div
                                    key={`${shift.id}-${item.key}`}
                                    className="flex items-center justify-between gap-3 rounded bg-background px-2 py-1 text-xs"
                                  >
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span
                                      className={
                                        item.status === 'fail'
                                          ? 'font-medium text-red-700'
                                          : item.status === 'pass'
                                            ? 'font-medium text-green-700'
                                            : 'text-yellow-800'
                                      }
                                    >
                                      {item.statusLabel}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-blue-700 h-8 px-2 text-xs"
                                onClick={() => {
                                  navigate(`/shifts/${shift.id}`);
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-red-700 h-8 px-2 text-xs"
                                disabled={deletingShiftId === shift.id}
                                onClick={() => setDeleteShiftTarget(shift)}
                              >
                                {deletingShiftId === shift.id ? 'Deleting...' : 'Delete Shift'}
                              </Button>
                              {shift.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-red-700 h-8 px-2 text-xs"
                                  onClick={() => {
                                    setSelectedShift(shift);
                                    setEndShiftDialog(true);
                                  }}
                                >
                                  End Shift
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={endShiftDialog} onOpenChange={handleEndShiftDialogChange}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">End Shift</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to end the shift for {selectedShift ? getDriverDisplay(selectedShift) : 'this driver'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={endShiftReason}
              onChange={(e) => setEndShiftReason(e.target.value)}
              placeholder="Reason (optional)"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-4">
            <AlertDialogCancel className="bg-muted text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndShift}
              className="bg-red-700 text-white hover:bg-red-800"
            >
              End Shift
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteShiftTarget)} onOpenChange={(open) => !open && setDeleteShiftTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Shift</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This deletes the shift and all related events. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel className="bg-muted text-foreground hover:bg-muted" disabled={Boolean(deletingShiftId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShift}
              className="bg-red-700 text-white hover:bg-red-800"
              disabled={Boolean(deletingShiftId)}
            >
              {deletingShiftId ? 'Deleting...' : 'Delete Shift'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

<Dialog open={detailsOpen} onOpenChange={handleDetailsOpenChange}>
  <DialogContent
    style={{ maxWidth: "1200px" }}
    className="bg-card border-border text-[#17191B] max-h-[90vh] overflow-y-auto"
  >
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold">Shift Details</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        Full timeline and event breakdown for the selected shift
      </DialogDescription>
    </DialogHeader>

    {!detailShift ? (
      <div className="text-sm text-muted-foreground">No shift selected.</div>
    ) : (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* LEFT COLUMN */}
        <div className="xl:col-span-2 space-y-4">

          {/* OVERVIEW */}
          <Card className="bg-background border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Overview</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Driver", getDriverDisplay(detailShift)],
                ["Vehicle", getVehicleDisplay(detailShift)],
                ["Start Time", formatTimestamp(detailShift.started_at)],
                ["End Time", formatTimestamp(detailShift.ended_at)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg bg-muted border border-border px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm text-foreground truncate">{value}</p>
                </div>
              ))}

              <div className="rounded-lg bg-muted border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge
                  className={
                    detailShift.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200 mt-1 capitalize"
                      : "bg-muted text-muted-foreground border-input mt-1 capitalize"
                  }
                >
                  {detailShift.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* GPS */}
          <Card className="bg-background border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Live GPS Tracking</CardTitle>
              <CardDescription className="text-muted-foreground">
                Latest location updates from shift events
              </CardDescription>
            </CardHeader>

            <CardContent>
              {detailsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader className="w-5 h-5 text-[#BE1C2D] animate-spin" />
                </div>
              ) : latestLocationItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No GPS data available</p>
              ) : (
                <div className="space-y-2">
                  {latestLocationItems.map((item) => (
                    <div
                      key={`loc-${item.id}`}
                      className="rounded-lg bg-muted border border-border px-3 py-2 text-xs"
                    >
                      <div className="flex justify-between text-muted-foreground">
                        <span>{item.latitude}</span>
                        <span>{item.longitude}</span>
                      </div>
                      {isLikelyDefaultCoordinate(item.latitude, item.longitude) && (
                        <p className="mt-1 text-[11px] text-amber-800">Invalid/default coordinate flagged</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatTimestamp(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CHECKLIST + BREAKS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Checklist</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted rounded-lg px-2 py-2 text-foreground">
                    Submitted At: {checklistSummary.submittedAt ? formatTimestamp(checklistSummary.submittedAt) : 'Pending'}
                  </div>
                  <div className="bg-muted rounded-lg px-2 py-2 text-foreground">
                    Answers: {checklistSummary.answerCount > 0 ? checklistSummary.answerCount : 'Pending'}
                  </div>
                  <div className="bg-muted rounded-lg px-2 py-2 text-foreground">
                    Has Failures:{' '}
                    <span
                      className={
                        checklistSummary.hasFailures == null
                          ? 'text-yellow-800'
                          : checklistSummary.hasFailures
                            ? 'text-red-700'
                            : 'text-green-700'
                      }
                    >
                      {checklistSummary.hasFailures == null ? 'Pending' : checklistSummary.hasFailures ? 'Fail' : 'Pass'}
                    </span>
                  </div>
                  <div className="bg-muted rounded-lg px-2 py-2 text-foreground">
                    Total Answers: {checklistSummary.total}
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {checklistItems.length === 0 ? (
                    <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                      No checklist submission event found
                    </div>
                  ) : (
                    checklistItems.map((item) => (
                      <div
                        key={`detail-${detailShift.id}-${item.key}`}
                        className="rounded-lg border border-border bg-muted px-3 py-2 text-xs"
                      >
                        <div className="flex justify-between gap-3">
                          <span className="text-foreground">{item.label}</span>
                          <span
                            className={
                              item.status === "fail"
                                ? "text-red-700"
                                : item.status === "pass"
                                ? "text-green-700"
                                : "text-yellow-800"
                            }
                          >
                            {item.statusLabel}
                          </span>
                        </div>
                        {item.valueLabel && (
                          <p className="mt-1 text-[11px] text-muted-foreground">{item.valueLabel}</p>
                        )}
                        {item.notes && (
                          <p className="mt-1 text-[11px] text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Breaks</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2 text-xs">
                  <div className="bg-muted rounded-lg px-3 py-2 text-foreground">
                    Raw break taken: {formatDurationSeconds(breakSummary.rawBreakSeconds) ?? '—'}
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-foreground">
                    Allowed break time: {formatDurationSeconds(breakSummary.allowanceSeconds) ?? '30m 0s'}
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-foreground">
                    Counted for payroll/work time: {formatDurationSeconds(breakSummary.countedBreakSeconds) ?? '—'}
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-foreground">
                    Working time (minus max 30m break): {formatDurationSeconds(workingSeconds ?? -1) ?? '—'}
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className={breakSummary.status === 'exceeded' ? 'text-red-700' : 'text-green-700'}>
                      {breakSummary.status === 'exceeded' ? 'Exceeded allowance' : 'Within allowance'}
                    </span>
                  </div>
                  {breakSummary.blockMessage && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800">
                      {breakSummary.blockMessage}
                    </div>
                  )}
                  {breakSummary.shouldAutoEndCurrentBreak && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
                      Break allowance reached while on break. Current break should be auto-ended.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN - TIMELINE */}
        <div className="xl:col-span-1">
          <Card className="bg-background border-border h-full">
            <CardHeader>
              <CardTitle className="text-foreground">Timeline</CardTitle>
              <CardDescription className="text-muted-foreground">
                Chronological event history
              </CardDescription>
            </CardHeader>

            <CardContent>
              {detailsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader className="w-5 h-5 text-[#BE1C2D] animate-spin" />
                </div>
              ) : timelineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events found</p>
              ) : (
                <div className="space-y-2">
                  {timelineItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-muted px-3 py-2"
                    >
                      <div className="flex justify-between">
                        <p className="text-sm text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(item.timestamp)}
                        </p>
                      </div>

                      {item.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
}
