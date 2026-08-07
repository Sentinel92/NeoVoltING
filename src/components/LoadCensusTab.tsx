import React, { useState, useMemo } from 'react';
import { 
  RoomData, 
  HighAppliance, 
  RoomDevice, 
  BudgetItem, 
  ServiceTypeMode, 
  ReplacementItem, 
  MaintenanceCheckItem, 
  FaultDiagnosticData 
} from '../types';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Sparkles, 
  Home, 
  Flame, 
  Tv, 
  Check, 
  RefreshCw, 
  ShieldAlert, 
  Info,
  Sliders,
  Lightbulb,
  Plug,
  Layers,
  ChevronDown,
  ChevronUp,
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Send,
  FileText,
  DollarSign,
  Activity,
  AlertCircle,
  ArrowRight,
  Edit3,
  X,
  FileSpreadsheet,
  Moon,
  Sun,
  Snowflake,
  Thermometer
} from 'lucide-react';
import { PlanScannerModal } from './PlanScannerModal';

interface LoadCensusTabProps {
  rooms?: RoomData[];
  highAppliances?: HighAppliance[];
  setRooms?: React.Dispatch<React.SetStateAction<RoomData[]>>;
  setHighAppliances?: React.Dispatch<React.SetStateAction<HighAppliance[]>>;
  onTransferToQuote?: (items: BudgetItem[]) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function LoadCensusTab({
  rooms = [],
  highAppliances = [],
  setRooms,
  setHighAppliances,
  onTransferToQuote,
  onNavigateToTab,
}: LoadCensusTabProps) {
  // Service Type Mode State
  const [serviceMode, setServiceMode] = useState<ServiceTypeMode>('census');
  const [transferToast, setTransferToast] = useState<string | null>(null);

  // Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(rooms[0]?.id || null);

  // --- MODE 1: Censo State ---
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomLights, setNewRoomLights] = useState(2);
  const [newRoomSockets, setNewRoomSockets] = useState(3);

  const [addingDeviceToRoomId, setAddingDeviceToRoomId] = useState<string | null>(null);
  const [newDevName, setNewDevName] = useState('');
  const [newDevWatts, setNewDevWatts] = useState(150);
  const [newDevQty, setNewDevQty] = useState(1);

  const [showAddHighModal, setShowAddHighModal] = useState(false);
  const [newHighName, setNewHighName] = useState('');
  const [newHighWatts, setNewHighWatts] = useState(2500);
  const [newHighCategory, setNewHighCategory] = useState('Cocina');
  const [newHighSocketType, setNewHighSocketType] = useState<'10A' | '16A' | 'Conexión Directa'>('16A');
  const [newHighVoltage, setNewHighVoltage] = useState<220 | 380>(220);

  // --- MODE 2: Reemplazo / Cambio Artefactos State ---
  const [replacementItems, setReplacementItems] = useState<ReplacementItem[]>([
    {
      id: 'rep_1',
      name: 'Enchufe Doble 10A/16A Bticino Classia',
      category: 'Accesorios / Interruptores',
      location: 'Living / Comedor',
      quantity: 4,
      reason: 'Sin Tierra / Obsoleto',
      unitMaterialPrice: 3990,
      unitLaborPrice: 5000,
    },
    {
      id: 'rep_2',
      name: 'Interruptor Mod. 9/24 Combinación',
      category: 'Accesorios / Interruptores',
      location: 'Pasillo Principal',
      quantity: 2,
      reason: 'Quemado / Averiado',
      unitMaterialPrice: 4200,
      unitLaborPrice: 4500,
    },
    {
      id: 'rep_3',
      name: 'Foco Panel LED Embutido 18W Luz Cálida',
      category: 'Iluminación',
      location: 'Cocina & Logia',
      quantity: 3,
      reason: 'Renovación Estética',
      unitMaterialPrice: 6990,
      unitLaborPrice: 6000,
    },
    {
      id: 'rep_4',
      name: 'Disyuntor Termomagnético Bticino 1x16A 6kA',
      category: 'Protecciones / Tableros',
      location: 'Tablero TDA',
      quantity: 1,
      reason: 'Aumento Capacidad',
      unitMaterialPrice: 4990,
      unitLaborPrice: 8000,
    },
  ]);

  const [showAddRepModal, setShowAddRepModal] = useState(false);
  const [newRepName, setNewRepName] = useState('');
  const [newRepCat, setNewRepCat] = useState<ReplacementItem['category']>('Accesorios / Interruptores');
  const [newRepLocation, setNewRepLocation] = useState('Dormitorio Principal');
  const [newRepQty, setNewRepQty] = useState(1);
  const [newRepReason, setNewRepReason] = useState<ReplacementItem['reason']>('Quemado / Averiado');
  const [newRepMatPrice, setNewRepMatPrice] = useState(4500);
  const [newRepLaborPrice, setNewRepLaborPrice] = useState(5000);

  const replacementPresets = [
    { name: 'Enchufe Doble 10A/16A Bticino', category: 'Accesorios / Interruptores' as const, mat: 3990, labor: 5000 },
    { name: 'Interruptor Simple 10A 9/12', category: 'Accesorios / Interruptores' as const, mat: 2990, labor: 4000 },
    { name: 'Interruptor Doble / Combinación 9/24', category: 'Accesorios / Interruptores' as const, mat: 4500, labor: 5000 },
    { name: 'Foco Panel LED Embutido 18W', category: 'Iluminación' as const, mat: 6990, labor: 6000 },
    { name: 'Lámpara Colgante Decorative E27', category: 'Iluminación' as const, mat: 15900, labor: 12000 },
    { name: 'Disyuntor Termomagnético 1x16A 6kA', category: 'Protecciones / Tableros' as const, mat: 4990, labor: 8000 },
    { name: 'Protector Diferencial 2x25A 30mA Clase A', category: 'Protecciones / Tableros' as const, mat: 18990, labor: 12000 },
    { name: 'Tablero Embutido 8 Polos PVC', category: 'Protecciones / Tableros' as const, mat: 16900, labor: 35000 },
    { name: 'Ducha Eléctrica / Calentador 4500W', category: 'Artefactos' as const, mat: 29900, labor: 20000 },
    { name: 'Caja de Derivación Conduit Estanca IP65', category: 'Conductores / Canalizaciones' as const, mat: 3200, labor: 4000 },
  ];

