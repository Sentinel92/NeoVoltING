import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Play, CheckCircle2, AlertTriangle, RotateCcw,
  Trash2, Users, Info, MonitorPlay, Scale,
  Sparkles, ShieldAlert, FileText, Copy, Download, Camera,
  Layers, X, Check, Activity, Sliders, Building2,
  ZoomIn, ZoomOut, Maximize2, Move, Plus, Wand2,
  ArrowLeft, ArrowRight, Settings, ShieldCheck, Gauge,
  Eye, EyeOff, ChevronDown, ChevronUp, SlidersHorizontal,
  Flame, Volume2, VolumeX, RefreshCw, Power
} from 'lucide-react';
import { ClientRecord, RoomData, HighAppliance } from '../types';
import { electricalAudio } from '../utils/electricalAudio';

export type TerminalType = 'L' | 'N' | 'PE' | 'L1' | 'L2' | 'L3';

export interface InteractiveTerminal {
  id: string;
  type: TerminalType;
  position: 'top' | 'bottom';
  x: number;
  y: number;
  label: string;
}

export interface InteractiveComponent {
  id: string;
  type: 'GRID' | 'IGA' | 'RCD' | 'MCB' | 'BAR_N' | 'BAR_PE' | 'LOAD';
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  terminals: InteractiveTerminal[];
  ampacity?: number;
  poles?: number;
  dinModules?: number;
  isTripped?: boolean;
  isOff?: boolean;
  trippedReason?: string;
}

export interface Wire {
  id: string;
  fromCompId: string;
  fromTermId: string;
  toCompId: string;
  toTermId: string;
  color: string;
}

export interface ActiveElectricalFault {
  id: string;
  type: 'SHORT_CIRCUIT_LN' | 'SHORT_CIRCUIT_PHASE_PHASE' | 'GROUND_FAULT_PE' | 'NEUTRAL_GROUND_LOOP' | 'REVERSE_POLARITY' | 'OVERLOAD';
  title: string;
  description: string;
  normReference: string;
  x: number;
  y: number;
  wireId?: string;
  fromTerminalLabel?: string;
  toTerminalLabel?: string;
  trippedCompId?: string;
  trippedCompName?: string;
  iccAmps: number;
  timeMs: number;
}

export interface SparkParticle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
}

export interface LoadPowerStatus {
  status: 'OPERATIONAL' | 'NO_NEUTRAL' | 'NO_PHASE' | 'NO_GROUND_PE' | 'TRIPPED_PROTECTION';
  voltage: number;
  currentAmps: number;
  powerWatts: number;
  message: string;
}

const DEMO_CLIENTS = [
  {
    id: 'demo_1',
    name: 'Don Pedro Morales (Casa Residencial)',
    propertyType: 'Residencial - 6.8 kW',
    loads: [
      { id: 'd1_l1', name: 'Circuito 1: Alumbrado General', power: 800 },
      { id: 'd1_l2', name: 'Circuito 2: Enchufes Dormitorios', power: 2200 },
      { id: 'd1_l3', name: 'Circuito 3: Enchufes Cocina & Logia', power: 2500 },
      { id: 'd1_l4', name: 'Circuito 4: Horno Eléctrico', power: 1300 },
    ]
  },
  {
    id: 'demo_2',
    name: 'Dra. Carmen Soto (Departamento 2D)',
    propertyType: 'Departamento / Estudio - 4.5 kW',
    loads: [
      { id: 'd2_l1', name: 'Circuito 1: Iluminación Depto', power: 600 },
      { id: 'd2_l2', name: 'Circuito 2: Enchufes Generales', power: 2000 },
      { id: 'd2_l3', name: 'Circuito 3: Termo Eléctrico', power: 1900 },
    ]
  },
  {
    id: 'demo_3',
    name: 'Pizzería Don Juan (Local Comercial)',
    propertyType: 'Comercial / Industrial - 12.5 kW',
    loads: [
      { id: 'd3_l1', name: 'Circuito 1: Iluminación Comercial', power: 1200 },
      { id: 'd3_l2', name: 'Circuito 2: Tomas Corriente & Caja', power: 2800 },
      { id: 'd3_l3', name: 'Circuito 3: Horno Industrial', power: 4500 },
      { id: 'd3_l4', name: 'Circuito 4: Climatización 24k BTU', power: 4000 },
    ]
  }
];

