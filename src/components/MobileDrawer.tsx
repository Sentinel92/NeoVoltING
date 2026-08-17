import React, { useState, useEffect } from 'react';
import { UserSession, ContractorConfig } from '../types';
import { 
  X, UserCheck, Zap, FileSpreadsheet, Eye, 
  Share2, HelpCircle, Power, Settings, Wrench, Navigation, CheckSquare,
  ChevronDown, ChevronUp, Calculator, ShieldCheck, Activity, Cable,
  FolderPlus, Users, Cpu, Moon, BarChart3, LayoutTemplate, Box, FileText,
  BookOpen, FileSignature, Layers, Award, Sparkles, Building2, User as UserIcon
} from 'lucide-react';
import { NeovoltLogo } from './NeovoltLogo';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
  contractor?: ContractorConfig | null;
  onLogout: () => void;
  setActiveTab: (tab: string) => void;
}

// Default high-quality SVG fallbacks encoded as Data URIs for instant, zero-flicker loading
const DEFAULT_AVATAR_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128' width='128' height='128'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230f172a'/%3E%3Cstop offset='100%25' stop-color='%231e293b'/%3E%3C/linearGradient%3E%3ClinearGradient id='cyanGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2300e5ff'/%3E%3Cstop offset='100%25' stop-color='%236366f1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='128' height='128' rx='24' fill='url(%23bg)'/%3E%3Ccircle cx='64' cy='48' r='22' fill='url(%23cyanGrad)' opacity='0.9'/%3E%3Cpath d='M28 108 C28 84 44 76 64 76 C84 76 100 84 100 108 Z' fill='url(%23cyanGrad)' opacity='0.8'/%3E%3C/svg%3E";