  // --- MODE 3: Mantención State ---
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceCheckItem[]>([
    {
      id: 'm1',
      category: '1. Tablero Eléctrico Principal',
      checkPoint: 'Torque de bornes en disyuntores e IGA con torquímetro',
      status: 'observado',
      observation: 'Borne de fase en circuito 2 presentó ligera holgura. Se reajustó a 2.5 N·m.',
      estimatedFixCost: 15000,
    },
    {
      id: 'm2',
      category: '1. Tablero Eléctrico Principal',
      checkPoint: 'Limpieza de polvo, sulfatación y residuos en peines/barras',
      status: 'conforme',
      observation: 'Tablero limpio sin acumulación de residuos ni signos de arqueo.',
    },
    {
      id: 'm3',
      category: '2. Protecciones & RCD',
      checkPoint: 'Prueba de botón TEST y disparo de interruptor diferencial (30mA)',
      status: 'conforme',
      observation: 'Disparo inmediato verificado OK (<30ms).',
    },
    {
      id: 'm4',
      category: '2. Protecciones & RCD',
      checkPoint: 'Verificación de tensión L-N (~220V), L-PE (~220V) y N-PE (<2V)',
      status: 'conforme',
      observation: 'Tensión medida L-N: 224V. N-PE: 0.8V. Parámetros excelentes.',
    },
    {
      id: 'm5',
      category: '3. Canalizaciones & Cajas',
      checkPoint: 'Inspección de continuidad de tierra de protección (PE) en enchufes',
      status: 'critico',
      observation: 'Enchufes del dormitorio 2 carecen de conductor de tierra PE conectado.',
      estimatedFixCost: 45000,
    },
    {
      id: 'm6',
      category: '4. Sistema de Puesta a Tierra',
      checkPoint: 'Inspección de cámara de registro, barra Cooperweld y prensa de bronce',
      status: 'observado',
      observation: 'Prensa sulfatada. Se requiere limpieza y aplicación de pasta antioxidante.',
      estimatedFixCost: 20000,
    },
  ]);

  // --- MODE 4: Diagnóstico de Fallas State ---
  const [diagnosticsList, setDiagnosticsList] = useState<FaultDiagnosticData[]>([
    {
      id: 'diag_1',
      faultType: 'Fuga a Tierra (RCD Salta al Armar)',
      location: 'Cocina / Logia',
      circuitName: 'Circuito N°3 - Enchufes de Cocina',
      measuredVoltage: 221,
      measuredIsolation: 0.15,
      measuredLeakageCurrent: 42,
      rootCause: 'Fuga de corriente por condensación de vapor dentro de caja de paso tras el hervidor eléctrico.',
      solutionApplied: 'Se desarmó caja de derivación, secado de cables con pistola de aire, re-aislado de empalmes con cinta autosoldable 3M y reemplazo de empaquetadura estanca IP65.',
      requiredParts: [
        { name: 'Caja Estanca IP65 Bticino', quantity: 1, unitPrice: 3800 },
        { name: 'Cinta Autosoldable Rubber Tape 3M', quantity: 1, unitPrice: 8900 },
      ],
      laborCost: 35000,
      status: 'Reparado & Probado',
    },
  ]);

  const [showAddDiagModal, setShowAddDiagModal] = useState(false);
  const [diagFaultType, setDiagFaultType] = useState('Fuga a Tierra (RCD Salta)');
  const [diagLocation, setDiagLocation] = useState('Estar / Comedor');
  const [diagCircuit, setDiagCircuit] = useState('Circuito 2 Enchufes');
  const [diagVoltage, setDiagVoltage] = useState(220);
  const [diagIsolation, setDiagIsolation] = useState(50);
  const [diagLeakage, setDiagLeakage] = useState(0);
  const [diagRootCause, setDiagRootCause] = useState('');
  const [diagSolution, setDiagSolution] = useState('');
  const [diagLabor, setDiagLabor] = useState(30000);

  const faultPresets = [
    'Fuga a Tierra (Diferencial Salta Repentinamente)',
    'Cortocircuito - Disyuntor Automático Salta al Instante',
    'Sobrecarga de Circuito - Automático Salta tras varios minutos',
    'Falta de Tensión / Enchufes o Luces Sin Voltaje',
    'Falso Contacto / Chispeo y Calentamiento en Cajas',
    'Caída de Tensión / Parpadeo de Iluminación',
    'Falta de Conductor de Protección Tierra (PE)',
  ];

  // Calculations Mode 1
  const totalLightPoints = rooms.reduce((sum, r) => sum + (r.lightPoints || 0), 0);
  const totalSocketPoints = rooms.reduce((sum, r) => sum + (r.socketPoints || 0), 0);

  const roomDevicesPowerWatts = rooms.reduce((sum, r) => {
    const devWatts = (r.devices || []).reduce((dSum, dev) => dSum + (dev.powerWatts * dev.quantity), 0);
    const baseEstimatedWatts = (r.lightPoints * 100) + (r.socketPoints * 250);
    return sum + Math.max(devWatts, baseEstimatedWatts);
  }, 0);

  const highAppliancesPowerWatts = highAppliances.reduce((sum, h) => sum + (h.powerWatts || 0), 0);
  const totalInstalledWatts = roomDevicesPowerWatts + highAppliancesPowerWatts;
  const totalInstalledKW = (totalInstalledWatts / 1000).toFixed(2);
  const estimatedAmps220V = Math.round(totalInstalledWatts / 220);

  const getRecommendedIGA = (amps: number) => {
    if (amps <= 16) return { rating: '1x16A', wire: '2.5 mm²' };
    if (amps <= 25) return { rating: '1x25A', wire: '4.0 mm²' };
    if (amps <= 32) return { rating: '1x32A', wire: '6.0 mm²' };
    if (amps <= 40) return { rating: '1x40A', wire: '10.0 mm²' };
    if (amps <= 50) return { rating: '1x50A', wire: '10.0 mm²' };
    return { rating: '3x32A (Trifásico)', wire: '6.0 mm² x3' };
  };
  const recIGA = getRecommendedIGA(estimatedAmps220V);

  // --- MÓDULO RIC N°02: Demanda Máxima y Selector de Escenarios de Consumo ---
  const [contractedCapacityKW, setContractedCapacityKW] = useState<number>(5.5); // Capacidad del empalme existente (kW)
  const [simultaneityMode, setSimultaneityMode] = useState<
    'ric02_residential' | 'min_base' | 'peak_max' | 'summer_ac' | 'winter_heat' | 'ric02_commercial' | 'custom'
  >('ric02_residential');
  const [customFs, setCustomFs] = useState<number>(0.70);

