import React, { useState, useEffect } from 'react';
import { UserSession } from '../types';
import { NeovoltLogo } from './NeovoltLogo';
import { 
  Zap, ShieldCheck, User, LogIn, LogOut, CheckCircle2, FileSpreadsheet, 
  Users, UserCheck, Wrench, Cpu, Cloud, CloudUpload, Smartphone, 
  RefreshCw, FolderPlus, Wifi, WifiOff, Database, BarChart3, Menu,
  Award, Building2
} from 'lucide-react';

interface HeaderNavbarProps {
  user: UserSession;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenDrawer?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customLogoUrl?: string;
  isSecCertified?: boolean;
  onSaveToCloud?: () => void;
  onLoadFromCloud?: () => void;
  onInstallApp?: () => void;
  isCloudSyncing?: boolean;
  lastCloudSyncTime?: string | null;
  isOnline?: boolean;
  pendingQueueCount?: number;
  onSyncNow?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  user,
  onOpenLogin,
  onLogout,
  onOpenDrawer,
  activeTab,
  setActiveTab,
  customLogoUrl,
  isSecCertified = true,
  onSaveToCloud,
  onLoadFromCloud,
  onInstallApp,
  isCloudSyncing = false,
  lastCloudSyncTime,
  isOnline = true,
  pendingQueueCount = 0,
  onSyncNow,
}) => {
  // Dynamic images and profile data from localStorage
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [logoError, setLogoError] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [dynamicProfile, setDynamicProfile] = useState<{
    name?: string;
    email?: string;
    companyName?: string;
    secLicense?: string;
    secClass?: string;
    title?: string;
  }>({});

  const syncProfileFromStorage = () => {
    try {
      const storedLogo = localStorage.getItem('user_logo_url');
      const storedAvatar = localStorage.getItem('user_avatar_url');

      let parsedProfile: any = {};
      const rawProfile = localStorage.getItem('profile_data');
      if (rawProfile) {
        try { parsedProfile = JSON.parse(rawProfile); } catch {}
      }

      let parsedContractor: any = {};
      const rawContractor = localStorage.getItem('neovolt_contractor');
      if (rawContractor) {
        try { parsedContractor = JSON.parse(rawContractor); } catch {}
      }

      const resolvedLogo = storedLogo || parsedProfile.logoUrl || parsedProfile.customLogoUrl || parsedContractor.customLogoUrl || customLogoUrl || '';
      const resolvedAvatar = storedAvatar || parsedProfile.avatarUrl || parsedProfile.customAvatarUrl || parsedContractor.customAvatarUrl || user?.googleAvatarUrl || '';

      setLogoUrl(resolvedLogo);
      setLogoError(false);

      setAvatarUrl(resolvedAvatar);
      setAvatarError(false);

      setDynamicProfile({
        name: parsedProfile.name || parsedProfile.installerName || parsedContractor.installerName || user?.name || 'Ing. Camilo Rojas',
        email: parsedProfile.email || parsedContractor.senderEmail || user?.email || 'ineovolt@gmail.com',
        companyName: parsedProfile.companyName || parsedContractor.companyName || 'NEOVOLT SpA',
        secLicense: parsedProfile.secLicense || parsedContractor.secLicense || user?.secNumber || 'SEC-84291-CL',
        secClass: parsedProfile.secClass || parsedContractor.secClass || 'Clase A',
        title: parsedProfile.title || parsedContractor.customProfessionalTitle || 'Ingeniero en Electricidad',
      });
    } catch (e) {
      console.warn('Error reading dynamic header profile:', e);
    }
  };

  useEffect(() => {
    syncProfileFromStorage();

    const handleProfileUpdated = () => {
      syncProfileFromStorage();
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (
        !e.key || 
        e.key === 'user_logo_url' || 
        e.key === 'user_avatar_url' || 
        e.key === 'profile_data' ||
        e.key === 'neovolt_contractor'
      ) {
        syncProfileFromStorage();
      }
    };

    window.addEventListener('neovolt_profile_updated', handleProfileUpdated);
    window.addEventListener('profile_updated', handleProfileUpdated);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('focus', handleProfileUpdated);

    return () => {
      window.removeEventListener('neovolt_profile_updated', handleProfileUpdated);
      window.removeEventListener('profile_updated', handleProfileUpdated);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('focus', handleProfileUpdated);
    };
  }, [customLogoUrl, user]);

  return (
    <header className="print:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Hamburger */}
          <div className="flex items-center gap-3">
            {onOpenDrawer && (
              <button 
                onClick={onOpenDrawer}
                className="p-1.5 -ml-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            
            {/* Dynamic Brand Logo with Fallback */}
            <div 
              className="cursor-pointer shrink-0 flex items-center gap-2" 
              onClick={() => setActiveTab('census')}
              title="Ir a Levantamiento"
            >
              {logoUrl && !logoError ? (
                <div className="flex items-center gap-2.5">
                  <img
                    src={logoUrl}
                    alt="Logo Empresa"
                    className="h-9 max-w-[180px] object-contain rounded filter drop-shadow"
                    onError={() => setLogoError(true)}
                  />
                  <span className="hidden xl:inline-block text-[11px] font-bold text-slate-400 border-l border-slate-700 pl-2.5">
                    {dynamicProfile.companyName || 'NEOVOLT'}
                  </span>
                </div>
              ) : (
                <NeovoltLogo customLogoUrl={customLogoUrl} variant="dark" />
              )}
            </div>
          </div>

          {/* Cloud Sync, Network Status & PWA Install Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Network Status & Firebase Offline Pill */}
            {!isOnline ? (
              <div 
                className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-sm"
                title="Modo Sin Conexión (Offline). Todos los cambios se guardan localmente."
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Modo Offline</span>
                {pendingQueueCount > 0 && (
                  <span className="bg-amber-500/30 text-amber-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-extrabold">
                    {pendingQueueCount} pend.
                  </span>
                )}
              </div>
            ) : isCloudSyncing ? (
              <div 
                className="flex items-center gap-1.5 bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-sm animate-pulse"
                title="Sincronizando cambios con Firebase Firestore en segundo plano"
              >
                <RefreshCw className="w-3.5 h-3.5 text-fuchsia-400 animate-spin" />
                <span className="hidden sm:inline">Sincronizando en 2° plano...</span>
              </div>
            ) : pendingQueueCount > 0 ? (
              <button
                onClick={onSyncNow}
                className="flex items-center gap-1.5 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/50 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 animate-pulse"
                title="Sincronizar cambios pendientes acumulados offline con Firebase"
              >
                <RefreshCw className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="hidden sm:inline">Sincronizar Firebase ({pendingQueueCount})</span>
              </button>
            ) : (
              <div 
                className="hidden lg:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold px-2 py-1 rounded-xl"
                title="Conexión en línea y sincronizado con Firebase Firestore"
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firebase Sync OK</span>
              </div>
            )}

            {/* Install App Button */}
            {onInstallApp && (
              <button
                onClick={onInstallApp}
                className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-all active:scale-95"
                title="Instalar esta app directamente en tu teléfono móvil o tablet"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Instalar App en Celular</span>
              </button>
            )}

            {/* Cloud Sync Button */}
            {user.isLoggedIn && onSaveToCloud && (
              <button
                onClick={onSaveToCloud}
                disabled={isCloudSyncing}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title={`Anclado a ${user.email} en la Nube / Firebase`}
              >
                <CloudUpload className={`w-3.5 h-3.5 text-emerald-400 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">
                  {isCloudSyncing ? 'Sincronizando...' : 'Guardar en Nube'}
                </span>
              </button>
            )}

            {/* User Auth Info & Login Controls */}
            {user.isLoggedIn ? (
              <div
                onClick={() => setActiveTab('profile')}
                className="cursor-pointer flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-1.5 transition-all group"
              >
                {/* Dynamic User Avatar with Lucide Fallback */}
                <div className="relative shrink-0">
                  {avatarUrl && !avatarError ? (
                    <img 
                      src={avatarUrl}
                      alt={dynamicProfile.name || user.name || "Avatar"}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500/50 shadow-sm"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-slate-900 rounded-full" />
                </div>

                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>{dynamicProfile.name || user.name}</span>
                    <span className="bg-cyan-950/80 text-cyan-300 text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/30 font-bold flex items-center gap-1">
                      <Award className="w-2.5 h-2.5 text-cyan-400" />
                      {dynamicProfile.secLicense || 'SEC'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="truncate max-w-[140px]">{dynamicProfile.email || user.email}</span>
                    <span>|</span>
                    <span className="text-emerald-400 font-semibold">{dynamicProfile.title || 'Ingeniero Eléctrico'}</span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  title="Cerrar sesión"
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1 ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
