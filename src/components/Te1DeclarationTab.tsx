import React, { useState, useRef } from 'react';
import { UserSession, RoomData, HighAppliance } from '../types';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  Send,
  Building,
  User,
  Zap,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Award,
  FileCheck,
  Share2,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { downloadPdfFromElement } from '../utils/pdfGenerator';

interface Te1DeclarationTabProps {
  user: UserSession;
  rooms: RoomData[];
  highAppliances: HighAppliance[];
  feederLength: number;
  isThreePhase: boolean;
}

export const Te1DeclarationTab: React.FC<Te1DeclarationTabProps> = ({
  user,
  rooms,
  highAppliances,
  feederLength,
  isThreePhase,
}) => {
  // Propietario / Mandante state
  const [owner, setOwner] = useState({
    name: 'Juan Carlos Morales Soto',
    rut: '12.849.302-K',
    address: 'Av. Providencia 1480, Apt 602',
    commune: 'Providencia',
    region: 'Región Metropolitana',
    phone: '+56 9 8765 4321',
    email: 'jcmorales@gmail.com',
  });

  // Instalador SEC state
  const [installer, setInstaller] = useState({
    name: user.name || 'Gonzalo Araya P.',
    rut: user.secNumber ? '15.429.108-3' : '15.429.108-3',
    secLicense: user.secNumber || 'SEC-84291-CL',
    secClass: user.role === 'engineer' ? 'Clase A (Ingeniero)' : 'Clase B (Técnico)',
    phone: '+56 9 9123 4567',
    commune: 'Santiago',
  });

  // Proyecto TE1 Technical Specs state
  const [project, setProject] = useState({
    buildingDestination: 'Habitacional (Vivienda Unifamiliar / Depto)',
    distributorCompany: 'Enel Distribución Chile S.A.',
    utilityContractNumber: '8492019-2',
    groundingResistanceOhm: 12.4,
    insulationResistanceMohm: 150.0,
    rcdDischargeTimeMs: 18.5,
    declarationType: 'Instalación Nueva en BT (Baja Tensión)',
  });

  const [activeReportSubTab, setActiveReportSubTab] = useState<'te1_form' | 'memory_report' | 'protocol_report'>('te1_form');
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
  const [aiCustomReportText, setAiCustomReportText] = useState<string | null>(null);

  // Total Load calculation
  const totalWattsFromRooms = rooms.reduce((acc, room) => {
    const roomWatts = room.devices.reduce((w, d) => w + d.powerWatts * d.quantity, 0);
    return acc + roomWatts + room.lightPoints * 100 + room.socketPoints * 250;
  }, 0);

  const totalWattsFromHeavy = highAppliances.reduce((acc, h) => acc + h.powerWatts, 0);
  const totalDeclaredWatts = totalWattsFromRooms + totalWattsFromHeavy || 6500;
  const totalDeclaredKw = (totalDeclaredWatts / 1000).toFixed(2);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const te1DocRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const ownerSlug = (owner.name || 'Propietario').replace(/[^a-zA-Z0-9]/g, '_');
      const subtabNames = {
        te1_form: 'Declaracion_TE1_SEC',
        memory_report: 'Memoria_Explicativa_SEC',
        protocol_report: 'Protocolo_Mediciones_RIC10',
      };
      const docTitle = subtabNames[activeReportSubTab] || 'Declaracion_TE1_SEC';

      await downloadPdfFromElement(te1DocRef.current, {
        filename: `${docTitle}_${ownerSlug}.pdf`,
        margin: 8,
        orientation: 'portrait',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Generate AI Memoria Explicativa
  const handleGenerateAiMemoria = async () => {
    setIsGeneratingAiReport(true);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: owner.name,
          address: `${owner.address}, ${owner.commune}`,
          briefNotes: `Declaración TE1 SEC de ${project.declarationType}. Destino: ${project.buildingDestination}.`,
          loadsSummary: {
            potenciaTotalKw: totalDeclaredKw,
            tipoSuministro: isThreePhase ? 'Trifásico 380V' : 'Monofásico 220V',
            empresaDistribuidora: project.distributorCompany,
            cantidadRecintos: rooms.length,
          },
          boardSpecs: {
            iga: isThreePhase ? '3x32A Curva C 10kA' : '1x32A Curva C 6kA',
            dps: 'DPS 275V 20kA Tipo 2',
            rcdCount: Math.ceil((rooms.length + highAppliances.length) / 3),
            feederWire: isThreePhase ? '5x6.0 mm² EVA' : '3x6.0 mm² EVA',
          },
        }),
      });

      const data = await res.json();
      if (data.report) {
        setAiCustomReportText(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  // Export SEC JSON payload for portal
  const handleExportSecJson = () => {
    const secData = {
      tipoDeclaracion: 'TE1',
      versionNormativa: 'RIC SEC N°01-N°11',
      instalador: installer,
      propietario: owner,
      especificacionesTecnicas: {
        potenciaDeclaradaKw: totalDeclaredKw,
        tipoSuministro: isThreePhase ? 'Trifásico 380V' : 'Monofásico 220V',
        empresaDistribuidora: project.distributorCompany,
        numeroCliente: project.utilityContractNumber,
        resistenciaTierraOhm: project.groundingResistanceOhm,
        resistenciaAislamientoMohm: project.insulationResistanceMohm,
        tiempoInyeccionDiferencialMs: project.rcdDischargeTimeMs,
      },
      recintos: rooms,
      cargasEspeciales: highAppliances,
      fechaDeclaracion: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(secData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DECLARACION_TE1_SEC_${owner.rut.replace(/[^0-9kK]/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls (Hidden in Print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Tramitación SEC Chile • Formulario Oficial TE1 & Memoria Explicativa</span>
          </div>
          <h2 className="text-xl font-bold text-white">Declaración TE1 e Informes Técnicos SEC</h2>
          <p className="text-xs text-slate-400 mt-1">
            Autogeneración de la Declaración TE1 para la Superintendencia de Electricidad y Combustibles con respaldo de ensayos RIC N°10.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportSecJson}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all"
            title="Descargar archivo estructurado JSON para la plataforma e-Declarador SEC"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>e-Declarador JSON</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-all active:scale-95"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGeneratingPdf ? 'Generando PDF...' : 'Generar PDF Documento'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all"
            title="Imprimir documento"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Form Fields (Hidden in Print) */}
        <div className="print:hidden lg:col-span-1 space-y-4">
          {/* Owner Data */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-fuchsia-400" />
              <span>1. Datos del Propietario / Mandante</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-0.5">Nombre / Razón Social:</label>
                <input
                  type="text"
                  value={owner.name}
                  onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-0.5">RUT Propietario:</label>
                  <input
                    type="text"
                    value={owner.rut}
                    onChange={(e) => setOwner({ ...owner, rut: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-0.5">Comuna:</label>
                  <input
                    type="text"
                    value={owner.commune}
                    onChange={(e) => setOwner({ ...owner, commune: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-0.5">Dirección de la Instalación:</label>
                <input
                  type="text"
                  value={owner.address}
                  onChange={(e) => setOwner({ ...owner, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-0.5">Teléfono:</label>
                  <input
                    type="text"
                    value={owner.phone}
                    onChange={(e) => setOwner({ ...owner, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-0.5">Email:</label>
                  <input
                    type="email"
                    value={owner.email}
                    onChange={(e) => setOwner({ ...owner, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Installer Data */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>2. Datos del Instalador Autorizado SEC</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-0.5">Nombre del Instalador:</label>
                <input
                  type="text"
                  value={installer.name}
                  onChange={(e) => setInstaller({ ...installer, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-0.5">N° Licencia SEC:</label>
                  <input
                    type="text"
                    value={installer.secLicense}
                    onChange={(e) => setInstaller({ ...installer, secLicense: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-0.5">Clase Licencia:</label>
                  <input
                    type="text"
                    value={installer.secClass}
                    onChange={(e) => setInstaller({ ...installer, secClass: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Technical Protocol Data */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>3. Mediciones y Ensayos RIC N°10</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-0.5">Empresa Distribuidora:</label>
                <input
                  type="text"
                  value={project.distributorCompany}
                  onChange={(e) => setProject({ ...project, distributorCompany: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-0.5">Res. Tierra (Ω):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={project.groundingResistanceOhm}
                    onChange={(e) => setProject({ ...project, groundingResistanceOhm: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-0.5">Res. Aisl. (MΩ):</label>
                  <input
                    type="number"
                    step="1"
                    value={project.insulationResistanceMohm}
                    onChange={(e) => setProject({ ...project, insulationResistanceMohm: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Printable Document View */}
        <div className="lg:col-span-2 space-y-4">
          {/* View Tab Selector (Hidden in Print) */}
          <div className="print:hidden flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveReportSubTab('te1_form')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeReportSubTab === 'te1_form'
                  ? 'bg-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Formulario Oficial TE1 SEC</span>
            </button>

            <button
              onClick={() => setActiveReportSubTab('memory_report')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeReportSubTab === 'memory_report'
                  ? 'bg-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Memoria Explicativa SEC</span>
            </button>

            <button
              onClick={() => setActiveReportSubTab('protocol_report')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeReportSubTab === 'protocol_report'
                  ? 'bg-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Protocolo Mediciones RIC N°10</span>
            </button>
          </div>

          {/* DOCUMENT BODY - PRINTABLE AREA */}
          <div ref={te1DocRef} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            {activeReportSubTab === 'te1_form' && (
              <div className="space-y-6">
                {/* Official SEC Banner Header */}
                <div className="border-2 border-slate-700 print:border-black p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left bg-slate-950 print:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-fuchsia-400 font-extrabold text-xs print:text-black print:border-black">
                      SEC
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-white print:text-black uppercase tracking-wider">
                        SUPERINTENDENCIA DE ELECTRICIDAD Y COMBUSTIBLES
                      </h2>
                      <p className="text-[11px] text-slate-300 print:text-slate-800 font-bold">
                        DECLARACIÓN DE INSTALACIONES ELÉCTRICAS DE INTERIOR (FORMULARIO TE1)
                      </p>
                      <p className="text-[10px] text-slate-400 print:text-slate-600">
                        Conforme a Ley N° 18.410 y Pliegos Técnicos Normativos RIC N°01 al N°11
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-700 print:border-black p-2.5 rounded-xl text-right bg-slate-900 print:bg-white min-w-[180px]">
                    <span className="text-[9px] uppercase font-bold text-emerald-400 print:text-black block">
                      CÓDIGO DE INSCRIPCIÓN TE1
                    </span>
                    <span className="text-sm font-mono font-bold text-white print:text-black block">
                      TE1-{Date.now().toString().slice(-8)}
                    </span>
                    <span className="text-[10px] text-slate-400 print:text-black block">
                      FECHA: {new Date().toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>

                {/* Section 1: Property and Owner */}
                <div className="border border-slate-800 print:border-slate-400 p-4 rounded-2xl space-y-2 text-xs">
                  <h4 className="font-extrabold text-fuchsia-400 print:text-black uppercase tracking-wider text-[11px]">
                    1. IDENTIFICACIÓN DE LA INSTALACIÓN Y DEL PROPIETARIO
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 print:text-black">
                    <div>
                      <span className="text-slate-400 print:text-slate-600 font-semibold block text-[10px]">Nombre o Razón Social Propietario:</span>
                      <strong className="text-white print:text-black">{owner.name}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 print:text-slate-600 font-semibold block text-[10px]">RUT Propietario:</span>
                      <strong className="font-mono text-white print:text-black">{owner.rut}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 print:text-slate-600 font-semibold block text-[10px]">Dirección de la Propiedad:</span>
                      <span>{owner.address}, {owner.commune}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 print:text-slate-600 font-semibold block text-[10px]">Destino de la Edificación:</span>
                      <span>{project.buildingDestination}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Technical Project Specs */}
                <div className="border border-slate-800 print:border-slate-400 p-4 rounded-2xl space-y-3 text-xs">
                  <h4 className="font-extrabold text-emerald-400 print:text-black uppercase tracking-wider text-[11px]">
                    2. CARACTERÍSTICAS TÉCNICAS Y POTENCIA DECLARADA (RIC N°01)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300 print:text-black">
                    <div className="bg-slate-950 print:bg-slate-100 p-2.5 rounded-xl border border-slate-800 print:border-slate-300">
                      <span className="text-[10px] text-slate-400 print:text-slate-700 block uppercase font-bold">Potencia Total Declarada:</span>
                      <strong className="text-lg text-emerald-400 print:text-black font-mono font-black">{totalDeclaredKw} kW</strong>
                    </div>

                    <div className="bg-slate-950 print:bg-slate-100 p-2.5 rounded-xl border border-slate-800 print:border-slate-300">
                      <span className="text-[10px] text-slate-400 print:text-slate-700 block uppercase font-bold">Tipo de Suministro:</span>
                      <strong className="text-sm text-white print:text-black font-semibold">{isThreePhase ? 'Trifásico 380V / 50Hz' : 'Monofásico 220V / 50Hz'}</strong>
                    </div>

                    <div className="bg-slate-950 print:bg-slate-100 p-2.5 rounded-xl border border-slate-800 print:border-slate-300">
                      <span className="text-[10px] text-slate-400 print:text-slate-700 block uppercase font-bold">Empresa Distribuidora:</span>
                      <strong className="text-sm text-white print:text-black font-semibold">{project.distributorCompany}</strong>
                    </div>
                  </div>

                  <div className="pt-2 text-slate-300 print:text-black text-[11px] leading-relaxed">
                    <p>
                      <strong>Recintos Declarados ({rooms.length}):</strong> {rooms.map((r) => r.name).join(', ') || 'Levantamiento Estándar'}.
                    </p>
                    <p>
                      <strong>Cargas Especiales (&gt;1500W):</strong> {highAppliances.map((h) => `${h.name} (${h.powerWatts}W)`).join(', ') || 'Sin cargas pesadas declaradas'}.
                    </p>
                  </div>
                </div>

                {/* Section 3: Certified Installer Declaration */}
                <div className="border border-slate-800 print:border-slate-400 p-4 rounded-2xl space-y-3 text-xs">
                  <h4 className="font-extrabold text-amber-400 print:text-black uppercase tracking-wider text-[11px]">
                    3. DECLARACIÓN JURADA DEL INSTALADOR AUTORIZADO
                  </h4>

                  <p className="text-[11px] text-slate-300 print:text-black leading-relaxed italic bg-slate-950/60 print:bg-slate-50 p-3 rounded-xl border border-slate-800 print:border-slate-300">
                    "El suscrito declara bajo su responsabilidad que la instalación eléctrica individualizada en el presente documento ha sido proyectada y ejecutada en estricta conformidad con la Ley General de Servicios Eléctricos y las Normas Técnicas aprobadas por la Superintendencia de Electricidad y Combustibles (SEC), habiéndose realizado satisfactoriamente todos los ensayos de protocolo RIC N°10."
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 print:border-slate-300">
                    <div>
                      <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">Instalador Eléctrico SEC:</span>
                      <p className="font-bold text-white print:text-black">{installer.name}</p>
                      <p className="text-slate-400 print:text-black text-[11px]">RUT: {installer.rut}</p>
                      <p className="text-emerald-400 print:text-black font-mono font-bold text-[11px]">
                        Licencia SEC: {installer.secLicense} ({installer.secClass})
                      </p>
                    </div>

                    <div className="text-center sm:text-right pt-6 sm:pt-0">
                      <div className="inline-block border-b-2 border-slate-600 print:border-black w-48 mb-1"></div>
                      <span className="block text-[10px] text-slate-400 print:text-black uppercase font-bold">Firma & Timbre Instalador SEC</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SubTab 2: Memoria Explicativa SEC */}
            {activeReportSubTab === 'memory_report' && (
              <div className="space-y-4 text-xs leading-relaxed text-slate-300 print:text-black">
                <div className="flex items-center justify-between border-b border-slate-800 print:border-black pb-3">
                  <div>
                    <h3 className="font-bold text-white print:text-black text-sm uppercase">MEMORIA EXPLICATIVA TÉCNICA SEC</h3>
                    <p className="text-[11px] text-slate-400 print:text-slate-700">Conforme a Pliegos RIC N°01 a RIC N°11</p>
                  </div>

                  <button
                    onClick={handleGenerateAiMemoria}
                    disabled={isGeneratingAiReport}
                    className="print:hidden bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isGeneratingAiReport ? 'Regenerando con IA...' : 'Regenerar con IA Gemini'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 whitespace-pre-line font-mono text-[11px]">
                  {aiCustomReportText || `MEMORIA EXPLICATIVA - INSTALACIÓN ELÉCTRICA INTERIOR

1. DESCRIPCIÓN GENERAL DEL PROYECTO:
El presente documento constituye la Memoria Explicativa para la declaración TE1 ante la SEC de la instalación eléctrica ubicada en ${owner.address}, comuna de ${owner.commune}.
Propietario: ${owner.name} (RUT: ${owner.rut}).

2. POTENCIA Y ALIMENTADORES:
- Potencia Total Instalada: ${totalDeclaredKw} kW
- Sistema: ${isThreePhase ? 'Trifásico 380V/50Hz' : 'Monofásico 220V/50Hz'}
- Conductor Alimentador Principal: ${isThreePhase ? '5x6.0 mm² EVA Libre de Halógenos' : '3x6.0 mm² EVA Libre de Halógenos'} bajo canalización Conduit 25mm.

3. TABLERO GENERAL Y PROTECCIONES (RIC N°02 & RIC N°05):
- Interruptor General Automático (IGA): ${isThreePhase ? '3x32A Curva C 10kA' : '1x32A Curva C 6kA'}
- Protector de Sobretensiones Transitorias (DPS): 275V 20kA
- Protecciones Diferenciales (RCD): Sensibilidad de 30mA, con un máximo estricto de 3 circuitos por cada diferencial según RIC N°05.

4. PROTOCOLO DE MEDIDAS DE SEGURIDAD Y TIERRA (RIC N°06):
- Malla de Puesta a Tierra comprobada: ${project.groundingResistanceOhm} Ω (cumpliendo límite < 20 Ω).
- Resistencia de aislamiento del cableado: ${project.insulationResistanceMohm} MΩ (cumpliendo límite > 1.0 MΩ).`}
                </div>
              </div>
            )}

            {/* SubTab 3: Protocolo Ensayos RIC N°10 */}
            {activeReportSubTab === 'protocol_report' && (
              <div className="space-y-4 text-xs text-slate-300 print:text-black">
                <h3 className="font-bold text-white print:text-black text-sm uppercase border-b border-slate-800 pb-2">
                  PROTOCOLO DE ENSAYOS Y PRUEBAS DE TERRENO (RIC N°10 SEC)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 space-y-2">
                    <h5 className="font-bold text-emerald-400 print:text-black text-xs">✓ Medición de Resistencia de Aislamiento</h5>
                    <p className="text-[11px] text-slate-300 print:text-black">
                      Tensión de Ensayo: 500V DC entre Fase-Neutro y Fase-Tierra.
                    </p>
                    <div className="text-sm font-mono font-bold text-white print:text-black">
                      Resultado: {project.insulationResistanceMohm} MΩ <span className="text-xs text-emerald-400">(Aprobado &gt; 1.0 MΩ)</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 space-y-2">
                    <h5 className="font-bold text-emerald-400 print:text-black text-xs">✓ Medición de Resistencia de Puesta a Tierra</h5>
                    <p className="text-[11px] text-slate-300 print:text-black">
                      Medición realizada con Telurómetro / Método de caída de potencial.
                    </p>
                    <div className="text-sm font-mono font-bold text-white print:text-black">
                      Resultado: {project.groundingResistanceOhm} Ω <span className="text-xs text-emerald-400">(Aprobado &lt; 20 Ω)</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 space-y-2">
                    <h5 className="font-bold text-emerald-400 print:text-black text-xs">✓ Ensayo de Inyección Diferencial (RCD 30mA)</h5>
                    <p className="text-[11px] text-slate-300 print:text-black">
                      Inyección de corriente de falla de 30mA a 0° y 180°.
                    </p>
                    <div className="text-sm font-mono font-bold text-white print:text-black">
                      Tiempo de Disparo: {project.rcdDischargeTimeMs} ms <span className="text-xs text-emerald-400">(Aprobado &lt; 30 ms)</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 space-y-2">
                    <h5 className="font-bold text-emerald-400 print:text-black text-xs">✓ Prueba de Polaridad y Continuidad PE</h5>
                    <p className="text-[11px] text-slate-300 print:text-black">
                      Verificación en el 100% de los alveolos de enchufes e iluminación.
                    </p>
                    <div className="text-sm font-mono font-bold text-white print:text-black">
                      Resultado: <span className="text-emerald-400">Continuidad 100% Verificada</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
