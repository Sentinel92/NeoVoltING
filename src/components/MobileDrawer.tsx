import React, { useState } from 'react';
import { UserSession } from '../types';
import { 
  X, UserCheck, Zap, FileSpreadsheet, Eye, 
  Share2, HelpCircle, Power, Settings, Wrench, Navigation, CheckSquare,
  ChevronDown, ChevronUp, Calculator, ShieldCheck, Activity, Cable,
  FolderPlus, Users, Cpu, Moon, BarChart3, LayoutTemplate, Box, FileText,
  BookOpen, FileSignature, Layers
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
  onLogout: () => void;
  setActiveTab: (tab: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen, onClose, user, onLogout, setActiveTab
}) => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  if (!isOpen) return null;

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/80 z-50 transition-opacity animate-fadeIn" 
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-slate-900 z-50 overflow-y-auto flex flex-col shadow-2xl animate-slideInRight border-r border-slate-800">
        
        {/* Header Profile */}
        <div className="bg-fuchsia-600 p-5 pt-8 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200">
             <span className="text-fuchsia-600 font-bold text-3xl">
              {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </span>
          </div>
          
          <h2 className="text-white font-bold text-lg">{user?.name || 'Ing. Camilo Rojas'}</h2>
          <p className="text-fuchsia-100 text-sm truncate">{user?.email || 'camila.rojas@duocuc.cl'}</p>
        </div>

        {/* Menu Items */}
        <div className="flex-1 py-4 flex flex-col bg-slate-900 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* SECCIÓN 1: GESTIÓN DE NEGOCIO Y PROYECTOS */}
          <div className="px-6 py-2">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Gestión de Negocio</h3>
          </div>
          <button 
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-[14px]">Dashboard KPI</span>
          </button>
          <button 
            onClick={() => navigateTo('projects')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <FolderPlus className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Proyectos & Solicitudes</span>
          </button>
          <button 
            onClick={() => navigateTo('crm')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <Users className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Clientes (CRM)</span>
          </button>
          <button 
            onClick={() => navigateTo('quote')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <CheckSquare className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Cotización & Contrato</span>
          </button>
          <button 
            onClick={() => navigateTo('catalog')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left border-b border-slate-800 mb-2"
          >
            <Layers className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Catálogo</span>
          </button>

          {/* SECCIÓN 2: HERRAMIENTAS TÉCNICAS E IA */}
          <div className="px-6 py-2 mt-2">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Herramientas Técnicas e IA</h3>
          </div>
          <button 
            onClick={() => navigateTo('diagnostic')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left relative"
          >
            <Cpu className="w-5 h-5 text-fuchsia-400" />
            <span className="font-medium text-[14px]">Consultor IA Fallas</span>
            <span className="absolute top-3.5 right-6 w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
          </button>
          <button 
            onClick={() => navigateTo('census')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="font-medium text-[14px]">Levantamiento (Censo)</span>
          </button>
          <button 
            onClick={() => navigateTo('assembler')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <ShieldCheck className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Armado Tablero</span>
          </button>
          <button 
            onClick={() => navigateTo('singleline')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <LayoutTemplate className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Diagrama Unilineal</span>
          </button>
          <button 
            onClick={() => navigateTo('physical')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <Box className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Tablero 2D Físico</span>
          </button>
          <button 
            onClick={() => navigateTo('report')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Informe Obra AI</span>
          </button>
          <button 
            onClick={() => navigateTo('norms')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <BookOpen className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Norma RIC SEC</span>
          </button>
          <button 
            onClick={() => navigateTo('te1')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <FileSignature className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Declaración TE1 SEC</span>
          </button>

          {/* Caja de Herramientas Expandible */}
          <div className="border-b border-slate-800 mb-2 pb-2 mt-1">
            <button 
              onClick={() => setIsToolsExpanded(!isToolsExpanded)}
              className="w-full flex items-center justify-between px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <Wrench className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-[14px] text-blue-100">Caja de Herramientas SEC</span>
              </div>
              {isToolsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            
            {/* Expanded Submenu */}
            {isToolsExpanded && (
              <div className="bg-slate-950/50 border-y border-slate-800 py-2 space-y-1">
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center gap-3 px-12 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-left text-sm"
                >
                  <Calculator className="w-4 h-4 text-fuchsia-400" />
                  <span>Dashboard Principal Herramientas</span>
                </button>
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center gap-3 px-12 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-left text-sm"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Cálculo Alimentadores</span>
                </button>
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center gap-3 px-12 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-left text-sm"
                >
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span>Factor de Potencia</span>
                </button>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: CONFIGURACIÓN Y CUENTA */}
          <div className="px-6 py-2 mt-2">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Configuración y Cuenta</h3>
          </div>
          <button 
            onClick={() => navigateTo('profile')}
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <UserCheck className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Mi Perfil y Licencia SEC</span>
          </button>
          <button 
            className="flex items-center gap-4 px-6 py-3 text-amber-400 hover:bg-slate-800 transition-colors text-left"
          >
            <Zap className="w-5 h-5" />
            <span className="font-medium text-[14px]">Versión PRO</span>
          </button>
          <button 
            className="flex items-center justify-between px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <Moon className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-[14px]">Modo Oscuro</span>
            </div>
             <div className="w-8 h-4 bg-fuchsia-600 rounded-full relative">
              <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </div>
          </button>
          <button 
            className="flex items-center gap-4 px-6 py-3 text-slate-300 hover:bg-slate-800 transition-colors text-left"
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-[14px]">Ajustes generales</span>
          </button>
          
          <button 
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-4 px-6 py-4 mt-4 mb-4 text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors text-left border-t border-slate-800"
          >
            <Power className="w-5 h-5" />
            <span className="font-medium text-[14px]">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};
