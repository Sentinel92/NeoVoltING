import React, { useState, useRef, useEffect } from 'react';
import { RoomData, HighAppliance, CustomProtectionSpecs, ContractorConfig, CustomerDetails } from '../types';
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Zap,
  Layers,
  Info,
  Printer,
  Loader2,
  Sliders,
  Edit3,
  CheckCircle2,
  RefreshCw,
  X,
  Shield,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Settings,
  Calculator,
  Building,
  User,
  MapPin,
  Calendar,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Award,
  Table,
} from 'lucide-react';
import { downloadPdfFromElement } from '../utils/pdfGenerator';

interface SingleLineCanvasRendererProps {
  isThreePhase: boolean;
  feederLength: number;
  feederWireSection: number;
  iga: { amps: number; curve: string; breakingCapacity: string; poles: string };
  dps: { voltage: string; dischargeCurrent: string };
  rcds: Record<number, { amps: number; sensitivity: string; classType: string }>;
  circuits: Array<{
    code: string;
    name: string;
    breaker: string;
    wire: string;
    pipe: string;
    loadW: number;
    rcdGroup: number;
    amps: number;
  }>;
  vNominal: number;
  dropVolts: number;
  dropPercent: number;
  isDropExceeded: boolean;
}

export const SingleLineCanvasRenderer: React.FC<SingleLineCanvasRendererProps> = ({
  isThreePhase,
  feederLength,
  feederWireSection,
  iga,
  dps,
  rcds,
  circuits,
  vNominal,
  dropVolts,
  dropPercent,
  isDropExceeded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numCircuits = Math.max(1, circuits.length);
    const colWidth = 175;
    const paddingLeft = 40;
    const width = Math.max(1050, paddingLeft + numCircuits * colWidth + 60);
    const height = 600;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // 1. Draw CAD Dark Canvas Background with subtle grid lines
    ctx.fillStyle = '#0b132b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Title Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('DIAGRAMA UNIFILAR AUTOMÁTICO (MOTOR CANVAS 2D CAD - SEC RIC N°02)', 20, 28);

    // 3. Empalme / Red Distribuidora Symbol
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 48, 120, 45, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('RED DISTRIBUIDORA', 28, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(isThreePhase ? '380V 3Ф (Trifásico)' : '220V 1Ф (Monofásico)', 28, 80);

    // Wire from Empalme to kWh Meter
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(140, 70.5);
    ctx.lineTo(185, 70.5);
    ctx.stroke();

    // 4. Medidor kWh Circle
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(210, 70.5, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('kWh', 210, 68);
    ctx.fillText('MEDIDOR', 210, 79);
    ctx.textAlign = 'left';

    // 5. Alimentador Principal Line
    const feederColor = isDropExceeded ? '#f43f5e' : '#10b981';
    ctx.strokeStyle = feederColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(234, 70.5);
    ctx.lineTo(430, 70.5);
    ctx.stroke();

    // Alimentador Label Box
    ctx.fillStyle = isDropExceeded ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = feederColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(248, 38, 172, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDropExceeded ? '#fca5a5' : '#a7f3d0';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`Alimentador ${feederWireSection}mm² EVA (${feederLength}m)`, 254, 50);
    ctx.fillText(`Caída V: ${dropPercent.toFixed(2)}% (${dropVolts.toFixed(2)}V)`, 254, 60);

    // 6. IGA (Interruptor General)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(430, 44, 130, 52, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e879f9';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('IGA GENERAL', 440, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${iga.poles}${iga.amps}A ${iga.curve}`, 440, 76);
    ctx.fillStyle = '#d8b4fe';
    ctx.font = '9px sans-serif';
    ctx.fillText(`P.C. ${iga.breakingCapacity}`, 440, 88);

    // Wire from IGA to DPS
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(560, 70.5);
    ctx.lineTo(610, 70.5);
    ctx.stroke();

    // 7. DPS (Protector Sobretensiones)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(610, 44, 120, 52, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('DPS SOBRETENSIÓN', 620, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${dps.voltage} - ${dps.dischargeCurrent}`, 620, 76);

    // Ground connection line from DPS down
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(670, 96);
    ctx.lineTo(670, 125);
    ctx.stroke();
    // Ground symbol
    ctx.beginPath();
    ctx.moveTo(660, 125);
    ctx.lineTo(680, 125);
    ctx.moveTo(663, 129);
    ctx.lineTo(677, 129);
    ctx.moveTo(667, 133);
    ctx.lineTo(673, 133);
    ctx.stroke();

    // Wire down to Main Busbar
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(730, 70.5);
    ctx.lineTo(770, 70.5);
    ctx.lineTo(770, 145);
    ctx.lineTo(40, 145);
    ctx.stroke();

    // 8. Main Distribution Busbars
    const busY = 145;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(30, busY - 3, width - 60, 6); // Phase L1 Busbar

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('BARRA DISTRIBUIDORA PRINCIPAL TABLERO TDA (FASE + NEUTRO + PE)', 40, busY - 7);

    // 9. Draw Circuits & RCDs
    circuits.forEach((cto, idx) => {
      const x = 50 + idx * colWidth;
      const startY = busY + 3;

      // Vertical feeder drop line from busbar
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 50, startY);
      ctx.lineTo(x + 50, startY + 35);
      ctx.stroke();

      // RCD Differential Box (Grouped)
      const rcdSpec = rcds[cto.rcdGroup] || { amps: 25, sensitivity: '30mA', classType: 'Clase AC' };
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, startY + 35, 120, 48, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`RCD G${cto.rcdGroup} (Diferencial)`, x + 8, startY + 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`2x${rcdSpec.amps}A ${rcdSpec.sensitivity}`, x + 8, startY + 64);
      ctx.fillStyle = '#e9d5ff';
      ctx.font = '8px sans-serif';
      ctx.fillText(rcdSpec.classType, x + 8, startY + 76);

      // Line from RCD to MCB
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 50, startY + 83);
      ctx.lineTo(x + 50, startY + 110);
      ctx.stroke();

      // MCB Circuit Breaker Box
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, startY + 110, 130, 85, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(cto.code, x + 10, startY + 128);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(cto.name.length > 15 ? cto.name.substring(0, 14) + '...' : cto.name, x + 35, startY + 128);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(cto.breaker, x + 10, startY + 145);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`Cond: ${cto.wire}`, x + 10, startY + 160);
      ctx.fillText(`Canal: ${cto.pipe}`, x + 10, startY + 173);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`P_decl: ${cto.loadW} W`, x + 10, startY + 186);

      // Outgoing Load Connection Line
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 50, startY + 195);
      ctx.lineTo(x + 50, startY + 240);
      ctx.stroke();

      // Load Terminal End Arrow / Circle
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(x + 50, startY + 240, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 10. Compliance Normative Stamp
    ctx.fillStyle = isDropExceeded ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = isDropExceeded ? '#f43f5e' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(width - 320, height - 75, 300, 60, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDropExceeded ? '#fca5a5' : '#34d399';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(
      isDropExceeded
        ? '⚠️ ALIMENTADOR EXCEDE LÍMITE 3% (NORMA RIC N°04)'
        : '✓ CUMPLE NORMATIVA SEC CHILE (RIC N°02, N°04, N°05)',
      width - 310,
      height - 58
    );
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px sans-serif';
    ctx.fillText(`Caída de Tensión Calculada: ${dropPercent.toFixed(2)}% (${dropVolts.toFixed(2)}V)`, width - 310, height - 44);
    ctx.fillText(`Tensión Nominal: ${vNominal}V | Circuito Básico TE1`, width - 310, height - 30);

  }, [isThreePhase, feederLength, feederWireSection, iga, dps, rcds, circuits, vNominal, dropVolts, dropPercent, isDropExceeded]);

  const handleExportCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diagrama_Unifilar_Canvas2D_TE1.png`;
    a.click();
  };

  return (
    <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Motor de Renderizado Canvas 2D - Diagrama Unifilar Autogenerado
          </h3>
        </div>

        <button
          onClick={handleExportCanvasImage}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-all shadow self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Exportar Imagen Canvas PNG</span>
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-slate-800 rounded-xl bg-slate-900 p-2">
        <canvas ref={canvasRef} className="block mx-auto rounded-lg shadow-inner" />
      </div>
    </div>
  );
};

interface SingleLineDiagramTabProps {
  rooms: RoomData[];
  highAppliances: HighAppliance[];
  feederLength: number;
  setFeederLength?: (len: number) => void;
  isThreePhase: boolean;
  feederWireSection: number;
  setFeederWireSection?: (sec: number) => void;
  customProtectionSpecs?: CustomProtectionSpecs;
  onUpdateProtectionSpecs?: (updated: CustomProtectionSpecs) => void;
  onSyncToBudget?: (updatedSpecs?: CustomProtectionSpecs) => void;
  contractor?: ContractorConfig;
  customer?: CustomerDetails;
}

export const SingleLineDiagramTab: React.FC<SingleLineDiagramTabProps> = ({
  rooms,
  highAppliances,
  feederLength,
  setFeederLength,
  isThreePhase,
  feederWireSection,
  setFeederWireSection,
  customProtectionSpecs,
  onUpdateProtectionSpecs = (_updated: CustomProtectionSpecs) => {},
  onSyncToBudget = (_updatedSpecs?: CustomProtectionSpecs) => {},
  contractor,
  customer,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalTab, setPdfModalTab] = useState<'branding' | 'options'>('branding');
  const [pdfColorChoice, setPdfColorChoice] = useState<'color' | 'bw'>('color');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isFullscreenDiagram, setIsFullscreenDiagram] = useState(false);
  const diagramDocRef = useRef<HTMLDivElement>(null);

  // Contractor Branding & Logo State for PDF Output
  const [contractorInfo, setContractorInfo] = useState({
    companyName: contractor?.companyName || 'NEOVOLT - Ingeniería Eléctrica de Precisión',
    installerName: contractor?.installerName || 'Camilo Rojas',
    secLicense: contractor?.secLicense || 'SEC-84291-CL',
    secClass: contractor?.secClass || 'Clase A (Alta y Baja Tensión)',
    rut: contractor?.rut || '76.892.410-5',
    phone: contractor?.phone || '+56 9 9876 5432',
    email: contractor?.senderEmail || 'contacto@neovolt.cl',
    address: contractor?.address || 'Av. Andrés Bello 2233, Providencia, Santiago',
    logoUrl: contractor?.customLogoUrl || '',
  });

  // Project Metadata State for PDF Output
  const [projectInfo, setProjectInfo] = useState({
    clientName: customer?.name || 'Juan Pérez Ovalle',
    clientRut: customer?.rut || '15.482.910-3',
    projectAddress: customer?.address || 'Av. Providencia 1240, Santiago',
    projectCity: customer?.city || 'Providencia',
    projectCode: 'TE1-2026-TDA01',
    projectDate: new Date().toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  });

  // Update contractor & customer if parent props update
  useEffect(() => {
    if (contractor) {
      setContractorInfo((prev) => ({
        ...prev,
        companyName: contractor.companyName || prev.companyName,
        installerName: contractor.installerName || prev.installerName,
        secLicense: contractor.secLicense || prev.secLicense,
        secClass: contractor.secClass || prev.secClass,
        rut: contractor.rut || prev.rut,
        phone: contractor.phone || prev.phone,
        email: contractor.senderEmail || prev.email,
        address: contractor.address || prev.address,
        logoUrl: contractor.customLogoUrl || prev.logoUrl,
      }));
    }
  }, [contractor]);

  useEffect(() => {
    if (customer) {
      setProjectInfo((prev) => ({
        ...prev,
        clientName: customer.name || prev.clientName,
        clientRut: customer.rut || prev.clientRut,
        projectAddress: customer.address || prev.projectAddress,
        projectCity: customer.city || prev.projectCity,
      }));
    }
  }, [customer]);

  // Logo upload reader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('⚠️ El archivo de logo debe pesar menos de 3 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setContractorInfo((prev) => ({ ...prev, logoUrl: reader.result as string }));
        showToast(' Logotipo del contratista cargado con éxito.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Active editing modal state for diagram elements
  const [editingComponent, setEditingComponent] = useState<{
    type: 'iga' | 'dps' | 'rcd' | 'cb' | 'feeder';
    rcdGroup?: number;
    code?: string;
    currentName?: string;
  } | null>(null);

  // Local copy of protection specs for live edits
  const specs: CustomProtectionSpecs = customProtectionSpecs || {
    iga: { amps: 25, curve: 'Curva C', breakingCapacity: '6kA', poles: isThreePhase ? '3x' : '1x' },
    dps: { voltage: isThreePhase ? '400V' : '275V', dischargeCurrent: '20kA' },
    rcds: {
      1: { amps: 25, sensitivity: '30mA', classType: 'Clase AC' },
      2: { amps: 40, sensitivity: '30mA', classType: 'Clase AC' },
      3: { amps: 40, sensitivity: '30mA', classType: 'Clase AC' },
    },
    circuitBreakers: {},
  };

  // Total Load calculation
  const totalLights = rooms.reduce((sum, r) => sum + r.lightPoints, 0);
  const totalSockets = rooms.reduce((sum, r) => sum + r.socketPoints, 0);
  const roomDevWatts = rooms.reduce((sum, r) => sum + r.devices.reduce((d, x) => d + x.powerWatts * x.quantity, 0), 0);
  const totalPowerW = totalLights * 100 + totalSockets * 150 + roomDevWatts + highAppliances.reduce((sum, h) => sum + h.powerWatts, 0);
  const totalPowerKW = totalPowerW / 1000;

  // Nominal voltage & default IGA calculation
  const vNominal = isThreePhase ? 380 : 220;
  const currentIn = totalPowerW / (vNominal * 0.93 * (isThreePhase ? 1.732 : 1));
  let calculatedIgaRating = 25;
  if (currentIn > 40) calculatedIgaRating = 50;
  else if (currentIn > 32) calculatedIgaRating = 40;
  else if (currentIn > 25) calculatedIgaRating = 32;
  else if (currentIn > 16) calculatedIgaRating = 25;
  else calculatedIgaRating = 16;

  // Active IGA specs
  const igaAmps = specs.iga?.amps || calculatedIgaRating;
  const igaCurve = specs.iga?.curve || 'Curva C';
  const igaBreaking = specs.iga?.breakingCapacity || '6kA';
  const igaPoles = specs.iga?.poles || (isThreePhase ? '3x' : '1x');

  // Active DPS specs
  const dpsVoltage = specs.dps?.voltage || (isThreePhase ? '400V' : '275V');
  const dpsDischarge = specs.dps?.dischargeCurrent || '20kA';

  // State & Calculations for Voltage Drop Calculator (Norma SEC RIC N°04)
  const [calcCurrent, setCalcCurrent] = useState<number>(() => Math.round((currentIn || 15) * 10) / 10);
  const [calcDistance, setCalcDistance] = useState<number>(() => feederLength || 20);

  // Standard Normalized Conductor Sections (mm²) under SEC RIC N°04
  const NORMALIZED_SECTIONS = [2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0, 70.0, 95.0, 120.0];

  // RIC N°04 Parameters
  const rhoCopper = 0.0178; // Resistividad cobre Ω·mm²/m
  const maxAllowedDropPercent = 3.0; // 3.0% máx permitido para alimentadores según RIC N°04
  const vMaxAllowedVolts = (vNominal * maxAllowedDropPercent) / 100;

  // Calculate voltage drop in Volts and % for a given section S (mm²), distance L (m), current I (A)
  const calculateVoltageDrop = (s: number, l: number, i: number) => {
    if (s <= 0 || l <= 0 || i <= 0) return { dropVolts: 0, dropPercent: 0 };
    const factor = isThreePhase ? Math.sqrt(3) : 2.0;
    const dropVolts = (factor * l * i * rhoCopper) / s;
    const dropPercent = (dropVolts / vNominal) * 100;
    return { dropVolts, dropPercent };
  };

  const calcFactor = isThreePhase ? Math.sqrt(3) : 2.0;
  const theoreticalSection = (calcFactor * calcDistance * calcCurrent * rhoCopper) / vMaxAllowedVolts;
  const suggestedSection = NORMALIZED_SECTIONS.find((s) => s >= theoreticalSection) || 120.0;
  const currentSection = feederWireSection || 4.0;
  const currentDrop = calculateVoltageDrop(currentSection, calcDistance, calcCurrent);
  const isSectionInsufficient = currentSection < suggestedSection || currentDrop.dropPercent > maxAllowedDropPercent;

  // Build Raw Circuits List
  const rawCircuits: {
    code: string;
    name: string;
    defaultBreaker: string;
    defaultWire: string;
    defaultPipe: string;
    loadW: number;
    rcdGroup: number;
    defaultAmps: number;
  }[] = [];

  let lightCount = Math.ceil(totalLights / 12) || (totalLights > 0 ? 1 : 0);
  let socketCount = Math.ceil(totalSockets / 10) || (totalSockets > 0 ? 1 : 0);

  let cIdx = 1;
  for (let i = 0; i < lightCount; i++) {
    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Alumbrado General ${i + 1}`,
      defaultBreaker: '1x10A 6kA Curva C',
      defaultWire: '3 x 1.5 mm² EVA',
      defaultPipe: 'PVC 20mm',
      loadW: Math.round((totalLights * 100) / (lightCount || 1)),
      rcdGroup: Math.ceil(cIdx / 3),
      defaultAmps: 10,
    });
    cIdx++;
  }

  for (let i = 0; i < socketCount; i++) {
    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Enchufes Generales 10A ${i + 1}`,
      defaultBreaker: '1x16A 6kA Curva C',
      defaultWire: '3 x 2.5 mm² EVA',
      defaultPipe: 'PVC 25mm',
      loadW: Math.round((totalSockets * 150 + roomDevWatts) / (socketCount || 1)),
      rcdGroup: Math.ceil(cIdx / 3),
      defaultAmps: 16,
    });
    cIdx++;
  }

  highAppliances.forEach((app) => {
    let b = '1x16A 6kA Curva C';
    let w = '3 x 2.5 mm² EVA';
    let p = 'PVC 25mm';
    let a = 16;
    if (app.powerWatts > 5000) {
      b = '1x32A 6kA Curva C';
      w = '3 x 6.0 mm² EVA';
      p = 'EMT 3/4"';
      a = 32;
    } else if (app.powerWatts > 3000) {
      b = '1x20A 6kA Curva C';
      w = '3 x 4.0 mm² EVA';
      p = 'PVC 25mm';
      a = 20;
    }

    rawCircuits.push({
      code: `C${cIdx}`,
      name: `Carga Dedicada - ${app.name}`,
      defaultBreaker: b,
      defaultWire: w,
      defaultPipe: p,
      loadW: app.powerWatts,
      rcdGroup: Math.ceil(cIdx / 3),
      defaultAmps: a,
    });
    cIdx++;
  });

  if (rawCircuits.length === 0) {
    rawCircuits.push({
      code: 'C1',
      name: 'Circuito General',
      defaultBreaker: '1x16A 6kA Curva C',
      defaultWire: '3 x 2.5 mm² EVA',
      defaultPipe: 'PVC 25mm',
      loadW: 2000,
      rcdGroup: 1,
      defaultAmps: 16,
    });
  }

  // Map active circuits with user overrides
  const circuits = rawCircuits.map((cto) => {
    const custom = specs.circuitBreakers?.[cto.code];
    if (custom) {
      return {
        ...cto,
        name: custom.customName || cto.name,
        breaker: `1x${custom.amps}A ${custom.breakingCapacity} ${custom.curve}`,
        wire: custom.wireSection,
        pipe: custom.pipeType,
        amps: custom.amps,
        curve: custom.curve,
        breakingCapacity: custom.breakingCapacity,
      };
    }
    return {
      ...cto,
      breaker: cto.defaultBreaker,
      wire: cto.defaultWire,
      pipe: cto.defaultPipe,
      amps: cto.defaultAmps,
      curve: 'Curva C',
      breakingCapacity: '6kA',
    };
  });

  const rcdCount = Math.max(1, Math.ceil(circuits.length / 3));

  const handleDownloadPdf = async (choice: 'color' | 'bw' = 'color') => {
    setIsGeneratingPdf(true);
    setIsPdfModalOpen(false);
    try {
      const isBw = choice === 'bw';
      const success = await downloadPdfFromElement(diagramDocRef.current, {
        filename: isBw ? `Diagrama_Unifilar_${projectInfo.projectCode}_BN.pdf` : `Diagrama_Unifilar_${projectInfo.projectCode}.pdf`,
        margin: 8,
        orientation: 'landscape',
        isBlackAndWhite: isBw,
      });
      if (success) {
        showToast(
          isBw
            ? '📄 Plano exportado a PDF en Blanco y Negro con logotipo del contratista y resumen de protecciones.'
            : '🎨 Plano exportado a PDF a Color con logotipo del contratista y resumen de protecciones.'
        );
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintDiagram = () => {
    window.print();
  };

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 4500);
  };

  const updateSpecsAndSync = (newSpecs: CustomProtectionSpecs, msg: string) => {
    onUpdateProtectionSpecs(newSpecs);
    onSyncToBudget(newSpecs);
    showToast(msg);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Controls & Interactivity Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Diagrama Unifilar Interactivo TE1 (SEC Chile)</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Plano Eléctrico Unilineal de Tablero TDA</span>
            <span className="bg-fuchsia-600/30 text-fuchsia-300 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-fuchsia-500/40">
              PDF Profesional
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Diseña, personaliza protecciones y exporta un documento PDF formal con logotipo del contratista, datos del proyecto y tabla de resumen de protecciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              onSyncToBudget(specs);
              showToast(' Cotización y Simulación 2D sincronizadas con las protecciones del plano.');
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition-all active:scale-95"
            title="Sincronizar especificaciones con Cotización"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sincronizar Presupuesto</span>
          </button>

          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setIsFullscreenDiagram(true)}
              className="p-1.5 text-slate-300 hover:text-white"
              title="Expandir a Pantalla Completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-300 hover:text-white"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-200 px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 text-slate-300 hover:text-white"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg transition-all active:scale-95"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGeneratingPdf ? 'Generando PDF...' : 'Exportar PDF Profesional'}</span>
          </button>

          <button
            onClick={handlePrintDiagram}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg border border-slate-700 transition-all"
            title="Vista de impresión"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* CALCULADORA DE CAÍDA DE TENSIÓN Y SECCIÓN MÍNIMA (NORMA SEC RIC N°04) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Calculadora de Caída de Tensión (Norma SEC RIC N°04)
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Máx 3.0% Alimentadores
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dimensionamiento de sección de conductor ($S$ mm²) según corriente de carga ($I$) y distancia ($L$).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <span className="text-slate-400">Tensión Nominal:</span>
            <span className="text-emerald-400">{vNominal}V ({isThreePhase ? 'Trifásico 3Ф' : 'Monofásico 1Ф'})</span>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Corriente de Carga Input */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <label className="font-bold text-slate-200">Corriente de Carga ($I$)</label>
              <button
                type="button"
                onClick={() => setCalcCurrent(Math.round((currentIn || 15) * 10) / 10)}
                className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300 font-semibold underline shrink-0"
                title="Cargar corriente de diseño total de la instalación"
              >
                Cargar I_total ({Math.round((currentIn || 15) * 10) / 10}A)
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="300"
                value={calcCurrent}
                onChange={(e) => setCalcCurrent(Math.max(0.1, Number(e.target.value) || 0.1))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500"
              />
              <span className="absolute right-3 top-2 text-slate-400 font-bold font-mono">A</span>
            </div>
            <p className="text-[10px] text-slate-400">Ingresa la corriente en Amperes a transmitir por el alimentador.</p>
          </div>

          {/* Distancia / Longitud Input */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <label className="font-bold text-slate-200 block">Distancia / Longitud ($L$)</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="300"
                value={calcDistance}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setCalcDistance(val);
                  if (setFeederLength) setFeederLength(val);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500"
              />
              <span className="absolute right-3 top-2 text-slate-400 font-bold font-mono">m</span>
            </div>
            <p className="text-[10px] text-slate-400">Distancia en metros desde el medidor hasta el tablero TDA.</p>
          </div>

          {/* Sección de Conductor Seleccionado */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
            <label className="font-bold text-slate-200 block">Sección Seleccionada ($S$ mm²)</label>
            <select
              value={currentSection}
              onChange={(e) => {
                const sec = Number(e.target.value);
                if (setFeederWireSection) setFeederWireSection(sec);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-fuchsia-500"
            >
              {NORMALIZED_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec} mm² EVA {sec === suggestedSection ? '(Recomendado RIC N°04)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">Sección en mm² del alimentador de cobre asignado.</p>
          </div>
        </div>

        {/* Calculation Result Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block font-medium">Caída Tensión (Volts)</span>
            <span className={`text-base font-black font-mono ${isSectionInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentDrop.dropVolts.toFixed(2)} Volts
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block font-medium">Porcentaje Caída (%)</span>
            <span className={`text-base font-black font-mono ${isSectionInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentDrop.dropPercent.toFixed(2)}%
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block font-medium">Sección Teórica Cobre</span>
            <span className="text-base font-black font-mono text-indigo-300">
              {theoreticalSection.toFixed(2)} mm²
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block font-medium">Sección Sugerida Norma</span>
            <span className="text-base font-black font-mono text-emerald-400">
              {suggestedSection.toFixed(1)} mm² EVA
            </span>
          </div>
        </div>

        {/* Voltage Drop Meter Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-400">Caída de Tensión Calculada vs Límite Norma RIC N°04 (3.0%)</span>
            <span className={isSectionInsufficient ? 'text-rose-400 font-extrabold' : 'text-emerald-400 font-extrabold'}>
              {currentDrop.dropPercent.toFixed(2)}% de 3.0% max
            </span>
          </div>
          <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: '60%' }}
              title="Límite reglamentario 3.0% SEC RIC N°04"
            />
            <div
              className={`h-full transition-all duration-300 ${
                currentDrop.dropPercent > 3.0
                  ? 'bg-gradient-to-r from-rose-600 to-red-500'
                  : currentDrop.dropPercent > 2.2
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, (currentDrop.dropPercent / 5.0) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0%</span>
            <span>1.5%</span>
            <span className="text-amber-400 font-bold">3.0% (Límite RIC N°04)</span>
            <span>4.5%</span>
            <span>5.0%+</span>
          </div>
        </div>

        {/* Visual Warning Box if Insufficient / Compliance Confirmation */}
        {isSectionInsufficient ? (
          <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-rose-300 uppercase tracking-wide flex items-center gap-2">
                  <span>¡ADVERTENCIA! SECCIÓN DE CONDUCTOR INSUFICIENTE</span>
                  <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                    SEC RIC N°04 RECHAZADO
                  </span>
                </h4>
                <p className="text-xs text-rose-100 leading-relaxed">
                  La sección seleccionada de <strong className="text-white underline">{currentSection} mm² EVA</strong> para una corriente de <strong className="text-white">{calcCurrent} A</strong> a <strong className="text-white">{calcDistance} m</strong> produce una caída de tensión de <strong className="text-rose-300 font-bold">{currentDrop.dropPercent.toFixed(2)}% ({currentDrop.dropVolts.toFixed(2)} V)</strong>. Esto supera el límite máximo del <strong className="text-amber-300">3.0% ({vMaxAllowedVolts.toFixed(2)} V)</strong> de la norma RIC N°04.
                </p>
                <div className="text-[11px] text-rose-200 font-medium">
                  Sección mínima reglamentaria requerida: <strong className="text-emerald-300 font-bold">{suggestedSection} mm² EVA</strong>.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (setFeederWireSection) setFeederWireSection(suggestedSection);
                showToast(`Sección de alimentador corregida a ${suggestedSection} mm² EVA según norma SEC RIC N°04.`);
              }}
              className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400/50 transition-all active:scale-95 flex items-center gap-2 self-start md:self-auto"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar {suggestedSection} mm² EVA</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 text-emerald-200 flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="font-bold text-white">Conductor Cumple Norma SEC RIC N°04:</strong>{' '}
              La sección de <strong className="text-emerald-300">{currentSection} mm² EVA</strong> limita la caída de tensión a <strong className="text-emerald-300">{currentDrop.dropPercent.toFixed(2)}% ({currentDrop.dropVolts.toFixed(2)} V)</strong>, manteniéndose dentro del umbral reglamentario del 3.0%.
            </div>
          </div>
        )}
      </div>

      {/* NUEVO MÓDULO: RENDERIZADO AUTOMÁTICO EN MOTOR CANVAS 2D CAD */}
      <SingleLineCanvasRenderer
        isThreePhase={isThreePhase}
        feederLength={feederLength || 20}
        feederWireSection={currentSection}
        iga={{
          amps: igaAmps,
          curve: igaCurve,
          breakingCapacity: igaBreaking,
          poles: igaPoles,
        }}
        dps={{
          voltage: dpsVoltage,
          dischargeCurrent: dpsDischarge,
        }}
        rcds={specs.rcds || {}}
        circuits={circuits}
        vNominal={vNominal}
        dropVolts={currentDrop.dropVolts}
        dropPercent={currentDrop.dropPercent}
        isDropExceeded={isSectionInsufficient || currentDrop.dropPercent > maxAllowedDropPercent}
      />

      {/* DOCUMENTO Y DIAGRAMA IMPRIMIBLE COMPLETO PARA PDF (REF: diagramDocRef) */}
      <div
        ref={diagramDocRef}
        className={
          isFullscreenDiagram
            ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-auto custom-scrollbar flex flex-col'
            : 'bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-x-auto min-h-[550px] relative text-slate-100'
        }
      >
        {isFullscreenDiagram && (
          <div className="flex items-center justify-between mb-4 shrink-0 sticky left-0 top-0 z-10 bg-slate-900/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-fuchsia-400" />
              <span>Diagrama Unifilar (Pantalla Completa)</span>
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                  className="p-1.5 text-slate-300 hover:text-white"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-200 px-2">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.1))}
                  className="p-1.5 text-slate-300 hover:text-white"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsFullscreenDiagram(false)}
                className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        )}

        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', minWidth: '1200px' }} className="transition-transform duration-300 ease-in-out">
          {/* ENCABEZADO FORMAL CONTRATISTA Y PROYECTO CON LOGOTIPO */}
          <div className="mb-6 bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
            {/* Logotipo e Información de Empresa Contratista */}
            <div className="flex items-center gap-4">
              {contractorInfo.logoUrl ? (
                <div className="bg-white border border-slate-200 p-1.5 rounded-xl flex items-center justify-center shrink-0">
                  <img
                    src={contractorInfo.logoUrl}
                    alt="Logotipo Contratista"
                    className="h-14 max-w-[180px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-slate-900 text-amber-400 rounded-xl flex flex-col items-center justify-center font-black shadow border border-slate-800 shrink-0">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <span className="text-[8px] tracking-widest uppercase text-slate-200">NEOVOLT</span>
                </div>
              )}
              <div>
                <h1 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {contractorInfo.companyName}
                </h1>
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>Instalador: <strong>{contractorInfo.installerName}</strong></span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-300">
                    {contractorInfo.secLicense}
                  </span>
                </p>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                  Licencia: {contractorInfo.secClass} | RUT: {contractorInfo.rut} | Tel: {contractorInfo.phone}
                </p>
              </div>
            </div>

            {/* Metadatos Formales TE1 */}
            <div className="text-left md:text-right text-[11px] font-mono border-t md:border-t-0 md:border-l border-slate-300 pt-2 md:pt-0 md:pl-4 self-stretch flex flex-col justify-center">
              <div className="font-bold text-slate-900 text-xs">DIAGRAMA UNIFILAR DE TABLERO TDA</div>
              <div className="text-slate-700 font-semibold">NORMATIVA SEC CHILE (RIC N°02 & RIC N°05)</div>
              <div className="text-slate-500 text-[10px]">CÓDIGO DOC: {projectInfo.projectCode}</div>
              <div className="text-slate-500 text-[10px]">FECHA EMISIÓN: {projectInfo.projectDate}</div>
            </div>
          </div>

          {/* Ficha de Proyecto y Datos de Cliente */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Cliente / Propietario</span>
              <span className="font-bold text-slate-900">{projectInfo.clientName}</span>
              <span className="text-[10px] text-slate-500 block font-mono">RUT: {projectInfo.clientRut}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Ubicación de Obra</span>
              <span className="font-bold text-slate-900">{projectInfo.projectAddress}</span>
              <span className="text-[10px] text-slate-500 block">{projectInfo.projectCity}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tensión & Potencia Decl.</span>
              <span className="font-bold text-slate-900">{totalPowerKW.toFixed(2)} kW ({totalPowerW} W)</span>
              <span className="text-[10px] text-emerald-800 font-bold block">
                {vNominal}V ({isThreePhase ? 'Trifásico 3Ф' : 'Monofásico 1Ф'})
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Alimentador Principal</span>
              <span className="font-bold text-slate-900">{feederWireSection} mm² EVA ({feederLength}m)</span>
              <span className="text-[10px] text-slate-600 font-semibold block">
                Caída V: {currentDrop.dropPercent.toFixed(2)}% (RIC N°04)
              </span>
            </div>
          </div>
        </div>

        {/* CONTENEDOR ESQUEMÁTICO DEL DIAGRAMA UNIFILAR (CON ZOOM) */}
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          className="transition-transform duration-200 min-w-[850px] p-4 bg-slate-900 border border-slate-800 rounded-2xl"
        >
          <div className="space-y-6">
            {/* 1. Red Distribuidora & Medidor */}
            <div className="flex items-center gap-4 pl-4">
              <div className="bg-slate-800 border-2 border-indigo-500 rounded-lg p-3 text-center min-w-[140px]">
                <div className="text-[10px] text-indigo-400 font-bold uppercase">Red Distribuidora</div>
                <div className="text-xs font-black text-white">{isThreePhase ? '380V Trifásico' : '220V Monofásico'}</div>
              </div>
              <div className="w-12 h-0.5 bg-indigo-500 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-indigo-300 font-mono">
                  EMP.
                </div>
              </div>

              {/* Medidor & Alimentador Box (Clickable) */}
              <div
                onClick={() => setEditingComponent({ type: 'feeder' })}
                className="group relative cursor-pointer border-2 border-indigo-500 hover:border-fuchsia-400 bg-slate-800 rounded-full w-14 h-14 flex items-center justify-center text-center p-1 shadow-lg transition-all hover:scale-105"
                title="Clic para configurar sección y largo de alimentador"
              >
                <div className="text-[10px] font-black text-emerald-400 leading-tight">kWh<br />Medidor</div>
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-fuchsia-600 text-white text-[9px] font-bold p-1 rounded-full shadow">
                  <Edit3 className="w-2.5 h-2.5" />
                </div>
              </div>

              <div
                onClick={() => setEditingComponent({ type: 'feeder' })}
                className="group relative cursor-pointer flex-1 bg-slate-950/80 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-2.5 transition-all"
                title="Clic para configurar alimentador"
              >
                <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center justify-between">
                  <span>Alimentador Principal</span>
                  <Edit3 className="w-3 h-3 opacity-60 group-hover:opacity-100 text-fuchsia-400" />
                </div>
                <div className="text-xs font-bold text-white mt-0.5">
                  Conductor {feederWireSection} mm² EVA ({feederLength} metros)
                </div>
              </div>
            </div>

            {/* Vertical Feeder Line down into Main Board Box */}
            <div className="ml-24 w-0.5 h-8 bg-emerald-500"></div>

            {/* 2. Main TDA Board Outer Boundary Box */}
            <div className="border-2 border-dashed border-fuchsia-500/50 rounded-2xl p-5 bg-slate-950/70 space-y-6 relative">
              <div className="absolute -top-3 left-4 bg-fuchsia-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>TABLERO DE DISTRIBUCIÓN ELÉCTRICA (TDA)</span>
              </div>

              {/* Cabecera: IGA + DPS */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-b border-slate-800 pb-5">
                {/* IGA CARD */}
                <div
                  onClick={() => setEditingComponent({ type: 'iga' })}
                  className="group relative cursor-pointer bg-slate-900 border-2 border-fuchsia-500 hover:border-fuchsia-400 hover:ring-2 hover:ring-fuchsia-400/50 p-3.5 rounded-xl shadow-lg min-w-[220px] transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between text-[10px] text-fuchsia-400 font-bold mb-1">
                    <span>IGA (Corte General)</span>
                    <span className="bg-fuchsia-600 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Edit3 className="w-2.5 h-2.5" /> Editar
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>{igaPoles}{igaAmps}A</span>
                    <span className="text-xs font-semibold text-fuchsia-300">{igaBreaking}</span>
                    <span className="text-xs font-semibold text-emerald-400">{igaCurve}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Interruptor Automático Termomagnético
                  </div>
                </div>

                <div className="hidden sm:block w-10 h-0.5 bg-fuchsia-500"></div>

                {/* DPS CARD */}
                <div
                  onClick={() => setEditingComponent({ type: 'dps' })}
                  className="group relative cursor-pointer bg-slate-900 border-2 border-amber-500 hover:border-amber-400 hover:ring-2 hover:ring-amber-400/50 p-3.5 rounded-xl shadow-lg min-w-[220px] transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1">
                    <span>DPS (Sobretensión)</span>
                    <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Edit3 className="w-2.5 h-2.5" /> Editar
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{dpsVoltage}</span>
                    <span className="text-amber-300">{dpsDischarge}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Protector Sobretensión Transitoria Cat. II
                  </div>
                </div>
              </div>

              {/* Barra de Distribución Principal */}
              <div className="relative my-4">
                <div className="h-2.5 bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-emerald-500 rounded-full shadow-md"></div>
                <div className="text-[9px] text-slate-400 font-mono mt-1 text-center font-bold">
                  BARRA DE DISTRIBUCIÓN PRINCIPAL (F + N + PE SEC)
                </div>
              </div>

              {/* Differential RCD Groups and Circuits Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {Array.from({ length: rcdCount }).map((_, rcdIdx) => {
                  const groupRcdNumber = rcdIdx + 1;
                  const groupCircuits = circuits.filter((c) => c.rcdGroup === groupRcdNumber);
                  const rcdSpec = specs.rcds?.[groupRcdNumber] || { amps: 25, sensitivity: '30mA', classType: 'Clase AC' };

                  return (
                    <div
                      key={rcdIdx}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 shadow-lg"
                    >
                      {/* RCD Differential Header */}
                      <div
                        onClick={() => setEditingComponent({ type: 'rcd', rcdGroup: groupRcdNumber })}
                        className="group relative cursor-pointer bg-slate-800 border-l-4 border-fuchsia-500 hover:border-fuchsia-400 p-3 rounded-r-lg transition-all hover:bg-slate-750 hover:shadow"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-fuchsia-400">
                          <span>INTERRUPTOR DIFERENCIAL RCD #{groupRcdNumber}</span>
                          <span className="bg-fuchsia-600 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <Edit3 className="w-2.5 h-2.5" /> Editar
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-white mt-1 flex items-center gap-2">
                          <span>2x{rcdSpec.amps}A</span>
                          <span className="text-fuchsia-300 font-mono">{rcdSpec.sensitivity}</span>
                          <span className="text-emerald-400 font-sans text-[11px]">{rcdSpec.classType}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Protección Ininterrumpible &lt; 30ms (RIC N°05)
                        </div>
                      </div>

                      {/* Circuits under this RCD */}
                      <div className="space-y-3">
                        {groupCircuits.map((cto) => (
                          <div
                            key={cto.code}
                            onClick={() =>
                              setEditingComponent({
                                type: 'cb',
                                code: cto.code,
                                currentName: cto.name,
                              })
                            }
                            className="group relative cursor-pointer bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start gap-3 hover:border-emerald-400 hover:ring-2 hover:ring-emerald-500/30 transition-all hover:scale-[1.01]"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                              {cto.code}
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="text-xs font-bold text-white truncate">{cto.name}</div>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Edit3 className="w-2.5 h-2.5" /> Editar
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-fuchsia-300 font-semibold">
                                {cto.breaker}
                              </div>
                              <div className="text-[10px] text-slate-400 flex flex-wrap gap-1.5 pt-0.5">
                                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                  {cto.wire}
                                </span>
                                <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                  {cto.pipe}
                                </span>
                                <span className="text-emerald-400 font-bold">{cto.loadW} W</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE RESUMEN DE PROTECCIONES ELÉCTRICAS Y CIRCUITOS */}
        <div className="mt-8 bg-white border-2 border-slate-900 rounded-xl p-5 text-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                Tabla Resumen de Protecciones Eléctricas y Especificaciones de Canalización (SEC TE1)
              </h3>
            </div>
            <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
              TDA - {circuits.length} Circuitos Declarados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider border-b-2 border-slate-900">
                  <th className="p-2 border border-slate-800">Código / ID</th>
                  <th className="p-2 border border-slate-800">Tipo de Protección / Circuito</th>
                  <th className="p-2 border border-slate-800">Polos</th>
                  <th className="p-2 border border-slate-800">Amperaje ($I_n$)</th>
                  <th className="p-2 border border-slate-800">Curva / Sensibilidad</th>
                  <th className="p-2 border border-slate-800">PDC / Especificación</th>
                  <th className="p-2 border border-slate-800">Conductor (Sección mm²)</th>
                  <th className="p-2 border border-slate-800">Canalización</th>
                  <th className="p-2 border border-slate-800 text-right">Potencia (W)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {/* IGA ROW */}
                <tr className="bg-amber-50/80 text-slate-900 font-semibold">
                  <td className="p-2 border border-slate-300 font-mono font-black text-amber-900">IGA</td>
                  <td className="p-2 border border-slate-300">Interruptor General Automático (Corte Principal)</td>
                  <td className="p-2 border border-slate-300 font-mono">{igaPoles}</td>
                  <td className="p-2 border border-slate-300 font-bold">{igaAmps} A</td>
                  <td className="p-2 border border-slate-300">{igaCurve}</td>
                  <td className="p-2 border border-slate-300 font-bold">{igaBreaking}</td>
                  <td className="p-2 border border-slate-300 font-mono">{feederWireSection} mm² EVA (Alimentador)</td>
                  <td className="p-2 border border-slate-300 font-mono">{feederLength}m Canalizado</td>
                  <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{totalPowerW} W</td>
                </tr>

                {/* DPS ROW */}
                <tr className="bg-slate-50 text-slate-900 font-semibold">
                  <td className="p-2 border border-slate-300 font-mono font-black text-indigo-900">DPS</td>
                  <td className="p-2 border border-slate-300">Protector Sobretensiones Transitorias (Cat. II)</td>
                  <td className="p-2 border border-slate-300 font-mono">{isThreePhase ? '3P+N' : '1P+N'}</td>
                  <td className="p-2 border border-slate-300">-</td>
                  <td className="p-2 border border-slate-300">Tensión {dpsVoltage}</td>
                  <td className="p-2 border border-slate-300 font-bold">Imax {dpsDischarge}</td>
                  <td className="p-2 border border-slate-300 font-mono">4.0 mm² EVA PE</td>
                  <td className="p-2 border border-slate-300 font-mono">Barra de Tierra PE</td>
                  <td className="p-2 border border-slate-300 text-right text-slate-400">-</td>
                </tr>

                {/* RCD ROWS & CIRCUITS */}
                {Array.from({ length: rcdCount }).map((_, rcdIdx) => {
                  const groupNum = rcdIdx + 1;
                  const rcdSpec = specs.rcds?.[groupNum] || { amps: 25, sensitivity: '30mA', classType: 'Clase AC' };
                  const groupCto = circuits.filter((c) => c.rcdGroup === groupNum);

                  return (
                    <React.Fragment key={`rcd_table_group_${groupNum}`}>
                      <tr className="bg-fuchsia-50/90 font-bold text-fuchsia-950">
                        <td className="p-2 border border-slate-300 font-mono font-black text-fuchsia-900">RCD #{groupNum}</td>
                        <td className="p-2 border border-slate-300" colSpan={2}>
                          Interruptor Diferencial Grupo #{groupNum} (Protección a Personas)
                        </td>
                        <td className="p-2 border border-slate-300 font-bold">{rcdSpec.amps} A</td>
                        <td className="p-2 border border-slate-300 font-bold text-fuchsia-800">{rcdSpec.sensitivity}</td>
                        <td className="p-2 border border-slate-300 font-bold">{rcdSpec.classType}</td>
                        <td className="p-2 border border-slate-300 font-mono text-[10px]" colSpan={2}>
                          Grupo alimentando {groupCto.length} Circuito(s)
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-fuchsia-950">
                          {groupCto.reduce((sum, c) => sum + c.loadW, 0)} W
                        </td>
                      </tr>

                      {groupCto.map((cto) => (
                        <tr key={`tbl_${cto.code}`} className="hover:bg-slate-50 text-slate-800">
                          <td className="p-2 border border-slate-300 font-mono font-black text-emerald-900 pl-4">
                            ↳ {cto.code}
                          </td>
                          <td className="p-2 border border-slate-300 font-medium">{cto.name}</td>
                          <td className="p-2 border border-slate-300 font-mono">1x</td>
                          <td className="p-2 border border-slate-300 font-bold">{cto.amps} A</td>
                          <td className="p-2 border border-slate-300">{cto.curve}</td>
                          <td className="p-2 border border-slate-300">{cto.breakingCapacity}</td>
                          <td className="p-2 border border-slate-300 font-mono">{cto.wire}</td>
                          <td className="p-2 border border-slate-300 font-mono">{cto.pipe}</td>
                          <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{cto.loadW} W</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* TOTAL SUMMARY ROW */}
                <tr className="bg-slate-900 text-white font-bold text-xs">
                  <td className="p-2.5 border border-slate-800 uppercase" colSpan={3}>
                    TOTALES DECLARADOS DEL TABLERO TDA
                  </td>
                  <td className="p-2.5 border border-slate-800" colSpan={3}>
                    {circuits.length} Disyuntores | {rcdCount} RCDs | 1 IGA | 1 DPS
                  </td>
                  <td className="p-2.5 border border-slate-800 font-mono" colSpan={2}>
                    Alimentador: {feederWireSection} mm² EVA ({feederLength}m)
                  </td>
                  <td className="p-2.5 border border-slate-800 text-right font-black font-mono text-emerald-400 text-sm">
                    {totalPowerW} W ({totalPowerKW.toFixed(2)} kW)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CUADRO DE FIRMAS Y RESPONSABILIDAD TÉCNICA SEC */}
        <div className="mt-8 border-2 border-slate-900 rounded-xl p-4 bg-white text-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px]">
          <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 flex flex-col justify-between h-32">
            <div>
              <div className="font-bold text-slate-900 uppercase text-[10px]">RESPONSABLE TÉCNICO DE LA INSTALACIÓN</div>
              <div className="text-[10px] text-slate-600">Instalador Autorizado Superintendencia de Electricidad y Combustibles (SEC)</div>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-2 text-center">
              <div className="font-bold text-slate-900">{contractorInfo.installerName}</div>
              <div className="text-[10px] text-emerald-800 font-bold">{contractorInfo.secLicense} ({contractorInfo.secClass})</div>
              <div className="text-[9px] text-slate-500">Firma / Timbre Instalador Certificado</div>
            </div>
          </div>

          <div className="border border-slate-300 p-3 rounded-lg bg-slate-50 flex flex-col justify-between h-32">
            <div>
              <div className="font-bold text-slate-900 uppercase text-[10px]">RECEPCIÓN Y CONFORMIDAD PROPIETARIO</div>
              <div className="text-[10px] text-slate-600">Aceptación de especificaciones técnicas y diagrama unifilar ejecutado</div>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-2 text-center">
              <div className="font-bold text-slate-900">{projectInfo.clientName}</div>
              <div className="text-[10px] text-slate-600 font-mono">RUT: {projectInfo.clientRut}</div>
              <div className="text-[9px] text-slate-500">Firma Propietario / Cliente</div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* COMPONENT SPECIFICATIONS EDITING MODAL */}
      {editingComponent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-fuchsia-500/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {editingComponent.type === 'iga' && 'Especificación IGA (Corte General)'}
                    {editingComponent.type === 'dps' && 'Especificación DPS (Protector Sobretensión)'}
                    {editingComponent.type === 'rcd' && `Especificación RCD Diferencial #${editingComponent.rcdGroup}`}
                    {editingComponent.type === 'cb' && `Especificación Disyuntor ${editingComponent.code}`}
                    {editingComponent.type === 'feeder' && 'Especificación Alimentador Principal'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sincronización automática con Cotización y Simulación 2D
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingComponent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM BODY FOR IGA */}
            {editingComponent.type === 'iga' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Amperaje Nominal IGA (In)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[16, 20, 25, 32, 40, 50, 63].map((amp) => (
                      <button
                        key={amp}
                        onClick={() => {
                          const updated = { ...specs, iga: { ...specs.iga, amps: amp } };
                          updateSpecsAndSync(updated, `IGA actualizado a ${specs.iga.poles || '1x'}${amp}A.`);
                        }}
                        className={`py-2 rounded-xl font-bold border transition-all ${
                          igaAmps === amp
                            ? 'bg-fuchsia-600 text-white border-fuchsia-400 ring-2 ring-fuchsia-400/40 shadow-lg'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {amp}A
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-200 mb-1">Curva de Disparo</label>
                    <select
                      value={igaCurve}
                      onChange={(e) => {
                        const updated = { ...specs, iga: { ...specs.iga, curve: e.target.value } };
                        updateSpecsAndSync(updated, `Curva de IGA cambiada a ${e.target.value}.`);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="Curva B">Curva B (Rápida)</option>
                      <option value="Curva C">Curva C (Estándar)</option>
                      <option value="Curva D">Curva D (Cargas Inductivas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-200 mb-1">Poder de Corte (PDC)</label>
                    <select
                      value={igaBreaking}
                      onChange={(e) => {
                        const updated = { ...specs, iga: { ...specs.iga, breakingCapacity: e.target.value } };
                        updateSpecsAndSync(updated, `Poder de corte IGA: ${e.target.value}.`);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="4.5kA">4.5 kA</option>
                      <option value="6kA">6.0 kA (Reglamentario SEC)</option>
                      <option value="10kA">10.0 kA (Industrial/Comercial)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* FORM BODY FOR DPS */}
            {editingComponent.type === 'dps' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Tensión de Operación (Uc)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['275V', '400V'].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const updated = { ...specs, dps: { ...specs.dps, voltage: v } };
                          updateSpecsAndSync(updated, `Tensión DPS: ${v}.`);
                        }}
                        className={`py-2.5 rounded-xl font-bold border transition-all ${
                          dpsVoltage === v
                            ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {v} ({v === '275V' ? 'Monofásico' : 'Trifásico'})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Corriente Máxima de Descarga (Imax)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['20kA', '40kA'].map((cur) => (
                      <button
                        key={cur}
                        onClick={() => {
                          const updated = { ...specs, dps: { ...specs.dps, dischargeCurrent: cur } };
                          updateSpecsAndSync(updated, `Capacidad DPS: ${cur}.`);
                        }}
                        className={`py-2.5 rounded-xl font-bold border transition-all ${
                          dpsDischarge === cur
                            ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FORM BODY FOR RCD */}
            {editingComponent.type === 'rcd' && editingComponent.rcdGroup && (
              <div className="space-y-4 text-xs">
                {(() => {
                  const gNum = editingComponent.rcdGroup!;
                  const curRcd = specs.rcds?.[gNum] || { amps: 25, sensitivity: '30mA', classType: 'Clase AC' };

                  return (
                    <>
                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Amperaje Nominal RCD RCD #{gNum}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[25, 40, 63].map((amp) => (
                            <button
                              key={amp}
                              onClick={() => {
                                const updated = {
                                  ...specs,
                                  rcds: { ...specs.rcds, [gNum]: { ...curRcd, amps: amp } },
                                };
                                updateSpecsAndSync(updated, `RCD #${gNum} actualizado a 2x${amp}A.`);
                              }}
                              className={`py-2 rounded-xl font-bold border transition-all ${
                                curRcd.amps === amp
                                  ? 'bg-fuchsia-600 text-white border-fuchsia-400 ring-2 ring-fuchsia-400/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              2x{amp}A
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-200 mb-1">Sensibilidad Diferencial</label>
                          <select
                            value={curRcd.sensitivity}
                            onChange={(e) => {
                              const updated = {
                                ...specs,
                                rcds: { ...specs.rcds, [gNum]: { ...curRcd, sensitivity: e.target.value } },
                              };
                              updateSpecsAndSync(updated, `Sensibilidad RCD #${gNum}: ${e.target.value}.`);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          >
                            <option value="30mA">30mA (Protección Personas)</option>
                            <option value="300mA">300mA (Protección Incendios)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-200 mb-1">Tipo de Clase RCD</label>
                          <select
                            value={curRcd.classType}
                            onChange={(e) => {
                              const updated = {
                                ...specs,
                                rcds: { ...specs.rcds, [gNum]: { ...curRcd, classType: e.target.value } },
                              };
                              updateSpecsAndSync(updated, `Clase RCD #${gNum}: ${e.target.value}.`);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          >
                            <option value="Clase AC">Clase AC (Cargas Corrientes)</option>
                            <option value="Clase A">Clase A (Componentes D.C. / Electrónica)</option>
                            <option value="Superinmunizado">Superinmunizado SI / F</option>
                          </select>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* FORM BODY FOR CIRCUIT BREAKER */}
            {editingComponent.type === 'cb' && editingComponent.code && (
              <div className="space-y-4 text-xs">
                {(() => {
                  const code = editingComponent.code!;
                  const ctoMatch = circuits.find((c) => c.code === code);
                  const currentCb = specs.circuitBreakers?.[code] || {
                    amps: ctoMatch?.amps || 16,
                    curve: 'Curva C',
                    breakingCapacity: '6kA',
                    wireSection: ctoMatch?.wire || '3 x 2.5 mm² EVA',
                    pipeType: ctoMatch?.pipe || 'PVC 25mm',
                    customName: ctoMatch?.name || 'Circuito',
                  };

                  return (
                    <>
                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Nombre Personalizado del Circuito</label>
                        <input
                          type="text"
                          value={currentCb.customName || ''}
                          onChange={(e) => {
                            const updated = {
                              ...specs,
                              circuitBreakers: {
                                ...specs.circuitBreakers,
                                [code]: { ...currentCb, customName: e.target.value },
                              },
                            };
                            onUpdateProtectionSpecs(updated);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          placeholder="Ej. Alumbrado Jardín / Climatización"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Amperaje Disyuntor ({code})</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[6, 10, 16, 20, 25, 32, 40].map((amp) => (
                            <button
                              key={amp}
                              onClick={() => {
                                const updated = {
                                  ...specs,
                                  circuitBreakers: {
                                    ...specs.circuitBreakers,
                                    [code]: { ...currentCb, amps: amp },
                                  },
                                };
                                updateSpecsAndSync(updated, `Circuito ${code} actualizado a 1x${amp}A.`);
                              }}
                              className={`py-2 rounded-xl font-bold border transition-all ${
                                currentCb.amps === amp
                                  ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              1x{amp}A
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Sección Conductor (mm² EVA)</label>
                        <select
                          value={currentCb.wireSection}
                          onChange={(e) => {
                            const updated = {
                              ...specs,
                              circuitBreakers: {
                                ...specs.circuitBreakers,
                                [code]: { ...currentCb, wireSection: e.target.value },
                              },
                            };
                            updateSpecsAndSync(updated, `Conductor ${code}: ${e.target.value}.`);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        >
                          <option value="3 x 1.5 mm² EVA">3 x 1.5 mm² EVA (Alumbrado máx 15A)</option>
                          <option value="3 x 2.5 mm² EVA">3 x 2.5 mm² EVA (Enchufes máx 21A)</option>
                          <option value="3 x 4.0 mm² EVA">3 x 4.0 mm² EVA (Carga pesada máx 28A)</option>
                          <option value="3 x 6.0 mm² EVA">3 x 6.0 mm² EVA (Empalme / Cocina máx 36A)</option>
                          <option value="3 x 10.0 mm² EVA">3 x 10.0 mm² EVA (Fuerza máx 50A)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-200 mb-1">Canalización (Tubería)</label>
                        <select
                          value={currentCb.pipeType}
                          onChange={(e) => {
                            const updated = {
                              ...specs,
                              circuitBreakers: {
                                ...specs.circuitBreakers,
                                [code]: { ...currentCb, pipeType: e.target.value },
                              },
                            };
                            updateSpecsAndSync(updated, `Canalización ${code}: ${e.target.value}.`);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        >
                          <option value="PVC 20mm">PVC Conduit 20mm</option>
                          <option value="PVC 25mm">PVC Conduit 25mm</option>
                          <option value="PVC 32mm">PVC Conduit 32mm</option>
                          <option value='EMT 1/2"'>EMT Metálico 1/2"</option>
                          <option value='EMT 3/4"'>EMT Metálico 3/4"</option>
                          <option value='EMT 1"'>EMT Metálico 1"</option>
                        </select>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* FORM BODY FOR FEEDER */}
            {editingComponent.type === 'feeder' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Cálculo Caída Tensión (RIC N°04):</span>
                    <span className={`font-mono font-bold ${isSectionInsufficient ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {currentDrop.dropPercent.toFixed(2)}% ({currentDrop.dropVolts.toFixed(2)}V)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Límite SEC Alimentador: <strong>3.0%</strong></span>
                    <span>Sugerida: <strong className="text-emerald-400 font-bold">{suggestedSection} mm² EVA</strong></span>
                  </div>
                </div>

                {isSectionInsufficient && (
                  <div className="bg-rose-950/80 border border-rose-500 rounded-xl p-3 text-white space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Sección Insuficiente para {calcCurrent}A a {calcDistance}m</span>
                    </div>
                    <p className="text-[11px] text-rose-100">
                      Produce {currentDrop.dropPercent.toFixed(2)}% de caída (&gt;3.0% máx RIC N°04).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (setFeederWireSection) setFeederWireSection(suggestedSection);
                        showToast(`Sección de alimentador corregida a ${suggestedSection} mm² EVA.`);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar Sección Sugerida ({suggestedSection} mm² EVA)</span>
                    </button>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Sección Conductor Alimentador (mm² EVA)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[2.5, 4.0, 6.0, 10.0, 16.0, 25.0].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => {
                          if (setFeederWireSection) setFeederWireSection(sec);
                          showToast(`Alimentador actualizado a ${sec} mm² EVA.`);
                        }}
                        className={`py-2.5 rounded-xl font-bold border transition-all relative ${
                          feederWireSection === sec
                            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                            : sec === suggestedSection
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900/80'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <span>{sec} mm² EVA</span>
                        {sec === suggestedSection && (
                          <span className="block text-[9px] font-semibold text-emerald-400">★ RIC N°04</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Longitud del Alimentador (Metros)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={feederLength}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      setCalcDistance(val);
                      if (setFeederLength) setFeederLength(val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setEditingComponent(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl border border-slate-700 text-xs transition-all"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  onSyncToBudget(specs);
                  setEditingComponent(null);
                  showToast(' Cambios guardados y sincronizados con la Cotización y Simulación 2D.');
                }}
                className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Sincronizar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORTACIÓN DE PLANO UNIFILAR A PDF CON LOGOTIPO Y RESUMEN DE PROTECCIONES */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-fuchsia-500/80 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Exportación de Documento PDF Profesional</h3>
                  <p className="text-[11px] text-slate-400">Incluye logotipo del contratista, datos del proyecto y tabla de protecciones</p>
                </div>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs in Modal */}
            <div className="flex border-b border-slate-800 text-xs">
              <button
                onClick={() => setPdfModalTab('branding')}
                className={`flex-1 py-2 font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  pdfModalTab === 'branding'
                    ? 'border-fuchsia-500 text-fuchsia-400 bg-slate-800/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>1. Logotipo y Datos Proyecto</span>
              </button>

              <button
                onClick={() => setPdfModalTab('options')}
                className={`flex-1 py-2 font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  pdfModalTab === 'options'
                    ? 'border-fuchsia-500 text-fuchsia-400 bg-slate-800/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2. Formato PDF y Resumen</span>
              </button>
            </div>

            {/* TAB 1: CONTRACTOR BRANDING & LOGO EDITING */}
            {pdfModalTab === 'branding' && (
              <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
                {/* Logo Upload Section */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-fuchsia-400" />
                      <span>Logotipo de la Empresa / Contratista</span>
                    </span>
                    {contractorInfo.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setContractorInfo((prev) => ({ ...prev, logoUrl: '' }))}
                        className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                      >
                        Quitar Logo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {contractorInfo.logoUrl ? (
                      <div className="w-20 h-16 bg-white p-1 rounded-xl border border-slate-700 flex items-center justify-center shrink-0">
                        <img
                          src={contractorInfo.logoUrl}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-16 bg-slate-900 text-slate-500 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-[10px] shrink-0">
                        <ImageIcon className="w-5 h-5 mb-0.5 opacity-50" />
                        <span>Sin Logo</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl border border-slate-700 text-xs flex items-center gap-2 w-fit transition-all">
                        <Upload className="w-4 h-4 text-fuchsia-400" />
                        <span>Subir Imagen de Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">
                        Soporta formatos PNG, JPG o SVG. Aparecerá en la esquina superior del plano PDF.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contractor Details Form */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Datos del Contratista / Instalador SEC</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Empresa / Razón Social</label>
                      <input
                        type="text"
                        value={contractorInfo.companyName}
                        onChange={(e) => setContractorInfo((prev) => ({ ...prev, companyName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Nombre Instalador</label>
                      <input
                        type="text"
                        value={contractorInfo.installerName}
                        onChange={(e) => setContractorInfo((prev) => ({ ...prev, installerName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Licencia SEC</label>
                      <input
                        type="text"
                        value={contractorInfo.secLicense}
                        onChange={(e) => setContractorInfo((prev) => ({ ...prev, secLicense: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">RUT Empresa/Instalador</label>
                      <input
                        type="text"
                        value={contractorInfo.rut}
                        onChange={(e) => setContractorInfo((prev) => ({ ...prev, rut: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Project & Client Details Form */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Datos del Proyecto y Cliente</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Nombre Cliente</label>
                      <input
                        type="text"
                        value={projectInfo.clientName}
                        onChange={(e) => setProjectInfo((prev) => ({ ...prev, clientName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">RUT Cliente</label>
                      <input
                        type="text"
                        value={projectInfo.clientRut}
                        onChange={(e) => setProjectInfo((prev) => ({ ...prev, clientRut: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Dirección de Obra</label>
                      <input
                        type="text"
                        value={projectInfo.projectAddress}
                        onChange={(e) => setProjectInfo((prev) => ({ ...prev, projectAddress: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium block mb-1">Código Proyecto / TE1</label>
                      <input
                        type="text"
                        value={projectInfo.projectCode}
                        onChange={(e) => setProjectInfo((prev) => ({ ...prev, projectCode: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-fuchsia-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPdfModalTab('options')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <span>Continuar a Selección de Color y Descarga</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* TAB 2: EXPORT OPTIONS & PROTECTIONS SUMMARY */}
            {pdfModalTab === 'options' && (
              <div className="space-y-4">
                {/* Choice Option Cards */}
                <div className="space-y-3">
                  <button
                    onClick={() => setPdfColorChoice('color')}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      pdfColorChoice === 'color'
                        ? 'bg-fuchsia-950/50 border-fuchsia-500 ring-2 ring-fuchsia-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        pdfColorChoice === 'color' ? 'border-fuchsia-400 bg-fuchsia-600' : 'border-slate-600'
                      }`}
                    >
                      {pdfColorChoice === 'color' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>A Color (Formato Digital con Marca de Agua)</span>
                        <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-300 font-semibold px-2 py-0.5 rounded-full border border-fuchsia-500/30">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Mantiene los colores normativos de fases y diferenciales, logotipo a todo color y tabla completa de protecciones.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPdfColorChoice('bw')}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${
                      pdfColorChoice === 'bw'
                        ? 'bg-slate-800 border-slate-400 ring-2 ring-slate-400/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        pdfColorChoice === 'bw' ? 'border-slate-200 bg-slate-400' : 'border-slate-600'
                      }`}
                    >
                      {pdfColorChoice === 'bw' && <Check className="w-3 h-3 text-slate-950" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>En Blanco y Negro (Plano SEC Impreso Norma TE1)</span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                          Norma SEC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Aplica alto contraste en blanco y negro para copias impresas en papel y carpetas de tramitación formal SEC.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Document Summary Included in PDF */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-400" />
                    <span>Resumen del Documento que se generará:</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>Logotipo de <strong>{contractorInfo.companyName}</strong> y firma SEC.</li>
                    <li>Datos del cliente: <strong>{projectInfo.clientName}</strong> ({projectInfo.clientRut}).</li>
                    <li>Diagrama Unifilar completo del tablero TDA ({totalPowerKW.toFixed(2)} kW).</li>
                    <li><strong>Tabla Resumen de Protecciones:</strong> 1 IGA ({igaPoles}{igaAmps}A), 1 DPS ({dpsVoltage}), {rcdCount} RCD(s) y {circuits.length} Disyuntores.</li>
                    <li>Cálculo de caída de tensión del alimentador ({currentDrop.dropPercent.toFixed(2)}% - RIC N°04).</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs border border-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDownloadPdf(pdfColorChoice)}
                disabled={isGeneratingPdf}
                className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Descargar PDF ({pdfColorChoice === 'bw' ? 'B/N' : 'Color'})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
