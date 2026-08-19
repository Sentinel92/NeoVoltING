import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import DxfParser from 'dxf-parser';
import {
  FileCode,
  Upload,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Ruler,
  MousePointer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Compass,
  Building,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Box,
  Sliders,
  Move,
  RefreshCw,
  Info,
  Maximize,
  Minimize
} from 'lucide-react';
import { SAMPLE_DXF_PLANS, SampleDxfPlan } from '../data/sampleDxfPlans';

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

export interface BoardPhysicalDimensions {
  dinModules: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  rows: number;
  capacityName: string;
}

export const BOARD_STANDARD_DIMENSIONS: Record<number, BoardPhysicalDimensions> = {
  12: { dinModules: 12, widthMm: 300, heightMm: 250, depthMm: 110, rows: 1, capacityName: 'Gabinete 12 Módulos DIN (1 Fila)' },
  24: { dinModules: 24, widthMm: 380, heightMm: 420, depthMm: 120, rows: 2, capacityName: 'Gabinete 24 Módulos DIN (2 Filas)' },
  36: { dinModules: 36, widthMm: 380, heightMm: 580, depthMm: 130, rows: 3, capacityName: 'Gabinete 36 Módulos DIN (3 Filas)' },
  48: { dinModules: 48, widthMm: 480, heightMm: 650, depthMm: 140, rows: 4, capacityName: 'Gabinete 48 Módulos DIN (4 Filas)' },
  72: { dinModules: 72, widthMm: 600, heightMm: 850, depthMm: 160, rows: 4, capacityName: 'Gabinete 72 Módulos DIN (Industrial)' },
};

export interface CadSpatialConfig {
  planId: string;
  planName: string;
  nicheWidthMm: number;
  nicheHeightMm: number;
  nicheX: number;
  nicheY: number;
  pixelsPerMeter: number;
  isCalibrated: boolean;
  activeLayers: Record<string, boolean>;
}

interface CadLayerCollisionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoardCapacity?: number;
  onApplySpatialConfig?: (config: CadSpatialConfig) => void;
}

export type CadLayerCategory = 'architecture' | 'furniture' | 'electrical' | 'other';

export const categorizeLayer = (layerName: string): CadLayerCategory => {
  const upper = layerName.toUpperCase();
  if (
    upper.includes('ALUMB') ||
    upper.includes('ENCH') ||
    upper.includes('TABLERO') ||
    upper.includes('CONDUIT') ||
    upper.includes('CANAL') ||
    upper.includes('ELECTR') ||
    upper.includes('LUZ') ||
    upper.includes('FUERZA') ||
    upper.includes('TDA')
  ) {
    return 'electrical';
  }
  if (
    upper.includes('MUEBLE') ||
    upper.includes('MOBIL') ||
    upper.includes('ARTEFACT') ||
    upper.includes('EQUIPO') ||
    upper.includes('SOFA') ||
    upper.includes('CAMA') ||
    upper.includes('COCINA_MUEBLE')
  ) {
    return 'furniture';
  }
  if (
    upper.includes('MURO') ||
    upper.includes('WALL') ||
    upper.includes('PUERTA') ||
    upper.includes('DOOR') ||
    upper.includes('VENTANA') ||
    upper.includes('WINDOW') ||
    upper.includes('COTA') ||
    upper.includes('DIM') ||
    upper.includes('TEXT') ||
    upper.includes('ARQUITECT')
  ) {
    return 'architecture';
  }
  return 'other';
};