  const ric02Demand = useMemo(() => {
    const totalLightWatts = rooms.reduce((s, r) => s + (r.lightPoints || 0) * 100, 0);
    const totalSocketWatts = rooms.reduce((s, r) => s + (r.socketPoints || 0) * 250, 0);
    const roomDevWatts = rooms.reduce((s, r) => s + (r.devices || []).reduce((ds, d) => ds + d.powerWatts * d.quantity, 0), 0);
    const highWatts = highAppliances.reduce((s, h) => s + (h.powerWatts || 0), 0);
    const totalInstalledW = totalLightWatts + totalSocketWatts + roomDevWatts + highWatts;
    const totalInstalledKWNum = Math.round((totalInstalledW / 1000) * 100) / 100;

    let demandedWatts = 0;
    if (simultaneityMode === 'ric02_residential') {
      // Normativa RIC N°02 Tabla Alumbrado y Enchufes Residenciales:
      // Alumbrado: Primeros 3.000 W al 100% (1.0), exceso al 35% (0.35)
      const lightDemanded = Math.min(totalLightWatts, 3000) + Math.max(0, totalLightWatts - 3000) * 0.35;
      // Enchufes: Primeros 3.000 W al 100% (1.0), exceso al 50% (0.50)
      const socketDemanded = Math.min(totalSocketWatts, 3000) + Math.max(0, totalSocketWatts - 3000) * 0.50;
      // Gran Consumo: Primeras 2 cargas al 100%, resto al 75%
      const sortedHigh = [...highAppliances].sort((a, b) => (b.powerWatts || 0) - (a.powerWatts || 0));
      const highDemanded = sortedHigh.reduce((acc, h, idx) => acc + (h.powerWatts || 0) * (idx < 2 ? 1.0 : 0.75), 0);
      // Dispositivos extra en recintos
      const devDemanded = roomDevWatts * 0.60;

      demandedWatts = lightDemanded + socketDemanded + highDemanded + devDemanded;
    } else if (simultaneityMode === 'min_base') {
      // Escenario Consumo Mínimo / Standby Nocturno
      demandedWatts = totalLightWatts * 0.10 + totalSocketWatts * 0.15 + highWatts * 0.20 + roomDevWatts * 0.15;
    } else if (simultaneityMode === 'peak_max') {
      // Escenario Consumo Pico / Carga Máxima Simultánea
      demandedWatts = totalLightWatts * 0.90 + totalSocketWatts * 0.85 + highWatts * 0.95 + roomDevWatts * 0.85;
    } else if (simultaneityMode === 'summer_ac') {
      // Escenario Verano (Climatización Aire Acondicionado & Piscina)
      demandedWatts = totalLightWatts * 0.45 + totalSocketWatts * 0.60 + highWatts * 0.95 + roomDevWatts * 0.60;
    } else if (simultaneityMode === 'winter_heat') {
      // Escenario Invierno (Calefacción Eléctrica & Agua Caliente)
      demandedWatts = totalLightWatts * 0.80 + totalSocketWatts * 0.75 + highWatts * 0.95 + roomDevWatts * 0.70;
    } else if (simultaneityMode === 'ric02_commercial') {
      // RIC N°02 Comercial: 100% primeros 10.000 W, 70% exceso
      demandedWatts = Math.min(totalInstalledW, 10000) + Math.max(0, totalInstalledW - 10000) * 0.70;
    } else {
      demandedWatts = totalInstalledW * customFs;
    }

    const maxDemandKW = Math.max(0.1, Math.round((demandedWatts / 1000) * 100) / 100);
    const effectiveFs = totalInstalledKWNum > 0 ? Math.round((maxDemandKW / totalInstalledKWNum) * 100) / 100 : 1.0;
    const capacityRatioPercent = Math.round((maxDemandKW / (contractedCapacityKW || 5.5)) * 100);
    const isOverCapacity = maxDemandKW > (contractedCapacityKW || 5.5);
    const differenceKW = Math.abs(Math.round((maxDemandKW - (contractedCapacityKW || 5.5)) * 100) / 100);
    const estimatedAmps220V = Math.round((maxDemandKW * 1000) / 220);

    return {
      totalInstalledKWNum,
      maxDemandKW,
      effectiveFs,
      capacityRatioPercent,
      isOverCapacity,
      differenceKW,
      estimatedAmps220V,
    };
  }, [rooms, highAppliances, contractedCapacityKW, simultaneityMode, customFs]);

