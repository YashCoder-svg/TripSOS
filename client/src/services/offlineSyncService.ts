export interface PendingSyncAction {
  id: string;
  type: 'emergency_pack_refresh' | 'offline_note';
  payload: Record<string, unknown>;
  createdAt: string;
}

const SYNC_QUEUE_KEY = 'tripsos_offline_sync_queue_v1';

export function getPendingSyncActions(): PendingSyncAction[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingSyncAction[];
  } catch {
    return [];
  }
}

export function queueSyncAction(action: Omit<PendingSyncAction, 'id' | 'createdAt'>): void {
  try {
    const existing = getPendingSyncActions();
    const item: PendingSyncAction = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    existing.push(item);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to queue offline sync action:', err);
  }
}

export function clearPendingSyncActions(): void {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (err) {
    console.error('Failed to clear sync queue:', err);
  }
}
