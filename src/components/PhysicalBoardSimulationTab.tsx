import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Play, CheckCircle2, AlertTriangle, RotateCcw,
  Trash2, Users, Info, MonitorPlay, Scale,
  Sparkles, ShieldAlert, FileText, Copy, Download,
  Layers, X, Check, Activity, Sliders, Building2
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
    if (!svgRef.current) return {x:0, y:0};
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return { x: cursorPt.x, y: cursorPt.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = getSvgMousePos(e);
    setMousePos(pt);
    
    if (draggingCompId) {
      setComponents(comps => comps.map(c => 
        c.id === draggingCompId ? { ...c, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } : c
      ));
    }
  };

  const handleMouseUp = () => {
    if (draggingCompId) {
      setComponents(comps => comps.map(c => {
        if (c.id === draggingCompId) {
          const snappedX = snapToGrid ? Math.round(c.x / gridSize) * gridSize : c.x;
          const snappedY = snapToGrid ? Math.round(c.y / gridSize) * gridSize : c.y;
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

  const totalLoadCurrent = useMemo(() => {
    return calculateTotalCurrent(loads, supplyType);
  }, [loads, supplyType]);

  const totalMcbAmps = useMemo(() => {
    return components.filter(c => c.type === 'MCB').reduce((sum, c) => sum + (c.ampacity || 0), 0);
  }, [components]);

  const igaComp = useMemo(() => components.find(c => c.type === 'IGA'), [components]);
  const igaAmps = igaComp?.ampacity || 25;
  const isIgaOverloaded = totalLoadCurrent > igaAmps;

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
            className={`board-container xl:col-span-3 bg-[#0f172a] border rounded-2xl overflow-hidden shadow-2xl relative min-h-[660px] transition-all duration-300 ${
              isCapacityExceeded ? 'border-rose-500 ring-2 ring-rose-500/50' : 'border-slate-800'
            }`}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            
            {/* TOOLBAR INSIDE BOARD CONTAINER (ACOMETIDA & GRID) */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl">
              
              {/* ACOMETIDA SELECTOR SIDEBAR/TOOLBAR */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-fuchsia-400" />
                  <span>Acometida SEC:</span>
                </span>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => handleSupplyToggle('MONOFASICO_220')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      supplyType === 'MONOFASICO_220'
                        ? 'bg-fuchsia-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Monofásico (220V)</span>
                  </button>
                  <button
                    onClick={() => handleSupplyToggle('TRIFASICO_380')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      supplyType === 'TRIFASICO_380'
                        ? 'bg-amber-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Trifásico (380V - 4P)</span>
                  </button>
                </div>
              </div>

              {/* GRID, WIRE & SIMULATION ACTIONS */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* SIMULAR ENERGIA BUTTON */}
                <button
                  onClick={() => {
                    const next = !isEnergySimulated;
                    setIsEnergySimulated(next);
                    setSnapNotice(next ? "⚡ Energía simulada activada: circuito energizado y componentes encendidos." : "🛑 Simulación de energía desactivada.");
                    setTimeout(() => setSnapNotice(null), 3000);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md border ${
                    isEnergySimulated
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 shadow-emerald-500/40 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                  }`}
                  title="Simular flujo de energía eléctrica sobre los cables validados y encender componentes"
                >
                  <Zap className={`w-4 h-4 ${isEnergySimulated ? 'fill-current text-slate-950 animate-bounce' : 'text-emerald-400'}`} />
                  <span>{isEnergySimulated ? 'Energía ON ⚡' : 'Simular Energía'}</span>
                </button>

                {/* VERIFICADOR DE CABLEADO BUTTON */}
                <button
                  onClick={() => {
                    const next = !isWiringVerifierActive;
                    setIsWiringVerifierActive(next);
                    if (next) setVerifierStep(0);
                    setSnapNotice(next ? "🔍 Modo Verificador de Cableado activado: Siga las líneas punteadas paso a paso." : "Verificador de cableado desactivado.");
                    setTimeout(() => setSnapNotice(null), 3000);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md border ${
                    isWiringVerifierActive
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/40'
                  }`}
                  title="Modo Verificador de Cableado: Resalta con líneas punteadas el camino del esquema unilineal"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{isWiringVerifierActive ? 'Verificador ON' : 'Verificador de Cableado'}</span>
                </button>

                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    snapToGrid 
                      ? 'bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/50' 
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <span>Snap ({gridSize}px): {snapToGrid ? 'ON' : 'OFF'}</span>
                </button>

                <button 
                  onClick={() => setWires([])} 
                  className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition" 
                  title="Borrar Todos los Cables"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* VERIFICADOR DE CABLEADO - STEP GUIDANCE BANNER */}
            {isWiringVerifierActive && activeStep && (
              <div className="absolute top-20 left-4 right-4 z-20 bg-slate-900/95 border-2 border-amber-500/80 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl space-y-2">
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

            {/* REAL-TIME FLOATING HUD PANEL (BOTTOM-RIGHT INSIDE BOARD CONTAINER) */}
            <div className="absolute bottom-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl space-y-2 min-w-[280px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Monitoreo en Tiempo Real
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isIgaOverloaded ? 'bg-rose-950 border-rose-600 text-rose-300 animate-pulse' : 'bg-emerald-950 border-emerald-600 text-emerald-300'
                }`}>
                  {isIgaOverloaded ? '⚡ SOBRECARGA IGA' : '✓ IGA OK'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Corriente Requerida:</span>
                  <span className={`text-base font-black ${isIgaOverloaded ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {totalLoadCurrent.toFixed(1)} A
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Capacidad IGA:</span>
                  <span className="text-base font-black text-amber-400">{igaAmps} A</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 flex justify-between">
                <span>Suma Protecciones MCB:</span>
                <span className="font-mono text-slate-200 font-bold">{totalMcbAmps} A</span>
              </div>
            </div>

            {/* SNAP TOAST NOTICE */}
            <AnimatePresence>
              {snapNotice && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-4 left-4 z-20 bg-slate-900/95 border border-rose-500/80 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs text-rose-200 font-mono shadow-2xl flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{snapNotice}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SVG BOARD CANVAS */}
            <svg
              ref={svgRef}
              className={`w-full h-full min-h-[700px] pt-16 ${
                draggingCompId ? 'cursor-grabbing' : activeWireStart ? 'cursor-crosshair' : 'cursor-default'
              }`}
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
                width="100%" 
                height="100%" 
                fill="url(#gridPattern50)" 
                style={{ opacity: draggingCompId ? 0.35 : 0.12 }}
              />

              {/* Rieles DIN */}
              <rect x="40" y="180" width="800" height="40" rx="2" fill="#334155" stroke="#475569" />
              <rect x="40" y="320" width="800" height="15" rx="2" fill="#1e293b" stroke="#334155" />

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

                return (
                  <g 
                    key={comp.id} 
                    transform={`translate(${comp.x}, ${comp.y})`}
                    onMouseEnter={() => setHoveredCompId(comp.id)}
                    onMouseLeave={() => setHoveredCompId(null)}
                    onMouseDown={(e: React.MouseEvent) => handleComponentMouseDown(e, comp)}
                    className={draggingCompId === comp.id ? 'cursor-grabbing' : activeWireStart ? 'cursor-crosshair' : 'cursor-grab'}
                  >
                    
                    {/* EXPANDED TRANSPARENT HITBOX (12px padding) for easy click/drag */}
                    <rect
                      x={-12}
                      y={-12}
                      width={comp.w + 24}
                      height={comp.h + 24}
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

                    {/* BLUE GLOW HIGHLIGHT ON HOVER OR DRAG */}
                    {isHovered && (
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
                      fill="#f8fafc" 
                      fontSize={comp.type.startsWith('BAR') ? 11 : 10} 
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {comp.name}
                    </text>

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
            </svg>
          </div>
        </div>
      </div>

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