const DEFAULT_COMPANY_LOGO_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 60' width='240' height='60'%3E%3Cdefs%3E%3ClinearGradient id='neovoltGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2300e5ff'/%3E%3Cstop offset='100%25' stop-color='%23e83d84'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='42' height='42' x='2' y='9' rx='10' fill='%230f172a' stroke='%23334155' stroke-width='1.5'/%3E%3Cpath d='M25 15 L14 30 L22 30 L19 45 L32 28 L24 28 Z' fill='url(%23neovoltGrad)'/%3E%3Ctext x='54' y='32' font-family='sans-serif' font-weight='900' font-size='20' fill='%23ffffff' letter-spacing='1.5'%3ENEO%3Ctspan fill='%2300e5ff'%3EVOLT%3C/tspan%3E%3C/text%3E%3Ctext x='55' y='45' font-family='sans-serif' font-weight='700' font-size='8' fill='%2394a3b8' letter-spacing='2'%3EINGENIER%C3%8DA EL%C3%89CTRICA SEC%3C/text%3E%3C/svg%3E";

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen, onClose, user, contractor: propContractor, onLogout, setActiveTab
}) => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  // Dynamic Profile State retrieved from localStorage and props
  const [dynamicLogoUrl, setDynamicLogoUrl] = useState<string>('');
  const [dynamicAvatarUrl, setDynamicAvatarUrl] = useState<string>('');
  const [dynamicName, setDynamicName] = useState<string>('');
  const [dynamicEmail, setDynamicEmail] = useState<string>('');
  const [dynamicCompany, setDynamicCompany] = useState<string>('');
  const [dynamicSecLicense, setDynamicSecLicense] = useState<string>('');
  const [dynamicSecClass, setDynamicSecClass] = useState<string>('');

  // Function to refresh and read profile info from localStorage
  const loadProfileFromStorage = () => {
    try {
      // 1. Check direct keys requested: 'user_logo_url', 'user_avatar_url', 'profile_data'
      const directLogo = localStorage.getItem('user_logo_url');
      const directAvatar = localStorage.getItem('user_avatar_url');
      
      let profileDataObj: any = null;
      const rawProfileData = localStorage.getItem('profile_data');
      if (rawProfileData) {
        try { profileDataObj = JSON.parse(rawProfileData); } catch {}
      }

      // 2. Check 'neovolt_contractor'
      let contractorObj: any = null;
      const rawContractor = localStorage.getItem('neovolt_contractor');
      if (rawContractor) {
        try { contractorObj = JSON.parse(rawContractor); } catch {}
      }

      // 3. Check user session in localStorage
      let sessionObj: any = null;
      const rawSession = localStorage.getItem('neovolt_user_session');
      if (rawSession) {
        try { sessionObj = JSON.parse(rawSession); } catch {}
      }

      // Resolve Company Logo
      const resolvedLogo = 
        directLogo || 
        profileDataObj?.logoUrl || 
        profileDataObj?.customLogoUrl || 
        contractorObj?.customLogoUrl || 
        propContractor?.customLogoUrl || 
        '';
      setDynamicLogoUrl(resolvedLogo);

      // Resolve User Avatar
      const resolvedAvatar = 
        directAvatar || 
        profileDataObj?.avatarUrl || 
        profileDataObj?.customAvatarUrl || 
        contractorObj?.customAvatarUrl || 
        propContractor?.customAvatarUrl || 
        user?.googleAvatarUrl || 
        sessionObj?.googleAvatarUrl || 
        '';
      setDynamicAvatarUrl(resolvedAvatar);

      // Resolve User Name
      const resolvedName = 
        profileDataObj?.installerName || 
        profileDataObj?.name || 
        contractorObj?.installerName || 
        propContractor?.installerName || 
        user?.name || 
        sessionObj?.name || 
        'Ing. Camilo Rojas';
      setDynamicName(resolvedName);

      // Resolve User Email
      const resolvedEmail = 
        profileDataObj?.email || 
        contractorObj?.senderEmail || 
        propContractor?.senderEmail || 
        user?.email || 
        sessionObj?.email || 
        'ineovolt@gmail.com';
      setDynamicEmail(resolvedEmail);

      // Resolve Company Name
      const resolvedCompany = 
        profileDataObj?.companyName || 
        contractorObj?.companyName || 
        propContractor?.companyName || 
        'NEOVOLT SpA';
      setDynamicCompany(resolvedCompany);

      // Resolve SEC License and Class
      const resolvedSec = 
        profileDataObj?.secLicense || 
        contractorObj?.secLicense || 
        propContractor?.secLicense || 
        user?.secNumber || 
        'SEC-84291-CL';
      setDynamicSecLicense(resolvedSec);

      const resolvedClass = 
        profileDataObj?.secClass || 
        contractorObj?.secClass || 
        propContractor?.secClass || 
        'Clase A';
      setDynamicSecClass(resolvedClass);

    } catch (e) {
      console.warn('Error loading dynamic profile data into Sidebar:', e);
    }
  };

  // Sync on mount and listen to changes
  useEffect(() => {
    loadProfileFromStorage();

    // Listen to custom update event fired whenever profile changes
    const handleProfileUpdate = () => {
      loadProfileFromStorage();
    };

    // Listen to window storage events from other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (
        !e.key || 
        e.key === 'neovolt_contractor' || 
        e.key === 'user_logo_url' || 
        e.key === 'user_avatar_url' || 
        e.key === 'profile_data' ||
        e.key === 'neovolt_user_session'
      ) {
        loadProfileFromStorage();
      }
    };

    window.addEventListener('neovolt_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleProfileUpdate);

    return () => {
      window.removeEventListener('neovolt_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleProfileUpdate);
    };
  }, [user, propContractor, isOpen]);

  if (!isOpen) return null;

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 z-50 backdrop-blur-xs transition-opacity animate-fadeIn" 
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-slate-900 z-50 overflow-y-auto flex flex-col shadow-2xl animate-slideInRight border-r border-slate-800">
        
        {/* ========================================================= */}
        {/* REFACTORED HEADER: Professional Dark Dynamic Profile Header */}
        {/* Replaces old pink container with dynamic logo and avatar */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 p-5 pt-6 border-b border-slate-800/90 relative shrink-0">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
            aria-label="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 1. Dynamic Company Logo Container (Top Area) */}
          <div className="mb-4 pr-7">
            {dynamicLogoUrl ? (
              <div className="h-10 flex items-center">
                <img 
                  src={dynamicLogoUrl} 
                  alt="Logo Empresa" 
                  className="max-h-10 max-w-[180px] object-contain rounded-md filter drop-shadow"
                  onError={(e) => {
                    // Fallback to default company SVG if custom url fails
                    (e.target as HTMLImageElement).src = DEFAULT_COMPANY_LOGO_FALLBACK;
                  }}
                />
              </div>
            ) : (
              <div className="h-10 flex items-center">
                <img 
                  src={DEFAULT_COMPANY_LOGO_FALLBACK} 
                  alt="NEOVOLT Logo Oficial" 
                  className="h-9 object-contain" 
                />
              </div>
            )}
          </div>

          {/* 2. User Avatar & Technical Identification */}
          <div className="flex items-center gap-3 pt-1">
            {/* Dynamic User Avatar Image with Fallback */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-700/80 shadow-inner flex items-center justify-center group">
                <img 
                  src={dynamicAvatarUrl || DEFAULT_AVATAR_FALLBACK} 
                  alt={dynamicName || "Foto de Perfil"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR_FALLBACK;
                  }}
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Instalador Activo" />
            </div>

            {/* User Details & SEC License Badge */}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-[14px] leading-tight truncate">
                {dynamicName}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                  <Award className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{dynamicSecLicense}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  {dynamicSecClass}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-1">
                {dynamicEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-3 flex flex-col bg-slate-900 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* SECCIÓN 1: GESTIÓN DE NEGOCIO Y PROYECTOS */}
          <div className="px-6 py-2">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Gestión de Negocio</h3>
          </div>
          <button 
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-[13px]">Dashboard KPI</span>
          </button>
          <button 
            onClick={() => navigateTo('projects')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <FolderPlus className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Proyectos & Solicitudes</span>
          </button>
          <button 
            onClick={() => navigateTo('crm')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Clientes (CRM)</span>
          </button>
          <button 
            onClick={() => navigateTo('quote')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Cotización & Contrato</span>
          </button>
          <button 
            onClick={() => navigateTo('catalog')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left border-b border-slate-800/80 mb-2"
          >
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Catálogo</span>
          </button>

          {/* SECCIÓN 2: HERRAMIENTAS TÉCNICAS E IA */}
          <div className="px-6 py-2 mt-1">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Herramientas Técnicas e IA</h3>
          </div>
          <button 
            onClick={() => navigateTo('diagnostic')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left relative"
          >
            <Cpu className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <span className="font-medium text-[13px]">Consultor IA Fallas</span>
            <span className="absolute top-3 right-6 w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
          </button>
          <button 
            onClick={() => navigateTo('census')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium text-[13px]">Levantamiento (Censo)</span>
          </button>
          <button 
            onClick={() => navigateTo('assembler')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Armado Tablero</span>
          </button>
          <button 
            onClick={() => navigateTo('singleline')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <LayoutTemplate className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Diagrama Unilineal</span>
          </button>
          <button 
            onClick={() => navigateTo('physical')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <Box className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium text-[13px]">Tablero 2D Físico</span>
          </button>
          <button 
            onClick={() => navigateTo('report')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Informe Obra AI</span>
          </button>
          <button 
            onClick={() => navigateTo('norms')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Norma RIC SEC</span>
          </button>
          <button 
            onClick={() => navigateTo('te1')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <FileSignature className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Declaración TE1 SEC</span>
          </button>

          {/* Caja de Herramientas Expandible */}
          <div className="border-b border-slate-800/80 mb-2 pb-2 mt-1">
            <button 
              onClick={() => setIsToolsExpanded(!isToolsExpanded)}
              className="w-full flex items-center justify-between px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-medium text-[13px] text-blue-100">Caja de Herramientas SEC</span>
              </div>
              {isToolsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            
            {/* Expanded Submenu */}
            {isToolsExpanded && (
              <div className="bg-slate-950/60 border-y border-slate-800 py-2 space-y-1">
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center gap-3 px-12 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-left text-xs"
                >
                  <Calculator className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Dashboard Calculadoras</span>
                </button>
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center gap-3 px-12 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-left text-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cálculo Alimentadores RIC N°04</span>
                </button>
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center gap-3 px-12 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-left text-xs"
                >
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  <span>Factor de Potencia & Demanda</span>
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: CONFIGURACIÓN Y CUENTA */}
          <div className="px-6 py-2 mt-1">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Configuración y Cuenta</h3>
          </div>
          <button 
            onClick={() => navigateTo('profile')}
            className="flex items-center gap-4 px-6 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-[13px]">Mi Perfil y Licencia SEC</span>
          </button>
          
          <button 
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-4 px-6 py-3.5 mt-3 mb-4 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left border-t border-slate-800/80"
          >
            <Power className="w-4 h-4 shrink-0" />
            <span className="font-medium text-[13px]">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};
