import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { saveUserDataToFirebase } from '../lib/firebase';

export interface UseDeleteManagerOptions<T> {
  userEmail?: string;
  storageKey?: string;
  onSuccess?: (deletedItem: T) => void;
  onError?: (error: any) => void;
}

export function useDeleteManager<T extends { id: string | number }>(
  initialItems: T[],
  setItemsState: Dispatch<SetStateAction<T[]>>,
  options: UseDeleteManagerOptions<T> = {}
) {
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const requestDelete = useCallback((item: T) => {
    setItemToDelete(item);
    setDeleteError(null);
  }, []);

  const cancelDelete = useCallback(() => {
    setItemToDelete(null);
    setDeleteError(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // 1. Update Local React State
      setItemsState((prevItems) => {
        const updated = prevItems.filter((i) => i.id !== itemToDelete.id);

        // 2. Persist to localStorage if key provided
        if (options.storageKey) {
          try {
            localStorage.setItem(options.storageKey, JSON.stringify(updated));
          } catch (e) {
            console.warn(`[useDeleteManager] Error writing to localStorage for key ${options.storageKey}:`, e);
          }
        }

        // 3. Trigger Firebase Sync if userEmail provided
        if (options.userEmail) {
          saveUserDataToFirebase(options.userEmail, {
            type: 'DELETE_ITEM',
            storageKey: options.storageKey,
            deletedId: itemToDelete.id,
            remainingCount: updated.length,
            timestamp: new Date().toISOString(),
          }).catch((err) => {
            console.warn('[useDeleteManager] Firebase sync warn:', err);
          });
        }

        return updated;
      });

      if (options.onSuccess) {
        options.onSuccess(itemToDelete);
      }
    } catch (err) {
      console.error('[useDeleteManager] Delete error:', err);
      setDeleteError('No se pudo eliminar el elemento. Intente nuevamente.');
      if (options.onError) {
        options.onError(err);
      }
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, setItemsState, options]);

  return {
    itemToDelete,
    isDeleting,
    deleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
