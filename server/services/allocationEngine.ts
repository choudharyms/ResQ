import { callProc } from '../db.js';

export interface AllocationResult {
  ok:           boolean;
  code?:        string;
  message?:     string;
  incident_id?: string;
  asset_id?:    string;
  asset_name?:  string;
  call_sign?:   string;
  distance_km?: number;
  eta_minutes?: number;
  alloc_version?: number;
}

/**
 * Dispatch the best available capable asset to an incident.
 * Delegates entirely to fn_allocate_asset(), which handles:
 *   - SELECT FOR UPDATE SKIP LOCKED (race safety)
 *   - Capability tag matching (@> containment)
 *   - Normalized composite scoring
 *   - Atomic state transitions on incidents, assets, and allocations
 */
export async function allocateAsset(
  incidentId:   string,
  dispatchedBy: string = 'SYSTEM_AI'
): Promise<AllocationResult> {
  return callProc<AllocationResult>('fn_allocate_asset', {
    incident_id:   incidentId,
    dispatched_by: dispatchedBy,
  });
}

export interface DegradationResult {
  ok:                 boolean;
  code?:              string;
  orphaned_incident:  boolean;
  incident_id?:       string;
  superseded_alloc?:  string;
}

/**
 * Handle asset degradation:
 *   1. Marks asset as 'Degraded'
 *   2. Supersedes active allocation
 *   3. Reopens the orphaned incident
 *   4. Returns incident_id so we can immediately re-allocate
 */
export async function handleAssetDegradation(
  assetId: string,
  reason:  string = 'ASSET_DEGRADED'
): Promise<DegradationResult> {
  const result = await callProc<DegradationResult>('fn_handle_asset_degradation', {
    asset_id: assetId,
    reason,
  });

  // If an incident was orphaned, immediately attempt re-allocation
  if (result.ok && result.orphaned_incident && result.incident_id) {
    console.log(`[Allocation] Re-queuing orphaned incident ${result.incident_id} after asset degradation`);
    const realloc = await allocateAsset(result.incident_id, 'SYSTEM_FAILOVER');
    if (!realloc.ok) {
      console.warn(`[Allocation] Re-allocation failed for ${result.incident_id}: ${realloc.message}`);
    }
  }

  return result;
}

export interface StatusUpdateResult {
  ok:           boolean;
  code?:        string;
  allocation_id?: string;
  incident_id?: string;
  new_status?:  string;
}

/**
 * Update the allocation status as an asset progresses through its mission.
 * Valid transitions: Dispatched → En_Route → On_Scene → Completed
 */
export async function updateAllocationStatus(
  assetId:   string,
  newStatus: 'En_Route' | 'On_Scene' | 'Completed',
  updatedBy: string = 'SYSTEM'
): Promise<StatusUpdateResult> {
  return callProc<StatusUpdateResult>('fn_update_allocation_status', {
    asset_id:    assetId,
    new_status:  newStatus,
    updated_by:  updatedBy,
  });
}
