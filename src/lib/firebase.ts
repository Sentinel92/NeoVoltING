import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Configuración Firebase Vercel OK
// Firebase configuration reading strictly from import.meta.env.VITE_FIREBASE_*
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoNeovoltSecApiKey12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "neovolt-sec-pwa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "neovolt-sec-pwa",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "neovolt-sec-pwa.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "8429100021",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:8429100021:web:neovoltsec84291",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let functions: any = null;
let isOfflinePersistenceEnabled = false;

try {
  // 1. Inicializar App
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (app) {
    // 2. Firestore con Caché Local Instantánea (IndexedDB)
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      isOfflinePersistenceEnabled = true;
      console.log('[Firebase] Persistence habilitada con éxito en IndexedDB para funcionamiento offline.');
    } catch {
      db = getFirestore(app);
      isOfflinePersistenceEnabled = true;
    }

    // 3. Functions configurado en la región correcta
    functions = getFunctions(app, 'southamerica-east1');
  }
} catch (err) {
  console.warn('[Firebase] Inicializado con modo híbrido de respaldo local:', err);
}

export { app, db, functions, isOfflinePersistenceEnabled };

// Coalescing map & active write status per user email to prevent write stream exhaustion
const CURRENT_SESSION_ID = 'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
const activeWritePromises = new Map<string, Promise<{ success: boolean; isOffline: boolean }>>();
const pendingWritePayloads = new Map<string, { payload: any; resolvers: Array<(res: { success: boolean; isOffline: boolean }) => void> }>();

/**
 * Sync user application payload to Firebase Firestore with automatic offline caching & write coalescing
 */
export async function saveUserDataToFirebase(userEmail: string, payload: any): Promise<{ success: boolean; isOffline: boolean }> {
  if (!userEmail) return { success: false, isOffline: true };
  const sanitizedEmail = userEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');

  if (!db) {
    return { success: false, isOffline: !navigator.onLine };
  }

  // If a write is currently in progress for this email, coalesce this request
  if (activeWritePromises.has(sanitizedEmail)) {
    return new Promise((resolve) => {
      const existing = pendingWritePayloads.get(sanitizedEmail);
      if (existing) {
        existing.payload = payload; // Overwrite with latest state
        existing.resolvers.push(resolve);
      } else {
        pendingWritePayloads.set(sanitizedEmail, {
          payload,
          resolvers: [resolve],
        });
      }
    });
  }

  // Execute the write operation
  const executeWrite = async (currentPayload: any): Promise<{ success: boolean; isOffline: boolean }> => {
    try {
      const docRef = doc(db!, 'neovolt_user_backups', sanitizedEmail);
      await setDoc(
        docRef,
        {
          email: userEmail,
          updatedAt: new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
          writerSessionId: CURRENT_SESSION_ID,
          payload: currentPayload,
        },
        { merge: true }
      );
      return { success: true, isOffline: !navigator.onLine };
    } catch (err: any) {
      const errMessage = err?.message || String(err);
      if (errMessage.includes('resource-exhausted') || errMessage.includes('Write stream exhausted')) {
        console.warn('[Firebase] Cola de escrituras en Firestore agotada. Se mantiene respaldo local correctamente.');
      } else {
        console.warn('[Firebase] Error al guardar en Firestore (respaldado localmente):', err);
      }
      return { success: false, isOffline: !navigator.onLine };
    }
  };

  const currentWritePromise = (async () => {
    const result = await executeWrite(payload);

    // After current write finishes, check if newer payloads arrived while writing
    activeWritePromises.delete(sanitizedEmail);

    if (pendingWritePayloads.has(sanitizedEmail)) {
      const pending = pendingWritePayloads.get(sanitizedEmail)!;
      pendingWritePayloads.delete(sanitizedEmail);

      // Perform one single follow-up save with the latest payload
      const followUpResult = await saveUserDataToFirebase(userEmail, pending.payload);
      pending.resolvers.forEach((res) => res(followUpResult));
    }

    return result;
  })();

  activeWritePromises.set(sanitizedEmail, currentWritePromise);
  return currentWritePromise;
}

/**
 * Load user data from Firebase Firestore
 */
export async function loadUserDataFromFirebase(userEmail: string): Promise<any | null> {
  if (!userEmail || !db) return null;
  const sanitizedEmail = userEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');

  try {
    const docRef = doc(db, 'neovolt_user_backups', sanitizedEmail);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().payload || null;
    }
  } catch (err) {
    console.warn('[Firebase] Error al consultar Firestore:', err);
  }
  return null;
}

/**
 * Subscribe in real time using onSnapshot for cross-device & multi-tab auto sync
 */
export function subscribeToUserDataRealtime(
  userEmail: string,
  onUpdate: (payload: any, isFromOtherDevice: boolean) => void
): () => void {
  if (!userEmail || !db) return () => {};
  const sanitizedEmail = userEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');

  try {
    const docRef = doc(db, 'neovolt_user_backups', sanitizedEmail);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        // Ignore uncommitted local writes
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.payload) {
            // Ignore writes coming from this exact browser session
            if (data.writerSessionId === CURRENT_SESSION_ID) {
              return;
            }
            // Truly from another session or device
            onUpdate(data.payload, true);
          }
        }
      },
      (error) => {
        console.warn('[Firebase Realtime] Error en escuchador onSnapshot:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase Realtime] No se pudo iniciar suscripción en tiempo real:', err);
    return () => {};
  }
}
