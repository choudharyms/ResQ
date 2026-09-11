import Dexie, { type Table } from 'dexie';

export interface OfflineQueuedIncident {
  localId?: number;
  id: string;
  raw_sos_text: string;
  primary_need: string;
  latitude: number;
  longitude: number;
  client_recorded_at: string;
  people_count: number;
  vulnerable_infants: number;
  vulnerable_elderly: number;
  vulnerable_critical_ill: number;
  synced: boolean;
}

export interface OfflineTelemetryPing {
  localId?: number;
  asset_id: string;
  latitude: number;
  longitude: number;
  fuel_level?: number;
  ping_timestamp: string;
  synced: boolean;
}

export class ResQOfflineDatabase extends Dexie {
  queuedIncidents!: Table<OfflineQueuedIncident, number>;
  telemetryPings!: Table<OfflineTelemetryPing, number>;

  constructor() {
    super('ResQOfflineDB');
    this.version(1).stores({
      queuedIncidents: '++localId, id, synced, client_recorded_at',
      telemetryPings: '++localId, asset_id, synced, ping_timestamp',
    });
  }
}

export const offlineDb = new ResQOfflineDatabase();

export async function queueOfflineSos(data: Omit<OfflineQueuedIncident, 'localId' | 'synced'>): Promise<number> {
  return await offlineDb.queuedIncidents.add({
    ...data,
    synced: false,
  });
}

export async function getUnsyncedSosReports(): Promise<OfflineQueuedIncident[]> {
  return await offlineDb.queuedIncidents.filter((item) => !item.synced).toArray();
}

export async function markSosReportsSynced(ids: string[]): Promise<void> {
  const idSet = new Set(ids);
  await offlineDb.queuedIncidents
    .filter((item) => idSet.has(item.id))
    .modify({ synced: true });
}

export async function countUnsyncedSosReports(): Promise<number> {
  return await offlineDb.queuedIncidents.filter((item) => !item.synced).count();
}

export async function clearAllOfflineQueue(): Promise<void> {
  await offlineDb.queuedIncidents.clear();
  await offlineDb.telemetryPings.clear();
}