  // Handlers Mode 1: Censo
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !setRooms) return;
    const newRoom: RoomData = {
      id: `room_${Date.now()}`,
      name: newRoomName.trim(),
      lightPoints: Math.max(0, newRoomLights),
      socketPoints: Math.max(0, newRoomSockets),
      devices: [],
    };
    setRooms((prev) => [...prev, newRoom]);
    setExpandedRoomId(newRoom.id);
    setNewRoomName('');
    setNewRoomLights(2);
    setNewRoomSockets(3);
    setShowAddRoomModal(false);
  };

  const handleDeleteRoom = (id: string) => {
    if (!setRooms) return;
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRoomPoints = (roomId: string, field: 'lightPoints' | 'socketPoints', delta: number) => {
    if (!setRooms) return;
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const updatedVal = Math.max(0, (r[field] || 0) + delta);
          return { ...r, [field]: updatedVal };
        }
        return r;
      })
    );
  };

  const handleAddDeviceToRoom = (roomId: string) => {
    if (!newDevName.trim() || !setRooms) return;
    const newDev: RoomDevice = {
      id: `dev_${Date.now()}`,
      name: newDevName.trim(),
      powerWatts: Math.max(1, newDevWatts),
      quantity: Math.max(1, newDevQty),
    };

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          return { ...r, devices: [...(r.devices || []), newDev] };
        }
        return r;
      })
    );

    setNewDevName('');
    setNewDevWatts(150);
    setNewDevQty(1);
    setAddingDeviceToRoomId(null);
  };

  const handleDeleteDevice = (roomId: string, devIndex: number) => {
    if (!setRooms) return;
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const updatedDevs = [...(r.devices || [])];
          updatedDevs.splice(devIndex, 1);
          return { ...r, devices: updatedDevs };
        }
        return r;
      })
    );
  };

  const handleAddHighAppliance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighName.trim() || !setHighAppliances) return;
    const newHigh: HighAppliance = {
      id: `high_${Date.now()}`,
      name: newHighName.trim(),
      powerWatts: Math.max(100, newHighWatts),
      category: newHighCategory,
      socketType: newHighSocketType,
      voltage: newHighVoltage,
    };
    setHighAppliances((prev) => [...prev, newHigh]);
    setNewHighName('');
    setNewHighWatts(2500);
    setShowAddHighModal(false);
  };

  const handleDeleteHighAppliance = (id: string) => {
    if (!setHighAppliances) return;
    setHighAppliances((prev) => prev.filter((h) => h.id !== id));
  };

  const handleLoadStandardPreset = () => {
    if (!setRooms || !setHighAppliances) return;
    const defaultRooms: RoomData[] = [
      {
        id: 'r1',
        name: 'Dormitorio Principal',
        lightPoints: 2,
        socketPoints: 4,
        devices: [
          { name: 'Smart TV 55"', powerWatts: 120, quantity: 1 },
          { name: 'Notebook / Laptop', powerWatts: 85, quantity: 1 },
        ],
      },
      {
        id: 'r2',
        name: 'Living / Comedor',
        lightPoints: 4,
        socketPoints: 6,
        devices: [
          { name: 'Consola Videojuegos (PS5)', powerWatts: 210, quantity: 1 },
          { name: 'PC Gaming / Escritorio', powerWatts: 450, quantity: 1 },
        ],
      },
      {
        id: 'r3',
        name: 'Cocina & Logia',
        lightPoints: 3,
        socketPoints: 5,
        devices: [
          { name: 'Refrigerador No-Frost A+', powerWatts: 250, quantity: 1 },
          { name: 'Microondas 25L', powerWatts: 1200, quantity: 1 },
          { name: 'Hervidor Eléctrico 1.7L', powerWatts: 1800, quantity: 1 },
        ],
      },
      {
        id: 'r4',
        name: 'Baño Principal',
        lightPoints: 2,
        socketPoints: 2,
        devices: [{ name: 'Secador de Pelo', powerWatts: 1600, quantity: 1 }],
      },
    ];

    const defaultHigh: HighAppliance[] = [
      { id: 'h1', name: 'Horno Eléctrico Empotrado', powerWatts: 2800, category: 'Cocina', socketType: '16A', voltage: 220 },
      { id: 'h2', name: 'Encimera Inducción 4 Platos', powerWatts: 7200, category: 'Cocina', socketType: 'Conexión Directa', voltage: 220 },
    ];

    setRooms(defaultRooms);
    setHighAppliances(defaultHigh);
  };

  const handleExportCensusToQuote = () => {
    if (!onTransferToQuote) return;
    const items: BudgetItem[] = [];

    if (totalLightPoints > 0) {
      items.push({
        id: `census_lights_${Date.now()}`,
        name: `Instalación/Puntos de Alumbrado (${totalLightPoints} pts en ${rooms.length} recintos)`,
        quantity: totalLightPoints,
        price: 18500,
        category: 'ILUMINACIÓN',
        unit: 'pto',
        skuCode: 'PTO-ALUM-RIC',
      });
    }

    if (totalSocketPoints > 0) {
      items.push({
        id: `census_sockets_${Date.now()}`,
        name: `Puntos de Enchufe Doble 10A/16A (${totalSocketPoints} pts en ${rooms.length} recintos)`,
        quantity: totalSocketPoints,
        price: 22500,
        category: 'ENCHUFES',
        unit: 'pto',
        skuCode: 'PTO-ENCH-RIC',
      });
    }

    highAppliances.forEach((h) => {
      items.push({
        id: `census_high_${h.id}`,
        name: `Circuito Dedicado para ${h.name} (${h.powerWatts}W - ${h.socketType})`,
        quantity: 1,
        price: 45000,
        category: 'CIRCUITOS ESPECIALES',
        unit: 'gl',
        skuCode: 'CIRC-DED-RIC',
      });
    });

    onTransferToQuote(items);
    triggerToast('¡Censo exportado exitosamente al Cotizador!');
  };

  // Handlers Mode 2: Reemplazos
  const handleAddReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepName.trim()) return;
    const newItem: ReplacementItem = {
      id: `rep_${Date.now()}`,
      name: newRepName.trim(),
      category: newRepCat,
      location: newRepLocation.trim(),
      quantity: Math.max(1, newRepQty),
      reason: newRepReason,
      unitMaterialPrice: Math.max(0, newRepMatPrice),
      unitLaborPrice: Math.max(0, newRepLaborPrice),
    };
    setReplacementItems((prev) => [...prev, newItem]);
    setNewRepName('');
    setShowAddRepModal(false);
  };

  const handleDeleteReplacement = (id: string) => {
    setReplacementItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleApplyPresetReplacement = (preset: typeof replacementPresets[0]) => {
    const newItem: ReplacementItem = {
      id: `rep_${Date.now()}`,
      name: preset.name,
      category: preset.category,
      location: 'Recinto General',
      quantity: 1,
      reason: 'Quemado / Averiado',
      unitMaterialPrice: preset.mat,
      unitLaborPrice: preset.labor,
    };
    setReplacementItems((prev) => [...prev, newItem]);
    triggerToast(`Añadido: ${preset.name}`);
  };

  const handleExportReplacementsToQuote = () => {
    if (!onTransferToQuote || replacementItems.length === 0) return;
    const budgetItems: BudgetItem[] = replacementItems.map((rep) => ({
      id: `quote_rep_${rep.id}`,
      name: `Reemplazo: ${rep.name} (${rep.location} - ${rep.reason})`,
      quantity: rep.quantity,
      price: rep.unitMaterialPrice + rep.unitLaborPrice,
      category: rep.category.toUpperCase(),
      unit: 'unid',
      skuCode: 'REEMP-ART-01',
    }));

    onTransferToQuote(budgetItems);
    triggerToast('¡Nómina de reemplazos exportada al Cotizador!');
  };

  // Handlers Mode 3: Mantención
  const handleToggleMaintenanceStatus = (id: string, status: MaintenanceCheckItem['status']) => {
    setMaintenanceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleUpdateMaintenanceObs = (id: string, obs: string) => {
    setMaintenanceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, observation: obs } : item))
    );
  };

  const handleExportMaintenanceToQuote = () => {
    if (!onTransferToQuote) return;
    const issueItems = maintenanceItems.filter((m) => m.status === 'observado' || m.status === 'critico');
    if (issueItems.length === 0) {
      triggerToast('No hay observaciones críticas para cotizar.');
      return;
    }

    const budgetItems: BudgetItem[] = issueItems.map((item) => ({
      id: `maint_fix_${item.id}`,
      name: `Servicio de Mantención/Corrección: ${item.checkPoint} (${item.category})`,
      quantity: 1,
      price: item.estimatedFixCost || 25000,
      category: 'MANTENCIÓN',
      unit: 'gl',
      skuCode: 'MANT-CORR-SEC',
    }));

    onTransferToQuote(budgetItems);
    triggerToast('¡Observaciones de mantención exportadas al Cotizador!');
  };

  // Handlers Mode 4: Diagnóstico
  const handleDeleteDiagnostic = (id: string) => {
    setDiagnosticsList((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagRootCause.trim() || !diagSolution.trim()) return;
    const newDiag: FaultDiagnosticData = {
      id: `diag_${Date.now()}`,
      faultType: diagFaultType,
      location: diagLocation,
      circuitName: diagCircuit,
      measuredVoltage: diagVoltage,
      measuredIsolation: diagIsolation,
      measuredLeakageCurrent: diagLeakage,
      rootCause: diagRootCause,
      solutionApplied: diagSolution,
      requiredParts: [],
      laborCost: diagLabor,
      status: 'Reparado & Probado',
    };
    setDiagnosticsList((prev) => [...prev, newDiag]);
    setDiagRootCause('');
    setDiagSolution('');
    setShowAddDiagModal(false);
  };

  const handleExportDiagnosticToQuote = (diag: FaultDiagnosticData) => {
    if (!onTransferToQuote) return;
    const items: BudgetItem[] = [
      {
        id: `diag_labor_${diag.id}`,
        name: `Diagnóstico y Reparación de Falla: ${diag.faultType} (${diag.location})`,
        quantity: 1,
        price: diag.laborCost,
        category: 'DIAGNÓSTICO Y REPARACIÓN',
        unit: 'gl',
        skuCode: 'DIAG-FALLA-SEC',
      },
    ];

    diag.requiredParts.forEach((part, pIdx) => {
      items.push({
        id: `diag_part_${diag.id}_${pIdx}`,
        name: `Repuesto: ${part.name}`,
        quantity: part.quantity,
        price: part.unitPrice,
        category: 'MATERIALES REPARACIÓN',
        unit: 'unid',
        skuCode: 'REP-DIAG-01',
      });
    });

    onTransferToQuote(items);
    triggerToast('¡Diagnóstico y reparación exportados al Cotizador!');
  };

  const triggerToast = (msg: string) => {
    setTransferToast(msg);
    setTimeout(() => setTransferToast(null), 3500);
  };

  const totalRepMaterials = replacementItems.reduce((s, i) => s + (i.unitMaterialPrice * i.quantity), 0);
  const totalRepLabor = replacementItems.reduce((s, i) => s + (i.unitLaborPrice * i.quantity), 0);

  const maintConformeCount = maintenanceItems.filter((i) => i.status === 'conforme').length;
  const maintObservadoCount = maintenanceItems.filter((i) => i.status === 'observado').length;
  const maintCriticoCount = maintenanceItems.filter((i) => i.status === 'critico').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {transferToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span>{transferToast}</span>
        </div>
      )}

      {/* Main Header Card with Service Mode Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Levantamiento & Registro Técnico de Terreno • Norma SEC Chile</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Registro de Servicio Eléctrico
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Selecciona el tipo de trabajo a desarrollar. Puedes registrar una instalación desde cero, cambios/reemplazos de artefactos, mantención preventiva o detección de fallas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {serviceMode === 'census' && (
              <button
                onClick={() => setIsScannerOpen(true)}
                className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-fuchsia-950/40 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Escanear Plano IA</span>
              </button>
            )}
            <button
              onClick={handleLoadStandardPreset}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Cargar Ejemplo</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive Service Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Mode 1: Censo Completo */}
          <button
            onClick={() => setServiceMode('census')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              serviceMode === 'census'
                ? 'bg-fuchsia-950/50 border-fuchsia-500 shadow-lg shadow-fuchsia-950/40'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Home className={`w-4 h-4 ${serviceMode === 'census' ? 'text-fuchsia-400' : 'text-slate-400'}`} />
                <span className="text-[10px] bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/60 px-1.5 py-0.5 rounded font-bold">
                  Obra / TE1
                </span>
              </div>
              <div className="text-xs font-bold text-white">Instalación Nueva / Censo</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                Levantamiento completo por recintos, puntos de alumbrado, enchufes y gran consumo.
              </div>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-fuchsia-400 flex items-center gap-1">
              <span>{rooms.length} Recintos registrados</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* Mode 2: Reemplazo Artefactos */}
          <button
            onClick={() => setServiceMode('replacement')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              serviceMode === 'replacement'
                ? 'bg-amber-950/50 border-amber-500 shadow-lg shadow-amber-950/40'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Plug className={`w-4 h-4 ${serviceMode === 'replacement' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded font-bold">
                  Accesorios
                </span>
              </div>
              <div className="text-xs font-bold text-white">Cambio & Reemplazo</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                Cambio puntual de lámparas, enchufes, interruptores, automáticos o tableros.
              </div>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-amber-400 flex items-center gap-1">
              <span>{replacementItems.length} Elementos a cambiar</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* Mode 3: Mantención */}
          <button
            onClick={() => setServiceMode('maintenance')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              serviceMode === 'maintenance'
                ? 'bg-cyan-950/50 border-cyan-500 shadow-lg shadow-cyan-950/40'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Wrench className={`w-4 h-4 ${serviceMode === 'maintenance' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded font-bold">
                  Inspección
                </span>
              </div>
              <div className="text-xs font-bold text-white">Mantención Eléctrica</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                Protocolo de inspección: torque bornes, prueba RCD, tensión y puesta a tierra.
              </div>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-cyan-400 flex items-center gap-1">
              <span>{maintConformeCount}/{maintenanceItems.length} Puntos Conformes</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* Mode 4: Diagnóstico de Fallas */}
          <button
            onClick={() => setServiceMode('diagnostic')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              serviceMode === 'diagnostic'
                ? 'bg-rose-950/50 border-rose-500 shadow-lg shadow-rose-950/40'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Search className={`w-4 h-4 ${serviceMode === 'diagnostic' ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800/60 px-1.5 py-0.5 rounded font-bold">
                  Averías
                </span>
              </div>
              <div className="text-xs font-bold text-white">Detección de Fallas</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                Búsqueda de fugas a tierra, cortocircuitos, sobrecargas y falso contacto.
              </div>
            </div>
            <div className="mt-3 text-[10px] font-semibold text-rose-400 flex items-center gap-1">
              <span>{diagnosticsList.length} Caso(s) diagnosticado(s)</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1 VIEW: CENSO COMPLETO & INSTALACIÓN NUEVA */}
      {/* ========================================================================= */}
      {serviceMode === 'census' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Home className="w-3 h-3 text-fuchsia-400" />
                <span>Recintos</span>
              </div>
              <div className="text-lg font-bold text-white mt-0.5">{rooms.length}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Alumbrado</span>
              </div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">{totalLightPoints} <span className="text-xs text-slate-400 font-normal">pts</span></div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Plug className="w-3 h-3 text-cyan-400" />
                <span>Enchufes</span>
              </div>
              <div className="text-lg font-bold text-cyan-300 mt-0.5">{totalSocketPoints} <span className="text-xs text-slate-400 font-normal">pts</span></div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Gran Consumo</span>
              </div>
              <div className="text-lg font-bold text-rose-300 mt-0.5">{highAppliances.length} <span className="text-xs text-slate-400 font-normal">art</span></div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Potencia Total</span>
              </div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5">{totalInstalledKW} <span className="text-xs text-slate-400 font-normal">kW</span></div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3 text-purple-400" />
                <span>IGA Sugerido</span>
              </div>
              <div className="text-lg font-bold text-purple-300 mt-0.5">{recIGA.rating}</div>
            </div>
          </div>

          {/* MÓDULO NORMATIVA RIC N°02: CÁLCULO DE DEMANDA MÁXIMA Y HERRAMIENTA SELECTOR DE ESCENARIOS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-fuchsia-400" />
                  <span>Módulo SEC RIC N°02 • Simulación de Cargas & Demanda Máxima</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Herramienta de Selección de Escenario de Consumo en Tiempo Real
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Empalme Contratado:</span>
                <select
                  value={contractedCapacityKW}
                  onChange={(e) => setContractedCapacityKW(parseFloat(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-amber-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-fuchsia-500 font-mono"
                >
                  <option value={3.3}>3.30 kW (Monofásico 15A)</option>
                  <option value={5.5}>5.50 kW (Monofásico 25A - Estándar)</option>
                  <option value={8.8}>8.80 kW (Monofásico 40A)</option>
                  <option value={11.0}>11.00 kW (Monofásico 50A)</option>
                  <option value={15.0}>15.00 kW (Trifásico 25A)</option>
                  <option value={27.0}>27.00 kW (Trifásico 40A)</option>
                </select>
              </div>
            </div>

            {/* Visual Scenario Selector Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Seleccionar Escenario de Uso Operativo:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setSimultaneityMode('ric02_residential')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    simultaneityMode === 'ric02_residential'
                      ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white shadow-lg ring-1 ring-fuchsia-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Activity className="w-4 h-4 text-fuchsia-400" />
                    <span className="text-[10px] font-mono font-bold text-fuchsia-300">RIC N°02</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">Normativo SEC</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Estándar reglamentario</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSimultaneityMode('min_base')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    simultaneityMode === 'min_base'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-mono font-bold text-indigo-300">Min</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">Consumo Mínimo</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Reposo y standby nocturno</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSimultaneityMode('peak_max')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    simultaneityMode === 'peak_max'
                      ? 'bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-mono font-bold text-amber-300">Pico</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">Consumo Pico</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Demanda máxima total</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSimultaneityMode('summer_ac')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    simultaneityMode === 'summer_ac'
                      ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-lg ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sun className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-mono font-bold text-cyan-300">Verano</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">Consumo Verano</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Climatización AC + Piscina</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSimultaneityMode('winter_heat')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    simultaneityMode === 'winter_heat'
                      ? 'bg-sky-600/20 border-sky-500 text-white shadow-lg ring-1 ring-sky-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Snowflake className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-mono font-bold text-sky-300">Invierno</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">Consumo Invierno</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Calefacción + Termoeléctrico</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSimultaneityMode('custom')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    simultaneityMode === 'custom'
                      ? 'bg-teal-600/20 border-teal-500 text-white shadow-lg ring-1 ring-teal-500/50'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    <span className="text-[10px] font-mono font-bold text-teal-300">Ajuste</span>
                  </div>
                  <div className="text-xs font-bold text-slate-200">Factor Libre</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Ajuste manual de Fs</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Controls Column */}
              <div className="md:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Capacidad Empalme Existente (kW):
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={contractedCapacityKW}
                      onChange={(e) => setContractedCapacityKW(parseFloat(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-fuchsia-500 font-mono"
                    >
                      <option value={3.3}>3.30 kW (Monofásico S-6 / 15A)</option>
                      <option value={5.5}>5.50 kW (Monofásico S-9 / 25A - Estándar)</option>
                      <option value={8.8}>8.80 kW (Monofásico S-15 / 40A)</option>
                      <option value={11.0}>11.00 kW (Monofásico S-20 / 50A)</option>
                      <option value={15.0}>15.00 kW (Trifásico T-20 / 25A)</option>
                      <option value={27.0}>27.00 kW (Trifásico T-30 / 40A)</option>
                    </select>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={contractedCapacityKW}
                      onChange={(e) => setContractedCapacityKW(parseFloat(e.target.value) || 1)}
                      className="w-20 bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold rounded-lg px-2 py-2 text-center"
                      placeholder="kW"
                    />
                  </div>
                </div>

                {simultaneityMode === 'custom' && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-slate-300 font-semibold">
                      <span>Factor de Simultaneidad (Fs):</span>
                      <span className="font-mono text-fuchsia-400 font-bold">{customFs.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.05"
                      value={customFs}
                      onChange={(e) => setCustomFs(parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-500 cursor-pointer"
                    />
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Potencia Conectada Total:</span>
                    <strong className="text-white font-mono">{ric02Demand.totalInstalledKWNum} kW</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Factor Aplicado (Fs):</span>
                    <strong className="text-fuchsia-300 font-mono">{ric02Demand.effectiveFs}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Demanda Máxima Calculada:</span>
                    <strong className="text-amber-300 font-mono font-bold">{ric02Demand.maxDemandKW} kW</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Corriente Máxima a 220V:</span>
                    <strong className="text-cyan-300 font-mono font-bold">~{ric02Demand.estimatedAmps220V} A</strong>
                  </div>
                </div>
              </div>

              {/* Status Comparison & Meter Column */}
              <div className="md:col-span-7 flex flex-col justify-between bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">
                      Uso de Capacidad del Empalme ({contractedCapacityKW} kW)
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        ric02Demand.isOverCapacity
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {ric02Demand.capacityRatioPercent}% de Capacidad
                    </span>
                  </div>

                  {/* Meter Bar */}
                  <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ric02Demand.isOverCapacity ? 'bg-gradient-to-r from-amber-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${Math.min(100, ric02Demand.capacityRatioPercent)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Conclusion Card */}
                <div
                  className={`p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    ric02Demand.isOverCapacity
                      ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                      : 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase">
                      {ric02Demand.isOverCapacity ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-rose-300">CAPACIDAD DE EMPALME INSUFICIENTE</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">EMPALME SUFICIENTE PARA DEMANDA MÁXIMA</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-bold">
                      {ric02Demand.maxDemandKW} kW / {contractedCapacityKW} kW
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed">
                    {ric02Demand.isOverCapacity ? (
                      <>
                        La demanda máxima calculada con simultaneidad RIC N°02 (<strong className="text-white">{ric02Demand.maxDemandKW} kW</strong>) supera la capacidad del empalme actual ({contractedCapacityKW} kW) en{' '}
                        <strong className="text-rose-300 font-mono">{ric02Demand.differenceKW} kW</strong>. Se requiere solicitar aumento de capacidad a la empresa distribuidora (Anexo TE1 SEC).
                      </>
                    ) : (
                      <>
                        La demanda máxima calculada con simultaneidad RIC N°02 (<strong className="text-white">{ric02Demand.maxDemandKW} kW</strong>) está plenamente cubierta por el empalme existente ({contractedCapacityKW} kW) con una reserva de{' '}
                        <strong className="text-emerald-300 font-mono">{ric02Demand.differenceKW} kW</strong> libres.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Layers className="w-4 h-4 text-fuchsia-400" />
                  <span>Recintos y Distribución de Cargas</span>
                  <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full border border-slate-700">
                    {rooms.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCensusToQuote}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Cotizar Censo</span>
                  </button>
                  <button
                    onClick={() => setShowAddRoomModal(true)}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir Recinto</span>
                  </button>
                </div>
              </div>

              {/* Rooms List */}
              {rooms.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Home className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-slate-300 font-semibold text-sm">No hay recintos registrados</div>
                  <button
                    onClick={() => setShowAddRoomModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-fuchsia-400 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Primer Recinto</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => {
                    const isExpanded = expandedRoomId === room.id;
                    const devWatts = (room.devices || []).reduce((s, d) => s + d.powerWatts * d.quantity, 0);
                    const estimatedWatts = Math.max(devWatts, (room.lightPoints * 100) + (room.socketPoints * 250));

                    return (
                      <div
                        key={room.id}
                        className={`bg-slate-900/80 border rounded-2xl transition-all overflow-hidden ${
                          isExpanded ? 'border-fuchsia-500/50 shadow-lg shadow-fuchsia-950/20' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="p-4 flex items-center justify-between gap-3 bg-slate-900/90">
                          <div
                            onClick={() => setExpandedRoomId(isExpanded ? null : room.id)}
                            className="flex-1 flex items-center gap-3 cursor-pointer select-none"
                          >
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-fuchsia-400 font-bold shrink-0">
                              <Home className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white">{room.name}</h3>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3 text-amber-400" /> {room.lightPoints} Luces
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Plug className="w-3 h-3 text-cyan-400" /> {room.socketPoints} Enchufes
                                </span>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">~{estimatedWatts} W</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpandedRoomId(isExpanded ? null : room.id)}
                              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-all"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-amber-400" />
                                  <span className="text-xs font-semibold text-slate-200">Alumbrado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateRoomPoints(room.id, 'lightPoints', -1)}
                                    className="w-7 h-7 bg-slate-800 text-white rounded-lg font-bold border border-slate-700"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-bold text-amber-300 w-6 text-center">{room.lightPoints}</span>
                                  <button
                                    onClick={() => handleUpdateRoomPoints(room.id, 'lightPoints', 1)}
                                    className="w-7 h-7 bg-slate-800 text-white rounded-lg font-bold border border-slate-700"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Plug className="w-4 h-4 text-cyan-400" />
                                  <span className="text-xs font-semibold text-slate-200">Enchufes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateRoomPoints(room.id, 'socketPoints', -1)}
                                    className="w-7 h-7 bg-slate-800 text-white rounded-lg font-bold border border-slate-700"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-bold text-cyan-300 w-6 text-center">{room.socketPoints}</span>
                                  <button
                                    onClick={() => handleUpdateRoomPoints(room.id, 'socketPoints', 1)}
                                    className="w-7 h-7 bg-slate-800 text-white rounded-lg font-bold border border-slate-700"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                  <Tv className="w-3.5 h-3.5 text-fuchsia-400" />
                                  <span>Artefactos en {room.name} ({room.devices?.length || 0})</span>
                                </div>
                                <button
                                  onClick={() => setAddingDeviceToRoomId(addingDeviceToRoomId === room.id ? null : room.id)}
                                  className="text-[11px] font-semibold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Añadir Artefacto</span>
                                </button>
                              </div>

                              {addingDeviceToRoomId === room.id && (
                                <div className="bg-slate-900 border border-fuchsia-500/30 p-3 rounded-xl space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Nombre artefacto (ej: Smart TV)"
                                      value={newDevName}
                                      onChange={(e) => setNewDevName(e.target.value)}
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                    />
                                    <input
                                      type="number"
                                      placeholder="Potencia (Watts)"
                                      value={newDevWatts}
                                      onChange={(e) => setNewDevWatts(Number(e.target.value))}
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                    />
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        placeholder="Cant."
                                        value={newDevQty}
                                        onChange={(e) => setNewDevQty(Number(e.target.value))}
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white w-16"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAddDeviceToRoom(room.id)}
                                        className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs py-1.5 rounded-lg"
                                      >
                                        Guardar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {(room.devices || []).length > 0 && (
                                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
                                  {(room.devices || []).map((dev, devIdx) => (
                                    <div key={devIdx} className="p-2.5 flex items-center justify-between text-xs">
                                      <span className="font-medium text-slate-200">{dev.quantity}x {dev.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-emerald-400 font-bold">{dev.powerWatts * dev.quantity} W</span>
                                        <button
                                          onClick={() => handleDeleteDevice(room.id, devIdx)}
                                          className="text-slate-500 hover:text-rose-400"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: High Appliances */}
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>Artefactos Gran Consumo</span>
                  </div>
                  <button
                    onClick={() => setShowAddHighModal(true)}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>

                {highAppliances.length === 0 ? (
                  <div className="text-slate-500 text-xs text-center py-4">
                    Sin cargas especiales de gran consumo registered.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {highAppliances.map((high) => (
                      <div key={high.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{high.name}</div>
                          <div className="text-[11px] text-slate-400">{high.socketType} • {high.voltage}V</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-400">{high.powerWatts} W</span>
                          <button onClick={() => handleDeleteHighAppliance(high.id)} className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2 VIEW: REEMPLAZO Y CAMBIO DE ARTEFACTOS */}
      {/* ========================================================================= */}
      {serviceMode === 'replacement' && (
        <div className="space-y-6">
          {/* Quick Stats & Action Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold">Costo Total Materiales</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">${totalRepMaterials.toLocaleString('es-CL')}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold">Costo Mano de Obra</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">${totalRepLabor.toLocaleString('es-CL')}</div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-semibold">Presupuesto Estimado</div>
                <div className="text-2xl font-bold text-white mt-1">${(totalRepMaterials + totalRepLabor).toLocaleString('es-CL')}</div>
              </div>
              <button
                onClick={handleExportReplacementsToQuote}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Exportar a Cotizador</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Añadir Rápido desde Catálogo de Reemplazos habituales:</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {replacementPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPresetReplacement(preset)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>{preset.name} (${(preset.mat + preset.labor).toLocaleString('es-CL')})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Replacement List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plug className="w-4 h-4 text-amber-400" />
                <span>Nómina de Elementos a Cambiar o Reemplazar</span>
              </h3>
              <button
                onClick={() => setShowAddRepModal(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Reemplazo Personalizado</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Artefacto / Componente</th>
                    <th className="p-3">Categoría & Ubicación</th>
                    <th className="p-3">Motivo Reemplazo</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">Unit. Material</th>
                    <th className="p-3 text-right">Unit. Mano Obra</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {replacementItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-bold text-white">{item.name}</td>
                      <td className="p-3 text-slate-400">{item.category} • {item.location}</td>
                      <td className="p-3">
                        <span className="bg-amber-950 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded text-[10px] font-bold">
                          {item.reason}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-200">{item.quantity}</td>
                      <td className="p-3 text-right text-amber-300">${item.unitMaterialPrice.toLocaleString('es-CL')}</td>
                      <td className="p-3 text-right text-emerald-300">${item.unitLaborPrice.toLocaleString('es-CL')}</td>
                      <td className="p-3 text-right font-bold text-white">
                        ${((item.unitMaterialPrice + item.unitLaborPrice) * item.quantity).toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDeleteReplacement(item.id)} className="text-slate-500 hover:text-rose-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3 VIEW: MANTENCIÓN ELÉCTRICA PREVENTIVA */}
      {/* ========================================================================= */}
      {serviceMode === 'maintenance' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span>Protocolo de Inspección & Mantención Preventiva SEC</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Evalúa el estado físico e instrumental de la instalación. Las observaciones se pueden cotizar directamente.
                </p>
              </div>

              <button
                onClick={handleExportMaintenanceToQuote}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cotizar Correcciones ({maintObservadoCount + maintCriticoCount})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {maintenanceItems.map((m) => (
                <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">{m.category}</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{m.checkPoint}</h4>
                    </div>

                    {/* Status Pill Switcher */}
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
                      <button
                        onClick={() => handleToggleMaintenanceStatus(m.id, 'conforme')}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                          m.status === 'conforme' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ✓ Conforme
                      </button>
                      <button
                        onClick={() => handleToggleMaintenanceStatus(m.id, 'observado')}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                          m.status === 'observado' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ⚠️ Observado
                      </button>
                      <button
                        onClick={() => handleToggleMaintenanceStatus(m.id, 'critico')}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                          m.status === 'critico' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🚨 Crítico
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Observaciones técnicas de la inspección..."
                      value={m.observation}
                      onChange={(e) => handleUpdateMaintenanceObs(m.id, e.target.value)}
                      className="sm:col-span-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
                    />
                    {(m.status === 'observado' || m.status === 'critico') && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          placeholder="Costo reparación ($)"
                          value={m.estimatedFixCost || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMaintenanceItems((prev) =>
                              prev.map((item) => (item.id === m.id ? { ...item, estimatedFixCost: val } : item))
                            );
                          }}
                          className="bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-xs rounded-lg px-3 py-2 w-full outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4 VIEW: DIAGNÓSTICO DE FALLAS */}
      {/* ========================================================================= */}
      {serviceMode === 'diagnostic' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-rose-400" />
                  <span>Detección, Aislamiento y Diagnóstico de Averías Eléctricas</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Registra los hallazgos de fallas complejas, causa raíz, mediciones con instrumental y cotiza la reparación.
                </p>
              </div>

              <button
                onClick={() => setShowAddDiagModal(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Registro Falla</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {diagnosticsList.map((diag) => (
                <div key={diag.id} className="bg-slate-950 border border-rose-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px] font-bold px-2 py-0.5 rounded">
                        {diag.status}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">{diag.faultType}</h4>
                      <p className="text-xs text-slate-400">{diag.location} • {diag.circuitName}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportDiagnosticToQuote(diag)}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Cotizar Reparación (${diag.laborCost.toLocaleString('es-CL')})</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDiagnostic(diag.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-all"
                        title="Eliminar Registro de Falla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tensión Medida L-N</div>
                      <div className="text-sm font-bold text-amber-300 mt-0.5">{diag.measuredVoltage || 220} V</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Aislamiento Megóhmetro</div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">{diag.measuredIsolation || 50} MΩ</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Fuga Fuga Pinza mA</div>
                      <div className="text-sm font-bold text-rose-400 mt-0.5">{diag.measuredLeakageCurrent || 0} mA</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-rose-400">Causa Raíz Determinada:</span>
                      <p className="text-slate-300 mt-0.5">{diag.rootCause}</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-emerald-400">Solución Aplicada / Recomendada:</span>
                      <p className="text-slate-300 mt-0.5">{diag.solutionApplied}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: AÑADIR RECINTO */}
      {/* ========================================================================= */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddRoom} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-fuchsia-400" />
                <span>Agregar Nuevo Recinto</span>
              </h3>
              <button type="button" onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Recinto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Terraza Exterior, Quincho, Taller"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Puntos Alumbrado</label>
                  <input
                    type="number"
                    value={newRoomLights}
                    onChange={(e) => setNewRoomLights(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Puntos Enchufes</label>
                  <input
                    type="number"
                    value={newRoomSockets}
                    onChange={(e) => setNewRoomSockets(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs py-2.5 rounded-xl">
              Guardar Recinto
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AÑADIR ARTEFACTO GRAN CONSUMO */}
      {/* ========================================================================= */}
      {showAddHighModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddHighAppliance} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Agregar Carga Especial / Gran Consumo</span>
              </h3>
              <button type="button" onClick={() => setShowAddHighModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre Carga / Artefacto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aire Acondicionado Inverter 18000 BTU"
                  value={newHighName}
                  onChange={(e) => setNewHighName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Potencia (Watts)</label>
                  <input
                    type="number"
                    value={newHighWatts}
                    onChange={(e) => setNewHighWatts(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Conexión</label>
                  <select
                    value={newHighSocketType}
                    onChange={(e: any) => setNewHighSocketType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  >
                    <option value="10A">Enchufe 10A</option>
                    <option value="16A">Enchufe 16A Especial</option>
                    <option value="Conexión Directa">Conexión Directa</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl">
              Guardar Carga Especial
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AÑADIR REEMPLAZO PERSONALIZADO */}
      {/* ========================================================================= */}
      {showAddRepModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddReplacement} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plug className="w-4 h-4 text-amber-400" />
                <span>Agregar Nuevo Reemplazo</span>
              </h3>
              <button type="button" onClick={() => setShowAddRepModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre Elemento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Foco Foco Proyector LED 50W Exterior"
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={newRepLocation}
                    onChange={(e) => setNewRepLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={newRepQty}
                    onChange={(e) => setNewRepQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Precio Material ($)</label>
                  <input
                    type="number"
                    value={newRepMatPrice}
                    onChange={(e) => setNewRepMatPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mano Obra ($)</label>
                  <input
                    type="number"
                    value={newRepLaborPrice}
                    onChange={(e) => setNewRepLaborPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2.5 rounded-xl">
              Añadir a Nómina
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: AÑADIR REGISTRO DE FALLA */}
      {/* ========================================================================= */}
      {showAddDiagModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddDiagnostic} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-rose-400" />
                <span>Registrar Diagnóstico de Falla Eléctrica</span>
              </h3>
              <button type="button" onClick={() => setShowAddDiagModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipo de Falla Pre-establecida</label>
                <select
                  value={diagFaultType}
                  onChange={(e) => setDiagFaultType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                >
                  {faultPresets.map((f, i) => (
                    <option key={i} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Lugar / Sector</label>
                  <input
                    type="text"
                    value={diagLocation}
                    onChange={(e) => setDiagLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Circuito Afectado</label>
                  <input
                    type="text"
                    value={diagCircuit}
                    onChange={(e) => setDiagCircuit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Causa Raíz Encontrada *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explica qué causó la falla (ej: cable pelado en ducto, entrada de agua, sobrecarga de artefacto)"
                  value={diagRootCause}
                  onChange={(e) => setDiagRootCause(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Solución Realizada / Trabajo *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Trabajo de reparación efectuado para solucionar el problema"
                  value={diagSolution}
                  onChange={(e) => setDiagSolution(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Costo Mano de Obra Reparación ($)</label>
                <input
                  type="number"
                  value={diagLabor}
                  onChange={(e) => setDiagLabor(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl">
              Guardar Diagnóstico
            </button>
          </form>
        </div>
      )}

      {/* Plan Scanner AI Modal */}
      {isScannerOpen && setRooms && setHighAppliances && (
        <PlanScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onApplyPlanToCensus={(scannedRooms, scannedHigh) => {
            setRooms(scannedRooms);
            setHighAppliances(scannedHigh);
            setIsScannerOpen(false);
            triggerToast('¡Plano escaneado con éxito por la IA!');
          }}
        />
      )}
    </div>
  );
}

export default LoadCensusTab;