export default function InteractiveBoardTab() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClientObj, setSelectedClientObj] = useState<ClientRecord | typeof DEMO_CLIENTS[0] | null>(null);

  const [components, setComponents] = useState<InteractiveComponent[]>([]);
  const [initialComponents, setInitialComponents] = useState<InteractiveComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  
  const [loads, setLoads] = useState<{ id: string; name: string; power: number }[]>(DEMO_CLIENTS[0].loads);
  
  const [boardCapacity, setBoardCapacity] = useState<number>(24);
  const [propertyType, setPropertyType] = useState<string>('Residencial');
  const [supplyType, setSupplyType] = useState<'MONOFASICO_220' | 'TRIFASICO_380'>('MONOFASICO_220');

  // Interactivity states: Hovering & Dragging
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  const [hoveredTerm, setHoveredTerm] = useState<{ compId: string; term: InteractiveTerminal } | null>(null);

  const [activeWireStart, setActiveWireStart] = useState<{compId: string, term: InteractiveTerminal} | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({x: 0, y: 0});
  
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0});

  const [simulationState, setSimulationState] = useState<'idle' | 'success' | 'error'>('idle');
  const [simulationMessages, setSimulationMessages] = useState<string[]>([]);

  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(10);
  const [snapNotice, setSnapNotice] = useState<string | null>(null);

  const [showAssemblyReportModal, setShowAssemblyReportModal] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  
  // Interactive Energy Simulation & Wiring Verifier States
  const [isEnergySimulated, setIsEnergySimulated] = useState<boolean>(false);
  const [isWiringVerifierActive, setIsWiringVerifierActive] = useState<boolean>(false);
  const [verifierStep, setVerifierStep] = useState<number>(0);

  // Electrical Simulation & Fault Engine States
  const [activeFault, setActiveFault] = useState<ActiveElectricalFault | null>(null);
  const [sparkParticles, setSparkParticles] = useState<SparkParticle[]>([]);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [wiringMode, setWiringMode] = useState<'realistic' | 'strict_assisted'>('realistic');
  const [showFaultDetailsModal, setShowFaultDetailsModal] = useState<boolean>(false);
  const [poweredLoadsMap, setPoweredLoadsMap] = useState<Record<string, LoadPowerStatus>>({});

  // Zoom & Pan Navigation Controls
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Selected Component for Active Border Highlight & Property Editing
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  // RIC Normative Feasibility Modal & Errors
  const [showFeasibilityModal, setShowFeasibilityModal] = useState<boolean>(false);
  const [feasibilityErrors, setFeasibilityErrors] = useState<string[]>([]);
  const [showQuickAddMenu, setShowQuickAddMenu] = useState<boolean>(false);
  const [showSecondaryMenu, setShowSecondaryMenu] = useState<boolean>(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Single-Line Logic Step-by-Step Expected Wiring Steps
  const expectedWiringSteps = useMemo(() => {
    const steps: Array<{
      id: string;
      title: string;
      description: string;
      fromCompId: string;
      fromTermId: string;
      toCompId: string;
      toTermId: string;
      color: string;
    }> = [];

    if (supplyType === 'TRIFASICO_380') {
      steps.push({
        id: 'step_grid_iga_l1',
        title: 'Paso 1: Acometida Fase L1 → IGA (Polo L1)',
        description: 'Conecte la salida de Fase L1 de la Red 380V a la entrada L1 del Interruptor General Acometida (IGA).',
        fromCompId: 'grid', fromTermId: 'grid_out_l1',
        toCompId: 'iga', toTermId: 'iga_in_l1',
        color: '#ef4444'
      });
      steps.push({
        id: 'step_grid_iga_l2',
        title: 'Paso 2: Acometida Fase L2 → IGA (Polo L2)',
        description: 'Conecte la salida de Fase L2 de la Red 380V a la entrada L2 del IGA.',
        fromCompId: 'grid', fromTermId: 'grid_out_l2',
        toCompId: 'iga', toTermId: 'iga_in_l2',
        color: '#475569'
      });
      steps.push({
        id: 'step_grid_iga_l3',
        title: 'Paso 3: Acometida Fase L3 → IGA (Polo L3)',
        description: 'Conecte la salida de Fase L3 de la Red 380V a la entrada L3 del IGA.',
        fromCompId: 'grid', fromTermId: 'grid_out_l3',
        toCompId: 'iga', toTermId: 'iga_in_l3',
        color: '#d97706'
      });
      steps.push({
        id: 'step_grid_iga_n',
        title: 'Paso 4: Acometida Neutro N → IGA (Polo N)',
        description: 'Conecte el Neutro (N) de la red al polo Neutro de entrada del IGA 4P.',
        fromCompId: 'grid', fromTermId: 'grid_out_n',
        toCompId: 'iga', toTermId: 'iga_in_n',
        color: '#38bdf8'
      });
      steps.push({
        id: 'step_iga_rcd_l1',
        title: 'Paso 5: IGA Salida L1 → RCD Entrada L1',
        description: 'Alimentación de Fase L1 desde la salida del IGA hacia la entrada del Protector Diferencial (RCD 30mA).',
        fromCompId: 'iga', fromTermId: 'iga_out_l1',
        toCompId: 'rcd', toTermId: 'rcd_in_l1',
        color: '#ef4444'
      });
      steps.push({
        id: 'step_iga_rcd_l2',
        title: 'Paso 6: IGA Salida L2 → RCD Entrada L2',
        description: 'Alimentación de Fase L2 desde IGA hacia el RCD.',
        fromCompId: 'iga', fromTermId: 'iga_out_l2',
        toCompId: 'rcd', toTermId: 'rcd_in_l2',
        color: '#475569'
      });
      steps.push({
        id: 'step_iga_rcd_l3',
        title: 'Paso 7: IGA Salida L3 → RCD Entrada L3',
        description: 'Alimentación de Fase L3 desde IGA hacia el RCD.',
        fromCompId: 'iga', fromTermId: 'iga_out_l3',
        toCompId: 'rcd', toTermId: 'rcd_in_l3',
        color: '#d97706'
      });
      steps.push({
        id: 'step_iga_rcd_n',
        title: 'Paso 8: IGA Salida N → RCD Entrada N',
        description: 'Alimentación de Neutro N desde la salida de IGA hacia el RCD.',
        fromCompId: 'iga', fromTermId: 'iga_out_n',
        toCompId: 'rcd', toTermId: 'rcd_in_n',
        color: '#38bdf8'
      });
      steps.push({
        id: 'step_rcd_bar_n',
        title: 'Paso 9: RCD Salida N → Bornera Barra Neutro',
        description: 'Conecte la salida de Neutro del RCD a la bornera principal aislada de Neutro.',
        fromCompId: 'rcd', fromTermId: 'rcd_out_n',
        toCompId: 'bar_n', toTermId: 'bar_n_0',
        color: '#38bdf8'
      });
    } else {
      steps.push({
        id: 'step_grid_iga_l',
        title: 'Paso 1: Acometida Fase L → IGA (Polo L)',
        description: 'Conecte la salida de Fase (L) del Empalme 220V a la entrada de Fase (L) del IGA.',
        fromCompId: 'grid', fromTermId: 'grid_out_l',
        toCompId: 'iga', toTermId: 'iga_in_l',
        color: '#ef4444'
      });
      steps.push({
        id: 'step_grid_iga_n',
        title: 'Paso 2: Acometida Neutro N → IGA (Polo N)',
        description: 'Conecte el Neutro (N) de la red al polo Neutro de entrada del IGA.',
        fromCompId: 'grid', fromTermId: 'grid_out_n',
        toCompId: 'iga', toTermId: 'iga_in_n',
        color: '#38bdf8'
      });
      steps.push({
        id: 'step_iga_rcd_l',
        title: 'Paso 3: IGA Salida L → RCD Entrada L',
        description: 'Alimentación de Fase L desde la salida del IGA hacia la entrada del Protector Diferencial RCD.',
        fromCompId: 'iga', fromTermId: 'iga_out_l',
        toCompId: 'rcd', toTermId: 'rcd_in_l',
        color: '#ef4444'
      });
      steps.push({
        id: 'step_iga_rcd_n',
        title: 'Paso 4: IGA Salida N → RCD Entrada N',
        description: 'Alimentación de Neutro N desde la salida de IGA hacia la entrada N del RCD.',
        fromCompId: 'iga', fromTermId: 'iga_out_n',
        toCompId: 'rcd', toTermId: 'rcd_in_n',
        color: '#38bdf8'
      });
      steps.push({
        id: 'step_rcd_bar_n',
        title: 'Paso 5: RCD Salida N → Bornera Barra Neutro',
        description: 'Conecte el neutro protegido de salida del RCD a la bornera distribuida de Neutro.',
        fromCompId: 'rcd', fromTermId: 'rcd_out_n',
        toCompId: 'bar_n', toTermId: 'bar_n_0',
        color: '#38bdf8'
      });
    }

    const mcbs = components.filter(c => c.type === 'MCB');
    const rcdPhaseTerm = supplyType === 'TRIFASICO_380' ? 'rcd_out_l1' : 'rcd_out_l';

    mcbs.forEach((mcb, idx) => {
      steps.push({
        id: `step_rcd_mcb_${idx}`,
        title: `Paso ${steps.length + 1}: RCD Salida L → Disyuntor ${mcb.name}`,
        description: `Puente de alimentación de fase desde la salida del RCD hacia la entrada del Disyuntor ${mcb.name}.`,
        fromCompId: 'rcd', fromTermId: rcdPhaseTerm,
        toCompId: mcb.id, toTermId: `mcb_${idx}_in_l`,
        color: '#ef4444'
      });

      const loadCompId = `load_comp_${idx}`;
      const loadComp = components.find(c => c.id === loadCompId);
      if (loadComp) {
        steps.push({
          id: `step_mcb_load_${idx}`,
          title: `Paso ${steps.length + 1}: Disyuntor ${mcb.name} → ${loadComp.name} (Fase)`,
          description: `Salida de fase desde el disyuntor ${mcb.name} hacia el circuito alimentado.`,
          fromCompId: mcb.id, fromTermId: `mcb_${idx}_out_l`,
          toCompId: loadCompId, toTermId: `load_${idx}_l`,
          color: '#ef4444'
        });

        steps.push({
          id: `step_load_bar_n_${idx}`,
          title: `Paso ${steps.length + 1}: ${loadComp.name} → Barra de Neutro (N)`,
          description: `Retorno de neutro del circuito hacia la bornera de neutro N${idx + 1}.`,
          fromCompId: loadCompId, fromTermId: `load_${idx}_n`,
          toCompId: 'bar_n', toTermId: `bar_n_${Math.min(idx + 1, 7)}`,
          color: '#38bdf8'
        });

        steps.push({
          id: `step_load_bar_pe_${idx}`,
          title: `Paso ${steps.length + 1}: ${loadComp.name} → Barra Tierra PE`,
          description: `Conexión de protección de tierra (PE) del circuito a la barra colectora de tierra PE.`,
          fromCompId: loadCompId, fromTermId: `load_${idx}_pe`,
          toCompId: 'bar_pe', toTermId: `bar_pe_${Math.min(idx + 1, 7)}`,
          color: '#22c55e'
        });
      }
    });

    steps.push({
      id: `step_grid_pe`,
      title: `Paso ${steps.length + 1}: Acometida Tierra PE → Barra Tierra PE`,
      description: 'Conecte la tierra principal de la acometida a la bornera principal de la Barra Tierra PE.',
      fromCompId: 'grid', fromTermId: 'grid_out_pe',
      toCompId: 'bar_pe', toTermId: 'bar_pe_0',
      color: '#22c55e'
    });

    return steps;
  }, [components, supplyType]);

  const isStepCompleted = (step: (typeof expectedWiringSteps)[0]) => {
    if (!step) return false;
    return wires.some(
      w =>
        (w.fromCompId === step.fromCompId &&
          w.fromTermId === step.fromTermId &&
          w.toCompId === step.toCompId &&
          w.toTermId === step.toTermId) ||
        (w.fromCompId === step.toCompId &&
          w.fromTermId === step.toTermId &&
          w.toCompId === step.fromCompId &&
          w.toTermId === step.fromTermId)
    );
  };

  const handleAutoWireStep = (step: (typeof expectedWiringSteps)[0]) => {
    if (!step || isStepCompleted(step)) return;
    const newWire: Wire = {
      id: `w_auto_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      fromCompId: step.fromCompId,
      fromTermId: step.fromTermId,
      toCompId: step.toCompId,
      toTermId: step.toTermId,
      color: step.color
    };
    setWires(prev => [...prev, newWire]);
  };

  const handleAutoWireAll = () => {
    const newWires: Wire[] = [...wires];
    expectedWiringSteps.forEach(step => {
      const done = newWires.some(
        w =>
          (w.fromCompId === step.fromCompId &&
            w.fromTermId === step.fromTermId &&
            w.toCompId === step.toCompId &&
            w.toTermId === step.toTermId) ||
          (w.fromCompId === step.toCompId &&
            w.fromTermId === step.toTermId &&
            w.toCompId === step.fromCompId &&
            w.toTermId === step.fromTermId)
      );
      if (!done) {
        newWires.push({
          id: `w_auto_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          fromCompId: step.fromCompId,
          fromTermId: step.fromTermId,
          toCompId: step.toCompId,
          toTermId: step.toTermId,
          color: step.color
        });
      }
    });
    setWires(newWires);
  };

  // RIC Verification & Logical Auto-Wiring
  const handleVerifyAndAutoWire = () => {
    const errors: string[] = [];

    // 1. Physical DIN capacity limit
    if (usedDinModules > boardCapacity) {
      errors.push(`Capacidad Física Excedida: Se ocupan ${usedDinModules} módulos DIN en un gabinete de ${boardCapacity} DIN (${Math.round((usedDinModules / boardCapacity) * 100)}% de ocupación). Aumente el gabinete a ${usedDinModules <= 36 ? 36 : 48} módulos.`);
    }

    // 2. IGA Presence (RIC N°02)
    const hasIga = components.some(c => c.type === 'IGA');
    if (!hasIga) {
      errors.push(`Falta Interruptor General de Acometida (IGA): La normativa SEC exige un dispositivo de corte omnipolar en la cabecera del tablero.`);
    }

    // 3. RCD Presence (RIC N°02 & RIC N°09)
    const hasRcd = components.some(c => c.type === 'RCD');
    if (!hasRcd) {
      errors.push(`Falta Protector Diferencial (RCD): Se exige protección diferencial con sensibilidad ≤ 30mA para protección de personas contra contactos indirectos.`);
    }

    // 4. IGA Overload Check
    if (isIgaOverloaded) {
      errors.push(`Sobrecarga Eléctrica en IGA: La demanda proyectada (${totalLoadCurrent.toFixed(1)} A) supera la capacidad del IGA (${igaAmps} A). Aumente el calibre de la protección o redistribuya cargas.`);
    }

    // 5. MCB circuits check
    const mcbs = components.filter(c => c.type === 'MCB');
    if (mcbs.length === 0) {
      errors.push(`Sin Disyuntores de Circuitos: Debe existir al menos un disyuntor automático (MCB) para proteger los circuitos derivados.`);
    }

    if (errors.length > 0) {
      setFeasibilityErrors(errors);
      setShowFeasibilityModal(true);
      return;
    }

    // Viable: perform optimal routing auto-wiring
    handleAutoWireAll();
    setSnapNotice("✓ Verificación Exitosa: Cableado lógico óptimo generado según estándar SEC / RIC N°02.");
    setTimeout(() => setSnapNotice(null), 4000);
  };

  // Add new component to DIN Rail
  const handleAddComponent = (type: 'MCB' | 'RCD' | 'DPS', ampacity: number = 16, customName?: string) => {
    const existingMcbs = components.filter(c => c.type === 'MCB');
    const count = existingMcbs.length + 1;
    const newId = `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`;

    // Find suitable X on DIN Rail 1 (Y=150) or DIN Rail 2 (Y=280)
    const rail1Comps = components.filter(c => c.y >= 120 && c.y <= 200).sort((a, b) => (a.x + a.w) - (b.x + b.w));
    const lastRail1 = rail1Comps[rail1Comps.length - 1];
    let nextX = lastRail1 ? lastRail1.x + lastRail1.w + 10 : 260;
    let nextY = 150;

    if (nextX > 720) {
      // Put on DIN Rail 2
      const rail2Comps = components.filter(c => c.y >= 240 && c.y <= 320).sort((a, b) => (a.x + a.w) - (b.x + b.w));
      const lastRail2 = rail2Comps[rail2Comps.length - 1];
      nextX = lastRail2 ? lastRail2.x + lastRail2.w + 10 : 80;
      nextY = 280;
    }

    let newComp: InteractiveComponent;
    if (type === 'MCB') {
      newComp = {
        id: newId,
        type: 'MCB',
        name: customName || `C${count} ${ampacity}A`,
        x: nextX,
        y: nextY,
        w: 45,
        h: 100,
        ampacity,
        dinModules: 1,
        terminals: [
          { id: `${newId}_in_l`, type: 'L', position: 'top', x: 22, y: 0, label: 'L' },
          { id: `${newId}_out_l`, type: 'L', position: 'bottom', x: 22, y: 100, label: 'L' }
        ]
      };
    } else if (type === 'RCD') {
      newComp = {
        id: newId,
        type: 'RCD',
        name: customName || `RCD ${ampacity}A 30mA`,
        x: nextX,
        y: nextY,
        w: 80,
        h: 100,
        ampacity,
        dinModules: 2,
        terminals: [
          { id: `${newId}_in_l`, type: 'L', position: 'top', x: 20, y: 0, label: 'L' },
          { id: `${newId}_in_n`, type: 'N', position: 'top', x: 60, y: 0, label: 'N' },
          { id: `${newId}_out_l`, type: 'L', position: 'bottom', x: 20, y: 100, label: 'L' },
          { id: `${newId}_out_n`, type: 'N', position: 'bottom', x: 60, y: 100, label: 'N' }
        ]
      };
    } else {
      newComp = {
        id: newId,
        type: 'MCB',
        name: customName || 'DPS Sobretensión',
        x: nextX,
        y: nextY,
        w: 45,
        h: 100,
        ampacity: 20,
        dinModules: 1,
        terminals: [
          { id: `${newId}_in_l`, type: 'L', position: 'top', x: 22, y: 0, label: 'L' },
          { id: `${newId}_out_pe`, type: 'PE', position: 'bottom', x: 22, y: 100, label: 'PE' }
        ]
      };
    }

    setComponents(prev => [...prev, newComp]);
    setSelectedCompId(newComp.id);
    setShowQuickAddMenu(false);
    setSnapNotice(`✓ ${newComp.name} añadido al riel DIN.`);
    setTimeout(() => setSnapNotice(null), 2500);
  };

  // Delete component and attached wires
  const handleDeleteComponent = (compId: string) => {
    setComponents(prev => prev.filter(c => c.id !== compId));
    setWires(prev => prev.filter(w => w.fromCompId !== compId && w.toCompId !== compId));
    if (selectedCompId === compId) setSelectedCompId(null);
    setSnapNotice("Componente eliminado del tablero y cables desconectados.");
    setTimeout(() => setSnapNotice(null), 2500);
  };

  // Update component ampacity
  const handleUpdateCompAmpacity = (compId: string, newAmps: number) => {
    setComponents(prev => prev.map(c => {
      if (c.id === compId) {
        const baseName = c.name.replace(/\d+A/, `${newAmps}A`);
        return { ...c, ampacity: newAmps, name: baseName };
      }
      return c;
    }));
    setSnapNotice(`Capacidad actualizada a ${newAmps}A.`);
    setTimeout(() => setSnapNotice(null), 2000);
  };

  // Move component left/right on rail
  const handleMoveCompOnRail = (compId: string, deltaX: number) => {
    setComponents(prev => prev.map(c => {
      if (c.id === compId) {
        const newX = Math.max(40, Math.min(800 - c.w, c.x + deltaX));
        return { ...c, x: newX };
      }
      return c;
    }));
  };

  // Zoom and Pan Handlers
  const handleZoomIn = () => setZoom(z => Math.min(2.2, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, +(z - 0.15).toFixed(2)));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const activeStep = expectedWiringSteps[verifierStep % Math.max(1, expectedWiringSteps.length)];

  const getCapacityByProperty = (typeStr: string): number => {
    const s = (typeStr || '').toLowerCase();
    if (s.includes('depto') || s.includes('departamento') || s.includes('estudio') || s.includes('4.5')) return 12;
    if (s.includes('comercial') || s.includes('industrial') || s.includes('12.5') || s.includes('grande')) return 36;
    if (s.includes('trifasico') || s.includes('edificio')) return 48;
    return 24;
  };

  useEffect(() => {
    const stored = localStorage.getItem('neovolt_clients');
    let loadedClients: ClientRecord[] = [];
    if (stored) {
      try {
        loadedClients = JSON.parse(stored);
        setClients(loadedClients);
      } catch(e) {}
    }
    
    if (loadedClients.length > 0) {
      const firstReal = loadedClients[0];
      setSelectedClientId(firstReal.id);
      setSelectedClientObj(firstReal);
      loadClientData(firstReal);
    } else {
      setSelectedClientId(DEMO_CLIENTS[0].id);
      setSelectedClientObj(DEMO_CLIENTS[0]);
      setLoads(DEMO_CLIENTS[0].loads);
      setPropertyType(DEMO_CLIENTS[0].propertyType);
      setBoardCapacity(getCapacityByProperty(DEMO_CLIENTS[0].propertyType));
      generateBoardLayout(DEMO_CLIENTS[0].loads, 'MONOFASICO_220');
    }
  }, []);

  const loadClientData = (client: ClientRecord) => {
    const newLoads: { id: string; name: string; power: number }[] = [];
    if (client.boardConfig?.rooms) {
      client.boardConfig.rooms.forEach((r: RoomData, idx: number) => {
        let roomPower = 0;
        if (r.devices && r.devices.length > 0) {
          r.devices.forEach(d => roomPower += (d.quantity || 1) * (d.powerWatts || 100));
        } else {
          roomPower = (r.lightPoints || 0) * 100 + (r.socketPoints || 0) * 250;
        }
        if (roomPower > 0) {
          newLoads.push({ id: `load_r_${r.id}_${idx}`, name: `Circuito ${r.name}`, power: roomPower });
        }
      });
    }

    if (client.boardConfig?.highAppliances) {
      client.boardConfig.highAppliances.forEach((ha: HighAppliance, idx: number) => {
        newLoads.push({ id: `load_ha_${ha.id}_${idx}`, name: `Fuerza ${ha.name}`, power: ha.powerWatts || 2000 });
      });
    }

    if (newLoads.length === 0) {
      newLoads.push({ id: 'load_default_1', name: 'Circuito 1: Alumbrado General', power: 1200 });
      newLoads.push({ id: 'load_default_2', name: 'Circuito 2: Enchufes Generales', power: 2200 });
    }

    const prop = client.address || client.notes || 'Residencial Unifamiliar';
    const recCap = getCapacityByProperty(prop);
    const isTri = prop.toLowerCase().includes('trifasico') || prop.toLowerCase().includes('comercial');
    const newSupply = isTri ? 'TRIFASICO_380' : 'MONOFASICO_220';

    setLoads(newLoads);
    setPropertyType(prop);
    setBoardCapacity(recCap);
    setSupplyType(newSupply);
    generateBoardLayout(newLoads, newSupply);
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const saved = clients.find(c => c.id === clientId);
    if (saved) {
      setSelectedClientObj(saved);
      loadClientData(saved);
      return;
    }

    const demo = DEMO_CLIENTS.find(d => d.id === clientId);
    if (demo) {
      setSelectedClientObj(demo);
      setLoads(demo.loads);
      setPropertyType(demo.propertyType);
      const recCap = getCapacityByProperty(demo.propertyType);
      const isTri = demo.id === 'demo_3';
      const newSupply = isTri ? 'TRIFASICO_380' : 'MONOFASICO_220';
      setBoardCapacity(recCap);
      setSupplyType(newSupply);
      generateBoardLayout(demo.loads, newSupply);
    }
  };

  const calculateTotalCurrent = (loadsArr: {power: number}[], st: 'MONOFASICO_220' | 'TRIFASICO_380') => {
    const totalPower = loadsArr.reduce((sum, l) => sum + l.power, 0);
    const pf = 0.93;
    if (st === 'TRIFASICO_380') {
      return totalPower / (Math.sqrt(3) * 380 * pf);
    }
    return totalPower / (220 * pf);
  };

  const getRecommendedIga = (amps: number) => {
    if (amps <= 10) return 10;
    if (amps <= 16) return 16;
    if (amps <= 20) return 20;
    if (amps <= 25) return 25;
    if (amps <= 32) return 32;
    if (amps <= 40) return 40;
    if (amps <= 50) return 50;
    return 63;
  };

  const generateBoardLayout = (
    currentLoads: { id: string; name: string; power: number }[],
    st: 'MONOFASICO_220' | 'TRIFASICO_380'
  ) => {
    setWires([]); 
    setSimulationState('idle');
    setSimulationMessages([]);
    setActiveWireStart(null);

    const newComps: InteractiveComponent[] = [];
    const totalAmps = calculateTotalCurrent(currentLoads, st);
    const igaAmps = getRecommendedIga(totalAmps);
    const rcdAmps = igaAmps <= 25 ? 25 : igaAmps <= 40 ? 40 : 63;

    if (st === 'TRIFASICO_380') {
      newComps.push({
        id: 'grid', type: 'GRID', name: 'Red Trifásica SEC 380V',
        x: 320, y: 20, w: 220, h: 55, dinModules: 0,
        terminals: [
          { id: 'grid_out_l1', type: 'L1', position: 'bottom', x: 25, y: 55, label: 'L1' },
          { id: 'grid_out_l2', type: 'L2', position: 'bottom', x: 65, y: 55, label: 'L2' },
          { id: 'grid_out_l3', type: 'L3', position: 'bottom', x: 105, y: 55, label: 'L3' },
          { id: 'grid_out_n', type: 'N', position: 'bottom', x: 145, y: 55, label: 'N' },
          { id: 'grid_out_pe', type: 'PE', position: 'bottom', x: 185, y: 55, label: 'PE' }
        ]
      });

      newComps.push({
        id: 'iga', type: 'IGA', name: `IGA 4P ${igaAmps}A`,
        x: 60, y: 150, w: 140, h: 100, ampacity: igaAmps, dinModules: 4, poles: 4,
        terminals: [
          { id: 'iga_in_l1', type: 'L1', position: 'top', x: 20, y: 0, label: 'L1' },
          { id: 'iga_in_l2', type: 'L2', position: 'top', x: 55, y: 0, label: 'L2' },
          { id: 'iga_in_l3', type: 'L3', position: 'top', x: 90, y: 0, label: 'L3' },
          { id: 'iga_in_n', type: 'N', position: 'top', x: 125, y: 0, label: 'N' },
          { id: 'iga_out_l1', type: 'L1', position: 'bottom', x: 20, y: 100, label: 'L1' },
          { id: 'iga_out_l2', type: 'L2', position: 'bottom', x: 55, y: 100, label: 'L2' },
          { id: 'iga_out_l3', type: 'L3', position: 'bottom', x: 90, y: 100, label: 'L3' },
          { id: 'iga_out_n', type: 'N', position: 'bottom', x: 125, y: 100, label: 'N' }
        ]
      });

      newComps.push({
        id: 'rcd', type: 'RCD', name: `RCD 4P ${rcdAmps}A 30mA`,
        x: 220, y: 150, w: 140, h: 100, ampacity: rcdAmps, dinModules: 4, poles: 4,
        terminals: [
          { id: 'rcd_in_l1', type: 'L1', position: 'top', x: 20, y: 0, label: 'L1' },
          { id: 'rcd_in_l2', type: 'L2', position: 'top', x: 55, y: 0, label: 'L2' },
          { id: 'rcd_in_l3', type: 'L3', position: 'top', x: 90, y: 0, label: 'L3' },
          { id: 'rcd_in_n', type: 'N', position: 'top', x: 125, y: 0, label: 'N' },
          { id: 'rcd_out_l1', type: 'L1', position: 'bottom', x: 20, y: 100, label: 'L1' },
          { id: 'rcd_out_l2', type: 'L2', position: 'bottom', x: 55, y: 100, label: 'L2' },
          { id: 'rcd_out_l3', type: 'L3', position: 'bottom', x: 90, y: 100, label: 'L3' },
          { id: 'rcd_out_n', type: 'N', position: 'bottom', x: 125, y: 100, label: 'N' }
        ]
      });
    } else {
      newComps.push({
        id: 'grid', type: 'GRID', name: 'Empalme Red SEC 220V',
        x: 360, y: 20, w: 140, h: 50, dinModules: 0,
        terminals: [
          { id: 'grid_out_l', type: 'L', position: 'bottom', x: 25, y: 50, label: 'L' },
          { id: 'grid_out_n', type: 'N', position: 'bottom', x: 70, y: 50, label: 'N' },
          { id: 'grid_out_pe', type: 'PE', position: 'bottom', x: 115, y: 50, label: 'PE' }
        ]
      });

      newComps.push({
        id: 'iga', type: 'IGA', name: `IGA Bipolar ${igaAmps}A`,
        x: 60, y: 150, w: 80, h: 100, ampacity: igaAmps, dinModules: 2, poles: 2,
        terminals: [
          { id: 'iga_in_l', type: 'L', position: 'top', x: 20, y: 0, label: 'L' },
          { id: 'iga_in_n', type: 'N', position: 'top', x: 60, y: 0, label: 'N' },
          { id: 'iga_out_l', type: 'L', position: 'bottom', x: 20, y: 100, label: 'L' },
          { id: 'iga_out_n', type: 'N', position: 'bottom', x: 60, y: 100, label: 'N' }
        ]
      });

      newComps.push({
        id: 'rcd', type: 'RCD', name: `RCD ${rcdAmps}A 30mA`,
        x: 160, y: 150, w: 80, h: 100, ampacity: rcdAmps, dinModules: 2, poles: 2,
        terminals: [
          { id: 'rcd_in_l', type: 'L', position: 'top', x: 20, y: 0, label: 'L' },
          { id: 'rcd_in_n', type: 'N', position: 'top', x: 60, y: 0, label: 'N' },
          { id: 'rcd_out_l', type: 'L', position: 'bottom', x: 20, y: 100, label: 'L' },
          { id: 'rcd_out_n', type: 'N', position: 'bottom', x: 60, y: 100, label: 'N' }
        ]
      });
    }

    newComps.push({
      id: 'bar_n', type: 'BAR_N', name: 'Barra Neutro',
      x: 60, y: 350, w: 320, h: 30, dinModules: 3,
      terminals: Array.from({length: 8}).map((_, i) => ({
        id: `bar_n_${i}`, type: 'N', position: 'top', x: 20 + i*38, y: 0, label: 'N'
      }))
    });

    newComps.push({
      id: 'bar_pe', type: 'BAR_PE', name: 'Barra Tierra PE',
      x: 410, y: 350, w: 320, h: 30, dinModules: 3,
      terminals: Array.from({length: 8}).map((_, i) => ({
        id: `bar_pe_${i}`, type: 'PE', position: 'top', x: 20 + i*38, y: 0, label: 'PE'
      }))
    });

    const startMcbX = st === 'TRIFASICO_380' ? 380 : 260;
    currentLoads.forEach((load, i) => {
      const mcbAmps = load.power >= 3500 ? 25 : load.power >= 2500 ? 20 : load.power >= 1500 ? 16 : 10;
      const mcbX = startMcbX + (i * 55);
      newComps.push({
        id: `mcb_${i}`, type: 'MCB', name: `C${i+1} ${mcbAmps}A`,
        x: mcbX, y: 150, w: 45, h: 100, ampacity: mcbAmps, dinModules: 1,
        terminals: [
          { id: `mcb_${i}_in_l`, type: 'L', position: 'top', x: 22, y: 0, label: 'L' },
          { id: `mcb_${i}_out_l`, type: 'L', position: 'bottom', x: 22, y: 100, label: 'L' }
        ]
      });

      const loadX = 60 + (i * 130);
      newComps.push({
        id: `load_comp_${i}`, type: 'LOAD', name: load.name,
        x: loadX, y: 480, w: 110, h: 65, dinModules: 0,
        terminals: [
          { id: `load_${i}_l`, type: 'L', position: 'top', x: 20, y: 0, label: 'L' },
          { id: `load_${i}_n`, type: 'N', position: 'top', x: 55, y: 0, label: 'N' },
          { id: `load_${i}_pe`, type: 'PE', position: 'top', x: 90, y: 0, label: 'PE' }
        ]
      });
    });

    const alignedComps = newComps.map(c => ({
      ...c,
      x: Math.round(c.x / 10) * 10,
      y: Math.round(c.y / 10) * 10
    }));

    setComponents(alignedComps);
    setInitialComponents(JSON.parse(JSON.stringify(alignedComps)));
  };

  const handleSupplyToggle = (newSupply: 'MONOFASICO_220' | 'TRIFASICO_380') => {
    setSupplyType(newSupply);
    generateBoardLayout(loads, newSupply);
    setSnapNotice(`Acometida cambiada a ${newSupply === 'TRIFASICO_380' ? 'Trifásico 380V (4P)' : 'Monofásico 220V'}`);
    setTimeout(() => setSnapNotice(null), 3000);
  };

  const handleResetLayout = () => {
    if (initialComponents.length > 0) {
      setComponents(JSON.parse(JSON.stringify(initialComponents)));
      setWires([]);
      setSimulationState('idle');
      setSimulationMessages([]);
      setActiveWireStart(null);
      setSnapNotice("✓ Disposición del tablero e instalaciones reiniciadas.");
      setTimeout(() => setSnapNotice(null), 2500);
    }
  };

  const getTerminalColor = (type: TerminalType) => {
    switch(type) {
      case 'L1': return '#ef4444'; // Rojo Fase 1
      case 'L2': return '#475569'; // Gris Oscuro / Negro Fase 2
      case 'L3': return '#d97706'; // Marrón / Ámbar Fase 3
      case 'L': return '#ef4444';  // Rojo Fase Monofásica
      case 'N': return '#38bdf8';  // Azul Claro Neutro
      case 'PE': return '#22c55e'; // Verde Tierra PE
      default: return '#cbd5e1';
    }
  };

  const areTerminalsCompatible = (t1: TerminalType, t2: TerminalType) => {
    if (t1 === t2) return true;
    if ((t1 === 'L' || t1 === 'L1' || t1 === 'L2' || t1 === 'L3') && 
        (t2 === 'L' || t2 === 'L1' || t2 === 'L2' || t2 === 'L3')) {
      return true;
    }
    return false;
  };

  // Spark and Arc Flash Particle Generator
  const generateSparksAt = (x: number, y: number) => {
    const particles: SparkParticle[] = [];
    const colors = ['#facc15', '#f97316', '#ef4444', '#ffffff', '#38bdf8'];
    for (let i = 0; i < 22; i++) {
      const angle = (Math.PI * 2 * i) / 22 + (Math.random() * 0.4 - 0.2);
      const dist = 30 + Math.random() * 55;
      particles.push({
        id: Date.now() + i,
        x,
        y,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 3.5,
      });
    }
    setSparkParticles(particles);
  };

  // --- REAL-WORLD ELECTRICAL SOLVER & SHORT CIRCUIT ENGINE ---
  const evaluateElectricalCircuits = (
    currentComps: InteractiveComponent[],
    currentWires: Wire[],
    st: 'MONOFASICO_220' | 'TRIFASICO_380',
    currentLoads: { id: string; name: string; power: number }[]
  ) => {
    // 1. Build Adjacency Graph of Terminal Connections
    const adj = new Map<string, Set<string>>();
    const addEdge = (a: string, b: string) => {
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    };

    // A. Add wire edges
    currentWires.forEach(w => {
      addEdge(`${w.fromCompId}:${w.fromTermId}`, `${w.toCompId}:${w.toTermId}`);
    });

    // B. Internal component bus connections (when breaker is closed & not tripped)
    currentComps.forEach(c => {
      if (c.type === 'BAR_N') {
        for (let i = 0; i < 7; i++) {
          addEdge(`${c.id}:bar_n_${i}`, `${c.id}:bar_n_${i + 1}`);
        }
      } else if (c.type === 'BAR_PE') {
        for (let i = 0; i < 7; i++) {
          addEdge(`${c.id}:bar_pe_${i}`, `${c.id}:bar_pe_${i + 1}`);
        }
      } else if (c.type === 'IGA' && !c.isTripped && !c.isOff) {
        if (st === 'TRIFASICO_380') {
          addEdge(`${c.id}:iga_in_l1`, `${c.id}:iga_out_l1`);
          addEdge(`${c.id}:iga_in_l2`, `${c.id}:iga_out_l2`);
          addEdge(`${c.id}:iga_in_l3`, `${c.id}:iga_out_l3`);
          addEdge(`${c.id}:iga_in_n`, `${c.id}:iga_out_n`);
        } else {
          addEdge(`${c.id}:iga_in_l`, `${c.id}:iga_out_l`);
          addEdge(`${c.id}:iga_in_n`, `${c.id}:iga_out_n`);
        }
      } else if (c.type === 'RCD' && !c.isTripped && !c.isOff) {
        if (st === 'TRIFASICO_380') {
          addEdge(`${c.id}:rcd_in_l1`, `${c.id}:rcd_out_l1`);
          addEdge(`${c.id}:rcd_in_l2`, `${c.id}:rcd_out_l2`);
          addEdge(`${c.id}:rcd_in_l3`, `${c.id}:rcd_out_l3`);
          addEdge(`${c.id}:rcd_in_n`, `${c.id}:rcd_out_n`);
        } else {
          addEdge(`${c.id}:rcd_in_l`, `${c.id}:rcd_out_l`);
          addEdge(`${c.id}:rcd_in_n`, `${c.id}:rcd_out_n`);
        }
      } else if (c.type === 'MCB' && !c.isTripped && !c.isOff) {
        const inTerm = c.terminals.find(t => t.id.includes('_in_'));
        const outTerm = c.terminals.find(t => t.id.includes('_out_'));
        if (inTerm && outTerm) {
          addEdge(`${c.id}:${inTerm.id}`, `${c.id}:${outTerm.id}`);
        }
      }
    });

    // Helper: Traverse Connected Net
    const getConnectedNet = (startKey: string): Set<string> => {
      const visited = new Set<string>();
      const queue = [startKey];
      visited.add(startKey);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = adj.get(curr);
        if (neighbors) {
          neighbors.forEach(n => {
            if (!visited.has(n)) {
              visited.add(n);
              queue.push(n);
            }
          });
        }
      }
      return visited;
    };

    // Calculate source nets from GRID
    let phaseNetL = new Set<string>();
    let phaseNetL1 = new Set<string>();
    let phaseNetL2 = new Set<string>();
    let phaseNetL3 = new Set<string>();
    const neutralNet = getConnectedNet('grid:grid_out_n');
    const earthNet = getConnectedNet('grid:grid_out_pe');

    if (st === 'TRIFASICO_380') {
      phaseNetL1 = getConnectedNet('grid:grid_out_l1');
      phaseNetL2 = getConnectedNet('grid:grid_out_l2');
      phaseNetL3 = getConnectedNet('grid:grid_out_l3');
    } else {
      phaseNetL = getConnectedNet('grid:grid_out_l');
    }

    const allPhaseTerminals = new Set<string>([
      ...phaseNetL, ...phaseNetL1, ...phaseNetL2, ...phaseNetL3
    ]);

    // Check 1: Cortocircuito Franco Fase-Neutro (L - N)
    let lnShortTerminal: string | null = null;
    allPhaseTerminals.forEach(termKey => {
      if (neutralNet.has(termKey)) {
        lnShortTerminal = termKey;
      }
    });

    if (lnShortTerminal) {
      const [cId, tId] = (lnShortTerminal as string).split(':');
      const comp = currentComps.find(c => c.id === cId);
      const term = comp?.terminals.find(t => t.id === tId);
      const coords = { x: (comp?.x || 300) + (term?.x || 20), y: (comp?.y || 200) + (term?.y || 20) };

      // Find closest protecting breaker
      const downstreamMcb = currentComps.find(c => c.type === 'MCB' && (phaseNetL.has(`${c.id}:${c.terminals[0]?.id}`) || c.id === cId));
      const trippedBreaker = downstreamMcb || currentComps.find(c => c.type === 'IGA') || currentComps[0];

      return {
        hasFault: true,
        fault: {
          id: `fault_ln_${Date.now()}`,
          type: 'SHORT_CIRCUIT_LN' as const,
          title: 'Cortocircuito Franco Fase - Neutro (220V)',
          description: `Se detectó un puente directo de impedancia cero entre Fase (L) y Neutro (N) en "${comp?.name || 'Bornera'}". La sobrecorriente instantánea alcanzó Icc ≈ 6.000A, accionando el disparador magnético de protección.`,
          normReference: 'RIC N°02 Art. 5 (Protección contra Cortocircuitos) & RIC N°03',
          x: coords.x,
          y: coords.y,
          trippedCompId: trippedBreaker?.id,
          trippedCompName: trippedBreaker?.name,
          iccAmps: 6000,
          timeMs: 15,
        },
        poweredLoads: {},
      };
    }

    // Check 2: Cortocircuito Entre Fases (380V Trifásico)
    if (st === 'TRIFASICO_380') {
      let interphaseShort: string | null = null;
      phaseNetL1.forEach(t => { if (phaseNetL2.has(t) || phaseNetL3.has(t)) interphaseShort = t; });
      phaseNetL2.forEach(t => { if (phaseNetL3.has(t)) interphaseShort = t; });

      if (interphaseShort) {
        const [cId, tId] = (interphaseShort as string).split(':');
        const comp = currentComps.find(c => c.id === cId);
        const term = comp?.terminals.find(t => t.id === tId);
        const coords = { x: (comp?.x || 300) + (term?.x || 20), y: (comp?.y || 200) + (term?.y || 20) };
        const iga = currentComps.find(c => c.type === 'IGA');

        return {
          hasFault: true,
          fault: {
            id: `fault_phase_${Date.now()}`,
            type: 'SHORT_CIRCUIT_PHASE_PHASE' as const,
            title: 'Cortocircuito Entre Fases (380V Bifásico / Trifásico)',
            description: `Se ha producido contacto directo entre dos conductores de fase activa (380V). Generó un arco eléctrico de gran energía térmica y sobrecorriente extrema Icc ≈ 8.500A.`,
            normReference: 'RIC N°02 Art. 5 & RIC N°03',
            x: coords.x,
            y: coords.y,
            trippedCompId: iga?.id,
            trippedCompName: iga?.name || 'IGA 4P',
            iccAmps: 8500,
            timeMs: 12,
          },
          poweredLoads: {},
        };
      }
    }

    // Check 3: Falla a Tierra Directa (Fase a PE)
    let groundFaultTerminal: string | null = null;
    allPhaseTerminals.forEach(termKey => {
      if (earthNet.has(termKey)) {
        groundFaultTerminal = termKey;
      }
    });

    if (groundFaultTerminal) {
      const [cId, tId] = (groundFaultTerminal as string).split(':');
      const comp = currentComps.find(c => c.id === cId);
      const term = comp?.terminals.find(t => t.id === tId);
      const coords = { x: (comp?.x || 300) + (term?.x || 20), y: (comp?.y || 200) + (term?.y || 20) };
      const rcd = currentComps.find(c => c.type === 'RCD') || currentComps.find(c => c.type === 'IGA');

      return {
        hasFault: true,
        fault: {
          id: `fault_pe_${Date.now()}`,
          type: 'GROUND_FAULT_PE' as const,
          title: 'Disparo por Falla a Tierra (Fase a Tierra PE)',
          description: `La Fase activa está tocando directamente la Barra de Tierra PE o masa metálica. El Protector Diferencial (RCD 30mA) detectó la fuga de corriente y actuó en menos de 20ms salvaguardando la vida humana.`,
          normReference: 'RIC N°05 (Protección contra Contactos Indirectos) & RIC N°02',
          x: coords.x,
          y: coords.y,
          trippedCompId: rcd?.id,
          trippedCompName: rcd?.name || 'RCD 30mA',
          iccAmps: 2200,
          timeMs: 18,
        },
        poweredLoads: {},
      };
    }

    // Check 4: Mezcla de Neutro y Tierra Post-Diferencial (N post-RCD a PE)
    const rcdOutNKey = 'rcd:rcd_out_n';
    if (adj.has(rcdOutNKey)) {
      const rcdNeutralNet = getConnectedNet(rcdOutNKey);
      let rcdGroundLoop = false;
      rcdNeutralNet.forEach(t => {
        if (earthNet.has(t) || t.startsWith('bar_pe:')) {
          rcdGroundLoop = true;
        }
      });

      if (rcdGroundLoop) {
        const rcd = currentComps.find(c => c.type === 'RCD');
        const coords = { x: (rcd?.x || 200) + 60, y: (rcd?.y || 150) + 100 };
        return {
          hasFault: true,
          fault: {
            id: `fault_rcd_loop_${Date.now()}`,
            type: 'NEUTRAL_GROUND_LOOP' as const,
            title: 'Disparo de RCD por Mezcla de Neutro y Tierra',
            description: `El conductor Neutro posterior al Diferencial está conectado a la barra de Tierra PE. El desbalance residual (IΔn > 30mA) provocó el disparo instantáneo del RCD al energizar.`,
            normReference: 'RIC N°02 Art. 6 & RIC N°05',
            x: coords.x,
            y: coords.y,
            trippedCompId: rcd?.id,
            trippedCompName: rcd?.name || 'RCD 30mA',
            iccAmps: 350,
            timeMs: 25,
          },
          poweredLoads: {},
        };
      }
    }

    // Evaluate powered status for each load
    const poweredLoads: Record<string, LoadPowerStatus> = {};
    currentLoads.forEach((load, idx) => {
      const lKey = `load_comp_${idx}:load_${idx}_l`;
      const nKey = `load_comp_${idx}:load_${idx}_n`;
      const peKey = `load_comp_${idx}:load_${idx}_pe`;

      const hasPhase = allPhaseTerminals.has(lKey);
      const hasNeutral = neutralNet.has(nKey);
      const hasPE = earthNet.has(peKey);

      const volt = st === 'TRIFASICO_380' ? 220 : 220;
      const current = Math.round((load.power / volt) * 10) / 10;

      if (hasPhase && hasNeutral && hasPE) {
        poweredLoads[load.id] = {
          status: 'OPERATIONAL',
          voltage: volt,
          currentAmps: current,
          powerWatts: load.power,
          message: `✓ Operativo y seguro (${volt}V - ${current}A). Cumple RIC N°02 y RIC N°05.`,
        };
      } else if (hasPhase && hasNeutral && !hasPE) {
        poweredLoads[load.id] = {
          status: 'NO_GROUND_PE',
          voltage: volt,
          currentAmps: current,
          powerWatts: load.power,
          message: `⚠️ Operativo pero SIN Tierra PE. Alto riesgo ante contacto indirecto (RIC N°05).`,
        };
      } else if (hasPhase && !hasNeutral) {
        poweredLoads[load.id] = {
          status: 'NO_NEUTRAL',
          voltage: 0,
          currentAmps: 0,
          powerWatts: 0,
          message: `🛑 Circuito Abierto: Falta retorno de Neutro hacia la barra colectora.`,
        };
      } else {
        poweredLoads[load.id] = {
          status: 'NO_PHASE',
          voltage: 0,
          currentAmps: 0,
          powerWatts: 0,
          message: `🛑 Sin alimentación de Fase desde el disyuntor automático.`,
        };
      }
    });

    return {
      hasFault: false,
      poweredLoads,
    };
  };

  // Toggle & Run Dynamic Energy Simulation
  const handleToggleEnergySimulation = (forceState?: boolean) => {
    const willSimulate = forceState !== undefined ? forceState : !isEnergySimulated;

    if (!willSimulate) {
      setIsEnergySimulated(false);
      setActiveFault(null);
      setSparkParticles([]);
      setPoweredLoadsMap({});
      setIsScreenShaking(false);
      electricalAudio.stopHum();
      setSnapNotice("🛑 Simulación de energía desactivada.");
      setTimeout(() => setSnapNotice(null), 2500);
      return;
    }

    // Run electrical solver
    const result = evaluateElectricalCircuits(components, wires, supplyType, loads);

    if (result.hasFault && result.fault) {
      setIsEnergySimulated(true);
      setActiveFault(result.fault);
      setPoweredLoadsMap({});

      // Play audio effect
      if (result.fault.type === 'GROUND_FAULT_PE' || result.fault.type === 'NEUTRAL_GROUND_LOOP') {
        electricalAudio.playRcdTripSound();
      } else {
        electricalAudio.playArcFlashSound();
      }

      // Screen shaking & sparks
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 450);
      generateSparksAt(result.fault.x, result.fault.y);

      // Trip the protective component
      if (result.fault.trippedCompId) {
        setComponents(prev => prev.map(c => 
          c.id === result.fault!.trippedCompId
            ? { ...c, isTripped: true, isOff: true, trippedReason: result.fault!.title }
            : c
        ));
      }

      setSnapNotice(`💥 ¡DISPARO DE PROTECCIÓN POR ${result.fault.title.toUpperCase()}!`);
    } else {
      setIsEnergySimulated(true);
      setActiveFault(null);
      setSparkParticles([]);
      setPoweredLoadsMap(result.poweredLoads);
      electricalAudio.startNormalHum();
      setSnapNotice("⚡ Tablero energizado correctamente: 220V/380V estables sin cortocircuitos (RIC N°02).");
      setTimeout(() => setSnapNotice(null), 3500);
    }
  };

  // Rearm All Protective Breakers
  const handleRearmAllBreakers = () => {
    setComponents(prev => prev.map(c => ({
      ...c,
      isTripped: false,
      isOff: false,
      trippedReason: undefined,
    })));
    setActiveFault(null);
    setSparkParticles([]);
    electricalAudio.playBreakerTripSound();
    setSnapNotice("🔄 Todas las protecciones IGA, RCD y MCB han sido rearmadas.");
    setTimeout(() => setSnapNotice(null), 2500);

    // If currently simulating, re-evaluate circuit
    if (isEnergySimulated) {
      setTimeout(() => {
        handleToggleEnergySimulation(true);
      }, 100);
    }
  };

  // Toggle individual component ON / OFF / REARM
  const handleToggleComponentSwitch = (compId: string) => {
    setComponents(prev => prev.map(c => {
      if (c.id === compId) {
        const nextOff = c.isTripped ? false : !c.isOff;
        return {
          ...c,
          isTripped: false,
          isOff: nextOff,
          trippedReason: undefined,
        };
      }
      return c;
    }));
    electricalAudio.playBreakerTripSound();

    if (isEnergySimulated) {
      setTimeout(() => {
        handleToggleEnergySimulation(true);
      }, 100);
    }
  };

  // Terminal click handler (Allows free realistic cross-wiring to test faults)
  const handleTerminalClick = (e: React.MouseEvent, comp: InteractiveComponent, terminal: InteractiveTerminal) => {
    e.stopPropagation();
    e.preventDefault();

    if (!activeWireStart) {
      setActiveWireStart({ compId: comp.id, term: terminal });
      const pt = getSvgMousePos(e);
      setMousePos(pt);
    } else {
      if (activeWireStart.compId === comp.id && activeWireStart.term.id === terminal.id) {
        setActiveWireStart(null);
        return;
      }

      // Check strict mode block vs realistic freedom
      if (wiringMode === 'strict_assisted' && !areTerminalsCompatible(activeWireStart.term.type, terminal.type)) {
        setSnapNotice(`🚫 BLOQUEADO POR MODO ASISTIDO: Conexión ${activeWireStart.term.type} con ${terminal.type} causará falla.`);
        setTimeout(() => setSnapNotice(null), 3500);
        setActiveWireStart(null);
        return;
      }

      const wireColor = getTerminalColor(activeWireStart.term.type);
      const newWire: Wire = {
        id: `w_${Date.now()}`,
        fromCompId: activeWireStart.compId,
        fromTermId: activeWireStart.term.id,
        toCompId: comp.id,
        toTermId: terminal.id,
        color: wireColor,
      };

      setWires([...wires, newWire]);
      setActiveWireStart(null);

      if (!areTerminalsCompatible(activeWireStart.term.type, terminal.type)) {
        setSnapNotice(`⚠️ Conexión cruzada ${activeWireStart.term.type} ↔ ${terminal.type} realizada. ¡Pulsa "Energizar ⚡" para simular el comportamiento!`);
        setTimeout(() => setSnapNotice(null), 4000);
      }
    }
  };

  const getSvgMousePos = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    return {
      x: (rawX - pan.x) / zoom,
      y: (rawY - pan.y) / zoom,
    };
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (!activeWireStart && (e.target === svgRef.current || (e.target as HTMLElement).getAttribute('data-bg') === 'true')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedCompId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = getSvgMousePos(e);
    setMousePos(pt);
    
    if (isPanning && !draggingCompId) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingCompId) {
      setComponents(comps => comps.map(c => 
        c.id === draggingCompId ? { ...c, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } : c
      ));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (draggingCompId) {
      setComponents(comps => comps.map(c => {
        if (c.id === draggingCompId) {
          let snappedX = snapToGrid ? Math.round(c.x / gridSize) * gridSize : c.x;
          let snappedY = snapToGrid ? Math.round(c.y / gridSize) * gridSize : c.y;

          // Rail alignment snapping: DIN Rail 1 (Y=150) or DIN Rail 2 (Y=280)
          if (c.type === 'IGA' || c.type === 'RCD' || c.type === 'MCB') {
            if (snappedY >= 110 && snappedY <= 210) {
              snappedY = 150;
            } else if (snappedY >= 230 && snappedY <= 340) {
              snappedY = 280;
            }
          }
          return { ...c, x: snappedX, y: snappedY };
        }
        return c;
      }));
    }
    setDraggingCompId(null);
  };

  const handleComponentMouseDown = (e: React.MouseEvent, comp: InteractiveComponent) => {
    if (activeWireStart) return;
    e.stopPropagation();
    setSelectedCompId(comp.id);
    const pt = getSvgMousePos(e);
    setDraggingCompId(comp.id);
    setDragOffset({ x: pt.x - comp.x, y: pt.y - comp.y });
  };

  const getTerminalAbsoluteCoords = (compId: string, termId: string) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return {x:0, y:0};
    const term = comp.terminals.find(t => t.id === termId);
    if (!term) return {x:0, y:0};
    return { x: comp.x + term.x, y: comp.y + term.y };
  };

  const getWirePath = (x1: number, y1: number, x2: number, y2: number) => {
    const dy = Math.abs(y2 - y1) * 0.4;
    return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
  };

  // Calculations for real-time floating HUD
  const usedDinModules = useMemo(() => {
    return components.reduce((sum, c) => sum + (c.dinModules || 0), 0);
  }, [components]);

  const isCapacityExceeded = usedDinModules > boardCapacity;

  const totalLoadPower = useMemo(() => {
    return loads.reduce((sum, l) => sum + l.power, 0);
  }, [loads]);

  const occupancyPercentage = useMemo(() => {
    return Math.round((usedDinModules / boardCapacity) * 100);
  }, [usedDinModules, boardCapacity]);

  const totalLoadCurrent = useMemo(() => {
    return calculateTotalCurrent(loads, supplyType);
  }, [loads, supplyType]);

  const totalMcbAmps = useMemo(() => {
    return components.filter(c => c.type === 'MCB').reduce((sum, c) => sum + (c.ampacity || 0), 0);
  }, [components]);

  const igaComp = useMemo(() => components.find(c => c.type === 'IGA'), [components]);
  const igaAmps = igaComp?.ampacity || 25;
  const isIgaOverloaded = totalLoadCurrent > igaAmps;

  const selectedComponent = useMemo(() => {
    return components.find(c => c.id === selectedCompId) || null;
  }, [components, selectedCompId]);

  // Assembly report text
  const assemblyReportText = useMemo(() => {
    const clientName = selectedClientObj ? (selectedClientObj as any).name : 'Cliente General';
    const dateStr = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let text = `==========================================================\n`;
    text += ` MEMORIA TÉCNICA DE MONTAJE Y DISPOSICIÓN DE TABLERO 2D\n`;
    text += ` ANEXO A INFORME DE OBRA / DECLARACIÓN TE1 SEC CHILE\n`;
    text += `==========================================================\n\n`;
    text += `• FECHA: ${dateStr}\n`;
    text += `• CLIENTE / PROYECTO: ${clientName}\n`;
    text += `• PROPIEDAD & TIPO: ${propertyType}\n`;
    text += `• ACOMETIDA: ${supplyType === 'TRIFASICO_380' ? 'Trifásico 380V (4P)' : 'Monofásico 220V'}\n`;
    text += `• GABINETE DIN: ${boardCapacity} Módulos (Ocupados: ${usedDinModules} DIN)\n`;
    text += `• DEMANDA ESTIMADA: ${loads.reduce((s,l)=>s+l.power,0)} W (${totalLoadCurrent.toFixed(1)} Amperes)\n`;
    text += `• IGA PRINCIPAL: ${igaAmps} A (${isIgaOverloaded ? '¡ALERTA DE SOBRECARGA!' : 'CAPACIDAD OPTIMA'})\n\n`;
    
    text += `DISPOSICIÓN FÍSICA Y COORDENADAS RIEL DIN:\n`;
    components.forEach((c, idx) => {
      text += ` [${idx+1}] ${c.name.padEnd(28)} | Posición: [X:${Math.round(c.x)}px, Y:${Math.round(c.y)}px]\n`;
    });

    return text;
  }, [selectedClientObj, propertyType, supplyType, boardCapacity, usedDinModules, loads, totalLoadCurrent, igaAmps, isIgaOverloaded, components]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(assemblyReportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Normative Validation Map: Checks DIN Rail limits and component collisions
  const componentValidationMap = useMemo(() => {
    const map: Record<string, { hasError: boolean; message?: string }> = {};

    components.forEach(comp => {
      const isDinComponent = comp.type === 'IGA' || comp.type === 'RCD' || comp.type === 'MCB' || comp.type === 'BAR_N' || comp.type === 'BAR_PE';

      // 1. DIN Rail physical bounds check (X < 40 or X + W > 840)
      if (isDinComponent || (comp.y >= 100 && comp.y <= 380)) {
        if (comp.x < 40) {
          map[comp.id] = {
            hasError: true,
            message: `⚠️ Límite Izquierdo Excedido (X: ${Math.round(comp.x)} < 40mm) [RIC N°02]`
          };
          return;
        }
        if (comp.x + comp.w > 840) {
          map[comp.id] = {
            hasError: true,
            message: `⚠️ Límite Derecho Excedido (X: ${Math.round(comp.x + comp.w)} > 840mm) [RIC N°02]`
          };
          return;
        }
      }

      // 2. Collision / Overlap check with other components
      for (const other of components) {
        if (other.id === comp.id) continue;

        const sameYLevel = Math.abs(comp.y - other.y) < 45 ||
          (comp.y < other.y + other.h && comp.y + comp.h > other.y);

        if (sameYLevel) {
          const overlapsX = comp.x < other.x + other.w && comp.x + comp.w > other.x;
          if (overlapsX) {
            map[comp.id] = {
              hasError: true,
              message: `⚠️ Solapamiento físico con "${other.name}" [RIC N°02]`
            };
            return;
          }
        }
      }

      map[comp.id] = { hasError: false };
    });

    return map;
  }, [components]);

  const [showCaptureMenu, setShowCaptureMenu] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Export board design to PNG or PDF technical drawing
  const handleCaptureDesign = async (format: 'png' | 'pdf' = 'png') => {
    if (!svgRef.current) return;
    setIsCapturing(true);
    setShowCaptureMenu(false);

    try {
      const svgElement = svgRef.current;
      const clientName = selectedClientObj ? (selectedClientObj as any).name : 'Cliente General';
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `plano-tablero-sec-${clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${dateStr}`;

      // Clone SVG
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('width', '1600');
      clone.setAttribute('height', '1000');
      clone.setAttribute('style', 'background-color: #0f172a;');

      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsCapturing(false);
          return;
        }

        // Dark slate background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw SVG image
        ctx.drawImage(image, 0, 0, 1600, 1000);

        // Technical title block (Membrete SEC)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.fillRect(40, 870, 1520, 100);
        ctx.strokeRect(40, 870, 1520, 100);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`PLANO DE DISPOSICIÓN FÍSICA Y MONTAJE DE TABLERO ELÉCTRICO`, 60, 900);

        ctx.font = '13px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`CLIENTE: ${clientName} | FECHA: ${new Date().toLocaleDateString('es-CL')}`, 60, 925);
        ctx.fillText(`OCUPACIÓN: ${usedDinModules}/${boardCapacity} DIN (${occupancyPercentage}%) | DEMANDA: ${(totalLoadPower/1000).toFixed(1)} kW (${totalLoadCurrent.toFixed(1)} A) | IGA: ${igaAmps} A`, 60, 948);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`NORMATIVA: RIC N°02 & N°19 SEC CHILE - NEOVOLT PRO`, 1080, 925);
        ctx.fillStyle = occupancyPercentage <= 75 ? '#22c55e' : '#f59e0b';
        ctx.fillText(occupancyPercentage <= 75 ? `✓ CUMPLE RESERVA MINIMA 25% (RIC N°02)` : `⚠️ RESERVA AJUSTADA (<25% LIBRE)`, 1080, 948);

        if (format === 'png') {
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `${fileName}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(blobURL);
          setSnapNotice('📸 Plano del tablero capturado y descargado en formato PNG.');
          setTimeout(() => setSnapNotice(null), 3500);
        } else {
          const { jsPDF } = await import('jspdf');
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
          });

          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 10, 10, 277, 173);
          pdf.save(`${fileName}.pdf`);
          URL.revokeObjectURL(blobURL);
          setSnapNotice('📄 Plano técnico del tablero exportado en formato PDF.');
          setTimeout(() => setSnapNotice(null), 3500);
        }
        setIsCapturing(false);
      };

      image.onerror = () => {
        setIsCapturing(false);
        setSnapNotice('⚠️ Error al renderizar la imagen del tablero.');
        setTimeout(() => setSnapNotice(null), 3500);
      };

      image.src = blobURL;
    } catch (err) {
      console.error('Error capturing design:', err);
      setIsCapturing(false);
      setSnapNotice('⚠️ No se pudo generar la imagen del tablero. Intente nuevamente.');
      setTimeout(() => setSnapNotice(null), 3500);
    }
  };

  // Dynamic status of hovering terminal compatibility during wire drawing
  const wireHoverStatus = useMemo(() => {
    if (!activeWireStart || !hoveredTerm) return null;
    const compatible = areTerminalsCompatible(activeWireStart.term.type, hoveredTerm.term.type);
    return {
      compatible,
      msg: compatible 
        ? `✓ Conexión válida: ${activeWireStart.term.type} -> ${hoveredTerm.term.type}`
        : `🚫 INCOMPATIBLE: Incompatible conectar ${activeWireStart.term.type} con ${hoveredTerm.term.type}`
    };
  }, [activeWireStart, hoveredTerm]);

  return (
    <div id="ProfessionalBoardGeneratorTab" className="ProfessionalBoardGeneratorTab min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
              <MonitorPlay className="w-4 h-4" />
              <span>Simulador 2D - Tableros Eléctricos SEC</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Armado de Tablero &amp; Alineación Magnética</h1>
            <p className="text-xs text-slate-400 mt-1">
              Diseño de tableros con verificación de acometida, capacidad DIN y validación lógica de cableado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAssemblyReportModal(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
            >
              <FileText className="w-4 h-4" />
              <span>Generar Memoria de Montaje</span>
            </button>
            <button
              onClick={handleResetLayout}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reiniciar Disposición</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* LEFT CONTROLS */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* SAVED CLIENTS SELECTOR */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Clientes Guardados en PWA</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  {clients.length} Guardados
                </span>
              </h3>
              
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">Seleccionar Cliente:</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {clients.length > 0 && (
                    <optgroup label="✓ Clientes Guardados en su PWA">
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.rut || 'SEC'})</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Proyectos Preconfigurados de Ejemplo">
                    {DEMO_CLIENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* DIN CAPACITY & CIRCUITS */}
              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Gabinete DIN:</label>
                  <select
                    value={boardCapacity}
                    onChange={(e) => setBoardCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-fuchsia-300 font-bold font-mono"
                  >
                    <option value={12}>12 Módulos</option>
                    <option value={18}>18 Módulos</option>
                    <option value={24}>24 Módulos</option>
                    <option value={36}>36 Módulos</option>
                    <option value={48}>48 Módulos</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Ocupación:</label>
                  <div className={`p-1.5 rounded-lg border text-center font-mono font-bold text-xs ${
                    isCapacityExceeded ? 'bg-rose-950 border-rose-700 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-400'
                  }`}>
                    {usedDinModules} / {boardCapacity} DIN
                  </div>
                </div>
              </div>
            </div>

            {/* NORMATIVE INSTRUCTIONS */}
            <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-indigo-300 flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Interacción Mejorada 2D</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                • <strong>Hitbox Aumentada:</strong> Seleccione y arrastre componentes sin fallos.<br/>
                • <strong>Glow Azul:</strong> Resplandor al pasar el mouse sobre cualquier dispositivo.<br/>
                • <strong>Línea Roja Incompatible:</strong> Intento de conectar polos incompatibles resalta en rojo y bloquea el snap.
              </p>
            </div>

          </div>

          {/* RIGHT BOARD CANVAS WITH INTEGRATED TOOLBAR & FLOATING HUD */}
          <div 
            className={`board-container xl:col-span-3 bg-[#0f172a] border rounded-2xl overflow-hidden shadow-2xl relative min-h-[720px] transition-all duration-300 select-none ${
              isCapacityExceeded ? 'border-rose-500 ring-2 ring-rose-500/50' : 'border-slate-800'
            }`}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey || e.altKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(z => Math.min(2.2, Math.max(0.5, +(z + delta).toFixed(2))));
              }
            }}
          >
            
            {/* COLLAPSIBLE TOP TOOLBAR / MINIMIZED TRIGGER */}
            {isToolbarCollapsed ? (
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                <button
                  onClick={() => setIsToolbarCollapsed(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs font-bold transition hover:border-slate-500 hover:text-white"
                  title="Expandir barra de herramientas del tablero"
                >
                  <Eye className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Mostrar Barra</span>
                </button>
                {isEnergySimulated && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold animate-pulse shadow-lg backdrop-blur-md">
                    <Zap className="w-3 h-3 text-emerald-400" /> Energía ON ⚡
                  </span>
                )}
              </div>
            ) : (
              <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/90 shadow-2xl">
                
                {/* LEFT SECTION: COMPACT TOGGLE SWITCH & ADD COMPONENT */}
                <div className="flex items-center gap-2">
                  {/* COMPACT SUPPLY TOGGLE SWITCH */}
                  <div className="flex items-center bg-slate-950/90 px-2 py-1 rounded-xl border border-slate-800 text-xs gap-1.5" title="Seleccionar Tipo de Acometida (RIC N°01/N°02)">
                    <span className={`text-[11px] font-bold transition ${supplyType === 'MONOFASICO_220' ? 'text-fuchsia-400 font-black' : 'text-slate-500'}`}>
                      220V 1F
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={supplyType === 'TRIFASICO_380'}
                      onClick={() => handleSupplyToggle(supplyType === 'MONOFASICO_220' ? 'TRIFASICO_380' : 'MONOFASICO_220')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        supplyType === 'TRIFASICO_380' ? 'bg-amber-500' : 'bg-fuchsia-600'
                      }`}
                      title={`Alternar a suministro ${supplyType === 'MONOFASICO_220' ? 'Trifásico 380V' : 'Monofásico 220V'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          supplyType === 'TRIFASICO_380' ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[11px] font-bold transition ${supplyType === 'TRIFASICO_380' ? 'text-amber-400 font-black' : 'text-slate-500'}`}>
                      380V 3F
                    </span>
                  </div>

                  {/* PRIMARY ACTION: ADD COMPONENT DROPDOWN */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowQuickAddMenu(!showQuickAddMenu);
                        setShowCaptureMenu(false);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                      title="Añadir dispositivo de protección o disyuntor al riel DIN"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Añadir</span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>

                    {showQuickAddMenu && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-30 space-y-1 text-xs">
                        <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider">Disyuntores MCB</div>
                        <button
                          onClick={() => handleAddComponent('MCB', 10, 'C10A Alumbrado')}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                        >
                          <span>MCB 10A (Alumbrado)</span>
                          <span className="text-[10px] font-mono text-fuchsia-400 font-bold">1 DIN</span>
                        </button>
                        <button
                          onClick={() => handleAddComponent('MCB', 16, 'C16A Enchufes')}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                        >
                          <span>MCB 16A (Enchufes)</span>
                          <span className="text-[10px] font-mono text-fuchsia-400 font-bold">1 DIN</span>
                        </button>
                        <button
                          onClick={() => handleAddComponent('MCB', 20, 'C20A Fuerza')}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                        >
                          <span>MCB 20A (Fuerza/Cocina)</span>
                          <span className="text-[10px] font-mono text-fuchsia-400 font-bold">1 DIN</span>
                        </button>
                        <button
                          onClick={() => handleAddComponent('MCB', 25, 'C25A Clima')}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                        >
                          <span>MCB 25A (Climatización)</span>
                          <span className="text-[10px] font-mono text-fuchsia-400 font-bold">1 DIN</span>
                        </button>
                        <div className="border-t border-slate-800 my-1 pt-1 text-[10px] text-slate-400 font-bold px-2 uppercase tracking-wider">Protección Especial</div>
                        <button
                          onClick={() => handleAddComponent('RCD', 25, 'RCD 25A 30mA')}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                        >
                          <span>RCD Diferencial 25A</span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">2 DIN</span>
                        </button>
                        <button
                          onClick={() => handleAddComponent('DPS', 20, 'DPS Sobretensión')}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between"
                        >
                          <span>Protector DPS Sobretensión</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">1 DIN</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT SECTION: PRIMARY ACTIONS + REARM + WIRING MODE + AUDIO + EXPORT */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {/* WIRING MODE SELECTOR (REALISTIC VS ASSISTED) */}
                  <button
                    onClick={() => {
                      const next = wiringMode === 'realistic' ? 'strict_assisted' : 'realistic';
                      setWiringMode(next);
                      setSnapNotice(next === 'realistic' ? '⚡ Modo Realista Activo: Puedes conectar libremente cualquier terminal. ¡Si hay cortocircuito, disparará las protecciones al energizar!' : '🛡️ Modo Asistido Activo: Bloquea conexiones incompatibles antes de cablear.');
                      setTimeout(() => setSnapNotice(null), 4000);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border ${
                      wiringMode === 'realistic'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={wiringMode === 'realistic' ? 'Modo Realista: Permite fallas y cortocircuitos reales al energizar' : 'Modo Asistido: Validación previa'}
                  >
                    <Flame className={`w-3.5 h-3.5 ${wiringMode === 'realistic' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">{wiringMode === 'realistic' ? 'Modo Realista' : 'Modo Asistido'}</span>
                  </button>

                  {/* REARM ALL BREAKERS (VISIBLE OR HIGHLIGHTED IF TRIPPED) */}
                  {components.some(c => c.isTripped || c.isOff) && (
                    <button
                      onClick={handleRearmAllBreakers}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg animate-pulse transition"
                      title="Rearmar y levantar todas las palancas de disyuntores e IGA disparados"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-200" />
                      <span>Rearmar Protecciones</span>
                    </button>
                  )}

                  {/* PRIMARY ACTION: VERIFICAR Y AUTOCABLEAR */}
                  <button
                    onClick={handleVerifyAndAutoWire}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                    title="Calcula la ruta lógica óptima entre dispositivos y dibuja las líneas de cableado según RIC N°02"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Autocablear</span>
                  </button>

                  {/* PRIMARY ACTION: SIMULAR ENERGIA */}
                  <button
                    onClick={() => handleToggleEnergySimulation()}
                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md border ${
                      activeFault
                        ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-600/40 animate-pulse'
                        : isEnergySimulated
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                    }`}
                    title="Simular flujo de energía eléctrica sobre los cables y probar respuesta de protecciones"
                  >
                    {activeFault ? (
                      <>
                        <Flame className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
                        <span>Falla / Corto 💥</span>
                      </>
                    ) : (
                      <>
                        <Zap className={`w-3.5 h-3.5 ${isEnergySimulated ? 'fill-current text-slate-950 animate-bounce' : 'text-emerald-400'}`} />
                        <span>{isEnergySimulated ? 'Energía ON ⚡' : 'Energizar ⚡'}</span>
                      </>
                    )}
                  </button>

                  {/* AUDIO MUTE TOGGLE */}
                  <button
                    onClick={() => {
                      const nextMute = !isAudioMuted;
                      setIsAudioMuted(nextMute);
                      electricalAudio.setMuted(nextMute);
                    }}
                    className="p-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition"
                    title={isAudioMuted ? 'Activar Sonidos de Arco y Protecciones' : 'Silenciar Efectos de Audio'}
                  >
                    {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>

                  {/* SECONDARY ACTIONS GROUP: ICONS WITH TOOLTIPS */}
                  <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-slate-300 gap-0.5">
                    {/* CAPTURAR DISENO (PNG / PDF) */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowCaptureMenu(!showCaptureMenu);
                          setShowQuickAddMenu(false);
                        }}
                        disabled={isCapturing}
                        className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition relative group"
                        title="Capturar Diseño (Exportar PNG / PDF)"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      {showCaptureMenu && (
                        <div className="absolute top-full right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-30 space-y-1 text-xs">
                          <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider">Capturar Tablero</div>
                          <button
                            onClick={() => {
                              setShowCaptureMenu(false);
                              handleCaptureDesign('png');
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between transition"
                          >
                            <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-emerald-400" /> Imagen PNG</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">.PNG</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowCaptureMenu(false);
                              handleCaptureDesign('pdf');
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 flex items-center justify-between transition"
                          >
                            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-cyan-400" /> Plano PDF</span>
                            <span className="text-[10px] font-mono text-cyan-400 font-bold">.PDF</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SNAP A REJILLA */}
                    <button
                      onClick={() => setSnapToGrid(!snapToGrid)}
                      className={`p-1.5 rounded-lg transition ${
                        snapToGrid
                          ? 'bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/40'
                          : 'hover:text-white hover:bg-slate-800 text-slate-400'
                      }`}
                      title={`Ajuste a Rejilla (${snapToGrid ? 'Activado 20px' : 'Desactivado'})`}
                    >
                      <Move className="w-3.5 h-3.5" />
                    </button>

                    {/* PASO A PASO (VERIFICADOR) */}
                    <button
                      onClick={() => {
                        const next = !isWiringVerifierActive;
                        setIsWiringVerifierActive(next);
                        if (next) setVerifierStep(0);
                        setSnapNotice(next ? "🔍 Modo Verificador activado: Siga las líneas guía paso a paso." : "Verificador desactivado.");
                        setTimeout(() => setSnapNotice(null), 3000);
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        isWiringVerifierActive
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'hover:text-white hover:bg-slate-800 text-slate-400'
                      }`}
                      title={`Verificador de Cableado Paso a Paso (${isWiringVerifierActive ? 'Activado' : 'Desactivado'})`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    {/* BORRAR CABLES */}
                    <button
                      onClick={() => {
                        setWires([]);
                        setSnapNotice("Todos los cables han sido eliminados.");
                        setTimeout(() => setSnapNotice(null), 2500);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Borrar Todos los Cables del Tablero"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* DISCRETE COLLAPSE TOOLBAR BUTTON (EYE / EYE-OFF ICON) */}
                  <button
                    onClick={() => {
                      setIsToolbarCollapsed(true);
                      setShowCaptureMenu(false);
                      setShowQuickAddMenu(false);
                    }}
                    className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition"
                    title="Ocultar barra de herramientas (Expandir lienzo al 100%)"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* ACTIVE SELECTED COMPONENT INSPECTOR / ACTIONS BAR */}
            {selectedComponent && (
              <div className={`absolute ${isToolbarCollapsed ? 'top-14' : 'top-16'} left-3 right-3 z-20 bg-slate-900/95 border-2 border-amber-500/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs`}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <div>
                    <span className="text-white font-black text-xs block">{selectedComponent.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Tipo: {selectedComponent.type} | {selectedComponent.dinModules || 0} Módulo(s) DIN | Posición: [X:{Math.round(selectedComponent.x)}px, Y:{Math.round(selectedComponent.y)}px]
                    </span>
                  </div>
                </div>

                {/* Component Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedComponent.ampacity && (
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold">Calibre:</span>
                      {[10, 16, 20, 25, 32, 40].map(a => (
                        <button
                          key={a}
                          onClick={() => handleUpdateCompAmpacity(selectedComponent.id, a)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                            selectedComponent.ampacity === a ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {a}A
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleMoveCompOnRail(selectedComponent.id, -20)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    title="Mover a la izquierda"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveCompOnRail(selectedComponent.id, 20)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    title="Mover a la derecha"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteComponent(selectedComponent.id)}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition shadow"
                    title="Eliminar este componente del riel DIN"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>

                  <button
                    onClick={() => setSelectedCompId(null)}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* VERIFICADOR DE CABLEADO - STEP GUIDANCE BANNER */}
            {isWiringVerifierActive && activeStep && !selectedComponent && (
              <div className={`absolute ${isToolbarCollapsed ? 'top-14' : 'top-16'} left-3 right-3 z-20 bg-slate-900/95 border-2 border-amber-500/80 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl space-y-2`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Verificador de Cableado - Paso {verifierStep + 1} / {expectedWiringSteps.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setVerifierStep(prev => Math.max(0, prev - 1))}
                      disabled={verifierStep === 0}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-[11px] font-bold transition"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setVerifierStep(prev => Math.min(expectedWiringSteps.length - 1, prev + 1))}
                      disabled={verifierStep === expectedWiringSteps.length - 1}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-[11px] font-bold transition"
                    >
                      Siguiente →
                    </button>
                    <button
                      onClick={() => handleAutoWireStep(activeStep)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-black shadow transition"
                    >
                      ⚡ Cablear Paso
                    </button>
                    <button
                      onClick={handleAutoWireAll}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shadow transition"
                    >
                      ✓ Cablear Todo
                    </button>
                    <button
                      onClick={() => setIsWiringVerifierActive(false)}
                      className="text-slate-400 hover:text-white p-1 ml-1"
                      title="Cerrar Verificador"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <strong className="text-white block font-bold text-xs">{activeStep.title}</strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{activeStep.description}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isStepCompleted(activeStep)
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                        : 'bg-amber-950 text-amber-300 border-amber-500/50 animate-pulse'
                    }`}>
                      {isStepCompleted(activeStep) ? '✓ CONECTADO' : '⏳ PENDIENTE (Línea Punteada Guía)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* REAL-TIME FLOATING STATISTICS HUD PANEL (COLLAPSIBLE, BOTTOM-LEFT) */}
            {isHudCollapsed ? (
              <button
                onClick={() => setIsHudCollapsed(false)}
                className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/80 shadow-2xl text-xs text-slate-300 hover:border-slate-500 hover:text-white transition"
                title="Expandir Estadísticas de Tablero"
              >
                <Activity className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="font-mono font-bold text-slate-200">{usedDinModules}/{boardCapacity} DIN</span>
                <span className="text-slate-500">|</span>
                <span className="font-mono text-amber-400 font-bold">{(totalLoadPower / 1000).toFixed(1)} kW</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-2xl space-y-2 min-w-[280px] max-w-xs text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Estadísticas en Vivo
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      isIgaOverloaded ? 'bg-rose-950 border-rose-600 text-rose-300 animate-pulse' : 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    }`}>
                      {isIgaOverloaded ? '⚡ SOBRECARGA' : '✓ IGA OK'}
                    </span>
                    <button
                      onClick={() => setIsHudCollapsed(true)}
                      className="p-0.5 text-slate-400 hover:text-white rounded"
                      title="Minimizar panel de estadísticas"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">DIN:</span>
                    <span className={`text-xs font-black ${isCapacityExceeded ? 'text-rose-400' : 'text-slate-100'}`}>
                      {usedDinModules}/{boardCapacity}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Potencia:</span>
                    <span className="text-xs font-black text-amber-400">
                      {(totalLoadPower / 1000).toFixed(1)}kW
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block font-sans">Corriente:</span>
                    <span className={`text-xs font-black ${isIgaOverloaded ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {totalLoadCurrent.toFixed(1)}A
                    </span>
                  </div>
                </div>

                {/* PHYSICAL OCCUPANCY PROGRESS BAR */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-sans">
                    <span className="text-slate-400 font-bold">Ocupación Física:</span>
                    <span className={`font-mono font-bold ${occupancyPercentage > 100 ? 'text-rose-400' : occupancyPercentage > 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {occupancyPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        occupancyPercentage > 100 
                          ? 'bg-rose-500' 
                          : occupancyPercentage > 75 
                            ? 'bg-amber-400' 
                            : 'bg-emerald-400'
                      }`} 
                      style={{ width: `${Math.min(100, occupancyPercentage)}%` }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FLOATING ZOOM & VIEW CONTROLS (BOTTOM-RIGHT CORNER) */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-1 gap-1 text-slate-300">
              <button
                onClick={handleZoomIn}
                className="p-2 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="Acercar Zoom (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="px-2 py-1 text-[10px] font-mono font-bold text-cyan-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Restablecer Vista (100%)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="Alejar Zoom (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            {/* SNAP TOAST NOTICE */}
            <AnimatePresence>
              {snapNotice && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-16 left-4 z-30 bg-slate-900/95 border border-amber-500/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-amber-200 font-mono shadow-2xl flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{snapNotice}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SVG BOARD CANVAS WITH ZOOM & PAN TRANSFORM */}
            <svg
              ref={svgRef}
              data-bg="true"
              className={`w-full h-full min-h-[720px] transition-[padding] duration-200 ${isToolbarCollapsed ? 'pt-0' : 'pt-12'} ${
                isScreenShaking ? 'screen-shake-effect' : ''
              } ${
                isPanning ? 'cursor-grabbing' : draggingCompId ? 'cursor-grabbing' : activeWireStart ? 'cursor-crosshair' : 'cursor-grab'
              }`}
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleMouseMove}
              onClick={() => {
                if(activeWireStart) setActiveWireStart(null);
              }}
            >
              <defs>
                {/* 10px Sub-grid Pattern */}
                <pattern id="gridPattern10" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="1,2" />
                </pattern>
                {/* 50px Major Grid Pattern */}
                <pattern id="gridPattern50" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect width="50" height="50" fill="url(#gridPattern10)" />
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#475569" strokeWidth="0.8" />
                </pattern>

                {/* BLUE GLOW FILTER FOR HOVER / SELECTION */}
                <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* RED GLOW FILTER FOR INCOMPATIBLE WIRE TERMINAL */}
                <filter id="redGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* ENERGY GLOW FILTER */}
                <filter id="energyGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* VERIFIER GLOW FILTER */}
                <filter id="verifierGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* GRID BACKGROUND */}
              <rect 
                data-bg="true"
                width="100%" 
                height="100%" 
                fill="url(#gridPattern50)" 
                style={{ opacity: draggingCompId ? 0.35 : 0.12 }}
              />

              {/* TRANSFORMED CANVAS GROUP (PAN & ZOOM) */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* Rieles DIN */}
                <rect x="40" y="180" width="800" height="40" rx="2" fill="#334155" stroke="#475569" />
                <rect x="40" y="310" width="800" height="40" rx="2" fill="#334155" stroke="#475569" />
                <rect x="40" y="440" width="800" height="15" rx="2" fill="#1e293b" stroke="#334155" />

                {/* DIN Rail Labels */}
                <text x="45" y="175" fill="#64748b" fontSize="10" fontWeight="bold">Riel DIN 1 (Cabecera &amp; Protecciones)</text>
                <text x="45" y="305" fill="#64748b" fontSize="10" fontWeight="bold">Riel DIN 2 (Circuitos &amp; Barras de Distribución)</text>
                <text x="45" y="435" fill="#64748b" fontSize="10" fontWeight="bold">Cargas &amp; Consumos Finales</text>

                {/* DRAWN WIRES */}
                {wires.map(w => {
                  const p1 = getTerminalAbsoluteCoords(w.fromCompId, w.fromTermId);
                  const p2 = getTerminalAbsoluteCoords(w.toCompId, w.toTermId);
                  return (
                    <g key={w.id} className="group cursor-pointer">
                      <path
                        d={getWirePath(p1.x, p1.y, p2.x, p2.y)}
                        fill="none"
                        stroke={w.color}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {/* ELECTRIC PULSE ANIMATION WHEN ENERGIZED */}
                      {isEnergySimulated && (
                        <path
                          d={getWirePath(p1.x, p1.y, p2.x, p2.y)}
                          fill="none"
                          stroke={w.color === '#38bdf8' ? '#38bdf8' : w.color === '#22c55e' ? '#4ade80' : '#facc15'}
                          strokeWidth="4"
                          strokeLinecap="round"
                          className="electric-pulse-wire"
                          filter="url(#energyGlow)"
                        />
                      )}
                      <path
                        d={getWirePath(p1.x, p1.y, p2.x, p2.y)}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="12"
                        className="hover:stroke-rose-500/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWires(wires.filter(item => item.id !== w.id));
                        }}
                      />
                    </g>
                  );
                })}

                {/* VERIFICADOR DE CABLEADO - DASHED GUIDANCE LINE */}
                {isWiringVerifierActive && activeStep && (
                  <g key={`verifier_guide_${activeStep.id}`}>
                    {/* Dashed line path */}
                    <path
                      d={getWirePath(
                        getTerminalAbsoluteCoords(activeStep.fromCompId, activeStep.fromTermId).x,
                        getTerminalAbsoluteCoords(activeStep.fromCompId, activeStep.fromTermId).y,
                        getTerminalAbsoluteCoords(activeStep.toCompId, activeStep.toTermId).x,
                        getTerminalAbsoluteCoords(activeStep.toCompId, activeStep.toTermId).y
                      )}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      className="verifier-dashed-wire"
                      filter="url(#verifierGlow)"
                    />
                    {/* Start terminal pulsing indicator */}
                    <circle
                      cx={getTerminalAbsoluteCoords(activeStep.fromCompId, activeStep.fromTermId).x}
                      cy={getTerminalAbsoluteCoords(activeStep.fromCompId, activeStep.fromTermId).y}
                      r={12}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      className="animate-ping"
                    />
                    {/* End terminal pulsing indicator */}
                    <circle
                      cx={getTerminalAbsoluteCoords(activeStep.toCompId, activeStep.toTermId).x}
                      cy={getTerminalAbsoluteCoords(activeStep.toCompId, activeStep.toTermId).y}
                      r={12}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      className="animate-ping"
                    />
                  </g>
                )}

                {/* ACTIVE DRAWING WIRE WITH RED INCOMPATIBILITY FEEDBACK */}
                {activeWireStart && (
                  <path
                    d={getWirePath(
                      getTerminalAbsoluteCoords(activeWireStart.compId, activeWireStart.term.id).x, 
                      getTerminalAbsoluteCoords(activeWireStart.compId, activeWireStart.term.id).y, 
                      mousePos.x, mousePos.y
                    )}
                    fill="none"
                    stroke={
                      wireHoverStatus && !wireHoverStatus.compatible
                        ? '#f43f5e'
                        : getTerminalColor(activeWireStart.term.type)
                    }
                    strokeWidth="3.5"
                    strokeDasharray="6,4"
                    strokeLinecap="round"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* COMPONENTS WITH EXPANDED HITBOX & BLUE GLOW ON HOVER */}
                {[...components].sort((a,b) => (a.id === draggingCompId ? 1 : b.id === draggingCompId ? -1 : 0)).map(comp => {
                  const isHovered = hoveredCompId === comp.id || draggingCompId === comp.id;
                  const isSelected = selectedCompId === comp.id;
                  const validation = componentValidationMap[comp.id] || { hasError: false };

                  return (
                    <g 
                      key={comp.id} 
                      transform={`translate(${comp.x}, ${comp.y})`}
                      onMouseEnter={() => setHoveredCompId(comp.id)}
                      onMouseLeave={() => setHoveredCompId(null)}
                      onMouseDown={(e: React.MouseEvent) => handleComponentMouseDown(e, comp)}
                      className={draggingCompId === comp.id ? 'cursor-grabbing' : activeWireStart ? 'cursor-crosshair' : 'cursor-grab'}
                    >
                      
                      {/* EXPANDED TRANSPARENT HITBOX (14px padding) for easy click/drag */}
                      <rect
                        x={-14}
                        y={-14}
                        width={comp.w + 28}
                        height={comp.h + 28}
                        fill="transparent"
                        style={{ pointerEvents: 'all' }}
                      />

                      {/* Component Body */}
                      {comp.type === 'BAR_N' ? (
                        <rect x={0} y={0} width={comp.w} height={comp.h} fill="#1e3a8a" rx="4" stroke="#3b82f6" strokeWidth="1.5" />
                      ) : comp.type === 'BAR_PE' ? (
                        <rect x={0} y={0} width={comp.w} height={comp.h} fill="#14532d" rx="4" stroke="#22c55e" strokeWidth="1.5" />
                      ) : comp.type === 'LOAD' ? (
                        <rect x={0} y={0} width={comp.w} height={comp.h} fill="#1e293b" rx="8" stroke="#64748b" strokeWidth="2" />
                      ) : comp.type === 'GRID' ? (
                        <rect x={0} y={0} width={comp.w} height={comp.h} fill="#334155" rx="8" stroke="#94a3b8" strokeWidth="2" />
                      ) : (
                        <rect x={0} y={0} width={comp.w} height={comp.h} fill="#0f172a" rx="6" stroke={comp.isTripped ? "#ef4444" : "#475569"} strokeWidth="2" />
                      )}

                      {/* MECHANICAL DIN SWITCH LEVER & STATUS FOR BREAKERS (IGA, RCD, MCB) */}
                      {(comp.type === 'IGA' || comp.type === 'RCD' || comp.type === 'MCB') && (
                        <g 
                          transform={`translate(${comp.w / 2 - 12}, 48)`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComponentSwitch(comp.id);
                          }}
                          className="cursor-pointer"
                        >
                          {/* Switch recess slot */}
                          <rect x={0} y={0} width={24} height={32} rx={3} fill="#020617" stroke="#334155" strokeWidth={1} />
                          
                          {/* Switch handle lever: UP (ON / Green), DOWN (OFF / Slate), TRIPPED (Down/Red) */}
                          {comp.isTripped ? (
                            <g>
                              <rect x={2} y={16} width={20} height={14} rx={2} fill="#ef4444" stroke="#fca5a5" strokeWidth={1} />
                              <text x={12} y={26} textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" style={{ pointerEvents: 'none' }}>TRIP</text>
                            </g>
                          ) : comp.isOff ? (
                            <g>
                              <rect x={2} y={16} width={20} height={14} rx={2} fill="#475569" stroke="#94a3b8" strokeWidth={1} />
                              <text x={12} y={26} textAnchor="middle" fill="#cbd5e1" fontSize="7" fontWeight="900" style={{ pointerEvents: 'none' }}>OFF</text>
                            </g>
                          ) : (
                            <g>
                              <rect x={2} y={2} width={20} height={14} rx={2} fill="#22c55e" stroke="#86efac" strokeWidth={1} />
                              <text x={12} y={12} textAnchor="middle" fill="#052e16" fontSize="7" fontWeight="900" style={{ pointerEvents: 'none' }}>ON</text>
                            </g>
                          )}
                        </g>
                      )}

                      {/* TRIPPED ALARM BADGE & PULSE */}
                      {comp.isTripped && (
                        <g 
                          transform={`translate(${comp.w / 2}, -16)`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComponentSwitch(comp.id);
                          }}
                          className="cursor-pointer animate-bounce"
                        >
                          <rect x={-45} y={-10} width={90} height={20} rx={10} fill="#dc2626" stroke="#fecaca" strokeWidth={1.5} filter="url(#redGlow)" />
                          <text x={0} y={3} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                            💥 DISPARADO
                          </text>
                        </g>
                      )}

                      {/* LOAD STATUS READOUT (WHEN POWERED IN ENERGIZED MODE) */}
                      {comp.type === 'LOAD' && isEnergySimulated && (
                        <g transform={`translate(${comp.w / 2}, 54)`}>
                          {poweredLoadsMap[comp.id.replace('load_comp_', 'd1_l').replace('load_comp_', 'd2_l')]?.status === 'OPERATIONAL' ||
                           Object.values(poweredLoadsMap).some(l => l.status === 'OPERATIONAL') ? (
                            <g>
                              <rect x={-36} y={-8} width={72} height={16} rx={4} fill="#052e16" stroke="#22c55e" strokeWidth={1} />
                              <text x={0} y={3} textAnchor="middle" fill="#4ade80" fontSize="8" fontWeight="bold">
                                220V • ACTIVO
                              </text>
                            </g>
                          ) : (
                            <g>
                              <rect x={-36} y={-8} width={72} height={16} rx={4} fill="#1e1b4b" stroke="#6366f1" strokeWidth={1} />
                              <text x={0} y={3} textAnchor="middle" fill="#a5b4fc" fontSize="8" fontWeight="bold">
                                0V • INACTIVO
                              </text>
                            </g>
                          )}
                        </g>
                      )}

                      {/* NORMATIVE ERROR RED HIGHLIGHT & GLOW (COLLISION OR OUT OF DIN RAIL BOUNDS) */}
                      {validation.hasError && (
                        <>
                          <rect
                            x={-3}
                            y={-3}
                            width={comp.w + 6}
                            height={comp.h + 6}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="3"
                            rx="8"
                            filter="url(#redGlow)"
                            className="animate-pulse"
                          />
                          {/* Alert icon badge */}
                          <g transform={`translate(${comp.w - 14}, -7)`}>
                            <circle cx="7" cy="7" r="7" fill="#f43f5e" filter="url(#redGlow)" />
                            <text x="7" y="11" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">!</text>
                          </g>
                        </>
                      )}

                      {/* ACTIVE SELECTION OUTLINE */}
                      {isSelected && !validation.hasError && (
                        <rect
                          x={-4}
                          y={-4}
                          width={comp.w + 8}
                          height={comp.h + 8}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          rx={comp.type.startsWith('BAR') ? "6" : "8"}
                          strokeDasharray="4,2"
                          filter="url(#verifierGlow)"
                        />
                      )}

                      {/* ENERGIZED GLOW & STATUS LED WHEN SIMULATING ENERGY (AND NOT TRIPPED) */}
                      {isEnergySimulated && !comp.isTripped && !comp.isOff && (
                        <>
                          <rect
                            x={-2}
                            y={-2}
                            width={comp.w + 4}
                            height={comp.h + 4}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                            rx={comp.type.startsWith('BAR') ? "6" : "8"}
                            filter="url(#energyGlow)"
                          />
                          <g transform={`translate(${comp.w - (comp.w < 60 ? 20 : 34)}, 6)`}>
                            <circle cx="5" cy="5" r="4" fill="#22c55e" filter="url(#energyGlow)" className="animate-pulse" />
                            {comp.w >= 60 && (
                              <text x="12" y="8" fill="#22c55e" fontSize="8" fontWeight="900" style={{ pointerEvents: 'none' }}>ON ⚡</text>
                            )}
                          </g>
                        </>
                      )}

                      {/* BLUE GLOW HIGHLIGHT ON HOVER OR DRAG (WHEN NO ERROR) */}
                      {isHovered && !isSelected && !validation.hasError && (
                        <rect 
                          x={-2} 
                          y={-2} 
                          width={comp.w + 4} 
                          height={comp.h + 4} 
                          fill="none" 
                          stroke="#38bdf8" 
                          strokeWidth="2.5" 
                          rx="8" 
                          filter="url(#blueGlow)" 
                        />
                      )}

                      {/* Label */}
                      <text 
                        x={comp.w/2} 
                        y={comp.type.startsWith('BAR') ? 20 : comp.type === 'GRID' ? 32 : (comp.type === 'IGA' || comp.type === 'RCD' || comp.type === 'MCB') ? 24 : 40} 
                        textAnchor="middle" 
                        fill={validation.hasError ? "#fda4af" : "#f8fafc"} 
                        fontSize={comp.type.startsWith('BAR') ? 11 : 10} 
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        {comp.name}
                      </text>

                      {/* NORMATIVE ERROR FLOATING TOOLTIP */}
                      {validation.hasError && (isHovered || isSelected || draggingCompId === comp.id) && validation.message && (
                        <g transform={`translate(${comp.w / 2}, ${comp.h + 28})`} className="pointer-events-none z-50">
                          <rect
                            x={-140}
                            y={-14}
                            width={280}
                            height={26}
                            rx={6}
                            fill="#450a0a"
                            stroke="#f43f5e"
                            strokeWidth={1.5}
                            filter="url(#redGlow)"
                          />
                          <text
                            x={0}
                            y={3}
                            textAnchor="middle"
                            fill="#fecdd3"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            {validation.message}
                          </text>
                        </g>
                      )}

                      {/* Terminals */}
                      {comp.terminals.map(term => {
                        const isActive = activeWireStart?.term.id === term.id && activeWireStart.compId === comp.id;
                        const isHoveredTarget = hoveredTerm?.term.id === term.id && hoveredTerm.compId === comp.id;
                        const isCompatible = activeWireStart && areTerminalsCompatible(activeWireStart.term.type, term.type);
                        const isIncompatible = activeWireStart && !isCompatible;

                        return (
                          <g 
                            key={term.id} 
                            onMouseEnter={() => setHoveredTerm({ compId: comp.id, term })}
                            onMouseLeave={() => setHoveredTerm(null)}
                            onClick={(e) => handleTerminalClick(e, comp, term)}
                            className="cursor-pointer group/term"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                          >
                            {/* Expanded terminal touch target (18px) */}
                            <circle
                              cx={term.x}
                              cy={term.y}
                              r={18}
                              fill="transparent"
                              style={{ pointerEvents: 'all' }}
                            />

                            {/* RED GLOW HIGHLIGHT IF HOVERED AND INCOMPATIBLE */}
                            {isIncompatible && isHoveredTarget && (
                              <circle
                                cx={term.x}
                                cy={term.y}
                                r={12}
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="3"
                                filter="url(#redGlow)"
                              />
                            )}

                            {/* BLUE / COMPATIBLE GLOW HIGHLIGHT */}
                            {isCompatible && isHoveredTarget && (
                              <circle
                                cx={term.x}
                                cy={term.y}
                                r={11}
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="2.5"
                                filter="url(#blueGlow)"
                              />
                            )}

                            {/* Visual Terminal Circle */}
                            <circle
                              cx={term.x}
                              cy={term.y}
                              r={isActive ? 8 : isHoveredTarget ? 7 : 5.5}
                              fill={isIncompatible && isHoveredTarget ? '#f43f5e' : getTerminalColor(term.type)}
                              stroke="#ffffff"
                              strokeWidth={isActive ? 2.5 : 1}
                            />
                            
                            <text
                              x={term.x}
                              y={term.position === 'top' ? term.y - 12 : term.y + 18}
                              textAnchor="middle"
                              fill={isIncompatible && isHoveredTarget ? '#f43f5e' : '#94a3b8'}
                              fontSize="9"
                              fontWeight="bold"
                              style={{ pointerEvents: 'none' }}
                            >
                              {term.label}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* --- DYNAMIC ARC FLASH & SHORT CIRCUIT EXPLOSION VISUALS --- */}
                {activeFault && (
                  <g key={`fault_visual_${activeFault.id}`} transform={`translate(${activeFault.x}, ${activeFault.y})`}>
                    {/* Shockwave circle */}
                    <circle cx="0" cy="0" r="45" fill="none" stroke="#facc15" strokeWidth="3" opacity="0.8" className="animate-ping" />
                    <circle cx="0" cy="0" r="28" fill="rgba(239, 68, 68, 0.45)" filter="url(#redGlow)" className="animate-pulse" />

                    {/* Arc Flash Lightning Burst Paths */}
                    <path
                      d="M -15 -18 L -3 -2 L -18 8 L 4 6 L -6 22 L 14 0 L 2 -10 L 16 -18 Z"
                      fill="#ffffff"
                      stroke="#facc15"
                      strokeWidth="2"
                      className="arc-flash-burst"
                    />

                    {/* Exploding Spark Particles */}
                    {sparkParticles.map(p => (
                      <circle
                        key={p.id}
                        cx={p.x - activeFault.x}
                        cy={p.y - activeFault.y}
                        r={p.size}
                        fill={p.color}
                        style={{
                          '--tx': `${p.tx}px`,
                          '--ty': `${p.ty}px`,
                        } as any}
                        className="spark-particle-anim"
                      />
                    ))}

                    {/* Smoke Cloud */}
                    <g className="smoke-cloud-anim">
                      <circle cx="-6" cy="-12" r="14" fill="#64748b" opacity="0.6" />
                      <circle cx="8" cy="-16" r="18" fill="#475569" opacity="0.5" />
                      <circle cx="0" cy="-22" r="12" fill="#334155" opacity="0.6" />
                    </g>

                    {/* Floating SVG Fault Label */}
                    <g transform="translate(0, -38)">
                      <rect x="-85" y="-12" width="170" height="24" rx="12" fill="#450a0a" stroke="#ef4444" strokeWidth="2" filter="url(#redGlow)" />
                      <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900">
                        ⚡ {activeFault.title.toUpperCase()}
                      </text>
                    </g>
                  </g>
                )}

              </g>
            </svg>

            {/* FLOATING REAL-TIME SHORT CIRCUIT DIAGNOSTIC HUD BANNER */}
            {activeFault && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] bg-slate-950/95 border-2 border-rose-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fadeIn">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-rose-600/30 text-rose-400 rounded-xl border border-rose-500/50 shrink-0 animate-bounce">
                      <Flame className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-rose-900/80 text-rose-200 rounded border border-rose-700">
                          {activeFault.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-rose-400 font-bold">
                          Icc ≈ {activeFault.iccAmps.toLocaleString('es-CL')} A • {activeFault.timeMs} ms
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white mt-1">
                        {activeFault.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {activeFault.description}
                      </p>
                      <div className="text-[11px] text-amber-300 font-mono mt-1.5 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Referencia Normativa: <strong>{activeFault.normReference}</strong></span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveFault(null)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400">
                    Dispositivo activado: <strong className="text-rose-400 font-mono">{activeFault.trippedCompName || 'IGA'}</strong> (Palanca abajo).
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFaultDetailsModal(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ver Análisis Técnico</span>
                    </button>
                    <button
                      onClick={handleRearmAllBreakers}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                      <span>Rearmar Protecciones</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED ELECTRICAL FAULT TECHNICAL ANALYSIS MODAL */}
      {showFaultDetailsModal && activeFault && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold">
                <Flame className="w-6 h-6 text-yellow-300" />
                <div>
                  <span className="text-[10px] text-rose-300 uppercase tracking-widest font-mono block">Diagnóstico de Cortocircuito & Falla Eléctrica</span>
                  <h3 className="text-base font-black text-white">{activeFault.title}</h3>
                </div>
              </div>
              <button onClick={() => setShowFaultDetailsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detalle del Evento Físico</div>
                <p className="leading-relaxed text-slate-200">
                  {activeFault.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Corriente Cortocircuito</div>
                  <div className="text-sm font-black text-yellow-400 font-mono mt-0.5">
                    {activeFault.iccAmps.toLocaleString('es-CL')} A
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tiempo de Disparo</div>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                    &lt; {activeFault.timeMs} ms
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Protección Actuada</div>
                  <div className="text-sm font-black text-rose-400 font-mono mt-0.5">
                    {activeFault.trippedCompName || 'IGA'}
                  </div>
                </div>
              </div>

              <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-3.5 space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Pliego Técnico Normativo SEC Aplicable:</span>
                </div>
                <div className="font-mono text-slate-200 font-semibold">
                  {activeFault.normReference}
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                  En conformidad con la normativa eléctrica de Chile, las protecciones magnéticas y diferenciales deben despejar fallas instantáneamente para evitar sobrecalentamiento de conductores, riesgos de incendio y electrocución.
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center gap-2">
                <button
                  onClick={() => {
                    // Remove faulty wires if desired or close
                    setShowFaultDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
                >
                  Cerrar Análisis
                </button>
                <button
                  onClick={() => {
                    setShowFaultDetailsModal(false);
                    handleRearmAllBreakers();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white" />
                  <span>Rearmar y Reintentar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEASIBILITY WARNING MODAL (RIC NORMATIVE CHECK) */}
      {showFeasibilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span className="text-sm uppercase tracking-wider">Inviabilidad Física / Normativa SEC</span>
              </div>
              <button onClick={() => setShowFeasibilityModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                El tablero actual no cumple con las condiciones mínimas para autocablearse debido a las siguientes observaciones del <strong>Pliego Técnico Normativo RIC</strong>:
              </p>

              <div className="space-y-2 bg-rose-950/40 border border-rose-900/60 rounded-xl p-3">
                {feasibilityErrors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-rose-200">
                    <span className="text-rose-400 font-bold font-mono shrink-0">[{idx + 1}]</span>
                    <span>{err}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowFeasibilityModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
                >
                  Entendido / Corregir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSEMBLY REPORT MODAL */}
      {showAssemblyReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-wider block">Documento Técnico SEC</span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>Memoria Técnica de Montaje y Disposición (Tablero 2D)</span>
                </h3>
              </div>
              <button onClick={() => setShowAssemblyReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                value={assemblyReportText}
                readOnly
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 leading-relaxed custom-scrollbar"
              />

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-slate-500 font-mono">NEOVOLT SEC - Módulo de Tableros 2D</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition"
                  >
                    {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copiedReport ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export const ProfessionalBoardGeneratorTab = InteractiveBoardTab;
export const PhysicalBoardSimulationTab = InteractiveBoardTab;
