import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';
import { Check, Search, ShieldAlert, XCircle, Loader } from 'lucide-react';
import {
  approveChecklistRequest,
  listChecklistApprovals,
  rejectChecklistRequest,
  type ChecklistApprovalRequest,
} from '@/lib/db/checklistApprovals';
import { formatPerthDateTime, PERTH_TIME_LABEL } from '@/lib/dateTime';

const statusBadgeClass = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'approved') return 'bg-green-50 text-green-700 border-green-200';
  if (normalized === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-yellow-50 text-yellow-800 border-yellow-200';
};

const isPendingStatus = (status: string) => {
  const normalized = status.trim().toLowerCase();
  return normalized === 'pending' || normalized === 'requested' || normalized === 'awaiting_approval';
};

function getFailedItemSummary(request: ChecklistApprovalRequest): string {
  if (request.failed_items.length === 0) {
    return 'No failed item details';
  }

  return request.failed_items
    .map((item) => {
      const section = item.sectionTitle ? ` [${item.sectionTitle}]` : '';
      const note = item.notes ? ` (${item.notes})` : '';
      const critical = item.critical ? ' [Critical]' : '';
      return `${item.label}${section}${critical}${note}`;
    })
    .join(', ');
}

const formatChecklistLabel = (key: string) =>
  key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toChecklistStatus = (value: unknown): 'Pass' | 'Fail' | 'Pending' => {
  if (value == null) return 'Pending';
  if (typeof value === 'boolean') return value ? 'Pass' : 'Fail';
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['pass', 'passed', 'ok', 'true', 'yes'].includes(normalized)) return 'Pass';
    if (['fail', 'failed', 'false', 'no'].includes(normalized)) return 'Fail';
  }
  return 'Pending';
};

const normalizeChecklistEntries = (rawChecklist: Record<string, unknown> | null) => {
  if (!rawChecklist) return [] as Array<{ key: string; label: string; status: 'Pass' | 'Fail' | 'Pending'; note: string | null }>;

  return Object.entries(rawChecklist).map(([key, rawValue]) => {
    if (!isRecord(rawValue)) {
      return {
        key,
        label: formatChecklistLabel(key),
        status: toChecklistStatus(rawValue),
        note: typeof rawValue === 'string' ? rawValue : null,
      };
    }

    const status = toChecklistStatus(rawValue.status ?? rawValue.result ?? rawValue.outcome ?? rawValue.pass ?? rawValue.value);
    const noteCandidate = rawValue.notes ?? rawValue.note ?? rawValue.comment ?? rawValue.details ?? rawValue.value;
    const note = typeof noteCandidate === 'string' && noteCandidate.trim().length > 0 ? noteCandidate.trim() : null;

    return {
      key,
      label: formatChecklistLabel(key),
      status,
      note,
    };
  });
};