export const CadLayerCollisionManagerModal: React.FC<CadLayerCollisionManagerModalProps> = ({
  isOpen,
  onClose,
  currentBoardCapacity = 24,
  onApplySpatialConfig,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Plan and File States
  const [selectedSample, setSelectedSample] = useState<SampleDxfPlan>(SAMPLE_DXF_PLANS[0]);
  const [rawDxfString, setRawDxfString] = useState<string>(SAMPLE_DXF_PLANS[0].dxfContent);
  const [fileName, setFileName] = useState<string>('Plano_Residencial_SEC_85m2.dxf');
  const [parsedDxf, setParsedDxf] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Viewport Transforms
  const [zoom, setZoom] = useState<number>(38); // pixels per meter
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 120, y: 380 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [theme, setTheme] = useState<'cad-dark' | 'blueprint' | 'paper-white'>('cad-dark');

  // Board Physical Specs
  const [boardCapacity, setBoardCapacity] = useState<number>(currentBoardCapacity);
  const boardDim = BOARD_STANDARD_DIMENSIONS[boardCapacity] || BOARD_STANDARD_DIMENSIONS[24];

  // Niche / Reserved Architectural Space (in meters/mm in CAD world)
  // Default niche size on plan: 450 mm width x 500 mm height
  const [nicheWorldPos, setNicheWorldPos] = useState<{ x: number; y: number }>({ x: 1.8, y: 5.6 });
  const [nicheWidthMm, setNicheWidthMm] = useState<number>(450);
  const [nicheHeightMm, setNicheHeightMm] = useState<number>(550);
  const [isDraggingNiche, setIsDraggingNiche] = useState<boolean>(false);

  // Tools: 'select' | 'measure' | 'calibrate' | 'move_niche'
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'calibrate' | 'move_niche'>('select');

  // Measure Tool Points
  const [measurePoints, setMeasurePoints] = useState<Array<{ x: number; y: number }>>([]);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);

  // Scale Calibration Tool
  const [calibrationPoints, setCalibrationPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [showCalibrationPrompt, setShowCalibrationPrompt] = useState<boolean>(false);
  const [calibrationInputMeters, setCalibrationInputMeters] = useState<string>('1.00');
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [pixelsPerMeter, setPixelsPerMeter] = useState<number>(38);

  // Layer Visibility
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const [layerColors, setLayerColors] = useState<Record<string, string>>({});

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Parse DXF String
  useEffect(() => {
    if (!rawDxfString) return;
    try {
      setParseError(null);
      const parser = new DxfParser();
      const parsed = parser.parseSync(rawDxfString);
      setParsedDxf(parsed);

      const layers: Record<string, boolean> = {};
      const colors: Record<string, string> = {};

      if (parsed.tables?.layer?.layers) {
        Object.entries(parsed.tables.layer.layers).forEach(([name, lData]: [string, any]) => {
          layers[name] = true;
          const colorNum = lData.color || 7;
          colors[name] = ACI_COLORS[colorNum] || '#38bdf8';
        });
      }

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
      fitToScreen(parsed);
    } catch (err: any) {
      console.error('Error parsing DXF in CadLayerCollisionManager:', err);
      setParseError(`No se pudo leer el archivo CAD: ${err?.message || 'Formato DXF'}`);
    }
  }, [rawDxfString]);

  // Synchronize initial capacity prop
  useEffect(() => {
    if (currentBoardCapacity && BOARD_STANDARD_DIMENSIONS[currentBoardCapacity]) {
      setBoardCapacity(currentBoardCapacity);
    }
  }, [currentBoardCapacity]);

  // Group Layers by Category
  const categorizedLayers = useMemo(() => {
    const categories: Record<CadLayerCategory, string[]> = {
      architecture: [],
      furniture: [],
      electrical: [],
      other: [],
    };

    Object.keys(layerVisibility).forEach((layerName) => {
      const cat = categorizeLayer(layerName);
      categories[cat].push(layerName);
    });

    return categories;
  }, [layerVisibility]);

  // Master Category Toggles
  const handleToggleCategory = (category: CadLayerCategory, forceState?: boolean) => {
    const layersInCat = categorizedLayers[category];
    const targetState = forceState !== undefined
      ? forceState
      : !layersInCat.every((l) => layerVisibility[l]);

    setLayerVisibility((prev) => {
      const next = { ...prev };
      layersInCat.forEach((l) => {
        next[l] = targetState;
      });
      return next;
    });
  };

  // Quick Preset Filters
  const handleFilterArchitectureAndElectrical = () => {
    setLayerVisibility((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach((layer) => {
        const cat = categorizeLayer(layer);
        next[layer] = cat === 'architecture' || cat === 'electrical';
      });
      return next;
    });
    setToastMessage('Filtro aplicado: Arquitectura + Eléctrica (Mobiliario Oculto)');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleFilterElectricalOnly = () => {
    setLayerVisibility((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach((layer) => {
        const cat = categorizeLayer(layer);
        next[layer] = cat === 'electrical';
      });
      return next;
    });
    setToastMessage('Filtro aplicado: Solo Capas Eléctricas');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShowAllLayers = () => {
    setLayerVisibility((prev) => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach((layer) => {
        next[layer] = true;
      });
      return next;
    });
    setToastMessage('Todas las capas visibles');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Collision Calculation: Compare Board Dimensions vs Niche Dimensions
  const collisionResult = useMemo(() => {
    const boardW = boardDim.widthMm;
    const boardH = boardDim.heightMm;

    const widthOverflowMm = Math.max(0, boardW - nicheWidthMm);
    const heightOverflowMm = Math.max(0, boardH - nicheHeightMm);
    const isColliding = widthOverflowMm > 0 || heightOverflowMm > 0;

    const boardAreaCm2 = (boardW * boardH) / 100;
    const nicheAreaCm2 = (nicheWidthMm * nicheHeightMm) / 100;
    const areaRatioPercent = Math.round((boardAreaCm2 / nicheAreaCm2) * 100);

    const horizontalClearanceMm = nicheWidthMm - boardW;
    const verticalClearanceMm = nicheHeightMm - boardH;

    return {
      isColliding,
      widthOverflowMm,
      heightOverflowMm,
      horizontalClearanceMm,
      verticalClearanceMm,
      areaRatioPercent,
      boardAreaCm2,
      nicheAreaCm2,
    };
  }, [boardDim, nicheWidthMm, nicheHeightMm]);

  // Center and Fit
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

      if (ent.vertices) ent.vertices.forEach((v: any) => checkPt(v.x, v.y));
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

    // 2. CAD Background Grid (1 meter minor grid)
    const gridSize = zoom;
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
      sy: pan.y - y * zoom,
    });

    // 3. Render DXF Entities
    if (parsedDxf && Array.isArray(parsedDxf.entities)) {
      parsedDxf.entities.forEach((ent: any) => {
        const layerName = ent.layer || '0';
        if (layerVisibility[layerName] === false) return;

        let strokeColor = layerColors[layerName] || '#38bdf8';
        if (ent.color !== undefined && ACI_COLORS[ent.color]) {
          strokeColor = ACI_COLORS[ent.color];
        }
        if (theme === 'paper-white' && strokeColor === '#ffffff') {
          strokeColor = '#0f172a';
        }

        const cat = categorizeLayer(layerName);
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = strokeColor;

        if (cat === 'architecture') {
          ctx.lineWidth = layerName.includes('MURO') ? 2.5 : 1.5;
        } else if (cat === 'electrical') {
          ctx.lineWidth = 2.0;
        } else if (cat === 'furniture') {
          ctx.lineWidth = 1.0;
          ctx.strokeStyle = theme === 'paper-white' ? '#94a3b8' : '#475569';
        } else {
          ctx.lineWidth = 1.2;
        }

        // LINE
        if (ent.type === 'LINE' && ent.vertices && ent.vertices.length >= 2) {
          const p1 = toScreen(ent.vertices[0].x, ent.vertices[0].y);
          const p2 = toScreen(ent.vertices[1].x, ent.vertices[1].y);
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        }
        // LWPOLYLINE / POLYLINE
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
        // CIRCLE (Lights / Sockets / Symbols)
        else if (ent.type === 'CIRCLE' && ent.center) {
          const center = toScreen(ent.center.x, ent.center.y);
          const radiusPx = (ent.radius || 0.25) * zoom;
          ctx.beginPath();
          ctx.arc(center.sx, center.sy, Math.max(3, radiusPx), 0, Math.PI * 2);
          ctx.stroke();

          if (layerName.includes('ALUMB')) {
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(center.sx, center.sy, Math.max(2, radiusPx * 0.45), 0, Math.PI * 2);
            ctx.fill();
          } else if (layerName.includes('ENCH')) {
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(center.sx - 3, center.sy - 3, 6, 6);
          }
        }
        // ARC
        else if (ent.type === 'ARC' && ent.center) {
          const center = toScreen(ent.center.x, ent.center.y);
          const radiusPx = (ent.radius || 0.5) * zoom;
          const startAngle = -(ent.endAngle || 0);
          const endAngle = -(ent.startAngle || Math.PI);
          ctx.beginPath();
          ctx.arc(center.sx, center.sy, radiusPx, startAngle, endAngle, false);
          ctx.stroke();
        }
        // TEXT / MTEXT
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

    // 4. RENDER ARCHITECTURAL NICHE & 2D BOARD SILHOUETTE WITH COLLISION HIGHLIGHT
    const nicheScreen = toScreen(nicheWorldPos.x, nicheWorldPos.y);
    const nicheW_px = (nicheWidthMm / 1000) * zoom;
    const nicheH_px = (nicheHeightMm / 1000) * zoom;

    const boardW_px = (boardDim.widthMm / 1000) * zoom;
    const boardH_px = (boardDim.heightMm / 1000) * zoom;

    // Draw Niche Container Area (Architectural Wall Opening)
    ctx.save();
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.fillRect(nicheScreen.sx - nicheW_px / 2, nicheScreen.sy - nicheH_px / 2, nicheW_px, nicheH_px);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(nicheScreen.sx - nicheW_px / 2, nicheScreen.sy - nicheH_px / 2, nicheW_px, nicheH_px);
    ctx.setLineDash([]);

    // Niche Dimensions Label
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Nicho CAD: ${nicheWidthMm}x${nicheHeightMm}mm`,
      nicheScreen.sx,
      nicheScreen.sy - nicheH_px / 2 - 6
    );

    // Draw 2D Board Enclosure inside or over the Niche
    const boardLeft = nicheScreen.sx - boardW_px / 2;
    const boardTop = nicheScreen.sy - boardH_px / 2;

    if (collisionResult.isColliding) {
      // FLASHING / PULSING RED COLLISION BORDER
      const pulseTime = Date.now() / 250;
      const pulseAlpha = 0.55 + 0.45 * Math.sin(pulseTime);

      ctx.fillStyle = `rgba(239, 68, 68, ${0.25 * pulseAlpha})`;
      ctx.fillRect(boardLeft, boardTop, boardW_px, boardH_px);

      ctx.strokeStyle = `rgba(244, 63, 94, ${pulseAlpha})`;
      ctx.lineWidth = 3.5;
      ctx.strokeRect(boardLeft, boardTop, boardW_px, boardH_px);

      // Warning Hatching or Exceeded Perimeter
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(boardLeft - 3, boardTop - 3, boardW_px + 6, boardH_px + 6);
      ctx.setLineDash([]);

      // Collision Tag
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(nicheScreen.sx - 75, nicheScreen.sy + boardH_px / 2 + 5, 150, 20);
      ctx.strokeStyle = '#ef4444';
      ctx.strokeRect(nicheScreen.sx - 75, nicheScreen.sy + boardH_px / 2 + 5, 150, 20);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#fecaca';
      ctx.fillText(`⚠️ COLISIÓN ESPACIAL`, nicheScreen.sx, nicheScreen.sy + boardH_px / 2 + 18);
    } else {
      // COMPLIANT BOARD - GREEN HIGHLIGHT
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(boardLeft, boardTop, boardW_px, boardH_px);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(boardLeft, boardTop, boardW_px, boardH_px);

      // Compliant Tag
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#86efac';
      ctx.fillText(
        `✓ Tablero ${boardDim.dinModules} DIN (${boardDim.widthMm}x${boardDim.heightMm}mm)`,
        nicheScreen.sx,
        nicheScreen.sy + boardH_px / 2 + 14
      );
    }

    // Mini DIN Rail representations inside the board
    const rowCount = boardDim.rows;
    for (let r = 0; r < rowCount; r++) {
      const rowY = boardTop + (boardH_px / (rowCount + 1)) * (r + 1);
      ctx.strokeStyle = collisionResult.isColliding ? '#fca5a5' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boardLeft + 10, rowY);
      ctx.lineTo(boardLeft + boardW_px - 10, rowY);
      ctx.stroke();
    }

    ctx.restore();

    // 5. RENDER MEASUREMENT LINE
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

    // 6. RENDER CALIBRATION REFERENCE LINE
    if (calibrationPoints.length > 0) {
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);

      const p1Screen = toScreen(calibrationPoints[0].x, calibrationPoints[0].y);
      ctx.beginPath();
      ctx.arc(p1Screen.sx, p1Screen.sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899';
      ctx.fill();

      if (calibrationPoints.length === 2) {
        const p2Screen = toScreen(calibrationPoints[1].x, calibrationPoints[1].y);
        ctx.beginPath();
        ctx.moveTo(p1Screen.sx, p1Screen.sy);
        ctx.lineTo(p2Screen.sx, p2Screen.sy);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p2Screen.sx, p2Screen.sy, 6, 0, Math.PI * 2);
        ctx.fill();

        const midX = (p1Screen.sx + p2Screen.sx) / 2;
        const midY = (p1Screen.sy + p2Screen.sy) / 2 - 14;

        ctx.fillStyle = '#500724';
        ctx.fillRect(midX - 60, midY - 14, 120, 26);
        ctx.strokeStyle = '#ec4899';
        ctx.setLineDash([]);
        ctx.strokeRect(midX - 60, midY - 14, 120, 26);

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#fbcfe8';
        ctx.textAlign = 'center';
        ctx.fillText(`📐 Calibrando Escala`, midX, midY + 3);
      }
      ctx.setLineDash([]);
    }

    // 7. Drawing Origin Indicator
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
  }, [
    parsedDxf,
    zoom,
    pan,
    theme,
    layerVisibility,
    layerColors,
    measurePoints,
    measuredDistance,
    calibrationPoints,
    nicheWorldPos,
    nicheWidthMm,
    nicheHeightMm,
    boardDim,
    collisionResult,
  ]);

  // Mouse Interactivity
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = (clickX - pan.x) / zoom;
    const worldY = (pan.y - clickY) / zoom;

    if (activeTool === 'move_niche') {
      setIsDraggingNiche(true);
      setNicheWorldPos({ x: worldX, y: worldY });
    } else if (activeTool === 'measure') {
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
    } else if (activeTool === 'calibrate') {
      if (calibrationPoints.length === 0 || calibrationPoints.length === 2) {
        setCalibrationPoints([{ x: worldX, y: worldY }]);
      } else if (calibrationPoints.length === 1) {
        const p1 = calibrationPoints[0];
        const p2 = { x: worldX, y: worldY };
        setCalibrationPoints([p1, p2]);
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const rawDist = Math.sqrt(dx * dx + dy * dy);
        setCalibrationInputMeters(rawDist > 0 ? rawDist.toFixed(2) : '1.00');
        setShowCalibrationPrompt(true);
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

    const worldX = (clickX - pan.x) / zoom;
    const worldY = (pan.y - clickY) / zoom;
    setCursorPos({ x: worldX, y: worldY });

    if (isDraggingNiche && activeTool === 'move_niche') {
      setNicheWorldPos({ x: worldX, y: worldY });
    } else if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingNiche(false);
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

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Upload Local DXF/DWG file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setRawDxfString(content);
    };
    reader.readAsText(file);
  };

  // Switch Sample Plan
  const handleSelectSample = (sample: SampleDxfPlan) => {
    setSelectedSample(sample);
    setFileName(`${sample.name.replace(/\s+/g, '_')}.dxf`);
    setRawDxfString(sample.dxfContent);
  };

  // Scale Calibration Confirmation
  const handleConfirmCalibration = () => {
    if (calibrationPoints.length !== 2) return;
    const p1 = calibrationPoints[0];
    const p2 = calibrationPoints[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy) * zoom;

    const realMeters = parseFloat(calibrationInputMeters);
    if (!isNaN(realMeters) && realMeters > 0) {
      const calculatedPpm = pixelDistance / realMeters;
      setPixelsPerMeter(calculatedPpm);
      setZoom(Math.max(10, Math.min(200, calculatedPpm)));
      setIsCalibrated(true);
      setShowCalibrationPrompt(false);
      setActiveTool('select');
      setToastMessage(`✓ Escala Calibrada: 1.00m = ${calculatedPpm.toFixed(1)}px reales`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Synchronize Configuration to Tab
  const handleApplyConfig = () => {
    if (onApplySpatialConfig) {
      onApplySpatialConfig({
        planId: selectedSample.id,
        planName: fileName,
        nicheWidthMm,
        nicheHeightMm,
        nicheX: nicheWorldPos.x,
        nicheY: nicheWorldPos.y,
        pixelsPerMeter: zoom,
        isCalibrated,
        activeLayers: layerVisibility,
      });
    }
    setToastMessage('✓ Configuración espacial y capas sincronizadas con el Tablero 2D');
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full h-[92vh] max-h-[920px] shadow-2xl flex flex-col overflow-hidden animate-fadeIn my-auto">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950/50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Visualizador de Capas CAD &amp; Detección de Colisiones 2D</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  RIC N°02 SEC
                </span>
                {collisionResult.isColliding ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600 animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" /> Colisión Espacial
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Espacio Conforme
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Filtro de capas (arquitectura, mobiliario, eléctrica), verificación de dimensiones de nicho y calibración de escala.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Blueprint Selector & File Upload Header Bar */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
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

          <label className="cursor-pointer shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow flex items-center gap-1.5 transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Archivo CAD (.DXF / .DWG)</span>
            <input type="file" accept=".dxf,.dwg,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Main 2-Column Work Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT: Interactive Vector Canvas */}
          <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Top Toolbar Overlay */}
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              {/* Coordinates & Calibration Indicator */}
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
                <div className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-pink-400" />
                  <span className={isCalibrated ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {isCalibrated ? 'Escala Calibrada' : 'Escala Estándar 1m'}
                  </span>
                </div>
              </div>

              {/* Action Tools (Navigate, Move Niche, Measure, Calibrate, Zoom, Theme) */}
              <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-lg flex flex-wrap items-center gap-1 text-xs">
                {/* Navigate */}
                <button
                  onClick={() => setActiveTool('select')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    activeTool === 'select' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Navegar y desplazar plano (Pan)"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Navegar</span>
                </button>

                {/* Move Niche Location */}
                <button
                  onClick={() => setActiveTool('move_niche')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    activeTool === 'move_niche' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Mover la ubicación del Nicho / Tablero en el plano"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ubicar Nicho</span>
                </button>

                {/* Measure Rule */}
                <button
                  onClick={() => {
                    setActiveTool('measure');
                    setMeasurePoints([]);
                    setMeasuredDistance(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    activeTool === 'measure' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Medir distancia entre 2 puntos"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Medir</span>
                </button>

                {/* Scale Calibration Tool */}
                <button
                  onClick={() => {
                    setActiveTool('calibrate');
                    setCalibrationPoints([]);
                    setShowCalibrationPrompt(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    activeTool === 'calibrate' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Calibrar escala: Haz clic en 2 extremos de una pared conocida y define su longitud real"
                >
                  <Scale className="w-3.5 h-3.5 text-pink-300" />
                  <span className="hidden sm:inline">Calibrar Escala</span>
                </button>

                <div className="h-4 w-px bg-slate-700 mx-0.5" />

                {/* Zoom Controls */}
                <button
                  onClick={() => setZoom((z) => Math.min(250, z * 1.25))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(5, z * 0.8))}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fitToScreen()}
                  className="p-1 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                  title="Centrar y Ajustar a Pantalla"
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

            {/* Calibration Dialog Modal Box */}
            {showCalibrationPrompt && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900 border-2 border-pink-500 rounded-2xl p-4 shadow-2xl text-slate-200 w-80 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-bold text-white">Definir Longitud Real de Referencia</span>
                  </div>
                  <button onClick={() => setShowCalibrationPrompt(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-tight">
                  Has trazado una línea entre 2 puntos del plano. Ingresa la distancia real para calibrar la escala milimétrica del tablero.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={calibrationInputMeters}
                    onChange={(e) => setCalibrationInputMeters(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-pink-500"
                    placeholder="Ej. 3.20"
                  />
                  <span className="text-xs font-bold text-slate-400">Metros</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowCalibrationPrompt(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmCalibration}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow transition-all"
                  >
                    Aplicar Calibración
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {parseError && (
              <div className="absolute top-16 left-4 right-4 z-20 bg-rose-950/90 border border-rose-600 text-rose-200 text-xs p-3 rounded-xl shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{parseError}</span>
                </div>
                <button onClick={() => setParseError(null)} className="p-1 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className={`w-full h-full cursor-${
                activeTool === 'move_niche'
                  ? 'move'
                  : activeTool === 'measure' || activeTool === 'calibrate'
                  ? 'crosshair'
                  : isPanning
                  ? 'grabbing'
                  : 'grab'
              }`}
            />

            {/* Collision Top Alert if Colliding */}
            {collisionResult.isColliding && (
              <div className="absolute bottom-12 left-4 right-4 z-20 bg-rose-950/95 border-2 border-rose-500 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-rose-200 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-white tracking-wide block">
                      ⚠️ ¡Alerta de Colisión Espacial en Plano CAD!
                    </span>
                    <p className="text-[11px] text-rose-300 leading-tight">
                      El tablero ({boardDim.widthMm}×{boardDim.heightMm} mm) sobrepasa el nicho disponible ({nicheWidthMm}×{nicheHeightMm} mm) por{' '}
                      <strong>{Math.max(collisionResult.widthOverflowMm, collisionResult.heightOverflowMm)} mm</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setNicheWidthMm(boardDim.widthMm + 60);
                      setNicheHeightMm(boardDim.heightMm + 60);
                      setToastMessage('Nicho ampliado automáticamente a dimensiones compatibles');
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition active:scale-95"
                  >
                    Ampliar Nicho CAD
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Status Hint */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-3 py-1 rounded-xl text-[10px] text-slate-400 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {activeTool === 'move_niche'
                  ? 'Haz clic en el plano para posicionar el nicho del tablero'
                  : activeTool === 'calibrate'
                  ? 'Haz clic en 2 puntos para calibrar escala milimétrica'
                  : activeTool === 'measure'
                  ? 'Haz clic en dos extremos para medir cotas'
                  : 'Arrastra para mover el plano • Rueda para zoom'}
              </span>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Layer Visualizer, Collision Metrics & Controls */}
          <div className="w-full lg:w-80 bg-slate-900 p-4 flex flex-col justify-between overflow-y-auto space-y-4 shrink-0 border-l border-slate-800">
            {/* 1. LAYER VISUALIZER (CAPAS DE ARQUITECTURA, MOBILIARIO Y ELÉCTRICA) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Visualizador de Capas</h4>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button onClick={handleFilterArchitectureAndElectrical} className="text-cyan-400 hover:underline font-semibold" title="Ocultar Mobiliario">
                    Sin Muebles
                  </button>
                  <span className="text-slate-600">|</span>
                  <button onClick={handleShowAllLayers} className="text-slate-400 hover:underline font-semibold">
                    Todas
                  </button>
                </div>
              </div>

              {/* Master Category Toggles */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* Architecture */}
                <button
                  onClick={() => handleToggleCategory('architecture')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    categorizedLayers.architecture.some((l) => layerVisibility[l])
                      ? 'bg-cyan-950/60 border-cyan-700 text-cyan-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] block leading-tight">Arquitectura</span>
                  <span className="text-[9px] opacity-75">{categorizedLayers.architecture.length} capas</span>
                </button>

                {/* Furniture */}
                <button
                  onClick={() => handleToggleCategory('furniture')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    categorizedLayers.furniture.some((l) => layerVisibility[l])
                      ? 'bg-amber-950/60 border-amber-700 text-amber-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] block leading-tight">Mobiliario</span>
                  <span className="text-[9px] opacity-75">{categorizedLayers.furniture.length} capas</span>
                </button>

                {/* Electrical */}
                <button
                  onClick={() => handleToggleCategory('electrical')}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    categorizedLayers.electrical.some((l) => layerVisibility[l])
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] block leading-tight">Eléctrica</span>
                  <span className="text-[9px] opacity-75">{categorizedLayers.electrical.length} capas</span>
                </button>
              </div>

              {/* Layer Detailed List */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 max-h-32 overflow-y-auto space-y-1 pr-1">
                {Object.entries(layerVisibility).map(([layerName, isVis]) => {
                  const cat = categorizeLayer(layerName);
                  return (
                    <div
                      key={layerName}
                      onClick={() => setLayerVisibility((p) => ({ ...p, [layerName]: !p[layerName] }))}
                      className={`flex items-center justify-between p-1 rounded-lg text-[11px] cursor-pointer transition ${
                        isVis ? 'text-slate-200 hover:bg-slate-900' : 'text-slate-600 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: layerColors[layerName] || '#38bdf8' }}
                        />
                        <span className="truncate font-mono">{layerName}</span>
                      </div>
                      <button className="text-slate-400 hover:text-white">
                        {isVis ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SPATIAL COLLISION & NICHE DIMENSION CONTROLS */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ShieldAlert className={`w-4 h-4 ${collisionResult.isColliding ? 'text-rose-400' : 'text-emerald-400'}`} />
                  <span>Detección de Colisión Espacial</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    collisionResult.isColliding
                      ? 'bg-rose-950 border border-rose-600 text-rose-300'
                      : 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                  }`}
                >
                  {collisionResult.isColliding ? 'NO CABE' : 'ESPACIO OK'}
                </span>
              </div>

              {/* Board Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Capacidad Tablero 2D:</label>
                <select
                  value={boardCapacity}
                  onChange={(e) => setBoardCapacity(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {Object.entries(BOARD_STANDARD_DIMENSIONS).map(([cap, d]) => (
                    <option key={cap} value={cap}>
                      {d.capacityName} ({d.widthMm}x{d.heightMm}mm)
                    </option>
                  ))}
                </select>
              </div>

              {/* Niche Dimensions Editor */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">Ancho Nicho CAD</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="10"
                      min="200"
                      max="1500"
                      value={nicheWidthMm}
                      onChange={(e) => setNicheWidthMm(parseInt(e.target.value) || 300)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono font-bold focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">mm</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">Alto Nicho CAD</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="10"
                      min="200"
                      max="1800"
                      value={nicheHeightMm}
                      onChange={(e) => setNicheHeightMm(parseInt(e.target.value) || 300)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono font-bold focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">mm</span>
                  </div>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Dimensiones Tablero:</span>
                  <span className="font-mono text-white font-bold">{boardDim.widthMm} x {boardDim.heightMm} mm</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Holgura Horizontal:</span>
                  <span className={`font-mono font-bold ${collisionResult.horizontalClearanceMm < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {collisionResult.horizontalClearanceMm >= 0 ? `+${collisionResult.horizontalClearanceMm} mm` : `${collisionResult.horizontalClearanceMm} mm`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Holgura Vertical:</span>
                  <span className={`font-mono font-bold ${collisionResult.verticalClearanceMm < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {collisionResult.verticalClearanceMm >= 0 ? `+${collisionResult.verticalClearanceMm} mm` : `${collisionResult.verticalClearanceMm} mm`}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. FOOTER ACTIONS */}
            <div className="space-y-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                onClick={handleApplyConfig}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Aplicar al Generador de Tablero 2D</span>
              </button>

              <p className="text-[10px] text-slate-500 text-center">
                Sincroniza nicho arquitectónico, capas visibles y calibración en el simulador 2D.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadLayerCollisionManagerModal;
