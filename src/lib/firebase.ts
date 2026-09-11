import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  onSnapshot,
  Firestore,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
} from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { ElectricalProject, ClientRecord, UserProfile } from '../types';

// Provisioned Firebase configuration with fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAFkwWzHfYjQzye0whhWga9mFhJf7QqMOQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0636451730.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0636451730",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0636451730.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "974253329987",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:974253329987:web:94532bf8501c59bea88ef6",
};

const databaseId = "ai-studio-neovoltingeniera-844fd634-8a91-4a72-94b5-717750b32a4e";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let functions: any = null;
let isOfflinePersistenceEnabled = false;

try {
  // 1. Initialize App
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (app) {
    // 2. Initialize Auth
    auth = getAuth(app);

    // 3. Initialize Firestore with Named Database & Persistent Cache
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, databaseId);
      isOfflinePersistenceEnabled = true;
    } catch {
      try {
        db = getFirestore(app, databaseId);
        isOfflinePersistenceEnabled = true;
      } catch {
        db = getFirestore(app);
      }
    }

    // 4. Functions
    functions = getFunctions(app, 'southamerica-east1');
  }
} catch (err) {
  console.warn('[Firebase] Inicializado con modo híbrido de respaldo local:', err);
}

export { app, db, auth, functions, isOfflinePersistenceEnabled };

// Coalescing map & active write status per user email to prevent write stream exhaustion
const CURRENT_SESSION_ID = 'session_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
const activeWritePromises = new Map<string, Promise<{ success: boolean; isOffline: boolean }>>();
const pendingWritePayloads = new Map<string, { payload: any; resolvers: Array<(res: { success: boolean; isOffline: boolean }) => void> }>();

/**
 * =========================================================================
 * USER PROFILE FIRESTORE MANAGEMENT
 * =========================================================================
 */

export async function getUserProfileDoc(uid: string): Promise<UserProfile | null> {
  if (!uid || !db) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('[Firebase Profile] Error al obtener perfil:', err);
  }
  return null;
}

