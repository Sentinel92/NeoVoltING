import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserSession } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  rut?: string;
  secLicense?: string;
  secClass?: string;
  companyName?: string;
  phone?: string;
  address?: string;
}

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  userSession: UserSession;
  isLoading: boolean;
  isGuestMode: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  syncUserProfile: (uid?: string) => Promise<UserProfile | null>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<boolean>;
  setGuestMode: (enabled: boolean) => void;
}

const DEFAULT_SESSION: UserSession = {
  email: '',
  name: 'Ing. Camilo Rojas',
  secNumber: 'SEC-84291-CL',
  secClass: 'Clase A',
  companyName: 'NEOVOLT Ingeniería Eléctrica SpA',
  phone: '+56 9 8765 4321',
  address: 'Santiago, Chile',
  isLoggedIn: false,
  role: 'engineer',
  professionalTitle: 'Ingeniero en Electricidad y Automatización Industrial',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('neovolt_guest_mode') === 'true';
  });

  const [userSession, setUserSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('neovolt_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SESSION;
      }
    }
    return DEFAULT_SESSION;
  });

  /**
   * Fetches user document from Firestore 'users/{uid}' and synchronizes profile data
   * (Avatar, Empresa, Nombre, Licencia SEC, Teléfono, RUT) with the technical profile
   */
  const syncUserProfile = useCallback(async (targetUid?: string): Promise<UserProfile | null> => {
    const uid = targetUid || auth?.currentUser?.uid || currentUser?.uid;
    if (!uid || !db) return null;

    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setUserProfile(profileData);

        const currentEmail = auth?.currentUser?.email || profileData.email || '';
        const updatedSession: UserSession = {
          uid,
          userId: uid,
          email: currentEmail,
          name: profileData.fullName || auth?.currentUser?.displayName || 'Instalador Autorizado SEC',
          secNumber: profileData.secLicense || profileData.rut || 'Clase A',
          secClass: profileData.secClass || 'Clase A',
          companyName: profileData.companyName || 'Servicios Eléctricos Integrales',
          phone: profileData.phone || '+56 9 8765 4321',
          address: profileData.address || 'Santiago, Chile',
          isLoggedIn: true,
          role: 'installer',
          professionalTitle: profileData.secClass ? `Instalador SEC ${profileData.secClass}` : 'Instalador Eléctrico Autorizado SEC',
          googleAvatarUrl: profileData.avatarUrl || auth?.currentUser?.photoURL || undefined,
        };

        setUserSession(updatedSession);
        localStorage.setItem('neovolt_user_session', JSON.stringify(updatedSession));
        return profileData;
      } else {
        // Create initial default document in Firestore 'users/{uid}'
        const initialDoc: UserProfile = {
          uid,
          email: auth?.currentUser?.email || '',
          fullName: auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || 'Instalador SEC',
          secLicense: 'Clase A',
          secClass: 'Clase A',
          companyName: 'NEOVOLT Ingeniería Eléctrica',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(docRef, initialDoc, { merge: true });
        setUserProfile(initialDoc);
        return initialDoc;
      }
    } catch (err) {
      console.warn('[AuthContext] Error sincronizando perfil desde Firestore colección "users":', err);
      return null;
    }
  }, [currentUser]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setCurrentUser(fbUser);
        setIsGuestMode(false);
        localStorage.removeItem('neovolt_guest_mode');
        // Fetch & sync user document from Firestore 'users' collection
        await syncUserProfile(fbUser.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setUserSession((prev) => ({
          ...prev,
          isLoggedIn: false,
          uid: undefined,
          userId: undefined,
        }));
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  /**
   * Logs in user with Firebase Auth signInWithEmailAndPassword
   */
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) return { success: false, error: 'Firebase Auth no está inicializado.' };
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = userCredential.user;
      setCurrentUser(fbUser);
      setIsGuestMode(false);
      localStorage.removeItem('neovolt_guest_mode');

      // Sync Firestore user profile document
      await syncUserProfile(fbUser.uid);

      return { success: true };
    } catch (err: any) {
      let message = 'Credenciales inválidas o error de conexión.';
      if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password'
      ) {
        message = 'Correo o contraseña incorrectos.';
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos fallidos. Intenta nuevamente más tarde.';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'El formato del correo electrónico no es válido.';
      }
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registers a new user with Firebase Auth createUserWithEmailAndPassword
   * and creates their profile document in Firestore 'users/{uid}'
   */
  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    if (!auth) return { success: false, error: 'Firebase Auth no está disponible.' };
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      const fbUser = userCredential.user;

      if (data.fullName) {
        await updateFirebaseProfile(fbUser, { displayName: data.fullName });
      }

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: data.email.trim(),
        fullName: data.fullName,
        rut: data.rut || '',
        secLicense: data.secLicense || 'Clase A',
        secClass: data.secClass || 'Clase A',
        companyName: data.companyName || 'Servicios Eléctricos Integrales',
        phone: data.phone || '',
        address: data.address || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (db) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(userDocRef, newProfile, { merge: true });
      }

      setUserProfile(newProfile);
      setCurrentUser(fbUser);
      setIsGuestMode(false);
      localStorage.removeItem('neovolt_guest_mode');

      const updatedSession: UserSession = {
        uid: fbUser.uid,
        userId: fbUser.uid,
        email: data.email.trim(),
        name: data.fullName,
        secNumber: data.secLicense || data.rut || 'Clase A',
        secClass: data.secClass || 'Clase A',
        companyName: data.companyName || 'Servicios Eléctricos Integrales',
        phone: data.phone || '+56 9 8765 4321',
        address: data.address || 'Santiago, Chile',
        isLoggedIn: true,
        role: 'installer',
        professionalTitle: 'Instalador Eléctrico Autorizado SEC',
      };
      setUserSession(updatedSession);
      localStorage.setItem('neovolt_user_session', JSON.stringify(updatedSession));

      return { success: true };
    } catch (err: any) {
      let message = 'Error al registrar usuario.';
      if (err?.code === 'auth/email-already-in-use') {
        message = 'Este correo electrónico ya se encuentra registrado.';
      } else if (err?.code === 'auth/weak-password') {
        message = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'El correo electrónico no es válido.';
      }
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Signs out the user from Firebase Auth
   */
  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsGuestMode(false);
    localStorage.removeItem('neovolt_guest_mode');
    setUserSession(DEFAULT_SESSION);
    localStorage.removeItem('neovolt_user_session');
  };

  /**
   * Sends password reset email
   */
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) return { success: false, error: 'Firebase Auth no disponible.' };
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'No se pudo enviar el correo de recuperación. Verifica la dirección.' };
    }
  };

  /**
   * Updates user document in Firestore 'users/{uid}' and local state
   */
  const updateProfileData = async (data: Partial<UserProfile>): Promise<boolean> => {
    const uid = currentUser?.uid || auth?.currentUser?.uid;
    if (!uid || !db) return false;

    try {
      const updated: UserProfile = {
        ...(userProfile || { uid, email: currentUser?.email || '', fullName: currentUser?.displayName || '' }),
        ...data,
        uid,
        email: currentUser?.email || data.email || '',
        updatedAt: new Date().toISOString(),
      };

      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, updated, { merge: true });

      setUserProfile(updated);
      setUserSession((prev) => ({
        ...prev,
        name: updated.fullName || prev.name,
        companyName: updated.companyName || prev.companyName,
        secNumber: updated.secLicense || prev.secNumber,
        secClass: updated.secClass || prev.secClass,
        phone: updated.phone || prev.phone,
        address: updated.address || prev.address,
        googleAvatarUrl: updated.avatarUrl || prev.googleAvatarUrl,
      }));

      return true;
    } catch (err) {
      console.warn('[AuthContext] Error actualizando perfil en Firestore "users":', err);
      return false;
    }
  };

  const handleSetGuestMode = (enabled: boolean) => {
    setIsGuestMode(enabled);
    if (enabled) {
      localStorage.setItem('neovolt_guest_mode', 'true');
    } else {
      localStorage.removeItem('neovolt_guest_mode');
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    userSession,
    isLoading,
    isGuestMode,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    resetPassword,
    syncUserProfile,
    updateProfileData,
    setGuestMode: handleSetGuestMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
