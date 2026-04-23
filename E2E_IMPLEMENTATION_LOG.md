# TransLine E2E Implementation Log

Date: 2026-04-17
Scope: Full system E2E implementation run (portal + backend + external driver app assumptions)
Assignment contract: vehicle_assignments active rows (unassigned_at IS NULL), assign_vehicle, unassign_driver

## Execution Status
- Phase 0: In Progress
- Phase 1: Completed (assignment lifecycle validated)
- Phase 2: Completed (driver and vehicle CRUD validated)
- Phase 3: Not Started
- Phase 4: Not Started
- Phase 5: Not Started

## Evidence Format
For each item:
- Item:
- Result: Pass | Fail | Blocked
- Expected:
- Actual:
- Evidence: command output / screenshot reference / DB query
- Notes:

## Phase 0: Baseline Setup
- [x] Verify Node/npm and dependency state
- [x] Verify scripts and app startup (main + portal)
- [ ] Verify admin login + initial portal pages load
- [ ] Verify no obvious schema-cache/table/column errors
- [ ] Verify canonical assignment objects are present in runtime DB

### Phase 0 Evidence (in progress)
- Item: Node/npm baseline
- Result: Pass with warning
- Expected: Node 20.x and npm available
- Actual: Node v24.11.1, npm 11.12.1; engine warning only
- Evidence: `node -v`, `npm -v`, `npm install` output
- Notes: Runtime is above pinned engine; monitor for incompatibilities.

- Item: Dependency install
- Result: Pass
- Expected: Dependencies install successfully
- Actual: 968 packages installed, vulnerabilities reported but install succeeded
- Evidence: `npm install` output
- Notes: Security audit to be handled separately from E2E flow.

- Item: Dev startup and route smoke
- Result: Pass with warning
- Expected: Main and portal route HTML responses
- Actual: `npm run dev` started and served `http://localhost:5173` and `/portal`; curl checks passed for `/`, `/portal`, `/portal/drivers`
- Evidence: dev server output + curl captures
- Notes: Vite reported `WebSocket server error: Port 24678 is already in use`; app still served successfully.

## Canonical SQL Runtime Validation
- [x] vehicle_assignments table present
- [x] assign_vehicle RPC present
- [x] unassign_driver RPC present
- [x] drivers_with_current_vehicle view present
- [x] vehicles_with_driver view present

### Additional Evidence Collected
- Item: Production build
- Result: Pass with warnings
- Expected: main + portal production bundles build successfully
- Actual: `npm run build` completed and produced dist assets for both apps
- Evidence: build command output including Vite completion for root and portal
- Notes: Tailwind content warning and bundle-size warning observed; non-blocking for E2E execution.

- Item: Production startup and route smoke
- Result: Pass
- Expected: server serves main and portal routes on port 5000
- Actual: `npm start` served `/`, `/portal` (redirect to `/portal/`), and `/portal/drivers` with valid HTML
- Evidence: server startup output + curl captures
- Notes: redirect behavior on `/portal` is expected.

- Item: Canonical assignment usage in portal runtime code
- Result: Pass
- Expected: usage of `vehicle_assignments`, `assign_vehicle`, `drivers_with_current_vehicle`, `vehicles_with_driver`
- Actual: matches found in DriversPage, VehiclesPage, DriverProfilePage, and db layer; no direct FK assignment fields found
- Evidence: grep scan across `portal/src`
- Notes: static code aligns with canonical assignment model.

- Item: Legacy direct-FK usage in portal runtime code
- Result: Pass
- Expected: no references to `assigned_driver_id` or `assigned_vehicle_id`
- Actual: no matches in `portal/src`
- Evidence: grep scan across `portal/src`
- Notes: legacy direct-FK patterns are absent from portal runtime code.

- Item: Repository definition of `unassign_driver`
- Result: Pass
- Expected: tracked SQL definition present or confirmed runtime availability
- Actual: canonical `unassign_driver(p_driver uuid)` definition is present in tracked migration SQL
- Evidence: repo-wide grep scan
- Notes: repository and runtime now align on canonical unassign RPC.