export async function setUserProfileDoc(profile: Partial<UserProfile> & { uid: string; email: string }): Promise<boolean> {
  if (!profile.uid || !db) return false;
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(
      docRef,
      {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('[Firebase Profile] Error al actualizar perfil:', err);
    return false;
  }
}

/**
 * =========================================================================
 * USER-ISOLATED PROJECTS MANAGEMENT (Firestore where("userId", "==", uid))
 * =========================================================================
 */

export async function saveProjectToFirestore(project: ElectricalProject, userId: string): Promise<boolean> {
  if (!userId || !db || !project.id) return false;
  try {
    const projectWithUser: ElectricalProject = {
      ...project,
      userId,
      updatedAt: new Date().toISOString(),
    };
    const docRef = doc(db, 'projects', project.id);
    await setDoc(docRef, projectWithUser, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase Projects] Error al guardar proyecto en Firestore:', err);
    return false;
  }
}

export async function fetchUserProjectsFromFirestore(userId: string): Promise<ElectricalProject[]> {
  if (!userId || !db) return [];
  try {
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const projects: ElectricalProject[] = [];
    querySnapshot.forEach((docSnap) => {
      projects.push(docSnap.data() as ElectricalProject);
    });
    return projects.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    console.warn('[Firebase Projects] Error al consultar proyectos de usuario:', err);
    return [];
  }
}

export async function deleteProjectFromFirestore(projectId: string, userId: string): Promise<boolean> {
  if (!projectId || !userId || !db) return false;
  try {
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('[Firebase Projects] Error al eliminar proyecto:', err);
    return false;
  }
}

/**
 * =========================================================================
 * USER-ISOLATED CLIENTS MANAGEMENT (Firestore where("userId", "==", uid))
 * =========================================================================
 */

export async function saveClientToFirestore(client: ClientRecord, userId: string): Promise<boolean> {
  if (!userId || !db || !client.id) return false;
  try {
    const clientWithUser: ClientRecord = {
      ...client,
      userId,
    };
    const docRef = doc(db, 'clients', client.id);
    await setDoc(docRef, clientWithUser, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase Clients] Error al guardar cliente en Firestore:', err);
    return false;
  }
}

export async function fetchUserClientsFromFirestore(userId: string): Promise<ClientRecord[]> {
  if (!userId || !db) return [];
  try {
    const q = query(collection(db, 'clients'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const clients: ClientRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      clients.push(docSnap.data() as ClientRecord);
    });
    return clients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('[Firebase Clients] Error al consultar clientes de usuario:', err);
    return [];
  }
}

export async function deleteClientFromFirestore(clientId: string, userId: string): Promise<boolean> {
  if (!clientId || !userId || !db) return false;
  try {
    const docRef = doc(db, 'clients', clientId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('[Firebase Clients] Error al eliminar cliente:', err);
    return false;
  }
}

/**
 * =========================================================================
 * REALTIME STATE & APPLICATION BACKUPS (Multi-tab and cloud sync)
 * =========================================================================
 */

export async function saveUserDataToFirebase(
  userIdentifier: string,
  payload: any,
  userId?: string
): Promise<{ success: boolean; isOffline: boolean }> {
  if (!userIdentifier && !userId) return { success: false, isOffline: true };
  const targetId = userId || userIdentifier;
  const sanitizedId = targetId.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');

  if (!db) {
    return { success: false, isOffline: !navigator.onLine };
  }

  // If a write is currently in progress for this user, coalesce this request
  if (activeWritePromises.has(sanitizedId)) {
    return new Promise((resolve) => {
      const existing = pendingWritePayloads.get(sanitizedId);
      if (existing) {
        existing.payload = payload;
        existing.resolvers.push(resolve);
      } else {
        pendingWritePayloads.set(sanitizedId, {
          payload,
          resolvers: [resolve],
        });
      }
    });
  }

  // Execute the write operation
  const executeWrite = async (currentPayload: any): Promise<{ success: boolean; isOffline: boolean }> => {
    try {
      const docRef = doc(db!, 'neovolt_user_backups', sanitizedId);
      await setDoc(
        docRef,
        {
          identifier: userIdentifier,
          userId: userId || null,
          email: userIdentifier.includes('@') ? userIdentifier : null,
          updatedAt: new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
          writerSessionId: CURRENT_SESSION_ID,
          payload: currentPayload,
        },
        { merge: true }
      );

      // Also persist isolated individual projects and clients in parallel if userId is known
      const effectiveUserId = userId || (userIdentifier.includes('@') ? undefined : userIdentifier);
      if (effectiveUserId && currentPayload.projects && Array.isArray(currentPayload.projects)) {
        for (const proj of currentPayload.projects) {
          if (proj.id) {
            saveProjectToFirestore(proj, effectiveUserId).catch(() => {});
          }
        }
      }
      if (effectiveUserId && currentPayload.clients && Array.isArray(currentPayload.clients)) {
        for (const client of currentPayload.clients) {
          if (client.id) {
            saveClientToFirestore(client, effectiveUserId).catch(() => {});
          }
        }
      }

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
    activeWritePromises.delete(sanitizedId);

    if (pendingWritePayloads.has(sanitizedId)) {
      const pending = pendingWritePayloads.get(sanitizedId)!;
      pendingWritePayloads.delete(sanitizedId);
      const followUpResult = await saveUserDataToFirebase(userIdentifier, pending.payload, userId);
      pending.resolvers.forEach((res) => res(followUpResult));
    }

    return result;
  })();

  activeWritePromises.set(sanitizedId, currentWritePromise);
  return currentWritePromise;
}

export async function loadUserDataFromFirebase(userIdentifier: string, userId?: string): Promise<any | null> {
  if (!userIdentifier && !userId) return null;
  const targetId = userId || userIdentifier;
  const sanitizedId = targetId.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');

  try {
    let resultPayload: any = null;

    // 1. Check user backup document
    const docRef = doc(db!, 'neovolt_user_backups', sanitizedId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      resultPayload = docSnap.data().payload || null;
    }

    // 2. Query Firestore collections with where('userId', '==', targetUserId)
    const effectiveUserId = userId || (userIdentifier.includes('@') ? undefined : userIdentifier);
    if (effectiveUserId && db) {
      const [userProjects, userClients] = await Promise.all([
        fetchUserProjectsFromFirestore(effectiveUserId),
        fetchUserClientsFromFirestore(effectiveUserId),
      ]);

      if (userProjects.length > 0 || userClients.length > 0) {
        if (!resultPayload) resultPayload = {};
        if (userProjects.length > 0) {
          resultPayload.projects = userProjects;
        }
        if (userClients.length > 0) {
          resultPayload.clients = userClients;
        }
      }
    }

    return resultPayload;
  } catch (err) {
    console.warn('[Firebase] Error al consultar Firestore:', err);
  }
  return null;
}

export function subscribeToUserDataRealtime(
  userIdentifier: string,
  onUpdate: (payload: any, isFromOtherDevice: boolean) => void,
  userId?: string
): () => void {
  if (!userIdentifier && !userId) return () => {};
  const targetId = userId || userIdentifier;
  const sanitizedId = targetId.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');

  try {
    const docRef = doc(db!, 'neovolt_user_backups', sanitizedId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.payload) {
            if (data.writerSessionId === CURRENT_SESSION_ID) {
              return;
            }
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