function ChecklistViewDialog({
  request,
  open,
  onOpenChange,
}: {
  request: ChecklistApprovalRequest | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const checklistEntries = normalizeChecklistEntries(request?.raw_checklist ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Checklist Request Details</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Failed pre-start checklist details. Times shown in {PERTH_TIME_LABEL}.
          </DialogDescription>
        </DialogHeader>

        {!request ? (
          <p className="text-sm text-muted-foreground">No checklist selected.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p className="text-foreground">Requested: <span className="text-foreground">{formatPerthDateTime(request.requested_at)}</span></p>
              <p className="text-foreground">Status: <span className="text-foreground capitalize">{request.status}</span></p>
              <p className="text-foreground">Driver: <span className="text-foreground">{request.driver_name ?? request.driver_id ?? 'Unknown'}</span></p>
              <p className="text-foreground">Vehicle: <span className="text-foreground">{request.vehicle_rego ?? request.vehicle_id ?? 'Unknown'}</span></p>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">Failed Items ({request.failed_items_count})</p>
              {request.failed_items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No structured failed item list was saved.</p>
              ) : (
                <div className="space-y-2">
                  {request.failed_items.map((item) => (
                    <div key={`${request.request_id}-${item.key}`} className="rounded border border-input p-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-foreground font-medium">{item.label}</p>
                        {item.sectionTitle && (
                          <span className="inline-flex items-center rounded border border-input bg-muted px-2 py-0.5 text-[11px] text-foreground">
                            {item.sectionTitle}
                          </span>
                        )}
                        {item.critical && (
                          <span className="inline-flex items-center rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-700">
                            Critical
                          </span>
                        )}
                      </div>
                      {item.notes && <p className="text-muted-foreground">Note: {item.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">Full Checklist ({checklistEntries.length})</p>
              {checklistEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checklist snapshot was saved for this request.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {checklistEntries.map((item) => (
                    <div key={`${request.request_id}-${item.key}-full`} className="rounded border border-input p-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-foreground font-medium">{item.label}</p>
                        <span
                          className={
                            item.status === 'Fail'
                              ? 'text-red-700'
                              : item.status === 'Pass'
                                ? 'text-green-700'
                                : 'text-yellow-800'
                          }
                        >
                          {item.status}
                        </span>
                      </div>
                      {item.note && <p className="text-muted-foreground mt-1">{item.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">Admin Note</p>
              <p className="text-sm text-foreground">{request.admin_note ?? 'No admin note yet.'}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ChecklistApprovalsPage() {
  const [rows, setRows] = useState<ChecklistApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveNoteById, setApproveNoteById] = useState<Record<string, string>>({});
  const [rejectNoteById, setRejectNoteById] = useState<Record<string, string>>({});
  const [noteVisibleById, setNoteVisibleById] = useState<Record<string, boolean>>({});
  const [viewing, setViewing] = useState<ChecklistApprovalRequest | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const requests = await listChecklistApprovals();
      setRows(requests);
    } catch (err) {
      console.error('ChecklistApprovalsPage: failed to load requests:', err);
      setError('Failed to load checklist approvals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => {
      const haystack = [
        row.driver_name,
        row.driver_id,
        row.vehicle_rego,
        row.vehicle_id,
        row.status,
        row.admin_note,
        getFailedItemSummary(row),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [rows, search]);

  const pendingCount = useMemo(
    () => rows.filter((row) => isPendingStatus(row.status)).length,
    [rows]
  );

  const approvedCount = useMemo(
    () => rows.filter((row) => row.status.toLowerCase() === 'approved').length,
    [rows]
  );

  const rejectedCount = useMemo(
    () => rows.filter((row) => row.status.toLowerCase() === 'rejected').length,
    [rows]
  );

  const handleApprove = useCallback(
    async (request: ChecklistApprovalRequest) => {
      const note = (approveNoteById[request.request_id] ?? '').trim();
      const noteVisible = noteVisibleById[request.request_id] ?? false;
      try {
        setBusyId(request.request_id);
        await approveChecklistRequest(request.request_id, note, noteVisible);
        await load();
      } catch (err) {
        console.error('ChecklistApprovalsPage: approve failed:', err);
        setError('Failed to approve checklist request.');
      } finally {
        setBusyId(null);
      }
    },
    [approveNoteById, noteVisibleById, load]
  );

  const handleReject = useCallback(
    async (request: ChecklistApprovalRequest) => {
      const note = (rejectNoteById[request.request_id] ?? '').trim();
      if (!note) {
        setError('Reject note is required.');
        return;
      }
      const noteVisible = noteVisibleById[request.request_id] ?? false;

      try {
        setBusyId(request.request_id);
        await rejectChecklistRequest(request.request_id, note, noteVisible);
        await load();
      } catch (err) {
        console.error('ChecklistApprovalsPage: reject failed:', err);
        setError('Failed to reject checklist request.');
      } finally {
        setBusyId(null);
      }
    },
    [rejectNoteById, noteVisibleById, load]
  );

  return (
    <div className="portalPage space-y-6">
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Checklist Approvals</h1>
          <p className="text-muted-foreground">Admin workflow for failed pre-start checklist requests. All times shown in {PERTH_TIME_LABEL}.</p>
        </div>
        <Button
          variant="outline"
          onClick={load}
          className="border-input bg-background text-foreground hover:bg-muted hover:text-foreground"
          disabled={loading}
        >
          {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-3xl font-bold text-red-700">{loading ? '-' : pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-700">{loading ? '-' : approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Rejected</p>
            <p className="text-3xl font-bold text-yellow-800">{loading ? '-' : rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-foreground">Approval Requests</CardTitle>
              <CardDescription className="text-muted-foreground">Review failed checklist submissions and unblock or reject drivers.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by driver, vehicle, status..."
                className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-[#BE1C2D]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Requested time</TableHead>
                    <TableHead className="text-muted-foreground">Driver</TableHead>
                    <TableHead className="text-muted-foreground">Vehicle</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Failed items count</TableHead>
                    <TableHead className="text-muted-foreground min-w-[260px]">Failed item details</TableHead>
                    <TableHead className="text-muted-foreground min-w-[260px]">Admin note</TableHead>
                    <TableHead className="text-muted-foreground min-w-[280px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        No checklist approval requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((request) => {
                      const isPending = isPendingStatus(request.status);
                      const busy = busyId === request.request_id;

                      return (
                        <TableRow key={request.request_id} className="border-border align-top">
                          <TableCell className="text-foreground">{formatPerthDateTime(request.requested_at)}</TableCell>
                          <TableCell className="text-foreground">{request.driver_name ?? request.driver_id ?? 'Unknown'}</TableCell>
                          <TableCell className="text-foreground">{request.vehicle_rego ?? request.vehicle_id ?? 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge className={`${statusBadgeClass(request.status)} capitalize`}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">{request.failed_items_count}</TableCell>
                          <TableCell className="text-foreground text-sm">{getFailedItemSummary(request)}</TableCell>
                          <TableCell className="space-y-2">
                            <p className="text-sm text-foreground">{request.admin_note ?? 'No note'}</p>
                            {!isPending && request.admin_note && request.note_visible_to_driver ? (
                              <p className="text-xs text-green-700">Visible to driver</p>
                            ) : null}
                            {isPending && (
                              <>
                                <Textarea
                                  value={approveNoteById[request.request_id] ?? ''}
                                  onChange={(event) =>
                                    setApproveNoteById((prev) => ({ ...prev, [request.request_id]: event.target.value }))
                                  }
                                  placeholder="Optional approval note"
                                  className="min-h-16 bg-background border-input text-foreground"
                                />
                                <Textarea
                                  value={rejectNoteById[request.request_id] ?? ''}
                                  onChange={(event) =>
                                    setRejectNoteById((prev) => ({ ...prev, [request.request_id]: event.target.value }))
                                  }
                                  placeholder="Required reject note"
                                  className="min-h-16 bg-background border-input text-foreground"
                                />
                                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={noteVisibleById[request.request_id] ?? false}
                                    onChange={(event) =>
                                      setNoteVisibleById((prev) => ({ ...prev, [request.request_id]: event.target.checked }))
                                    }
                                    className="h-4 w-4 accent-[#BE1C2D]"
                                  />
                                  Show this note to the driver
                                </label>
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-input bg-background text-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => setViewing(request)}
                              >
                                <ShieldAlert className="mr-1 h-4 w-4" />
                                View checklist
                              </Button>

                              {isPending ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-700 text-white hover:bg-green-800"
                                    disabled={busy}
                                    onClick={() => handleApprove(request)}
                                  >
                                    <Check className="mr-1 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-red-700 text-white hover:bg-red-800"
                                    disabled={busy}
                                    onClick={() => handleReject(request)}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Reject with note
                                  </Button>
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">Request already finalized.</p>
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

      <ChecklistViewDialog request={viewing} open={Boolean(viewing)} onOpenChange={(next) => !next && setViewing(null)} />
    </div>
  );
}