- Item: Runtime DB object validation via Supabase auth (continued after contract fix)
- Result: Pass
- Expected: canonical table/views/RPCs available
- Actual: `vehicle_assignments`, `drivers_with_current_vehicle`, `vehicles_with_driver`, `assign_vehicle`, and `unassign_driver` all available in runtime DB
- Evidence: Node script using `@supabase/supabase-js` with `admin@test.com` credentials
- Notes: Prior `PGRST202` mismatch is resolved in current environment.

- Item: Reversible live assignment lifecycle probe (canonical RPCs only)
- Result: Pass
- Expected: active assignment is derived by `unassigned_at IS NULL`; `assign_vehicle` and `unassign_driver` preserve lifecycle invariants
- Actual: used a live driver with current assignment, verified exactly one active row after `assign_vehicle`, verified zero active rows after `unassign_driver`, and restored original assignment via `assign_vehicle`; `vehicles_with_driver` remained consistent (`vehicle_id, rego, driver_id, driver_name`)
- Evidence: authenticated Supabase probe script output with restore verification
- Notes: no `unassign_vehicle` or legacy direct-FK patterns used in validation.

- Item: Runtime view shape validation
- Result: Pass
- Expected: runtime `vehicles_with_driver` returns `vehicle_id, rego, driver_id, driver_name`
- Actual: sampled runtime row keys match canonical shape exactly
- Evidence: direct select sample from runtime view
- Notes: view contract is aligned with confirmed backend.

- Item: Local admin create-driver API validation
- Result: Blocked
- Expected: authenticated admin can create driver through local API
- Actual: endpoint returned HTTP 500 `Server configuration error`
- Evidence: POST `http://localhost:5000/admin/create-driver` with valid bearer token + server log output
- Notes: local server missing `SUPABASE_URL` and/or `SUPABASE_SERVICE_ROLE_KEY` env vars.

## Phase 2: Driver and Vehicle CRUD Validation
- [x] Driver creation works without errors
- [x] `full_name` is correctly handled and not null
- [x] Vehicle creation uses `rego` consistently
- [x] Assignment works immediately after creation
- [x] Driver delete flow unassigns active assignment first

### Phase 2 Evidence
- Item: Controlled CRUD probe using authenticated Supabase admin session
- Result: Pass
- Expected: all Phase 2 CRUD checks pass with canonical contract and no schema changes
- Actual: created temp driver (`full_name` set and non-null), created temp vehicle (`rego` persisted consistently), assigned immediately via `assign_vehicle`, verified active assignment row (`unassigned_at IS NULL`) and `vehicles_with_driver` consistency, then unassigned via `unassign_driver`, deleted driver, and deleted vehicle
- Evidence: Node probe output with all checks true (`driver_creation_works`, `driver_full_name_not_null`, `vehicle_rego_consistent`, `assignment_immediate_after_creation`, `delete_flow_unassigns_first`, `driver_deleted_after_unassign`)
- Notes: validation used canonical objects only (`vehicle_assignments`, `assign_vehicle`, `unassign_driver`, `vehicles_with_driver`); no legacy patterns used.

## Fail/Blocker Register
- Warning: Node engine mismatch (`20.x` required, running `24.11.1`).
- Warning: Vite websocket port 24678 in use during dev startup.
- Note: Runtime DB introspection completed via authenticated Supabase session.
- Resolved: Canonical RPC `unassign_driver(p_driver)` is available and validated in runtime DB.
- Resolved: Runtime `vehicles_with_driver` shape matches canonical contract (`vehicle_id, rego, driver_id, driver_name`).
- Note: Local backend admin API remains blocked without `SUPABASE_SERVICE_ROLE_KEY`, but Phase 2 CRUD was validated directly against the runtime DB contract via authenticated session.
