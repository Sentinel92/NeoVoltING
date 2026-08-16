import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Play, CheckCircle2, AlertTriangle, RotateCcw,
  Trash2, Users, Info, MonitorPlay, Scale,
  Sparkles, ShieldAlert, FileText, Copy, Download, Camera,
  Layers, X, Check, Activity, Sliders, Building2,
  ZoomIn, ZoomOut, Maximize2, Move, Plus, Wand2,
  ArrowLeft, ArrowRight, Settings, ShieldCheck, Gauge,
  Eye, EyeOff, ChevronDown, ChevronUp, SlidersHorizontal
} from 'lucide-react';
import { ClientRecord, RoomData, HighAppliance } from '../types';

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
}

export interface Wire {
  id: string;
  fromCompId: string;
  fromTermId: string;
  toCompId: string;
  toTermId: string;
  color: string;
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
      case 'L1': return '#ef4444'; // Rojo
      case 'L2': return '#475569'; // Gris Oscuro / Negro
      case 'L3': return '#d97706'; // Marrón / Ámbar
      case 'L': return '#ef4444';  // Rojo
      case 'N': return '#38bdf8';  // Azul Claro
      case 'PE': return '#22c55e'; // Verde
      default: return '#cbd5e1';
    }
  };

  const areTerminalsCompatible = (t1: TerminalType, t2: TerminalType) => {
    if (t1 === t2) return true;
    // L1, L2, L3 son todas fases en Trifásico
    if ((t1 === 'L' || t1 === 'L1' || t1 === 'L2' || t1 === 'L3') && 
        (t2 === 'L' || t2 === 'L1' || t2 === 'L2' || t2 === 'L3')) {
      return true;
    }
    return false;
  };

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
      
      // BLOQUEO DE SNAP POR INCOMPATIBILIDAD SEC
      if (!areTerminalsCompatible(activeWireStart.term.type, terminal.type)) {
        setSnapNotice(`🚫 BLOQUEADO POR NORMA SEC: No se puede conectar ${activeWireStart.term.type} con ${terminal.type}`);
        setTimeout(() => setSnapNotice(null), 3500);
        setActiveWireStart(null);
        return;
      }

      const wireColor = getTerminalColor(terminal.type);
      const newWire: Wire = {
        id: `w_${Date.now()}`,
        fromCompId: activeWireStart.compId,
        fromTermId: activeWireStart.term.id,
        toCompId: comp.id,
        toTermId: terminal.id,
        color: wireColor
      };

      setWires([...wires, newWire]);
      setActiveWireStart(null);
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

                {/* RIGHT SECTION: PRIMARY ACTIONS + SECONDARY TOOLTIP ICON GROUP + DISCRETE COLLAPSE */}
                <div className="flex items-center gap-2 text-xs">
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
                    onClick={() => {
                      const next = !isEnergySimulated;
                      setIsEnergySimulated(next);
                      setSnapNotice(next ? "⚡ Energía simulada activada: circuito energizado y componentes encendidos." : "🛑 Simulación de energía desactivada.");
                      setTimeout(() => setSnapNotice(null), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm border ${
                      isEnergySimulated
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-emerald-500/40 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                    }`}
                    title="Simular flujo de energía eléctrica sobre los cables validados"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isEnergySimulated ? 'fill-current text-slate-950 animate-bounce' : 'text-emerald-400'}`} />
                    <span>{isEnergySimulated ? 'Energía ON ⚡' : 'Simular'}</span>
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
                        <rect x={0} y={0} width={comp.w} height={comp.h} fill="#0f172a" rx="6" stroke="#475569" strokeWidth="2" />
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

                      {/* ENERGIZED GLOW & STATUS LED WHEN SIMULATING ENERGY */}
                      {isEnergySimulated && (
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
                        y={comp.type.startsWith('BAR') ? 20 : comp.type === 'GRID' ? 32 : 40} 
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
              </g>
            </svg>
          </div>
        </div>
      </div>

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
