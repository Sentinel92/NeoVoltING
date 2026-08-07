import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Zap, Play, CheckCircle2, AlertTriangle, RotateCcw,
  Plus, Trash2, Users, Info, MonitorPlay, Database, LayoutGrid, Scale
} from 'lucide-react';
import { ClientRecord, RoomData, HighAppliance } from '../types';

export type TerminalType = 'L' | 'N' | 'PE';

export interface InteractiveTerminal {
  id: string;
  type: TerminalType;
  position: 'top' | 'bottom';
  x: number; // Relative to component
  y: number; // Relative to component
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
}

export interface Wire {
  id: string;
  fromCompId: string;
  fromTermId: string;
  toCompId: string;
  toTermId: string;
  color: string;
}

export default function InteractiveBoardTab() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const [components, setComponents] = useState<InteractiveComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  
  const [loads, setLoads] = useState<{ id: string; name: string; power: number }[]>([
    { id: 'load_1', name: 'Alumbrado 1', power: 500 },
    { id: 'load_2', name: 'Enchufes', power: 2000 }
  ]);
  
  const [activeWireStart, setActiveWireStart] = useState<{compId: string, term: InteractiveTerminal} | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({x: 0, y: 0});
  
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0});

  const [simulationState, setSimulationState] = useState<'idle' | 'success' | 'error'>('idle');
  const [simulationMessages, setSimulationMessages] = useState<string[]>([]);
  
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('neovolt_clients');
    if (stored) {
      try {
        setClients(JSON.parse(stored));
      } catch(e) {}
    }
    // Auto-generate initial board
    generateBoardLayout(loads);
  }, []);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newLoads: { id: string; name: string; power: number }[] = [];
    
    // Extract from rooms
    if (client.boardConfig?.rooms) {
      client.boardConfig.rooms.forEach((r: RoomData, idx: number) => {
        let roomPower = 0;
        r.devices.forEach(d => roomPower += d.quantity * d.powerWatts);
        if (roomPower > 0) {
          newLoads.push({ id: `load_r_${r.id}_${idx}`, name: r.name, power: roomPower });
        }
      });
    }

    // Extract from high appliances
    if (client.boardConfig?.highAppliances) {
      client.boardConfig.highAppliances.forEach((ha: HighAppliance, idx: number) => {
        newLoads.push({ id: `load_ha_${ha.id}_${idx}`, name: ha.name, power: ha.powerWatts });
      });
    }

    if (newLoads.length === 0) {
      // Fallback if client has no specific data
      newLoads.push({ id: 'load_default_1', name: 'Circuito General', power: 2000 });
    }

    setLoads(newLoads);
    generateBoardLayout(newLoads);
  };

  const calculateTotalCurrent = (loadsArr: {power: number}[]) => {
    const totalPower = loadsArr.reduce((sum, l) => sum + l.power, 0);
    return totalPower / (220 * 0.93); // Assuming 220V, cos phi 0.93
  };

  const getRecommendedIga = (amps: number) => {
    if (amps <= 10) return 10;
    if (amps <= 16) return 16;
    if (amps <= 20) return 20;
    if (amps <= 25) return 25;
    if (amps <= 32) return 32;
    if (amps <= 40) return 40;
    return 63;
  };

  const generateBoardLayout = (currentLoads: { id: string; name: string; power: number }[]) => {
    setWires([]); 
    setSimulationState('idle');
    setSimulationMessages([]);
    setActiveWireStart(null);

    const newComps: InteractiveComponent[] = [];
    
    // Total Load for smart recommendation
    const totalAmps = calculateTotalCurrent(currentLoads);
    const igaAmps = getRecommendedIga(totalAmps);
    const rcdAmps = igaAmps <= 25 ? 25 : 40;

    // GRID
    newComps.push({
      id: 'grid', type: 'GRID', name: 'Empalme / Red',
      x: 350, y: 20, w: 120, h: 50,
      terminals: [
        { id: 'grid_out_l', type: 'L', position: 'bottom', x: 20, y: 50, label: 'L' },
        { id: 'grid_out_n', type: 'N', position: 'bottom', x: 60, y: 50, label: 'N' },
        { id: 'grid_out_pe', type: 'PE', position: 'bottom', x: 100, y: 50, label: 'PE' }
      ]
    });

    // IGA
    newComps.push({
      id: 'iga', type: 'IGA', name: `IGA ${igaAmps}A`,
      x: 60, y: 150, w: 80, h: 100, ampacity: igaAmps,
      terminals: [
        { id: 'iga_in_l', type: 'L', position: 'top', x: 20, y: 0, label: 'L' },
        { id: 'iga_in_n', type: 'N', position: 'top', x: 60, y: 0, label: 'N' },
        { id: 'iga_out_l', type: 'L', position: 'bottom', x: 20, y: 100, label: 'L' },
        { id: 'iga_out_n', type: 'N', position: 'bottom', x: 60, y: 100, label: 'N' }
      ]
    });

    // RCD
    newComps.push({
      id: 'rcd', type: 'RCD', name: `RCD ${rcdAmps}A 30mA`,
      x: 160, y: 150, w: 80, h: 100, ampacity: rcdAmps,
      terminals: [
        { id: 'rcd_in_l', type: 'L', position: 'top', x: 20, y: 0, label: 'L' },
        { id: 'rcd_in_n', type: 'N', position: 'top', x: 60, y: 0, label: 'N' },
        { id: 'rcd_out_l', type: 'L', position: 'bottom', x: 20, y: 100, label: 'L' },
        { id: 'rcd_out_n', type: 'N', position: 'bottom', x: 60, y: 100, label: 'N' }
      ]
    });

    // BARS
    newComps.push({
      id: 'bar_n', type: 'BAR_N', name: 'Barra Neutro',
      x: 60, y: 350, w: 300, h: 30,
      terminals: Array.from({length: 8}).map((_, i) => ({
        id: `bar_n_${i}`, type: 'N', position: 'top', x: 20 + i*35, y: 0, label: 'N'
      }))
    });

    newComps.push({
      id: 'bar_pe', type: 'BAR_PE', name: 'Barra Tierra (PE)',
      x: 400, y: 350, w: 300, h: 30,
      terminals: Array.from({length: 8}).map((_, i) => ({
        id: `bar_pe_${i}`, type: 'PE', position: 'top', x: 20 + i*35, y: 0, label: 'PE'
      }))
    });

    // MCBs & LOADS
    currentLoads.forEach((load, i) => {
      const loadAmps = (load.power / (220 * 0.93));
      const mcbAmps = getRecommendedIga(loadAmps);
      const mcbX = 260 + (i * 60);
      newComps.push({
        id: `mcb_${i}`, type: 'MCB', name: `C${i+1} ${mcbAmps}A`,
        x: mcbX, y: 150, w: 40, h: 100, ampacity: mcbAmps,
        terminals: [
          { id: `mcb_${i}_in_l`, type: 'L', position: 'top', x: 20, y: 0, label: 'L' },
          { id: `mcb_${i}_out_l`, type: 'L', position: 'bottom', x: 20, y: 100, label: 'L' }
        ]
      });

      const loadX = 60 + (i * 120);
      newComps.push({
        id: `load_comp_${i}`, type: 'LOAD', name: load.name,
        x: loadX, y: 480, w: 100, h: 60,
        terminals: [
          { id: `load_${i}_l`, type: 'L', position: 'top', x: 20, y: 0, label: 'L' },
          { id: `load_${i}_n`, type: 'N', position: 'top', x: 50, y: 0, label: 'N' },
          { id: `load_${i}_pe`, type: 'PE', position: 'top', x: 80, y: 0, label: 'PE' }
        ]
      });
    });

    setComponents(newComps);
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
    setDraggingCompId(null);
  };

  const handleComponentMouseDown = (e: React.MouseEvent, comp: InteractiveComponent) => {
    if (activeWireStart) return; // Don't drag if drawing wire
    e.stopPropagation();
    const pt = getSvgMousePos(e);
    setDraggingCompId(comp.id);
    setDragOffset({ x: pt.x - comp.x, y: pt.y - comp.y });
  };

  const handleTerminalClick = (e: React.MouseEvent, comp: InteractiveComponent, terminal: InteractiveTerminal) => {
    e.stopPropagation();
    setSimulationState('idle');
    setSimulationMessages([]);

    if (!activeWireStart) {
      setActiveWireStart({ compId: comp.id, term: terminal });
      const pt = getSvgMousePos(e);
      setMousePos(pt);
    } else {
      if (activeWireStart.compId === comp.id && activeWireStart.term.id === terminal.id) {
        setActiveWireStart(null); // Cancel
        return;
      }
      
      // Validation: No Phase to Neutral
      if (activeWireStart.term.type !== terminal.type) {
        setSimulationState('error');
        setSimulationMessages([
          `¡ERROR NORMATIVO! Intento de conectar ${activeWireStart.term.type} con ${terminal.type}. Cortocircuito evitado.`
        ]);
        setActiveWireStart(null);
        return;
      }

      const newWire: Wire = {
        id: `w_${Date.now()}`,
        fromCompId: activeWireStart.compId,
        fromTermId: activeWireStart.term.id,
        toCompId: comp.id,
        toTermId: terminal.id,
        color: terminal.type === 'L' ? '#ef4444' : terminal.type === 'N' ? '#3b82f6' : '#22c55e'
      };

      const exists = wires.some(w => 
        (w.fromTermId === newWire.fromTermId && w.toTermId === newWire.toTermId) ||
        (w.toTermId === newWire.fromTermId && w.fromTermId === newWire.toTermId)
      );

      if (!exists) {
        setWires([...wires, newWire]);
      }
      setActiveWireStart(null);
    }
  };

  const checkNorms = () => {
    const msgs: string[] = [];
    let isOk = true;

    // Check sizes
    const iga = components.find(c => c.type === 'IGA');
    const rcd = components.find(c => c.type === 'RCD');
    const mcbs = components.filter(c => c.type === 'MCB');

    const totalAmps = calculateTotalCurrent(loads);

    if (iga) {
      if ((iga.ampacity || 0) < totalAmps) {
        msgs.push(`RIESGO DE DISPARO: La capacidad del IGA (${iga.ampacity}A) es menor a la demanda total del proyecto (${totalAmps.toFixed(1)}A).`);
        isOk = false;
      } else {
        msgs.push(`CAPACIDAD IGA CORRECTA: IGA de ${iga.ampacity}A soporta la demanda de ${totalAmps.toFixed(1)}A.`);
      }
    }

    if (iga && rcd) {
      if ((iga.ampacity || 0) > (rcd.ampacity || 0)) {
        msgs.push(`RIC N°03: La capacidad del RCD (${rcd.ampacity}A) debe ser mayor o igual al IGA (${iga.ampacity}A) que lo protege.`);
        isOk = false;
      }
    }
    
    if (mcbs.length > 0) {
      // Rule: max 3 circuits per RCD generally (rule of thumb)
      if (mcbs.length > 3) {
        msgs.push(`Recomendación RIC N°03: Considerar más de un Diferencial (RCD) si hay más de 3 circuitos derivados para evitar disparos intempestivos.`);
        isOk = false; // Soft fail for simulation purposes
      }
    }
    return { isOk, msgs };
  };

  const simulateBoard = () => {
    const msgs: string[] = [];
    let hasError = false;

    const isConnected = (t1: string, t2: string) => {
      return wires.some(w => (w.fromTermId === t1 && w.toTermId === t2) || (w.toTermId === t1 && w.fromTermId === t2));
    };

    const isConnectedToAny = (t1: string, termPrefix: string) => {
      return wires.some(w => 
        (w.fromTermId === t1 && w.toTermId.startsWith(termPrefix)) || 
        (w.toTermId === t1 && w.fromTermId.startsWith(termPrefix))
      );
    };

    // Continuity checks
    if (!isConnected('grid_out_l', 'iga_in_l')) { msgs.push('Falta conectar Fase de la Red al IGA.'); hasError = true; }
    if (!isConnected('grid_out_n', 'iga_in_n')) { msgs.push('Falta conectar Neutro de la Red al IGA.'); hasError = true; }

    if (!isConnected('iga_out_l', 'rcd_in_l')) { msgs.push('Falta puentear Fase del IGA al Diferencial RCD.'); hasError = true; }
    if (!isConnected('iga_out_n', 'rcd_in_n')) { msgs.push('Falta puentear Neutro del IGA al Diferencial RCD.'); hasError = true; }

    if (!isConnectedToAny('rcd_out_n', 'bar_n_')) { msgs.push('El Neutro de salida del Diferencial debe ir a la Barra de Neutro.'); hasError = true; }
    if (!isConnectedToAny('grid_out_pe', 'bar_pe_')) { msgs.push('La Tierra de la Red debe ir a la Barra de Tierra (PE).'); hasError = true; }

    const mcbs = components.filter(c => c.type === 'MCB');
    mcbs.forEach((mcb, i) => {
      const mcbOutL = mcb.terminals.find(t => t.position === 'bottom')?.id;
      const mcbInL = mcb.terminals.find(t => t.position === 'top')?.id;
      
      if (mcbInL && !isConnected('rcd_out_l', mcbInL) && !isConnectedToAny(mcbInL, 'mcb_')) {
        msgs.push(`Falta alimentación de Fase al Automático ${mcb.name}.`); hasError = true;
      }
      
      // Find load that matches this MCB (simplistic index match for simulation)
      const loadComp = components.filter(c => c.type === 'LOAD')[i];
      if (loadComp && mcbOutL) {
        const loadL = loadComp.terminals.find(t => t.type === 'L')?.id;
        const loadN = loadComp.terminals.find(t => t.type === 'N')?.id;
        const loadPE = loadComp.terminals.find(t => t.type === 'PE')?.id;
        
        if (loadL && !isConnected(mcbOutL, loadL)) { msgs.push(`El circuito "${loadComp.name}" no recibe Fase de su Automático.`); hasError = true; }
        if (loadN && !isConnectedToAny(loadN, 'bar_n_')) { msgs.push(`Falta conectar el Neutro del circuito "${loadComp.name}".`); hasError = true; }
        if (loadPE && !isConnectedToAny(loadPE, 'bar_pe_')) { msgs.push(`Falta conectar la Tierra del circuito "${loadComp.name}".`); hasError = true; }
      }
    });

    const normCheck = checkNorms();
    if (!normCheck.isOk) {
      hasError = true;
      msgs.push(...normCheck.msgs);
    }

    if (hasError) {
      setSimulationState('error');
      setSimulationMessages(msgs);
    } else {
      setSimulationState('success');
      // add normCheck msgs as they include the green 'CAPACIDAD IGA CORRECTA' etc.
      setSimulationMessages([
        '¡Auditoría SEC exitosa! El tablero simulado tiene continuidad, cableado correcto.',
        ...normCheck.msgs
      ]);
    }
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
              <MonitorPlay className="w-4 h-4" />
              <span>Simulador Didáctico e Interactivo</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Armado de Tablero y Validaciones RIC</h1>
            <p className="text-xs text-slate-400 mt-1">
              Arrastra componentes (Drag & Drop), conecta terminales haciendo clic y valida normativamente el diseño.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* LEFT PANEL: CONTROLS */}
          <div className="xl:col-span-1 space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Base de Datos y Diseño</span>
              </h3>
              
              <div>
                <label className="text-xs text-slate-400 block mb-1">Seleccionar Cliente / Proyecto</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Cliente Custom (Manual) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.propertyType}</option>
                  ))}
                  {clients.length === 0 && <option value="test_1" disabled>Sin clientes en BD</option>}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Al seleccionar un cliente, se cargarán sus requerimientos de carga (watts) y se autogenerarán los dispositivos de protección (IGA, RCD, MCBs).
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Cargas / Circuitos Actuales</span>
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {loads.map((l, i) => (
                    <div key={l.id} className="flex flex-col bg-slate-950 border border-slate-800 p-2 rounded-lg">
                      <span className="text-xs text-slate-200 font-bold">C{i+1}: {l.name}</span>
                      <span className="text-[10px] text-slate-400">{l.power} W / {(l.power / (220*0.93)).toFixed(1)}A</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => generateBoardLayout(loads)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-xs transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-alinear Componentes</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Auditoría Normativa</span>
              </h3>
              
              <button
                onClick={simulateBoard}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4" />
                <span>Verificar Conexiones y Normas</span>
              </button>

              {simulationState !== 'idle' && (
                <div className={`p-4 rounded-xl border ${
                  simulationState === 'success' ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-rose-950/30 border-rose-800/50'
                }`}>
                  <h4 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${
                    simulationState === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {simulationState === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {simulationState === 'success' ? 'Simulación Exitosa' : 'Avisos Detectados'}
                  </h4>
                  <ul className="space-y-1.5">
                    {simulationMessages.map((msg, idx) => (
                      <li key={idx} className={`text-[11px] ${simulationState === 'success' ? 'text-emerald-200/80' : 'text-rose-200/80'} flex items-start gap-1 leading-tight`}>
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{msg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-4">
              <div className="flex gap-2 items-start text-indigo-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                  <strong>Controles del Tablero:</strong><br/>
                  • Arrastra componentes para ordenarlos en los rieles.<br/>
                  • Haz clic en terminales (L, N, PE) para trazar cables.<br/>
                  • La validación impide automáticamente cortocircuitos.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: SVG BOARD */}
          <div 
            className="xl:col-span-3 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[600px]"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            
            {/* Toolbar internal */}
            <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 flex gap-1">
              <button onClick={() => setWires([])} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Limpiar Cables">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <svg
              ref={svgRef}
              className={`w-full h-full min-h-[700px] ${draggingCompId ? 'cursor-grabbing' : activeWireStart ? 'cursor-crosshair' : 'cursor-default'}`}
              onMouseMove={handleMouseMove}
              onClick={() => {
                if(activeWireStart) setActiveWireStart(null);
              }}
            >
              <defs>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/>
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <rect width="100%" height="100%" fill="url(#gridPattern)" />

              {/* Rieles DIN decorativos */}
              <rect x="40" y="180" width="800" height="40" rx="2" fill="#334155" stroke="#475569" />
              <rect x="40" y="320" width="800" height="15" rx="2" fill="#1e293b" stroke="#334155" />

              {/* Wires */}
              {wires.map(w => {
                const p1 = getTerminalAbsoluteCoords(w.fromCompId, w.fromTermId);
                const p2 = getTerminalAbsoluteCoords(w.toCompId, w.toTermId);
                return (
                  <path
                    key={w.id}
                    d={getWirePath(p1.x, p1.y, p2.x, p2.y)}
                    fill="none"
                    stroke={w.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })}

              {/* Active drawing wire */}
              {activeWireStart && (
                <path
                  d={getWirePath(
                    getTerminalAbsoluteCoords(activeWireStart.compId, activeWireStart.term.id).x, 
                    getTerminalAbsoluteCoords(activeWireStart.compId, activeWireStart.term.id).y, 
                    mousePos.x, mousePos.y
                  )}
                  fill="none"
                  stroke={activeWireStart.term.type === 'L' ? '#ef4444' : activeWireStart.term.type === 'N' ? '#3b82f6' : '#22c55e'}
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Components */}
              {/* Sort to draw dragged component on top */}
              {[...components].sort((a,b) => (a.id === draggingCompId ? 1 : b.id === draggingCompId ? -1 : 0)).map(comp => (
                <g 
                  key={comp.id} 
                  transform={`translate(${comp.x}, ${comp.y})`}
                  onMouseDown={(e) => handleComponentMouseDown(e, comp)}
                  className={draggingCompId === comp.id ? 'cursor-grabbing' : activeWireStart ? 'cursor-crosshair' : 'cursor-grab'}
                >
                  
                  {/* Body */}
                  {comp.type === 'BAR_N' ? (
                    <rect x={0} y={0} width={comp.w} height={comp.h} fill="#1e3a8a" rx="4" stroke="#3b82f6" />
                  ) : comp.type === 'BAR_PE' ? (
                    <rect x={0} y={0} width={comp.w} height={comp.h} fill="#14532d" rx="4" stroke="#22c55e" />
                  ) : comp.type === 'LOAD' ? (
                    <rect x={0} y={0} width={comp.w} height={comp.h} fill="#1e293b" rx="8" stroke="#64748b" strokeWidth="2" />
                  ) : comp.type === 'GRID' ? (
                    <rect x={0} y={0} width={comp.w} height={comp.h} fill="#334155" rx="8" stroke="#94a3b8" />
                  ) : (
                    <rect x={0} y={0} width={comp.w} height={comp.h} fill="#0f172a" rx="6" stroke="#475569" strokeWidth="2" />
                  )}

                  {/* Highlight for drag */}
                  {draggingCompId === comp.id && (
                    <rect x={-2} y={-2} width={comp.w+4} height={comp.h+4} fill="none" stroke="#f472b6" strokeWidth="2" rx="8" />
                  )}

                  {/* Label */}
                  <text 
                    x={comp.w/2} 
                    y={comp.type.startsWith('BAR') ? 20 : 40} 
                    textAnchor="middle" 
                    fill="#f8fafc" 
                    fontSize={comp.type.startsWith('BAR') ? 12 : 11} 
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {comp.name}
                  </text>

                  {/* Terminals */}
                  {comp.terminals.map(term => {
                    const isActive = activeWireStart?.term.id === term.id && activeWireStart.compId === comp.id;
                    const isHoverTarget = activeWireStart && activeWireStart.term.id !== term.id && activeWireStart.term.type === term.type;
                    
                    return (
                      <g 
                        key={term.id} 
                        onClick={(e) => handleTerminalClick(e, comp, term)}
                        className="cursor-pointer"
                        onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking terminal
                      >
                        <circle
                          cx={term.x}
                          cy={term.y}
                          r={isActive ? 8 : 6}
                          fill={term.type === 'L' ? '#ef4444' : term.type === 'N' ? '#3b82f6' : '#22c55e'}
                          stroke="#ffffff"
                          strokeWidth={isActive ? 2 : 1}
                          filter={isHoverTarget ? 'url(#glow)' : ''}
                          className="transition-all hover:scale-150 origin-center"
                        />
                        <text
                          x={term.x}
                          y={term.position === 'top' ? term.y - 12 : term.y + 18}
                          textAnchor="middle"
                          fill="#94a3b8"
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
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProfessionalBoardGeneratorTab = InteractiveBoardTab;
export const PhysicalBoardSimulationTab = InteractiveBoardTab;
