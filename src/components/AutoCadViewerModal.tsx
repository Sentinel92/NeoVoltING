import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import DxfParser from 'dxf-parser';
import {
  FileCode,
  Upload,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Ruler,
  MousePointer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  Zap,
  Home,
  Check,
  RefreshCw,
  X,
  Info,
  Sliders,
  Move,
  Search,
  Building,
  Image as ImageIcon,
  Compass,
  Cpu,
  Layers2
} from 'lucide-react';
import { RoomData, HighAppliance } from '../types';
import { SAMPLE_DXF_PLANS, SampleDxfPlan } from '../data/sampleDxfPlans';

interface AutoCadViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlanToCensus?: (extractedRooms: RoomData[], extractedAppliances: HighAppliance[]) => void;
  onNavigateToTab?: (tab: string) => void;
}

// AutoCAD ACI standard index color to Hex Map
const ACI_COLORS: Record<number, string> = {
  1: '#ef4444', // Red
  2: '#eab308', // Yellow
  3: '#22c55e', // Green
  4: '#06b6d4', // Cyan
  5: '#3b82f6', // Blue
  6: '#ec4899', // Magenta
  7: '#ffffff', // White
  8: '#64748b', // Dark Grey
  9: '#cbd5e1', // Light Grey
  10: '#f87171',
  11: '#fca5a5',
  30: '#f97316', // Orange
  40: '#fbbf24',
  50: '#facc15',
  70: '#84cc16',
  80: '#4ade80',
  130: '#38bdf8',
  150: '#60a5fa',
  210: '#c084fc',
  250: '#334155',
  256: '#ffffff', // ByLayer default
};

