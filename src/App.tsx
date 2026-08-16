import React, { useState, useEffect, useRef } from 'react';
import { 
  UserSession, 
  RoomData, 
  HighAppliance, 
  BudgetItem, 
  CustomerDetails, 
  ContractorConfig, 
  WorkReportData, 
  ClientRecord, 
  CustomProtectionSpecs, 
  ElectricalProject, 
  ProjectBoardConfig,
  BudgetHistoryRecord
} from './types';

import { HeaderNavbar } from './components/HeaderNavbar';
import { LoginModal } from './components/LoginModal';
import { LoadCensusTab } from './components/LoadCensusTab';
import { ClientsDatabaseTab } from './components/ClientsDatabaseTab';
import { InstallerProfileTab } from './components/InstallerProfileTab';
import { BoardAssemblerTab } from './components/BoardAssemblerTab';
import { SingleLineDiagramTab } from './components/SingleLineDiagramTab';
import { ProfessionalBoardGeneratorTab } from './components/PhysicalBoardSimulationTab';
import { CotizadorTab } from './components/CotizadorTab';
import { WorkReportTab } from './components/WorkReportTab';
import { MaterialsCatalogTab } from './components/MaterialsCatalogTab';
import { RicNormsTab } from './components/RicNormsTab';
import { AiDiagnosticConsultantTab } from './components/AiDiagnosticConsultantTab';
import { Te1DeclarationTab } from './components/Te1DeclarationTab';
import { ProjectsManagerModule } from './components/ProjectsManagerModule';
import { DashboardModule } from './components/DashboardModule';
import { ToolsModule } from './components/ToolsModule';
import { MobileDrawer } from './components/MobileDrawer';
import { TabSkeletonScreen } from './components/TabSkeletonScreen';
import { motion, AnimatePresence } from 'motion/react';

import { saveUserDataToFirebase, loadUserDataFromFirebase, subscribeToUserDataRealtime } from './lib/firebase';
import { 
  enqueueOfflineSync, 
  getPendingSyncQueue, 
  flushOfflineSyncQueue, 
  setupNetworkAndSyncListeners 
} from './lib/offlineManager';

import { 
  Zap, 
  Users, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  Smartphone, 
  X, 
  FolderPlus, ChevronRight, Home,
  Wifi,
  WifiOff,
  RefreshCw,
  Check
} from 'lucide-react';

export interface NavItemConfig {
  label: string;
  category?: string;
  componentName: string;
}

export const navConfig: Record<string, NavItemConfig> = {
  dashboard: { label: 'Dashboard KPI', category: 'General', componentName: 'DashboardModule' },
  projects: { label: 'Proyectos & Solicitudes', category: 'Gestión', componentName: 'ProjectsManagerModule' },
  census: { label: 'Levantamiento (Censo)', category: 'Estudio de Carga', componentName: 'LoadCensusTab' },
  crm: { label: 'Clientes (CRM)', category: 'Gestión', componentName: 'ClientsDatabaseTab' },
  profile: { label: 'Perfil Técnico', category: 'Ajustes', componentName: 'InstallerProfileTab' },
  diagnostic: { label: 'Consultor IA Fallas', category: 'Herramientas IA', componentName: 'AiDiagnosticConsultantTab' },
  assembler: { label: 'Armado Tablero', category: 'Diseño Técnico', componentName: 'BoardAssemblerTab' },
  singleline: { label: 'Diagrama Unilineal', category: 'Diseño Técnico', componentName: 'SingleLineDiagramTab' },
  physical: { label: 'Tablero 2D Físico', category: 'Simulador 2D', componentName: 'ProfessionalBoardGeneratorTab' },
  quote: { label: 'Cotización & Contrato', category: 'Comercial', componentName: 'CotizadorTab' },
  report: { label: 'Informe Obra AI', category: 'Reportes', componentName: 'WorkReportTab' },
  catalog: { label: 'Catálogo de Materiales', category: 'Insumos', componentName: 'MaterialsCatalogTab' },
  tools: { label: 'Herramientas SEC / RIC', category: 'Calculadoras', componentName: 'ToolsModule' },
  norms: { label: 'Norma RIC SEC', category: 'Reglamentación', componentName: 'RicNormsTab' },
  te1: { label: 'Declaración TE1 SEC', category: 'Trámites', componentName: 'Te1DeclarationTab' },
};

const TAB_LABELS: Record<string, string> = {
  "dashboard": "Dashboard KPI",
  "projects": "Proyectos & Solicitudes",
  "tools": "Herramientas SEC / RIC",
  "census": "Levantamiento (Censo)",
  "crm": "Clientes (CRM)",
  "profile": "Perfil Técnico",
  "diagnostic": "Consultor IA Fallas",
  "assembler": "Armado Tablero",
  "singleline": "Diagrama Unilineal",
  "physical": "Tablero 2D Físico",
  "quote": "Cotización & Contrato",
  "report": "Informe Obra AI",
  "catalog": "Catálogo",
  "norms": "Norma RIC SEC",
  "te1": "Declaración TE1 SEC",
};

