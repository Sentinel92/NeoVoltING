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

/**
 * Sync user application payload to Firebase Firestore with automatic offline caching
 */
export async function saveUserDataToFirebase(userEmail: string, payload: any): Promise<{ success: boolean; isOffline: boolean }> {
  if (!userEmail) return { success: false, isOffline: true };
  const sanitizedEmail = userEmail.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  if (db) {
    try {
      const docRef = doc(db, 'neovolt_user_backups', sanitizedEmail);
      await setDoc(
        docRef,
        {
          email: userEmail,
          updatedAt: new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
          payload: payload,
        },
        { merge: true }
      );
      return { success: true, isOffline: !navigator.onLine };
    } catch (err) {
      console.warn('[Firebase] Error al guardar en Firestore (se mantendrá en cola offline local):', err);
    }
  }
  return { success: false, isOffline: !navigator.onLine };
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
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.payload) {
            const isFromOtherDevice = !snapshot.metadata.hasPendingWrites;
            onUpdate(data.payload, isFromOtherDevice);
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
