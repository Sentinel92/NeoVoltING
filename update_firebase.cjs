const fs = require('fs');

const content = `import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const metaEnv = (import.meta as any).env || {};

// Default / Optional Firebase Config
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyDemoNeovoltSecApiKey12345",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "neovolt-sec-pwa.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "neovolt-sec-pwa",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "neovolt-sec-pwa.appspot.com",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "8429100021",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:8429100021:web:neovoltsec84291",
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
    // Se utiliza initializeFirestore con persistentLocalCache (v9/v10+)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager() // Soporte para múltiples pestañas abiertas
      })
    });
    
    isOfflinePersistenceEnabled = true;
    console.log('[Firebase] Persistence habilitada con éxito en IndexedDB para funcionamiento offline.');

    // 3. Functions configurado en la región correcta (reduce latencia)
    // Definir explícitamente la región sudamericana para menor latencia desde Chile/Latam
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
`;

fs.writeFileSync('src/lib/firebase.ts', content);
console.log('Firebase updated successfully!');