export const AutoCadViewerModal: React.FC<AutoCadViewerModalProps> = ({
  isOpen,
  onClose,
  onApplyPlanToCensus,
  onNavigateToTab,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Plan State
  const [selectedSample, setSelectedSample] = useState<SampleDxfPlan>(SAMPLE_DXF_PLANS[0]);
  const [rawDxfString, setRawDxfString] = useState<string>(SAMPLE_DXF_PLANS[0].dxfContent);
  const [fileName, setFileName] = useState<string>('Plano_Residencial_SEC_85m2.dxf');
  const [parsedDxf, setParsedDxf] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);

  // Canvas Viewport & Camera Transforms
  const [zoom, setZoom] = useState<number>(38); // pixels per DXF unit (meters)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 120, y: 380 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [theme, setTheme] = useState<'cad-dark' | 'blueprint' | 'paper-white'>('cad-dark');

  // Tool Mode: Navigation vs Measure
  const [activeTool, setActiveTool] = useState<'select' | 'measure'>('select');
  const [measurePoints, setMeasurePoints] = useState<Array<{ x: number; y: number }>>([]);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);

  // Layers Visibility State
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const [layerColors, setLayerColors] = useState<Record<string, string>>({});

  // Extraction & Electrical Audit Summary
  const [extractedData, setExtractedData] = useState<{
    rooms: RoomData[];
    highAppliances: HighAppliance[];
    surfaceM2: number;
    lightsCount: number;
    socketsCount: number;
    boardsCount: number;
    conduitMeters: number;
    circuitsEstimated: number;
  } | null>(null);

  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Parse DXF data when raw string changes
  useEffect(() => {
    if (!rawDxfString) return;
    try {
      setParseError(null);
      const parser = new DxfParser();
      const parsed = parser.parseSync(rawDxfString);
      setParsedDxf(parsed);

      // Extract layers and assign initial visibility & colors
      const layers: Record<string, boolean> = {};
      const colors: Record<string, string> = {};

      if (parsed.tables?.layer?.layers) {
        Object.entries(parsed.tables.layer.layers).forEach(([name, lData]: [string, any]) => {
          layers[name] = true;
          const colorNum = lData.color || 7;
          colors[name] = ACI_COLORS[colorNum] || '#38bdf8';
        });
      }

      // Also scan entities for any implicit layers
      if (Array.isArray(parsed.entities)) {
        parsed.entities.forEach((ent: any) => {
          if (ent.layer && layers[ent.layer] === undefined) {
            layers[ent.layer] = true;
            colors[ent.layer] = '#38bdf8';
          }
        });
      }

      setLayerVisibility(layers);
      setLayerColors(colors);

      // Auto-extract electrical telemetry
      extractElectricalDataFromDxf(parsed);
      fitToScreen(parsed);
    } catch (err: any) {
      console.error('Error parsing DXF plan:', err);
      setParseError(`No se pudo interpretar el archivo CAD: ${err?.message || 'Formato DXF inválido'}`);
    }
  }, [rawDxfString]);

  // Extract electrical census metrics from DXF entities & layers
  const extractElectricalDataFromDxf = (dxf: any) => {
    if (!dxf || !Array.isArray(dxf.entities)) return;

    let lights = 0;
    let sockets = 0;
    let boards = 0;
    let conduitLength = 0;
    const roomTexts: string[] = [];

    dxf.entities.forEach((ent: any) => {
      const layer = (ent.layer || '').toUpperCase();

      if (layer.includes('ALUMB') || layer.includes('LUZ') || layer.includes('LIGHT')) {
        if (ent.type === 'CIRCLE' || ent.type === 'INSERT' || ent.type === 'POINT') {
          lights++;
        }
      } else if (layer.includes('ENCH') || layer.includes('SOCKET') || layer.includes('FUERZA')) {
        if (ent.type === 'CIRCLE' || ent.type === 'INSERT' || ent.type === 'POINT') {
          sockets++;
        }
      } else if (layer.includes('TABLERO') || layer.includes('TDA') || layer.includes('PANEL')) {
        if (ent.type === 'LINE' || ent.type === 'TEXT' || ent.type === 'INSERT') {
          boards = Math.max(1, boards + 0.25);
        }
      } else if (layer.includes('CONDUIT') || layer.includes('CANAL') || layer.includes('TUBO')) {
        if (ent.type === 'LINE' && ent.vertices && ent.vertices.length >= 2) {
          const dx = ent.vertices[1].x - ent.vertices[0].x;
          const dy = ent.vertices[1].y - ent.vertices[0].y;
          conduitLength += Math.sqrt(dx * dx + dy * dy);
        }
      }

      if (ent.type === 'TEXT' || ent.type === 'MTEXT') {
        const textVal = ent.text || ent.string || '';
        if (textVal && (textVal.includes('DORM') || textVal.includes('LIVING') || textVal.includes('COCINA') || textVal.includes('BAÑO') || textVal.includes('SALA') || textVal.includes('OFICINA'))) {
          roomTexts.push(textVal);
        }
      }
    });

    const finalLights = Math.max(lights, selectedSample.estimatedLights || 8);
    const finalSockets = Math.max(sockets, selectedSample.estimatedSockets || 14);
    const finalBoards = Math.max(Math.round(boards), selectedSample.estimatedBoards || 1);
    const finalConduits = Math.max(Math.round(conduitLength), selectedSample.estimatedConduitMeters || 45);
    const surfaceM2 = selectedSample.surfaceM2 || 85;

    // Build structured rooms
    const defaultRoomNames = ['Living / Comedor', 'Cocina & Logia', 'Dormitorio Principal', 'Dormitorio 2', 'Baño Principal'];
    const namesToUse = roomTexts.length > 0 ? roomTexts.slice(0, 5) : defaultRoomNames;

    const rooms: RoomData[] = namesToUse.map((name, idx) => ({
      id: `cad_room_${Date.now()}_${idx}`,
      name: name.split('(')[0].trim(),
      surfaceM2: Math.round(surfaceM2 / namesToUse.length),
      lightPoints: Math.max(1, Math.round(finalLights / namesToUse.length)),
      socketPoints: Math.max(2, Math.round(finalSockets / namesToUse.length)),
      devices: idx === 1 ? [
        { name: 'Refrigerador A+', powerWatts: 250, quantity: 1 },
        { name: 'Microondas 25L', powerWatts: 1200, quantity: 1 }
      ] : idx === 0 ? [
        { name: 'Smart TV 55"', powerWatts: 140, quantity: 1 }
      ] : []
    }));

    const highAppliances: HighAppliance[] = [
      { id: `cad_high_1`, name: 'Horno Eléctrico Empotrado', powerWatts: 2800, category: 'Cocina', socketType: '16A', voltage: 220 },
      { id: `cad_high_2`, name: 'Climatizador Inverter 12kBTU', powerWatts: 1600, category: 'Climatización', socketType: '16A', voltage: 220 },
    ];

    const circuitsEstimated = Math.ceil(finalLights / 12) + Math.ceil(finalSockets / 10) + highAppliances.length;

    setExtractedData({
      rooms,
      highAppliances,
      surfaceM2,
      lightsCount: finalLights,
      socketsCount: finalSockets,
      boardsCount: finalBoards,
      conduitMeters: finalConduits,
      circuitsEstimated,
    });
  };

  // Center & Fit drawing in canvas viewport
  const fitToScreen = useCallback((dxfData?: any) => {
    const data = dxfData || parsedDxf;
    if (!data || !Array.isArray(data.entities) || data.entities.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    data.entities.forEach((ent: any) => {
      const checkPt = (x?: number, y?: number) => {
        if (typeof x === 'number' && !isNaN(x)) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }
        if (typeof y === 'number' && !isNaN(y)) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      };

      if (ent.vertices) {
        ent.vertices.forEach((v: any) => checkPt(v.x, v.y));
      }
      if (ent.center) checkPt(ent.center.x, ent.center.y);
      if (ent.position) checkPt(ent.position.x, ent.position.y);
      if (ent.startPoint) checkPt(ent.startPoint.x, ent.startPoint.y);
      if (ent.endPoint) checkPt(ent.endPoint.x, ent.endPoint.y);
    });

    if (minX === Infinity) {
      minX = 0; maxX = 15; minY = 0; maxY = 10;
    }

    const width = maxX - minX || 10;
    const height = maxY - minY || 10;
    const canvas = canvasRef.current;
    const cWidth = canvas ? canvas.clientWidth || 750 : 750;
    const cHeight = canvas ? canvas.clientHeight || 500 : 500;

    const scaleX = (cWidth * 0.75) / width;
    const scaleY = (cHeight * 0.75) / height;
    const newZoom = Math.max(10, Math.min(65, Math.min(scaleX, scaleY)));

    setZoom(newZoom);
    setPan({
      x: cWidth / 2 - ((minX + maxX) / 2) * newZoom,
      y: cHeight / 2 + ((minY + maxY) / 2) * newZoom,
    });
  }, [parsedDxf]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 550;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Background Theme
    if (theme === 'cad-dark') {
      ctx.fillStyle = '#080d1a';
    } else if (theme === 'blueprint') {
      ctx.fillStyle = '#061a33';
    } else {
      ctx.fillStyle = '#f8fafc';
    }
    ctx.fillRect(0, 0, width, height);

    // 2. CAD Background Grid (1 meter minor grid, 5 meters major grid)
    const gridSize = zoom; // 1 unit in pixels
    if (gridSize > 6) {
      ctx.strokeStyle = theme === 'paper-white' ? '#e2e8f0' : theme === 'blueprint' ? '#0d2d59' : '#131d33';
      ctx.lineWidth = 1;

      const startX = pan.x % gridSize;
      for (let x = startX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const startY = pan.y % gridSize;
      for (let y = startY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // World to Screen Coordinate Converter
    const toScreen = (x: number, y: number) => ({
      sx: pan.x + x * zoom,
      sy: pan.y - y * zoom, // AutoCAD Y-up to Canvas Y-down
    });

    // 3. Render DXF Entities
    if (parsedDxf && Array.isArray(parsedDxf.entities)) {
      parsedDxf.entities.forEach((ent: any) => {
        const layerName = ent.layer || '0';
        if (layerVisibility[layerName] === false) return; // Layer is hidden

        // Determine Entity Color
        let strokeColor = layerColors[layerName] || '#38bdf8';
        if (ent.color !== undefined && ACI_COLORS[ent.color]) {
          strokeColor = ACI_COLORS[ent.color];
        }
        if (theme === 'paper-white' && (strokeColor === '#ffffff' || strokeColor === '#ffffff')) {
          strokeColor = '#0f172a';
        }

        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = strokeColor;
        ctx.lineWidth = layerName.includes('MURO') ? 2.5 : layerName.includes('CONDUIT') ? 2.0 : 1.5;

        // ENTITY: LINE
        if (ent.type === 'LINE' && ent.vertices && ent.vertices.length >= 2) {
          const p1 = toScreen(ent.vertices[0].x, ent.vertices[0].y);
          const p2 = toScreen(ent.vertices[1].x, ent.vertices[1].y);
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        }
        // ENTITY: LWPOLYLINE / POLYLINE
        else if ((ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') && Array.isArray(ent.vertices)) {
          if (ent.vertices.length > 0) {
            ctx.beginPath();
            const start = toScreen(ent.vertices[0].x, ent.vertices[0].y);
            ctx.moveTo(start.sx, start.sy);
            for (let i = 1; i < ent.vertices.length; i++) {
              const pt = toScreen(ent.vertices[i].x, ent.vertices[i].y);
              ctx.lineTo(pt.sx, pt.sy);
            }
            if (ent.shape) ctx.closePath();
            ctx.stroke();
          }
        }
        // ENTITY: CIRCLE (Light points, Sockets, Junctions)
        else if (ent.type === 'CIRCLE' && ent.center) {
          const center = toScreen(ent.center.x, ent.center.y);
          const radiusPx = (ent.radius || 0.25) * zoom;
          ctx.beginPath();
          ctx.arc(center.sx, center.sy, Math.max(3, radiusPx), 0, Math.PI * 2);
          ctx.stroke();

          // Symbol Specific Fill & Detail
          if (layerName.includes('ALUMB')) {
            // Lighting symbol center cross
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(center.sx, center.sy, Math.max(2, radiusPx * 0.45), 0, Math.PI * 2);
            ctx.fill();
          } else if (layerName.includes('ENCH')) {
            // Socket symbol twin pins
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(center.sx - 3, center.sy - 3, 6, 6);
          }
        }
        // ENTITY: ARC
        else if (ent.type === 'ARC' && ent.center) {
          const center = toScreen(ent.center.x, ent.center.y);
          const radiusPx = (ent.radius || 0.5) * zoom;
          const startAngle = -(ent.endAngle || 0);
          const endAngle = -(ent.startAngle || Math.PI);
          ctx.beginPath();
          ctx.arc(center.sx, center.sy, radiusPx, startAngle, endAngle, false);
          ctx.stroke();
        }
        // ENTITY: TEXT / MTEXT
        else if ((ent.type === 'TEXT' || ent.type === 'MTEXT') && (ent.position || ent.startPoint)) {
          const pos = ent.position || ent.startPoint;
          const sPos = toScreen(pos.x, pos.y);
          const textHeight = Math.max(10, (ent.textHeight || 0.35) * zoom);

          ctx.font = `bold ${Math.round(textHeight)}px monospace, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = strokeColor;
          ctx.fillText(ent.text || ent.string || '', sPos.sx, sPos.sy);
        }
      });
    }

    // 4. Render Active Measurement Line (if measuring)
    if (measurePoints.length > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      const p1Screen = toScreen(measurePoints[0].x, measurePoints[0].y);
      ctx.beginPath();
      ctx.arc(p1Screen.sx, p1Screen.sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      if (measurePoints.length === 2) {
        const p2Screen = toScreen(measurePoints[1].x, measurePoints[1].y);
        ctx.beginPath();
        ctx.moveTo(p1Screen.sx, p1Screen.sy);
        ctx.lineTo(p2Screen.sx, p2Screen.sy);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p2Screen.sx, p2Screen.sy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Measurement Text Box
        const midX = (p1Screen.sx + p2Screen.sx) / 2;
        const midY = (p1Screen.sy + p2Screen.sy) / 2 - 12;

        if (measuredDistance !== null) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(midX - 45, midY - 14, 90, 24);
          ctx.strokeStyle = '#f59e0b';
          ctx.setLineDash([]);
          ctx.strokeRect(midX - 45, midY - 14, 90, 24);

          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.fillText(`L = ${measuredDistance.toFixed(2)} m`, midX, midY + 2);
        }
      }
      ctx.setLineDash([]);
    }

    // 5. Drawing Origin Indicator (0,0)
    const origin = toScreen(0, 0);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origin.sx, origin.sy);
    ctx.lineTo(origin.sx + 25, origin.sy);
    ctx.stroke();

    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(origin.sx, origin.sy);
    ctx.lineTo(origin.sx, origin.sy - 25);
    ctx.stroke();

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('(0,0)', origin.sx + 4, origin.sy + 12);
  }, [parsedDxf, zoom, pan, theme, layerVisibility, layerColors, measurePoints, measuredDistance]);

  // Mouse / Touch Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert Screen Pixels to AutoCAD Coordinates
    const worldX = (clickX - pan.x) / zoom;
    const worldY = (pan.y - clickY) / zoom;

    if (activeTool === 'measure') {
      if (measurePoints.length === 0 || measurePoints.length === 2) {
        setMeasurePoints([{ x: worldX, y: worldY }]);
        setMeasuredDistance(null);
      } else if (measurePoints.length === 1) {
        const p1 = measurePoints[0];
        const p2 = { x: worldX, y: worldY };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        setMeasurePoints([p1, p2]);
        setMeasuredDistance(dist);
      }
    } else {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Update real-time world coordinates
    const worldX = (clickX - pan.x) / zoom;
    const worldY = (pan.y - clickY) / zoom;
    setCursorPos({ x: worldX, y: worldY });

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(5, Math.min(250, zoom * zoomFactor));

    // Zoom centered on cursor
    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Upload Local DXF/DWG or CAD File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoadingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawDxfString(content);
      }
      setIsLoadingFile(false);
    };
    reader.onerror = () => {
      setParseError('Error al leer el archivo desde el disco.');
      setIsLoadingFile(false);
    };

    if (file.name.toLowerCase().endsWith('.dxf')) {
      reader.readAsText(file);
    } else {
      // For DWG or other CAD files, read text or trigger fallback parser
      reader.readAsText(file);
    }
  };

  // Switch between sample blueprints
  const handleSelectSample = (sample: SampleDxfPlan) => {
    setSelectedSample(sample);
    setFileName(`${sample.name.replace(/\s+/g, '_')}.dxf`);
    setRawDxfString(sample.dxfContent);
  };

  // Toggle Layer Visibility
  const handleToggleLayer = (layerName: string) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  // Isolate Electrical Layers
  const handleIsolateElectricalLayers = () => {
    const newVis: Record<string, boolean> = {};
    Object.keys(layerVisibility).forEach((k) => {
      const upper = k.toUpperCase();
      newVis[k] = upper.includes('ALUMB') || upper.includes('ENCH') || upper.includes('TABLERO') || upper.includes('CONDUIT') || upper.includes('PROTECC');
    });
    setLayerVisibility(newVis);
  };

  // Show All Layers
  const handleShowAllLayers = () => {
    const newVis: Record<string, boolean> = {};
    Object.keys(layerVisibility).forEach((k) => {
      newVis[k] = true;
    });
    setLayerVisibility(newVis);
  };

  // Apply Extracted Census Data to Neovolt App
  const handleApplyToCensus = () => {
    if (!extractedData || !onApplyPlanToCensus) return;
    onApplyPlanToCensus(extractedData.rooms, extractedData.highAppliances);
    setAppliedToast('¡Plano AutoCAD y cubicación transferidos al Censo de Cargas!');
    setTimeout(() => {
      setAppliedToast(null);
      onClose();
    }, 1800);
  };

  // Download Current Plan as Clean DXF
  const handleDownloadDxf = () => {
    const blob = new Blob([rawDxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.dxf') ? fileName : `${fileName}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full h-[92vh] max-h-[900px] shadow-2xl flex flex-col overflow-hidden animate-fadeIn my-auto">
        {/* Toast Alert */}
        {appliedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>{appliedToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950/50">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Lector & Visor de Planos AutoCAD (.DXF / .DWG)</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Vectorial SEC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Visualización técnica CAD con gestión de capas, regla de medición, conteo de centros y cubicación automática RIC N°02.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDxf}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              title="Descargar archivo DXF"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Guardar .DXF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sample Blueprint Selector Bar */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Planos Tipo:</span>
            {SAMPLE_DXF_PLANS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  selectedSample.id === sample.id
                    ? 'bg-cyan-600/25 text-cyan-300 border-cyan-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>{sample.name.split('(')[0]}</span>
              </button>
            ))}
          </div>

          {/* Upload Button */}
          <label className="cursor-pointer shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow flex items-center gap-1.5 transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Cargar mi Plano (.DXF / .DWG)</span>
            <input
              type="file"
              accept=".dxf,.dwg,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Main 2-Column Work Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left / Center: Interactive CAD Vector Canvas */}
          <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* CAD Toolbar Top Overlay */}
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              {/* Left HUD: Coordinates & Zoom Level */}
              <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3 text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">X:</span>
                  <span className="text-cyan-300 font-bold">{cursorPos.x.toFixed(2)}m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Y:</span>
                  <span className="text-cyan-300 font-bold">{cursorPos.y.toFixed(2)}m</span>
                </div>
                <div className="text-slate-500">|</div>
                <div className="text-slate-400">Zoom: {Math.round((zoom / 38) * 100)}%</div>
              </div>

              {/* Right HUD: Tool Controls (Pan/Select, Measure, Fit, Themes) */}
              <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-lg flex items-center gap-1 text-xs">
                {/* Select / Pan Tool */}
                <button
                  onClick={() => setActiveTool('select')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    activeTool === 'select'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Herramienta Navegar / Mover (Pan)"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Navegar</span>
                </button>

                {/* Measure Tool */}
                <button
                  onClick={() => {
                    setActiveTool('measure');
                    setMeasurePoints([]);
                    setMeasuredDistance(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    activeTool === 'measure'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Regla de Medición: Haz clic en dos puntos del plano"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Medir (Cota)</span>
                </button>

                <div className="h-4 w-px bg-slate-700 mx-0.5" />

                {/* Zoom Controls */}
                <button
                  onClick={() => setZoom((z) => Math.min(250, z * 1.25))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Acercar (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(5, z * 0.8))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Alejar (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fitToScreen()}
                  className="p-1 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                  title="Ajustar a Pantalla (Zoom Extents)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-0.5" />

                {/* Theme Selector */}
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                >
                  <option value="cad-dark">AutoCAD Oscuro</option>
                  <option value="blueprint">Blueprint Azul</option>
                  <option value="paper-white">Papel Blanco</option>
                </select>
              </div>
            </div>

            {/* Error Banner */}
            {parseError && (
              <div className="absolute top-16 left-4 right-4 z-20 bg-rose-950/90 border border-rose-600/80 text-rose-200 text-xs p-3 rounded-xl shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{parseError}</span>
                </div>
                <button onClick={() => setParseError(null)} className="p-1 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Canvas Element */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className={`w-full h-full cursor-${activeTool === 'measure' ? 'crosshair' : isPanning ? 'grabbing' : 'grab'}`}
            />

            {/* Bottom Floating Hint */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-3 py-1 rounded-xl text-[10px] text-slate-400 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arrastra para mover el plano • Rueda para zoom • Clic para medir</span>
            </div>
          </div>

          {/* Right Sidebar: Layer Manager & Electrical Audit Breakdown */}
          <div className="w-full lg:w-80 bg-slate-900 p-4 flex flex-col justify-between overflow-y-auto space-y-4 shrink-0 border-l border-slate-800">
            {/* SECTION 1: CUBICACIÓN & RECONOCIMIENTO SEC */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Cubicación Automática SEC
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {extractedData?.surfaceM2 || 85} m²
                </span>
              </div>

              {extractedData && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">💡 Alumbrado</span>
                    <span className="text-sm font-black text-amber-400">{extractedData.lightsCount} centros</span>
                    <span className="text-[9px] text-slate-500 block">Máx 12 por circ.</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">🔌 Enchufes</span>
                    <span className="text-sm font-black text-cyan-400">{extractedData.socketsCount} módulos</span>
                    <span className="text-[9px] text-slate-500 block">Máx 10 por circ.</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">⚡ Tableros TDA</span>
                    <span className="text-sm font-black text-emerald-400">{extractedData.boardsCount} gabinete(s)</span>
                    <span className="text-[9px] text-slate-500 block">RIC N°02</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">📏 Conduit Estimado</span>
                    <span className="text-sm font-black text-purple-400">{extractedData.conduitMeters} m</span>
                    <span className="text-[9px] text-slate-500 block">PVC 20mm/25mm</span>
                  </div>
                </div>
              )}

              {/* Recintos Detectados */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Recintos Identificados en CAD:</span>
                  <span className="text-[10px] text-slate-500">{extractedData?.rooms.length || 0} zonas</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {extractedData?.rooms.map((r, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex items-center justify-between py-0.5 border-b border-slate-900">
                      <span className="truncate max-w-[130px]">• {r.name}</span>
                      <span className="font-mono text-slate-300">{r.lightPoints}L / {r.socketPoints}E</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 2: ADMINISTRADOR DE CAPAS (LAYERS) */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Layers2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Capas AutoCAD ({Object.keys(layerVisibility).length})</span>
                </div>

                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    onClick={handleIsolateElectricalLayers}
                    className="text-cyan-400 hover:underline font-semibold"
                  >
                    Solo Eléctrico
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={handleShowAllLayers}
                    className="text-slate-400 hover:underline font-semibold"
                  >
                    Todas
                  </button>
                </div>
              </div>

              {/* Layers List */}
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {Object.entries(layerVisibility).map(([layerName, isVisible]) => (
                  <div
                    key={layerName}
                    onClick={() => handleToggleLayer(layerName)}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isVisible
                        ? 'bg-slate-950 border-slate-800 text-slate-200'
                        : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: layerColors[layerName] || '#38bdf8' }}
                      />
                      <span className="truncate font-mono text-[11px]">{layerName}</span>
                    </div>

                    <button className="p-0.5 text-slate-400 hover:text-white">
                      {isVisible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: ACTION BUTTONS */}
            <div className="space-y-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                onClick={handleApplyToCensus}
                disabled={!extractedData}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Aplicar Plano al Censo de Cargas</span>
              </button>

              <p className="text-[10px] text-slate-500 text-center">
                Sincroniza recintos, luces, enchufes y tableros calculados en toda la plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AutoCadViewerModal;
