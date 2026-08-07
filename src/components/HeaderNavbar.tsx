import React from 'react';
import { UserSession } from '../types';
import { NeovoltLogo } from './NeovoltLogo';
import { Zap, ShieldCheck, User, LogIn, LogOut, CheckCircle2, FileSpreadsheet, Users, UserCheck, Wrench, Cpu, Cloud, CloudUpload, Smartphone, RefreshCw, FolderPlus, Wifi, WifiOff, Database, BarChart3 } from 'lucide-react';

interface HeaderNavbarProps {
  user: UserSession;
  onOpenLogin: () => void;
  onLogout: () => void;
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
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard KPI', icon: BarChart3, badge: 'KPIs' },
    { id: 'projects', label: '0. Proyectos & Solicitudes', icon: FolderPlus, badge: 'Nuevo' },
    { id: 'census', label: '1. Levantamiento', icon: Zap },
    { id: 'crm', label: '2. Clientes (CRM)', icon: Users },
    { id: 'profile', label: '3. Perfil Técnico', icon: UserCheck },
    { id: 'diagnostic', label: '4. Consultor IA Fallas', icon: Cpu, badge: 'IA Gemini' },
    { id: 'assembler', label: '5. Armado Tablero', icon: ShieldCheck },
    { id: 'singleline', label: '6. Unilineal', icon: FileSpreadsheet },
    { id: 'physical', label: '7. Tablero 2D', icon: Zap },
    { id: 'quote', label: '8. Cotización & Contrato', icon: CheckCircle2 },
    { id: 'report', label: '9. Informe Obra AI', icon: CheckCircle2 },
    { id: 'catalog', label: '10. Catálogo', icon: CheckCircle2 },
    { id: 'norms', label: '11. Norma RIC SEC', icon: ShieldCheck },
    { id: 'te1', label: '12. Declaración TE1 SEC', icon: FileSpreadsheet, badge: 'Oficial' },
  ];

  return (
    <header className="print:hidden bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo Header */}
          <div className="cursor-pointer shrink-0" onClick={() => setActiveTab('census')}>
            <NeovoltLogo customLogoUrl={customLogoUrl} variant="dark" />
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
            ) : pendingQueueCount > 0 ? (
              <button
                onClick={onSyncNow}
                disabled={isCloudSyncing}
                className="flex items-center gap-1.5 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/50 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 animate-pulse"
                title="Sincronizar cambios pendientes acumulados offline con Firebase"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-fuchsia-400 ${isCloudSyncing ? 'animate-spin' : ''}`} />
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
                className="cursor-pointer flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-1.5 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>{user.name}</span>
                    <span className="bg-fuchsia-500/20 text-fuchsia-300 text-[9px] px-1.5 py-0.5 rounded border border-fuchsia-500/30 font-bold">
                      Perfil Ingeniero
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="truncate max-w-[150px]">{user.email}</span>
                    <span>|</span>
                    <span className="text-emerald-400 font-semibold">Ingeniero Eléctrico</span>
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
                className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-fuchsia-600 text-white font-semibold shadow-md shadow-fuchsia-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
