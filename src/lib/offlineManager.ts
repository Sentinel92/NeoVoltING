import { saveUserDataToFirebase } from './firebase';

export interface PendingSyncItem {
  id: string;
  email: string;
  action: 'FULL_BACKUP' | 'PROJECT_UPDATE' | 'CLIENT_UPDATE';
  payload: any;
  timestamp: string;
}

const QUEUE_STORAGE_KEY = 'neovolt_pending_sync_queue_v1';

/**
 * Get all un-synced items from local storage
 */
export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error al leer la cola de sincronización offline:', err);
    return [];
  }
}

/**
 * Save pending sync queue to local storage
 */
function savePendingSyncQueue(queue: PendingSyncItem[]) {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error al guardar la cola de sincronización offline:', err);
  }
}

/**
 * Add an item to the offline sync queue
 */
export function enqueueOfflineSync(email: string, payload: any, action: 'FULL_BACKUP' | 'PROJECT_UPDATE' | 'CLIENT_UPDATE' = 'FULL_BACKUP'): PendingSyncItem {
  const queue = getPendingSyncQueue();
  
  // Replace existing full backup for the same user if present to avoid redundant syncs
  const filteredQueue = queue.filter(item => item.email !== email || item.action !== action);

  const newItem: PendingSyncItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email,
    action,
    payload,
    timestamp: new Date().toISOString(),
  };

  filteredQueue.push(newItem);
  savePendingSyncQueue(filteredQueue);

  // Notify Service Worker BackgroundSync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((reg: any) => {
      if (reg.sync) {
        reg.sync.register('firebase-cloud-sync').catch(() => {});
      }
    });
  }

  return newItem;
}

/**
 * Clear or remove item from queue
 */
export function removeFromSyncQueue(id: string) {
  const queue = getPendingSyncQueue().filter(item => item.id !== id);
  savePendingSyncQueue(queue);
}

/**
 * Process all items in the pending queue by pushing to Firebase and Cloud Server API
 */
export async function flushOfflineSyncQueue(
  onProgress?: (syncedCount: number, totalCount: number) => void
): Promise<{ success: boolean; syncedCount: number; errorsCount: number }> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, errorsCount: 0 };
  }

  let syncedCount = 0;
  let errorsCount = 0;
  const remainingItems: PendingSyncItem[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    let firebaseSuccess = false;
    let apiSuccess = false;

    // 1. Save to Firebase Firestore
    try {
      const fbResult = await saveUserDataToFirebase(item.email, item.payload);
      if (fbResult.success) {
        firebaseSuccess = true;
      }
    } catch (err) {
      console.warn('Fallo guardando item en Firebase during queue flush:', err);
    }

    // 2. Save to Server Cloud API endpoint
    try {
      const res = await fetch('/api/cloud-sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: item.email, data: item.payload }),
      });
      const data = await res.json();
      if (data.success) {
        apiSuccess = true;
      }
    } catch (err) {
      console.warn('Fallo enviando item al servidor durante flush:', err);
    }

    if (firebaseSuccess || apiSuccess) {
      syncedCount++;
    } else {
      errorsCount++;
      remainingItems.push(item);
    }

    if (onProgress) {
      onProgress(i + 1, queue.length);
    }
  }

  savePendingSyncQueue(remainingItems);

  if (syncedCount > 0) {
    const now = new Date().toISOString();
    localStorage.setItem('neovolt_last_cloud_sync', now);
  }

  return { success: errorsCount === 0, syncedCount, errorsCount };
}

/**
 * Custom Hook or Manager for Online/Offline Status and Automatic Queue Flushing
 */
export function setupNetworkAndSyncListeners(
  onOnlineStatusChange: (isOnline: boolean) => void,
  onAutoSyncCompleted: (result: { syncedCount: number }) => void
) {
  const handleOnline = async () => {
    onOnlineStatusChange(true);
    console.log('[NetworkSync] Conexión a internet restablecida. Iniciando sincronización de cola con Firebase...');
    const result = await flushOfflineSyncQueue();
    if (result.syncedCount > 0) {
      onAutoSyncCompleted(result);
    }
  };

  const handleOffline = () => {
    onOnlineStatusChange(false);
    console.log('[NetworkSync] La aplicación ha entrado en modo sin conexión (Offline).');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Listen for Service Worker Messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'FIREBASE_SYNC_REQUEST') {
        if (navigator.onLine) {
          const result = await flushOfflineSyncQueue();
          if (result.syncedCount > 0) {
            onAutoSyncCompleted(result);
          }
        }
      }
    });
  }

  // Trigger initial check if online and queue has items
  if (navigator.onLine && getPendingSyncQueue().length > 0) {
    flushOfflineSyncQueue().then((res) => {
      if (res.syncedCount > 0) {
        onAutoSyncCompleted(res);
      }
    });
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