interface BreadcrumbProps {
  activeTab: string;
  onNavigateToTab: (tab: string) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ activeTab, onNavigateToTab }) => {
  const item = navConfig[activeTab] || {
    label: TAB_LABELS[activeTab] || activeTab,
    category: 'Sección',
    componentName: 'Component',
  };

  return (
    <nav aria-label="Breadcrumb" className="bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 py-2 print:hidden backdrop-blur-sm shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center text-xs text-slate-400 font-medium overflow-x-auto whitespace-nowrap scrollbar-none gap-1.5">
        <button
          onClick={() => onNavigateToTab('dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors group shrink-0"
        >
          <Home className="w-3.5 h-3.5 text-slate-500 group-hover:text-fuchsia-400 transition-colors" />
          <span>Inicio</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

        <span className="text-slate-500 shrink-0">Plataforma Neovolt</span>

        {item.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-slate-400 shrink-0">{item.category}</span>
          </>
        )}

        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

        <div className="flex items-center gap-1.5 shrink-0 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
          <Zap className="w-3 h-3 text-fuchsia-400" />
          <span>{item.label}</span>
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  // User Authentication State
  const [user, setUser] = useState<UserSession>({
    email: 'ineovolt@gmail.com',
    name: 'Ing. Camilo Rojas',
    secNumber: 'SEC-84291-CL',
    isLoggedIn: true,
    role: 'engineer',
    professionalTitle: 'Ingeniero en Electricidad y Automatización Industrial',
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('diagnostic');

  // Cloud Sync, Firebase & Network Persistence State
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => getPendingSyncQueue().length);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('neovolt_last_cloud_sync');
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaInstallGuide, setShowPwaInstallGuide] = useState(false);

  // Sync Guard Refs to prevent infinite loop of Firestore writes & reads
  const isUpdatingFromRemoteRef = useRef(false);
  const lastSavedHashRef = useRef('');

  // Setup Network Listeners & Auto Sync on Recovery
  useEffect(() => {
    const cleanup = setupNetworkAndSyncListeners(
      (onlineState) => {
        setIsOnline(onlineState);
        setPendingQueueCount(getPendingSyncQueue().length);
        if (!onlineState) {
          setSyncToast({
            message: '⚡ Modo Offline Activo: Todos los cambios se guardarán localmente.',
            type: 'warning',
          });
          setTimeout(() => setSyncToast(null), 6000);
        }
      },
      (result) => {
        setPendingQueueCount(getPendingSyncQueue().length);
        if (result.syncedCount > 0) {
          setSyncToast({
            message: `✅ Red reestablecida: ${result.syncedCount} cambio(s) sincronizado(s) con Firebase con éxito.`,
            type: 'success',
          });
          setTimeout(() => setSyncToast(null), 6000);
        }
      }
    );
    return cleanup;
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowPwaInstallGuide(true);
    }
  };

  // Initial Sample Clients Database
  const initialClients: ClientRecord[] = [
    {
      id: 'c1',
      name: 'Inmobiliaria Providencia SpA',
      rut: '76.543.210-K',
      email: 'proyectos@providenciaspa.cl',
      phone: '+56 9 8765 4321',
      address: 'Av. Providencia 1240, Dpto 42',
      city: 'Providencia',
      propertyType: 'Comercial',
      notes: 'Tablero TDA embutido, requiere aumento de capacidad y cambio a protecciones diferenciales 30mA Clase A.',
      createdAt: '15/05/2026',
    },
    {
      id: 'c2',
      name: 'Comunidad Edificio San Cristóbal',
      rut: '65.123.456-7',
      email: 'administracion@sancristobal.cl',
      phone: '+56 9 9123 4567',
      address: 'Pedro de Valdivia 850',
      city: 'Providencia',
      propertyType: 'Comunidad',
      notes: 'Tablero de Fuerza Bombas de Agua y Alumbrado Pasillos. Inspección previa SEC solicitada.',
      createdAt: '20/06/2026',
    },
    {
      id: 'c3',
      name: 'Juan Pérez Ovalle',
      rut: '15.482.910-3',
      email: 'juan.perez@ejemplo.cl',
      phone: '+56 9 7654 3210',
      address: 'Pasaje El Roble 452',
      city: 'Maipú',
      propertyType: 'Residencial',
      notes: 'Casa habitación, cambio de tablero de madera antiguo a gabinete DIN ignífugo con IGA y DPS.',
      createdAt: '02/07/2026',
    },
  ];

  // Saved Clients state
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    const local = localStorage.getItem('neovolt_clients');
    return local ? JSON.parse(local) : initialClients;
  });

  useEffect(() => {
    localStorage.setItem('neovolt_clients', JSON.stringify(clients));
  }, [clients]);

  // Projects & Service Orders State
  const initialProjects: ElectricalProject[] = [
    {
      id: 'p1',
      code: 'PRJ-2026-101',
      title: 'Cambio de Artefactos, Enchufes y Revisión de Fugas TDA',
      projectType: 'REEMPLAZO_ARTEFACTOS',
      status: 'COTIZACION',
      client: {
        name: 'Inmobiliaria Providencia SpA',
        rut: '76.543.210-K',
        email: 'proyectos@providenciaspa.cl',
        phone: '+56 9 8765 4321',
        address: 'Av. Providencia 1240, Dpto 42',
        city: 'Providencia',
        emergencyPhone: '',
        propertyType: 'Comercial',
      },
      description: 'Cliente solicita reemplazo de 6 enchufes dobles quemados en cocina, cambio de diferencial a Clase A y pruebas de aislamiento.',
      attachments: [],
      scopeItems: [
        { id: 's1', description: 'Reemplazo de Enchufe Doble 16A Embutido Bticino', quantity: 6, unitPrice: 4890, unit: 'unid', category: 'ARTEFACTOS' },
        { id: 's2', description: 'Reemplazo Interruptor Diferencial 2x25A 30mA Clase A Superinmunizado', quantity: 1, unitPrice: 28990, unit: 'unid', category: 'PROTECCIONES' },
        { id: 's3', description: 'Pruebas de disparo e inspección con telurómetro y multímetro', quantity: 1, unitPrice: 35000, unit: 'global', category: 'REVISION_TECNICA' },
        { id: 's4', description: 'Mano de obra recambio de enchufes y peinado de tablero', quantity: 1, unitPrice: 65000, unit: 'global', category: 'MANO_DE_OBRA' },
      ],
      laborPrice: 65000,
      materialsPrice: 93330,
      totalPrice: 158330,
      includeTaxIVA: false,
      notes: 'Requieren factura y comprobante para administración del edificio.',
      createdAt: '18/05/2026',
      updatedAt: '18/05/2026',
      targetDeadline: '2026-06-01',
      boardConfig: {
        boardCapacity: 24,
        isThreePhase: false,
        placedAccessories: [
          {
            instanceId: 'p1_acc1',
            itemId: 'pilot_red_220v',
            name: 'Luz Piloto LED Roja 220V (Presencia L1)',
            category: 'senializacion',
            type: 'pilot_light_red',
            dinModules: 1,
            dropZone: 'rail_0_slot_0',
            colorClass: 'bg-rose-950 border-rose-500 text-rose-300',
          },
        ],
        customWires: [
          { id: 'w1', fromId: 'medidor_l', fromName: 'Medidor Entrada L1', toId: 'iga_in_l', toName: 'IGA Entrada 1', color: 'phase' },
          { id: 'w2', fromId: 'medidor_n', fromName: 'Medidor Entrada N', toId: 'iga_in_n', toName: 'IGA Entrada N', color: 'neutral' },
          { id: 'w3', fromId: 'iga_out_l', fromName: 'IGA Salida L', toId: 'pilot_l1_x1', toName: 'Luz Piloto X1', color: 'phase' },
          { id: 'w4', fromId: 'iga_out_n', fromName: 'IGA Salida N', toId: 'pilot_l1_x2', toName: 'Luz Piloto X2', color: 'neutral' },
        ],
      },
    },
    {
      id: 'p2',
      code: 'PRJ-2026-102',
      title: 'Tablero Distribución Trifásico Industrial & Alumbrado',
      projectType: 'INSTALACION_NUEVA',
      status: 'EN_EJECUCION',
      client: {
        name: 'Comunidad Edificio San Cristóbal',
        rut: '65.123.456-7',
        email: 'administracion@sancristobal.cl',
        phone: '+56 9 9123 4567',
        address: 'Pedro de Valdivia 850',
        city: 'Providencia',
        emergencyPhone: '',
        propertyType: 'Comunidad',
      },
      description: 'Tablero de distribución trifásico con IGA 40A, diferencial 30mA, voltímetro/amperímetro digital y protecciones de fuerza.',
      attachments: [],
      scopeItems: [
        { id: 's201', description: 'Tablero DIN 36 Módulos Metálico Embutido IP55', quantity: 1, unitPrice: 85000, unit: 'unid', category: 'PROTECCIONES' },
        { id: 's202', description: 'Interruptor Diferencial Trifásico 4x40A 30mA + Disyuntor 3x32A', quantity: 2, unitPrice: 42000, unit: 'unid', category: 'PROTECCIONES' },
      ],
      laborPrice: 120000,
      materialsPrice: 127000,
      totalPrice: 247000,
      includeTaxIVA: true,
      notes: 'Requiere balanceo de fases L1, L2 y L3 en terreno.',
      createdAt: '20/06/2026',
      updatedAt: '20/06/2026',
      targetDeadline: '2026-07-10',
      boardConfig: {
        boardCapacity: 36,
        isThreePhase: true,
        placedAccessories: [
          {
            instanceId: 'p2_acc1',
            itemId: 'pilot_red_220v',
            name: 'Luz Piloto LED Roja 220V (Presencia L1)',
            category: 'senializacion',
            type: 'pilot_light_red',
            dinModules: 1,
            dropZone: 'rail_0_slot_0',
            colorClass: 'bg-rose-950 border-rose-500 text-rose-300',
          },
          {
            instanceId: 'p2_acc2',
            itemId: 'pilot_yellow_220v',
            name: 'Luz Piloto LED Amarilla 220V (Presencia L2)',
            category: 'senializacion',
            type: 'pilot_light_yellow',
            dinModules: 1,
            dropZone: 'rail_0_slot_1',
            colorClass: 'bg-amber-950 border-amber-500 text-amber-300',
          },
          {
            instanceId: 'p2_acc3',
            itemId: 'voltmeter_digital',
            name: 'Voltímetro / Amperímetro Digital DIN 380V',
            category: 'medicion',
            type: 'meter_digital',
            dinModules: 2,
            dropZone: 'rail_0_slot_10',
            colorClass: 'bg-indigo-950 border-indigo-500 text-indigo-300',
          },
        ],
        customWires: [
          { id: 'w1', fromId: 'medidor_l', fromName: 'Medidor Entrada L1', toId: 'iga_in_l', toName: 'IGA Entrada 1', color: 'phase' },
          { id: 'w2', fromId: 'medidor_n', fromName: 'Medidor Entrada N', toId: 'iga_in_n', toName: 'IGA Entrada N', color: 'neutral' },
          { id: 'w3', fromId: 'iga_out_l', fromName: 'IGA Salida L', toId: 'pilot_l1_x1', toName: 'Luz Piloto L1 X1', color: 'phase' },
          { id: 'w4', fromId: 'c1_out_l', fromName: 'C1 Salida Fuerza', toId: 'bar_neutral', toName: 'Barra Neutro N', color: 'neutral' },
        ],
      },
    },
    {
      id: 'p3',
      code: 'PRJ-2026-103',
      title: 'Normalización Tablero Residencial Casa Maipú',
      projectType: 'AUMENTO_CAPACIDAD',
      status: 'COTIZACION',
      client: {
        name: 'Juan Pérez Ovalle',
        rut: '15.482.910-3',
        email: 'juan.perez@ejemplo.cl',
        phone: '+56 9 7654 3210',
        address: 'Pasaje El Roble 452',
        city: 'Maipú',
        emergencyPhone: '',
        propertyType: 'Residencial',
      },
      description: 'Cambio de tablero antiguo de madera por gabinete ignífugo DIN 18M con IGA 20A y protector sobretensiones DPS.',
      attachments: [],
      scopeItems: [
        { id: 's301', description: 'Gabinete DIN 18 Módulos Sobrepuesto Ignífugo IP40', quantity: 1, unitPrice: 22900, unit: 'unid', category: 'PROTECCIONES' },
        { id: 's302', description: 'Disyuntor Monofásico Bticino 1x20A Curva C + DPS 275V 20kA', quantity: 1, unitPrice: 32800, unit: 'unid', category: 'PROTECCIONES' },
      ],
      laborPrice: 55000,
      materialsPrice: 55700,
      totalPrice: 110700,
      includeTaxIVA: false,
      notes: 'Requiere declaración TE1 para posterior aumento de capacidad CGE.',
      createdAt: '02/07/2026',
      updatedAt: '02/07/2026',
      targetDeadline: '2026-07-20',
      boardConfig: {
        boardCapacity: 18,
        isThreePhase: false,
        placedAccessories: [
          {
            instanceId: 'p3_acc1',
            itemId: 'pilot_red_220v',
            name: 'Luz Piloto LED Roja 220V',
            category: 'senializacion',
            type: 'pilot_light_red',
            dinModules: 1,
            dropZone: 'rail_0_slot_0',
            colorClass: 'bg-rose-950 border-rose-500 text-rose-300',
          },
        ],
        customWires: [
          { id: 'w1', fromId: 'medidor_l', fromName: 'Medidor L1', toId: 'iga_in_l', toName: 'IGA Entrada L', color: 'phase' },
          { id: 'w2', fromId: 'medidor_n', fromName: 'Medidor N', toId: 'iga_in_n', toName: 'IGA Entrada N', color: 'neutral' },
          { id: 'w3', fromId: 'iga_out_l', fromName: 'IGA Salida L', toId: 'dps_in_l', toName: 'DPS Entrada L', color: 'phase' },
          { id: 'w4', fromId: 'dps_out_pe', fromName: 'DPS Borna PE', toId: 'bar_earth', toName: 'Barra Tierra PE', color: 'earth' },
        ],
      },
    },
  ];

  const [projects, setProjects] = useState<ElectricalProject[]>(() => {
    const local = localStorage.getItem('neovolt_projects');
    return local ? JSON.parse(local) : initialProjects;
  });

  const [selectedProjectId] = useState<string>('p1');

  useEffect(() => {
    localStorage.setItem('neovolt_projects', JSON.stringify(projects));

    // Daily backup
    const today = new Date().toISOString().split('T')[0];
    const lastBackupDate = localStorage.getItem('neovolt_autosave_date');
    if (lastBackupDate !== today) {
      localStorage.setItem('neovolt_autosave_daily', JSON.stringify(projects));
      localStorage.setItem('neovolt_autosave_date', today);
    }
  }, [projects]);

  const [budgetHistory, setBudgetHistory] = useState<BudgetHistoryRecord[]>(() => {
    try {
      const local = localStorage.getItem('neovolt_budget_history');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const handleRevertBudgetHistory = (record: BudgetHistoryRecord) => {
    if (record.previousItems && record.previousItems.length > 0) {
      setBudgetItems(record.previousItems);
    }
    setSyncToast({
      message: `✅ Restablecida versión del ${record.timestamp}: ${record.description}`,
      type: 'success',
    });
    setTimeout(() => setSyncToast(null), 5000);
  };

  const [selectedProjectClientId, setSelectedProjectClientId] = useState<string | undefined>(undefined);

  const handleSelectClientForProject = (client: ClientRecord) => {
    setSelectedProjectClientId(client.id);
    setActiveTab('projects');
  };

  const handleSelectProjectForQuote = (project: ElectricalProject) => {
    if (project.client) {
      setCustomer({
        name: project.client.name,
        rut: project.client.rut || '',
        address: project.client.address || '',
        city: project.client.city || '',
        phone: project.client.phone || '',
        email: project.client.email || '',
        emergencyPhone: project.client.emergencyPhone || '',
        propertyType: project.client.propertyType || 'Residencial',
      });
    }
    if (project.scopeItems) {
      const convertedItems: BudgetItem[] = project.scopeItems.map((item) => ({
        id: item.id,
        name: item.description,
        quantity: item.quantity,
        price: item.unitPrice,
        category: item.category as any,
      }));
      setBudgetItems(convertedItems);
    }
    setActiveTab('quote');
  };

  const handleTransferProjectToQuote = (customerObj: CustomerDetails, items: BudgetItem[], laborAmount: number) => {
    setCustomer(customerObj);
    setBudgetItems(items);
    setActiveTab('quote');
  };

  // Electrical Project State
  const [rooms, setRooms] = useState<RoomData[]>([
    {
      id: '1',
      name: 'Dormitorio Principal',
      lightPoints: 2,
      socketPoints: 3,
      devices: [
        { name: 'Smart TV 55"', powerWatts: 120, quantity: 1 },
        { name: 'Notebook / Laptop', powerWatts: 85, quantity: 1 },
      ],
    },
    {
      id: '2',
      name: 'Estar / Living Comedor',
      lightPoints: 3,
      socketPoints: 5,
      devices: [
        { name: 'Consola Videojuegos (PS5)', powerWatts: 210, quantity: 1 },
        { name: 'PC Gaming / Escritorio', powerWatts: 450, quantity: 1 },
      ],
    },
    {
      id: '3',
      name: 'Cocina & Logia',
      lightPoints: 2,
      socketPoints: 4,
      devices: [
        { name: 'Refrigerador No-Frost A+', powerWatts: 250, quantity: 1 },
        { name: 'Microondas 25L', powerWatts: 1200, quantity: 1 },
        { name: 'Hervidor Eléctrico 1.7L', powerWatts: 1800, quantity: 1 },
      ],
    },
  ]);

  const [highAppliances, setHighAppliances] = useState<HighAppliance[]>([
    {
      id: 'h1',
      name: 'Horno Eléctrico Empotrado',
      powerWatts: 2800,
      category: 'Cocina',
      socketType: '16A',
      voltage: 220,
    },
    {
      id: 'h2',
      name: 'Encimera Inducción 4 Platos',
      powerWatts: 7200,
      category: 'Cocina',
      socketType: 'Conexión Directa',
      voltage: 220,
    },
  ]);

  // Feeder Specs
  const [feederLength, setFeederLength] = useState(20);
  const [isThreePhase, setIsThreePhase] = useState(false);
  const [feederWireSection, setFeederWireSection] = useState(4.0);

  // Custom Protections Specs
  const [customProtectionSpecs, setCustomProtectionSpecs] = useState<CustomProtectionSpecs>({
    iga: {
      amps: 25,
      curve: 'Curva C',
      breakingCapacity: '6kA',
      poles: '1x',
    },
    dps: {
      voltage: '275V',
      dischargeCurrent: '20kA',
    },
    rcds: {
      1: { amps: 25, sensitivity: '30mA', classType: 'Clase AC' },
      2: { amps: 40, sensitivity: '30mA', classType: 'Clase AC' },
      3: { amps: 40, sensitivity: '30mA', classType: 'Clase AC' },
    },
    circuitBreakers: {},
  });

  const handleSyncProtectionsToBudget = (specs: CustomProtectionSpecs) => {
    const igaPoles = specs.iga?.poles || (isThreePhase ? '3x' : '1x');
    const igaAmps = specs.iga?.amps || 25;
    const igaCurve = specs.iga?.curve || 'Curva C';
    const igaBreak = specs.iga?.breakingCapacity || '6kA';
    let igaPrice = 5990;
    if (igaAmps >= 40) igaPrice = 9990;
    if (igaPoles === '3x') igaPrice = 24990;

    const newProtectionItems: BudgetItem[] = [
      {
        id: 'prot_iga',
        name: `Disyuntor ${igaPoles === '3x' ? 'Trifásico' : 'Monofásico'} Bticino ${igaPoles}${igaAmps}A ${igaBreak} ${igaCurve} (IGA General)`,
        quantity: 1,
        price: igaPrice,
        category: 'PROTECCIONES',
        unit: 'unid',
        skuCode: 'CAT-IGA-SEC',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=60',
      },
      {
        id: 'prot_dps',
        name: `Protector de Sobretensión Transitoria DPS ${specs.dps?.voltage || '275V'} ${specs.dps?.dischargeCurrent || '20kA'} (Sobretensión Cat. II)`,
        quantity: 1,
        price: 24990,
        category: 'PROTECCIONES',
        unit: 'unid',
        skuCode: 'CAT-DPS-SEC',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=60',
      },
    ];

    Object.entries(specs.rcds || {}).forEach(([rcdNum, rcd]) => {
      let rcdPrice = 19990;
      if (rcd.amps >= 40) rcdPrice = 22990;
      if (rcd.classType.includes('Superinmunizado') || rcd.classType.includes('Clase A')) rcdPrice = 38990;
      newProtectionItems.push({
        id: `prot_rcd_${rcdNum}`,
        name: `Interruptor Diferencial Bticino 2x${rcd.amps}A ${rcd.sensitivity} ${rcd.classType} (RCD #${rcdNum})`,
        quantity: 1,
        price: rcdPrice,
        category: 'PROTECCIONES',
        unit: 'unid',
        skuCode: `CAT-RCD-${rcdNum}`,
        imageUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=300&auto=format&fit=crop&q=60',
      });
    });

    Object.entries(specs.circuitBreakers || {}).forEach(([code, cb]) => {
      let cbPrice = 5990;
      if (cb.amps >= 20) cbPrice = 6490;
      if (cb.amps >= 25) cbPrice = 6990;
      if (cb.amps >= 32) cbPrice = 7490;
      newProtectionItems.push({
        id: `prot_cb_${code}`,
        name: `Disyuntor Monofásico Bticino 1x${cb.amps}A ${cb.breakingCapacity} ${cb.curve} (${code}: ${cb.customName || 'Circuito'})`,
        quantity: 1,
        price: cbPrice,
        category: 'PROTECCIONES',
        unit: 'unid',
        skuCode: `CAT-CB-${code}`,
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=60',
      });
    });

    setBudgetItems((prev) => {
      const remaining = prev.filter((item) => item.category !== 'PROTECCIONES');
      return [...remaining, ...newProtectionItems];
    });
  };

  // Budget Items
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { id: 'b1', name: 'Disyuntor Monofásico 1x16A 6kA Curva C', quantity: 2, price: 5990, category: 'PROTECCIONES' },
    { id: 'b2', name: 'Diferencial 2x25A 30mA Clase AC', quantity: 1, price: 19990, category: 'PROTECCIONES' },
    { id: 'b3', name: 'Protector de Sobretensión DPS 275V 20kA', quantity: 1, price: 24990, category: 'PROTECCIONES' },
    { id: 'b4', name: 'Tablero Eléctrico Embutido 18 Módulos IP40', quantity: 1, price: 24990, category: 'PROTECCIONES' },
    { id: 'b5', name: 'Tubo Flexible PVC Corrugado 25mm (Rollo 25m)', quantity: 1, price: 14990, category: 'CANALIZACIÓN' },
    { id: 'b6', name: 'Cable EVA 2.5mm² Azul (Metro)', quantity: 30, price: 690, category: 'CONDUCTORES' },
    { id: 'b7', name: 'Cable EVA 2.5mm² Blanco (Metro)', quantity: 30, price: 690, category: 'CONDUCTORES' },
    { id: 'b8', name: 'Cable EVA 2.5mm² Verde (Metro)', quantity: 30, price: 690, category: 'CONDUCTORES' },
  ]);

  // Customer Details
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: 'Juan Pérez Ovalle',
    rut: '15.482.910-3',
    address: 'Av. Providencia 1240, Santiago',
    city: 'Providencia',
    phone: '+56 9 8765 4321',
    email: 'cliente.providencia@ejemplo.cl',
    emergencyPhone: '+56 9 1234 5678',
    propertyType: 'Residencial',
  });

  // Contractor Config
  const [contractor, setContractor] = useState<ContractorConfig>(() => {
    const local = localStorage.getItem('neovolt_contractor');
    if (local) return JSON.parse(local);
    return {
      senderEmail: 'ineovolt@gmail.com',
      companyName: 'NEOVOLT - Ingeniería Eléctrica de Precisión',
      installerName: 'Camilo Rojas',
      secLicense: 'SEC-84291-CL',
      secClass: 'Clase A (Alta y Baja Tensión)',
      rut: '76.892.410-5',
      phone: '+56 9 9876 5432',
      address: 'Av. Andrés Bello 2233, Providencia, Santiago',
      bankDetails: {
        bankName: 'Banco de Chile',
        accountType: 'Cuenta Corriente',
        accountNumber: '123-45678-00',
        holderName: 'NEOVOLT SpA',
        holderRut: '76.892.410-5',
        emailForNotify: 'ineovolt@gmail.com',
      },
    };
  });

  useEffect(() => {
    localStorage.setItem('neovolt_contractor', JSON.stringify(contractor));
  }, [contractor]);

  // Work Report Data
  const [workReport, setWorkReport] = useState<WorkReportData>({
    clientName: customer.name,
    address: customer.address,
    briefNotes: 'Normalización e instalación de Tablero TDA 18M, canalización EMT/PVC Conduit, protecciones diferenciales 30mA y medición de puesta a tierra.',
    generatedAiReport: '',
    photoPaths: [],
    testResults: {
      isolationMOhms: 50,
      earthResistanceOhms: 12.4,
      rcdTripTimeMs: 22,
    },
  });

  // Save to Cloud & Firebase Function with Non-Blocking Background Sync
  const handleSaveToCloud = async (isManual: boolean = true) => {
    if (!user.email) return;
    setIsCloudSyncing(true);
    const now = new Date().toISOString();
    const payload = {
      user,
      clients,
      projects,
      rooms,
      highAppliances,
      feederLength,
      isThreePhase,
      feederWireSection,
      budgetItems,
      customer,
      contractor,
      workReport,
      savedAt: now,
    };

    // Update last saved payload hash to prevent immediate duplicate auto-saving
    lastSavedHashRef.current = JSON.stringify({
      projects,
      clients,
      rooms,
      highAppliances,
      feederLength,
      isThreePhase,
      feederWireSection,
      budgetItems,
      customer,
      contractor,
      workReport,
    });

    try {
      if (!navigator.onLine) {
        // Offline: Enqueue offline sync item
        enqueueOfflineSync(user.email, payload, 'FULL_BACKUP');
        setPendingQueueCount(getPendingSyncQueue().length);
        if (isManual) {
          setSyncToast({
            message: '⚡ Guardado localmente en modo Offline. Se sincronizará prioritariamente al reconectar.',
            type: 'warning',
          });
          setTimeout(() => setSyncToast(null), 5000);
        }
      } else {
        // Online: Save to Firebase Firestore & Cloud API asynchronously
        const fbResult = await saveUserDataToFirebase(user.email, payload);
        
        try {
          fetch('/api/cloud-sync/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, data: payload }),
          }).catch(() => {});
        } catch (e) {
          console.warn('Servidor secundario de la nube inaccesible:', e);
        }

        // Flush any accumulated offline queue items
        await flushOfflineSyncQueue();
        setPendingQueueCount(getPendingSyncQueue().length);

        setLastCloudSyncTime(now);
        localStorage.setItem('neovolt_last_cloud_sync', now);

        if (isManual) {
          setSyncToast({
            message: fbResult.success
              ? '✅ Guardado y sincronizado con éxito en Firebase Firestore.'
              : '✅ Datos guardados en la nube correctamente.',
            type: 'success',
          });
          setTimeout(() => setSyncToast(null), 4000);
        }
      }
    } catch (err) {
      console.error('Error al respaldar en la nube/Firebase:', err);
      enqueueOfflineSync(user.email, payload, 'FULL_BACKUP');
      setPendingQueueCount(getPendingSyncQueue().length);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Manual Network & Firebase Sync trigger
  const handleManualSync = async () => {
    if (!navigator.onLine) {
      setSyncToast({
        message: '⚠️ La aplicación se encuentra sin conexión a internet. La sincronización se ejecutará automáticamente cuando regrese la red.',
        type: 'warning',
      });
      setTimeout(() => setSyncToast(null), 5000);
      return;
    }

    setIsCloudSyncing(true);
    try {
      const res = await flushOfflineSyncQueue();
      setPendingQueueCount(getPendingSyncQueue().length);
      if (res.syncedCount > 0) {
        setSyncToast({
          message: `✅ Sincronización manual exitosa: ${res.syncedCount} registro(s) subidos a Firebase.`,
          type: 'success',
        });
      } else {
        setSyncToast({
          message: '✨ Todos los registros locales están perfectamente sincronizados con Firebase.',
          type: 'info',
        });
      }
      setTimeout(() => setSyncToast(null), 4000);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Load from Cloud & Firebase Function silently in background
  const handleLoadFromCloud = async () => {
    if (!user.email) return;
    setIsCloudSyncing(true);
    try {
      // 1. Prioritize Firebase Firestore
      const fbData = await loadUserDataFromFirebase(user.email);
      if (fbData) {
        isUpdatingFromRemoteRef.current = true;
        if (fbData.clients) setClients(fbData.clients);
        if (fbData.projects) setProjects(fbData.projects);
        if (fbData.rooms) setRooms(fbData.rooms);
        if (fbData.highAppliances) setHighAppliances(fbData.highAppliances);
        if (fbData.budgetItems) setBudgetItems(fbData.budgetItems);
        if (fbData.contractor) setContractor(fbData.contractor);
        if (fbData.customer) setCustomer(fbData.customer);
        if (fbData.workReport) setWorkReport(fbData.workReport);
        if (fbData.feederLength) setFeederLength(fbData.feederLength);
        if (fbData.isThreePhase !== undefined) setIsThreePhase(fbData.isThreePhase);
        if (fbData.feederWireSection) setFeederWireSection(fbData.feederWireSection);
        const now = new Date().toISOString();
        setLastCloudSyncTime(now);
        localStorage.setItem('neovolt_last_cloud_sync', now);

        lastSavedHashRef.current = JSON.stringify({
          projects: fbData.projects || projects,
          clients: fbData.clients || clients,
          rooms: fbData.rooms || rooms,
          highAppliances: fbData.highAppliances || highAppliances,
          feederLength: fbData.feederLength || feederLength,
          isThreePhase: fbData.isThreePhase !== undefined ? fbData.isThreePhase : isThreePhase,
          feederWireSection: fbData.feederWireSection || feederWireSection,
          budgetItems: fbData.budgetItems || budgetItems,
          customer: fbData.customer || customer,
          contractor: fbData.contractor || contractor,
          workReport: fbData.workReport || workReport,
        });
        return;
      }

      // 2. Fallback to Cloud API
      const res = await fetch(`/api/cloud-sync/load?email=${encodeURIComponent(user.email)}`);
      const result = await res.json();
      if (result.found && result.data) {
        const d = result.data;
        isUpdatingFromRemoteRef.current = true;
        if (d.clients) setClients(d.clients);
        if (d.projects) setProjects(d.projects);
        if (d.rooms) setRooms(d.rooms);
        if (d.highAppliances) setHighAppliances(d.highAppliances);
        if (d.budgetItems) setBudgetItems(d.budgetItems);
        if (d.contractor) setContractor(d.contractor);
        if (d.customer) setCustomer(d.customer);
        if (d.workReport) setWorkReport(d.workReport);
        if (d.feederLength) setFeederLength(d.feederLength);
        if (d.isThreePhase !== undefined) setIsThreePhase(d.isThreePhase);
        if (d.feederWireSection) setFeederWireSection(d.feederWireSection);
        if (result.updatedAt) {
          setLastCloudSyncTime(result.updatedAt);
          localStorage.setItem('neovolt_last_cloud_sync', result.updatedAt);
        }
      }
    } catch (err) {
      console.error('Error al cargar datos de la nube:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    if (user.isLoggedIn && user.email) {
      handleLoadFromCloud();
    }
  }, [user.email]);

  // Real-time Firestore onSnapshot Listener for multi-device & multi-tab auto sync
  useEffect(() => {
    if (!user.isLoggedIn || !user.email) return;

    const unsubscribe = subscribeToUserDataRealtime(user.email, (fbData, isFromOtherDevice) => {
      if (isFromOtherDevice && fbData) {
        isUpdatingFromRemoteRef.current = true;
        if (fbData.clients) setClients(fbData.clients);
        if (fbData.projects) setProjects(fbData.projects);
        if (fbData.rooms) setRooms(fbData.rooms);
        if (fbData.highAppliances) setHighAppliances(fbData.highAppliances);
        if (fbData.budgetItems) setBudgetItems(fbData.budgetItems);
        if (fbData.customer) setCustomer(fbData.customer);
        if (fbData.contractor) setContractor(fbData.contractor);
        if (fbData.workReport) setWorkReport(fbData.workReport);
        if (fbData.feederLength) setFeederLength(fbData.feederLength);
        if (fbData.isThreePhase !== undefined) setIsThreePhase(fbData.isThreePhase);
        if (fbData.feederWireSection) setFeederWireSection(fbData.feederWireSection);
        const now = new Date().toISOString();
        setLastCloudSyncTime(now);
        localStorage.setItem('neovolt_last_cloud_sync', now);

        lastSavedHashRef.current = JSON.stringify({
          projects: fbData.projects || projects,
          clients: fbData.clients || clients,
          rooms: fbData.rooms || rooms,
          highAppliances: fbData.highAppliances || highAppliances,
          feederLength: fbData.feederLength || feederLength,
          isThreePhase: fbData.isThreePhase !== undefined ? fbData.isThreePhase : isThreePhase,
          feederWireSection: fbData.feederWireSection || feederWireSection,
          budgetItems: fbData.budgetItems || budgetItems,
          customer: fbData.customer || customer,
          contractor: fbData.contractor || contractor,
          workReport: fbData.workReport || workReport,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user.isLoggedIn, user.email]);

  // Debounced background sync to Firebase when local state changes (optimistic)
  const isFirstSyncRun = useRef(true);
  useEffect(() => {
    if (!user.isLoggedIn || !user.email) return;
    if (isFirstSyncRun.current) {
      isFirstSyncRun.current = false;
      return;
    }

    // Skip auto-save if state was just hydrated from cloud
    if (isUpdatingFromRemoteRef.current) {
      isUpdatingFromRemoteRef.current = false;
      return;
    }

    const currentHash = JSON.stringify({
      projects,
      clients,
      rooms,
      highAppliances,
      feederLength,
      isThreePhase,
      feederWireSection,
      budgetItems,
      customer,
      contractor,
      workReport,
    });

    // Skip auto-save if data is identical to the last saved state
    if (currentHash === lastSavedHashRef.current) {
      return;
    }

    // Debounce save operation by 3000ms
    const timer = setTimeout(() => {
      lastSavedHashRef.current = currentHash;
      handleSaveToCloud(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    projects,
    clients,
    rooms,
    highAppliances,
    feederLength,
    isThreePhase,
    feederWireSection,
    budgetItems,
    customer,
    contractor,
    workReport,
  ]);

  const handleAddItemToBudget = (item: BudgetItem) => {
    setBudgetItems((prev) => [...prev, item]);
  };

  const handleSelectClientForQuote = (selectedCustomer: CustomerDetails) => {
    setCustomer(selectedCustomer);
    setActiveTab('quote');
  };

  const handleSelectClientForReport = (selectedCustomer: CustomerDetails) => {
    setCustomer(selectedCustomer);
    setWorkReport((prev) => ({
      ...prev,
      clientName: selectedCustomer.name,
      address: selectedCustomer.address,
    }));
    setActiveTab('report');
  };

  const handleLogout = () => {
    setUser({
      email: '',
      name: '',
      secNumber: '',
      isLoggedIn: false,
      role: 'installer',
    });
  };

  const handleImportMaterialsToQuote = (items: BudgetItem[]) => {
    setBudgetItems(items);
    setActiveTab('quote');
  };

  // Mapeos de Navegación Flexibles (Previene pantallas negras)
  const isCrmTab = ['crm', 'clients', 'clients_database', '2'].includes(activeTab);
  const isCensusTab = ['census', 'levantamiento', '1'].includes(activeTab);
  const isDiagnosticTab = ['diagnostic', 'ai_consultant', '4'].includes(activeTab);
  const isAssemblerTab = ['assembler', 'board_assembler', '5'].includes(activeTab);
  const isSingleLineTab = ['singleline', 'diagram', '6'].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-fuchsia-500 selection:text-white">
      {/* Header Navbar */}
      <HeaderNavbar
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        customLogoUrl={contractor.customLogoUrl}
        isSecCertified={contractor.isSecCertified}
        onSaveToCloud={() => handleSaveToCloud(true)}
        onLoadFromCloud={handleLoadFromCloud}
        onInstallApp={handleInstallApp}
        isCloudSyncing={isCloudSyncing}
        lastCloudSyncTime={lastCloudSyncTime}
        isOnline={isOnline}
        pendingQueueCount={pendingQueueCount}
        onSyncNow={handleManualSync}
      />

      {/* Breadcrumb Navigation Indicator */}
      <Breadcrumb activeTab={activeTab} onNavigateToTab={setActiveTab} />

      <MobileDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onLogout={handleLogout}
        setActiveTab={setActiveTab}
      />

      {/* Sync Status Toast Notification (Floating, Non-blocking) */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs font-semibold text-slate-200"
          >
            <div className="flex items-center gap-2.5">
              {syncToast.type === 'warning' ? (
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <WifiOff className="w-4 h-4 animate-pulse" />
                </div>
              ) : syncToast.type === 'success' ? (
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 shrink-0">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-slate-100">Sincronización Firebase</span>
                <span className={
                  syncToast.type === 'warning' ? 'text-amber-300 font-normal' :
                  syncToast.type === 'success' ? 'text-emerald-300 font-normal' : 'text-fuchsia-300 font-normal'
                }>
                  {syncToast.message}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSyncToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Instructions Modal */}
      {showPwaInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-sm">
                <Smartphone className="w-5 h-5" />
                <span>Instalar App en tu Celular</span>
              </div>
              <button
                onClick={() => setShowPwaInstallGuide(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Para anclar NEOVOLT a la pantalla de inicio de tu teléfono móvil y usarla como una aplicación nativa:
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>🤖 En Android (Google Chrome / Edge):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Toca el menú de 3 puntos (⋮) en la esquina superior derecha.</li>
                  <li>Selecciona <strong className="text-fuchsia-300">"Instalar aplicación"</strong> o <strong className="text-fuchsia-300">"Agregar a la pantalla principal"</strong>.</li>
                  <li>Confirma y verás el ícono de la app en tu teléfono.</li>
                </ol>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>🍎 En iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Toca el botón <strong className="text-fuchsia-300">Compartir</strong> (el cuadrado con la flecha hacia arriba).</li>
                  <li>Desplázate hacia abajo y selecciona <strong className="text-fuchsia-300">"Agregar a inicio"</strong>.</li>
                  <li>Toca "Agregar" arriba a la derecha.</li>
                </ol>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPwaInstallGuide(false)}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20 sm:pb-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {(() => {
              switch (activeTab) {
                case 'physical':
                case 'tablero_2d':
                case '7':
                  return <ProfessionalBoardGeneratorTab />;

                case 'dashboard':
                  return (
                    <DashboardModule
                      projects={projects}
                      clients={clients}
                      budgetHistory={budgetHistory}
                      onRevertBudgetHistory={handleRevertBudgetHistory}
                      onNavigateToTab={setActiveTab}
                      onSelectProjectForQuote={handleSelectProjectForQuote}
                      rooms={rooms}
                      highAppliances={highAppliances}
                      onUpdateProject={(updatedProj) => {
                        setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
                      }}
                    />
                  );

                case 'projects':
                case '0':
                  return (
                    <ProjectsManagerModule
                      projects={projects}
                      setProjects={setProjects}
                      clients={clients}
                      setClients={setClients}
                      contractor={contractor}
                      onTransferToGlobalQuote={handleTransferProjectToQuote}
                      onNavigateToTab={setActiveTab}
                      initialSelectedClientId={selectedProjectClientId}
                    />
                  );

                case 'census':
                case 'levantamiento':
                case '1':
                  return (
                    <LoadCensusTab
                      rooms={rooms}
                      highAppliances={highAppliances}
                      setRooms={setRooms}
                      setHighAppliances={setHighAppliances}
                      onTransferToQuote={(newItems) => {
                        setBudgetItems((prev) => [...prev, ...newItems]);
                        setActiveTab('quote');
                      }}
                      onNavigateToTab={setActiveTab}
                    />
                  );

                case 'crm':
                case 'clients':
                case 'clients_database':
                case '2':
                  return (
                    <ClientsDatabaseTab
                      clients={clients}
                      setClients={setClients}
                      onSelectClientForQuote={handleSelectClientForQuote}
                      onSelectClientForReport={handleSelectClientForReport}
                      onSelectClientForProject={handleSelectClientForProject}
                    />
                  );

                case 'profile':
                case '3':
                  return (
                    <InstallerProfileTab
                      contractor={contractor}
                      setContractor={setContractor}
                      user={user}
                      setUser={setUser}
                      onSaveToCloud={handleSaveToCloud}
                      onLoadFromCloud={handleLoadFromCloud}
                      onInstallApp={handleInstallApp}
                      isCloudSyncing={isCloudSyncing}
                      lastCloudSyncTime={lastCloudSyncTime}
                    />
                  );

                case 'diagnostic':
                case 'ai_consultant':
                case '4':
                  return (
                    <AiDiagnosticConsultantTab
                      isSecCertified={contractor.isSecCertified}
                      currentUser={user}
                      onUpdateUserSession={setUser}
                      onAppendToWorkReport={(summaryText) => {
                        setWorkReport((prev) => ({
                          ...prev,
                          generatedAiReport: prev.generatedAiReport
                            ? `${prev.generatedAiReport}\n\n${summaryText}`
                            : summaryText,
                          briefNotes: prev.briefNotes
                            ? `${prev.briefNotes} | Diagnóstico IA SEC incorporado.`
                            : 'Diagnóstico técnico IA SEC incorporado.',
                        }));
                      }}
                      onNavigateToTab={(tab, targetNorm) => {
                        if (targetNorm && tab === 'norms') {
                          try {
                            localStorage.setItem('neovolt_target_ric_norm', targetNorm);
                          } catch {}
                        }
                        setActiveTab(tab);
                      }}
                    />
                  );

                case 'assembler':
                case 'board_assembler':
                case '5':
                  return (
                    <BoardAssemblerTab
                      rooms={rooms}
                      highAppliances={highAppliances}
                      feederLength={feederLength}
                      setFeederLength={setFeederLength}
                      isThreePhase={isThreePhase}
                      setIsThreePhase={setIsThreePhase}
                      feederWireSection={feederWireSection}
                      setFeederWireSection={setFeederWireSection}
                      onImportMaterialsToQuote={handleImportMaterialsToQuote}
                    />
                  );

                case 'singleline':
                case 'diagram':
                case '6':
                  return (
                    <SingleLineDiagramTab
                      rooms={rooms}
                      highAppliances={highAppliances}
                      feederLength={feederLength}
                      setFeederLength={setFeederLength}
                      isThreePhase={isThreePhase}
                      feederWireSection={feederWireSection}
                      setFeederWireSection={setFeederWireSection}
                      customProtectionSpecs={customProtectionSpecs}
                      onUpdateProtectionSpecs={(updated) => {
                        setCustomProtectionSpecs(updated);
                        handleSyncProtectionsToBudget(updated);
                      }}
                      onSyncToBudget={(specs) => {
                        handleSyncProtectionsToBudget(specs || customProtectionSpecs);
                      }}
                      contractor={contractor}
                      customer={customer}
                    />
                  );

                case 'physical':
                case 'simulator':
                case 'board':
                case '7':
                  return <ProfessionalBoardGeneratorTab />;

                case 'quote':
                case '8':
                  return (
                    <CotizadorTab
                      items={budgetItems}
                      setItems={setBudgetItems}
                      customer={customer}
                      setCustomer={setCustomer}
                      contractor={contractor}
                      setContractor={setContractor}
                      rooms={rooms}
                      highAppliances={highAppliances}
                    />
                  );

                case 'report':
                case '9':
                  return (
                    <WorkReportTab
                      reportData={workReport}
                      setReportData={setWorkReport}
                      customer={customer}
                      contractor={contractor}
                      rooms={rooms}
                      highAppliances={highAppliances}
                      feederLength={feederLength}
                      isThreePhase={isThreePhase}
                      feederWireSection={feederWireSection}
                      customGeminiApiKey={user.customGeminiApiKey}
                    />
                  );

                case 'catalog':
                case '10':
                  return (
                    <MaterialsCatalogTab
                      onAddItemToBudget={handleAddItemToBudget}
                      onNavigateToQuote={() => setActiveTab('quote')}
                    />
                  );

                case 'tools':
                  return (
                    <ToolsModule
                      onNavigateToTab={setActiveTab}
                      rooms={rooms}
                      highAppliances={highAppliances}
                      onExportWiresToBudget={(items) => {
                        setBudgetItems(prev => [...prev, ...items]);
                        setActiveTab('quote');
                      }}
                    />
                  );

                case 'norms':
                case '11':
                  return <RicNormsTab />;

                case 'te1':
                case '12':
                  return (
                    <Te1DeclarationTab
                      user={user}
                      contractor={contractor}
                      rooms={rooms}
                      highAppliances={highAppliances}
                      feederLength={feederLength}
                      isThreePhase={isThreePhase}
                    />
                  );

                default:
                  return (
                    <DashboardModule
                      projects={projects}
                      clients={clients}
                      budgetHistory={budgetHistory}
                      onRevertBudgetHistory={handleRevertBudgetHistory}
                      onNavigateToTab={setActiveTab}
                      onSelectProjectForQuote={handleSelectProjectForQuote}
                      rooms={rooms}
                      highAppliances={highAppliances}
                      onUpdateProject={(updatedProj) => {
                        setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
                      }}
                    />
                  );
              }
            })()}
          </motion.div>
        </AnimatePresence>
      </main>



      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(session) => {
          setUser(session);
          setContractor((prev) => ({ ...prev, senderEmail: session.email }));
        }}
      />

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NEOVOLT &copy; {new Date().getFullYear()} • Ingeniería Eléctrica de Precisión</span>
          <span className="text-slate-400">Normativa Superintendencia de Electricidad y Combustibles (SEC Chile)</span>
        </div>
      </footer>
    </div>
  );
}