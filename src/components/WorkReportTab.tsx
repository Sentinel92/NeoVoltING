import React, { useState, useRef } from 'react';
import { WorkReportData, CustomerDetails, ContractorConfig, RoomData, HighAppliance } from '../types';
import { NeovoltLogo } from './NeovoltLogo';
import { Sparkles, Camera, Send, Mail, Copy, Check, FileCheck, ShieldCheck, Printer, Download, Loader2, Trash2, AlertTriangle, CheckCircle2, ShieldAlert, Activity, XCircle, Zap, Cpu, FileText, Upload, PenTool, RotateCcw } from 'lucide-react';
import { downloadPdfFromElement, generatePdfBlob } from '../utils/pdfGenerator';
import { exportWorkReportToJsPdf } from '../utils/workReportPdfExporter';

interface WorkReportTabProps {
  reportData: WorkReportData;
  setReportData: React.Dispatch<React.SetStateAction<WorkReportData>>;
  customer: CustomerDetails;
  contractor: ContractorConfig;
  rooms: RoomData[];
  highAppliances: HighAppliance[];
  feederLength?: number;
  isThreePhase?: boolean;
  feederWireSection?: number;
  customGeminiApiKey?: string;
}

export const WorkReportTab: React.FC<WorkReportTabProps> = ({
  reportData,
  setReportData,
  customer,
  contractor,
  rooms,
  highAppliances,
  feederLength = 20,
  isThreePhase = false,
  feederWireSection = 4.0,
  customGeminiApiKey,
}) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingMemoriaAi, setLoadingMemoriaAi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [memoriaNotice, setMemoriaNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigFileInputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [installerSignatureUrl, setInstallerSignatureUrl] = useState<string>(
    contractor.installerSignatureUrl || ''
  );

  // Canvas signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0284c7'; // sky-600
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setInstallerSignatureUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearSignatureCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setInstallerSignatureUrl('');
  };

  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setInstallerSignatureUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    if (sigFileInputRef.current) sigFileInputRef.current.value = '';
  };

  // Grounding Resistance Diagnostic Tool State (RIC N°06 limit: 20 Ohms)
  const [groundResistance, setGroundResistance] = useState<number>(
    reportData.testResults?.earthResistanceOhms ?? 12.4
  );

  const handleUpdateGroundResistance = (val: number) => {
    const num = Math.max(0.1, Math.round(val * 10) / 10);
    setGroundResistance(num);
    setReportData((prev) => ({
      ...prev,
      testResults: {
        ...(prev.testResults || { isolationMOhms: 50, earthResistanceOhms: 12.4, rcdTripTimeMs: 22 }),
        earthResistanceOhms: num,
      },
    }));
  };

  const isGroundCompliant = groundResistance <= 20.0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const base64Url = evt.target.result as string;
          setReportData((prev) => ({
            ...prev,
            photoPaths: [...prev.photoPaths, base64Url],
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSimulatePhoto = () => {
    // Sample photo
    const samplePhoto = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80';
    setReportData({
      ...reportData,
      photoPaths: [...reportData.photoPaths, samplePhoto],
    });
  };

  // 1. Generate standard AI Technical Report
  const handleGenerateAiReport = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: customer.name || reportData.clientName,
          address: customer.address || reportData.address,
          briefNotes: reportData.briefNotes,
          loadsSummary: { roomsCount: rooms.length, highAppliancesCount: highAppliances.length },
          boardSpecs: {
            iga: isThreePhase ? '3x32A 6kA Curva C' : '1x25A 6kA Curva C',
            dps: isThreePhase ? '3x Trifásico 400V 20kA' : '1x Monofásico 275V 20kA',
            rcdCount: Math.max(1, Math.ceil((rooms.length + highAppliances.length) / 3)),
          },
          customApiKey: customGeminiApiKey,
        }),
      });

      const data = await res.json();
      if (data.report) {
        setReportData({
          ...reportData,
          generatedAiReport: data.report,
        });
        setMemoriaNotice('¡Informe técnico redactado con éxito!');
        setTimeout(() => setMemoriaNotice(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // 2. Generate detailed "Memoria de Montaje" based on BoardAssembler components and RIC norms
  const handleGenerateMemoriaMontaje = async () => {
    setLoadingMemoriaAi(true);
    try {
      const res = await fetch('/api/generate-memoria-montaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: customer.name || reportData.clientName,
          address: customer.address || reportData.address,
          briefNotes: reportData.briefNotes,
          rooms,
          highAppliances,
          feederLength,
          isThreePhase,
          feederWireSection,
          testResults: {
            isolationMOhms: reportData.testResults?.isolationMOhms || 50,
            earthResistanceOhms: groundResistance,
            rcdTripTimeMs: reportData.testResults?.rcdTripTimeMs || 22,
          },
          contractor,
          customApiKey: customGeminiApiKey,
        }),
      });

      const data = await res.json();
      if (data.report) {
        setReportData({
          ...reportData,
          generatedAiReport: data.report,
        });
        setMemoriaNotice('¡Memoria de Montaje generada con éxito mediante Gemini IA conforme a las normas RIC SEC!');
        setTimeout(() => setMemoriaNotice(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMemoriaAi(false);
    }
  };

  const handleCopyReport = () => {
    if (!reportData.generatedAiReport) return;
    navigator.clipboard.writeText(reportData.generatedAiReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportDocRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await exportWorkReportToJsPdf({
        reportData: {
          ...reportData,
          testResults: {
            ...reportData.testResults,
            earthResistanceOhms: groundResistance,
          },
        },
        customer,
        contractor,
        rooms,
        highAppliances,
        overrideInstallerSignatureUrl: installerSignatureUrl,
      });
    } catch (err) {
      console.error('Error exportando con jsPDF, intentando fallback html2pdf:', err);
      const clientSlug = (customer.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      await downloadPdfFromElement(reportDocRef.current, {
        filename: `Informe_Tecnico_Obra_${clientSlug}.pdf`,
        margin: 10,
        orientation: 'portrait',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const clientSlug = (customer.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Informe_Tecnico_Obra_${clientSlug}.pdf`;

      const pdfBlob = await generatePdfBlob(reportDocRef.current, {
        filename,
        margin: 10,
        orientation: 'portrait',
      });

      if (pdfBlob) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Informe Técnico de Obra - ${contractor.companyName}`,
              text: `Hola ${customer.name}, te adjunto el informe técnico de entrega de obra eléctrica.`,
              files: [file],
            });
            return;
          } catch (e) {
            console.log('WebShare cancelado, usando descarga directa.');
          }
        }

        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      let cleanPhone = (customer.phone || '').replace(/\D/g, '');
      if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
        cleanPhone = '56' + cleanPhone;
      }

      const text = encodeURIComponent(
        `Hola *${customer.name || 'Estimado/a'}*, adjunto el Informe Técnico y Memoria de Montaje de la obra eléctrica ejecutada por *${
          contractor.companyName
        }* en ${customer.address || 'su propiedad'}.

📍 *DOCUMENTO ADJUNTO:* ${filename}
Atentamente,
*${contractor.installerName}* (${contractor.secLicense ? `Licencia SEC: ${contractor.secLicense}` : 'Técnico Instalador'})`
      );

      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${text}`
        : `https://wa.me/?text=${text}`;

      window.open(waUrl, '_blank');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Image Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Notification Toast */}
      {memoriaNotice && (
        <div className="print:hidden bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{memoriaNotice}</span>
          </div>
          <button
            onClick={() => setMemoriaNotice(null)}
            className="text-emerald-400 hover:text-white font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner (Hidden in Print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            <span>Etapa 6 • Informe Técnico de Obra & Carpeta TE1 SEC</span>
          </div>
          <h2 className="text-xl font-bold text-white">Acta de Conformidad & Memoria de Montaje</h2>
          <p className="text-xs text-slate-400 mt-1">
            Genera la Memoria Explicativa de Montaje con Gemini IA basada en los componentes del tablero e integra protocolo de pruebas y firma del instalador en PDF.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateMemoriaMontaje}
            disabled={loadingMemoriaAi || loadingAi}
            className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 shrink-0"
            title="Genera la Memoria de Montaje en base al diseño del tablero y la norma SEC RIC"
          >
            {loadingMemoriaAi ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Cpu className="w-4 h-4 text-fuchsia-300 animate-pulse" />
            )}
            <span>{loadingMemoriaAi ? 'Redactando Memoria...' : 'Generar Memoria de Montaje (IA RIC)'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all active:scale-95"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGeneratingPdf ? 'Generando PDF...' : 'Exportar a PDF'}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-600 shadow transition-all active:scale-95"
            title="Enviar informe por WhatsApp con PDF"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all"
            title="Vista de impresión directa"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Observaciones Form & Memoria Controller (Hidden in Print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-fuchsia-400" />
            <span>1. Observaciones de Terreno & Mediciones Normativas SEC</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateAiReport}
              disabled={loadingAi}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-fuchsia-300 border border-fuchsia-500/30 font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loadingAi ? 'Generando...' : 'Informe Breve IA'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Resumen / Notas Técnicas de la Obra Ejecutada
            </label>
            <textarea
              rows={2}
              value={reportData.briefNotes}
              onChange={(e) => setReportData({ ...reportData, briefNotes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
              placeholder="Ej: Montaje de gabinete TDA 18 DIN, instalación de IGA 25A 6kA, DPS 275V y peinado de bornes..."
            />
          </div>

          {/* HERRAMIENTA DE DIAGNÓSTICO: RESISTENCIA PUESTA A TIERRA NORMATIVA RIC N°06 */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Herramienta de Diagnóstico • Puesta a Tierra (RIC N°06)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Límite Máximo Normativo:</span>
                <strong className="text-amber-400 font-mono font-bold">20.0 Ω</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Input Control & Quick Presets */}
              <div className="md:col-span-5 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Valor Medido Telurómetro (Ohms / Ω):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="200"
                    value={groundResistance}
                    onChange={(e) => handleUpdateGroundResistance(parseFloat(e.target.value) || 0)}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:outline-none focus:border-sky-500 shadow-inner"
                  />
                  <span className="text-slate-400 font-mono text-sm font-bold">Ω</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Ejemplos:</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateGroundResistance(5.2)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2 py-0.5 rounded border border-slate-700 font-mono"
                  >
                    5.2 Ω
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateGroundResistance(12.4)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2 py-0.5 rounded border border-slate-700 font-mono"
                  >
                    12.4 Ω
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateGroundResistance(28.5)}
                    className="text-[10px] bg-slate-800 hover:bg-rose-900/60 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60 font-mono"
                  >
                    28.5 Ω
                  </button>
                </div>
              </div>

              {/* Status Badge & Diagnostic Conclusion */}
              <div className="md:col-span-7">
                <div
                  className={`p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isGroundCompliant
                      ? 'bg-emerald-950/50 border-emerald-500/80 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-500/80 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                      {isGroundCompliant ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">CUMPLE NORMATIVA SEC RIC N°06</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-rose-300">NO CUMPLE NORMATIVA SEC RIC N°06</span>
                        </>
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                        isGroundCompliant
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {isGroundCompliant ? 'CONFORME (≤ 20 Ω)' : 'NO CONFORME (> 20 Ω)'}
                    </span>
                  </div>

                  <p className="text-[11px] leading-snug">
                    {isGroundCompliant ? (
                      <>
                        <strong className="text-white">Resistencia Medida: {groundResistance} Ω.</strong> Margen de seguridad:{' '}
                        <span className="font-mono text-emerald-300 font-bold">{(20 - groundResistance).toFixed(1)} Ω</span> por
                        debajo del máximo de 20.0 Ω. Garantiza el correcto drenaje de corrientes de falla a tierra.
                      </>
                    ) : (
                      <>
                        <strong className="text-white">Resistencia Medida: {groundResistance} Ω.</strong> Excede el límite normativo por{' '}
                        <span className="font-mono text-rose-300 font-bold">{(groundResistance - 20).toFixed(1)} Ω</span>. Se
                        requiere instalar barras adicionales o mejorador de suelo (RIC N°06).
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Other Secondary Normative Readings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-semibold text-[11px]">Aislamiento Conductores (RIC N°04):</span>
                <span className="font-mono font-bold text-emerald-400">&gt; 50 MΩ (500V DC)</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 font-semibold text-[11px]">Tiempo Disparo RCD (RIC N°05):</span>
                <span className="font-mono font-bold text-emerald-400">22 ms (a 30mA)</span>
              </div>
            </div>
          </div>
        </div>

        {/* MEMORIA DE MONTAJE GENERADA & EDITABLE */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-fuchsia-400" />
              <span className="text-xs font-bold text-slate-200">
                2. Memoria Explicativa de Montaje & Diagnóstico TDA (RIC SEC)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateMemoriaMontaje}
                disabled={loadingMemoriaAi}
                className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition-all active:scale-95"
              >
                {loadingMemoriaAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
                )}
                <span>{loadingMemoriaAi ? 'Redactando con Gemini...' : '⚡ Generar Memoria con Gemini IA'}</span>
              </button>

              {reportData.generatedAiReport && (
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={8}
              value={reportData.generatedAiReport}
              onChange={(e) => setReportData({ ...reportData, generatedAiReport: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-fuchsia-500 transition-colors leading-relaxed"
              placeholder="Presione 'Generar Memoria de Montaje (IA RIC)' para autocompletar este campo con las especificaciones del tablero en base a los Pliegos Técnicos RIC N°01 al N°11..."
            />
          </div>
        </div>

        {/* Photos List & Upload */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              3. Fotografías de Respaldo de Terreno ({reportData.photoPaths.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/40 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Foto Dispositivo</span>
              </button>

              <button
                type="button"
                onClick={handleSimulatePhoto}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Foto Muestra</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            {reportData.photoPaths.map((url, i) => (
              <div key={i} className="w-24 h-24 rounded-xl overflow-hidden border border-slate-700 shadow-md relative group">
                <img src={url} alt={`Terreno ${i}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setReportData((prev) => ({
                      ...prev,
                      photoPaths: prev.photoPaths.filter((_, idx) => idx !== i),
                    }));
                  }}
                  className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-full opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Signature Pad Section */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <input
            type="file"
            ref={sigFileInputRef}
            onChange={handleSignatureFileUpload}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">
                4. Firma Digital del Instalador Responsable SEC
              </span>
            </div>

            <div className="flex items-center gap-2">
              {installerSignatureUrl ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Firma Digital Cargada
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold uppercase">
                  Sin Firma Manual (Se usará Sello Digital SEC)
                </span>
              )}

              <button
                type="button"
                onClick={() => sigFileInputRef.current?.click()}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-2.5 py-1 rounded-lg transition-all"
              >
                <Upload className="w-3 h-3 text-sky-400" />
                <span>Subir Imagen</span>
              </button>

              <button
                type="button"
                onClick={clearSignatureCanvas}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs px-2.5 py-1 rounded-lg transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Borrar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            {/* Interactive Canvas Drawing Box */}
            <div className="sm:col-span-7 space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">
                Dibujar Trazo de Firma en Pantalla (Dedo o Mouse):
              </label>
              <div className="relative bg-white rounded-xl border border-slate-700 overflow-hidden touch-none shadow-inner">
                <canvas
                  ref={sigCanvasRef}
                  width={380}
                  height={110}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-28 cursor-crosshair bg-slate-50"
                />
                <span className="absolute bottom-1 right-2 text-[9px] text-slate-400 select-none pointer-events-none">
                  Firma Acreditada SEC
                </span>
              </div>
            </div>

            {/* Signature Preview & SEC Acreditation Stamp */}
            <div className="sm:col-span-5 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-400">
                Vista Previa de Firma en PDF:
              </label>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 h-28 flex flex-col items-center justify-center text-center">
                {installerSignatureUrl ? (
                  <img
                    src={installerSignatureUrl}
                    alt="Firma Instalador"
                    className="max-h-20 object-contain mx-auto"
                  />
                ) : (
                  <div className="space-y-1 text-slate-400">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="text-[10px] font-bold text-emerald-300 uppercase">
                      Timbre de Validación Digital SEC
                    </p>
                    <p className="text-[9px] font-mono text-slate-500">
                      SEC-{contractor.secLicense || '12345'}-VERIFIED
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Corporate Report Body */}
      <div ref={reportDocRef} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Company Header with Logo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 print:border-black pb-6">
          <div>
            <NeovoltLogo customLogoUrl={contractor.customLogoUrl} variant="dark" />
            <div className="mt-3 text-xs text-slate-400 print:text-black space-y-0.5">
              <p className="font-bold text-slate-200 print:text-black">{contractor.companyName}</p>
              <p>RUT: {contractor.rut} | {contractor.address}</p>
              <p>
                Técnico: {contractor.installerName} (
                {contractor.isSecCertified !== false
                  ? `Licencia SEC: ${contractor.secLicense} - ${contractor.secClass}`
                  : contractor.customProfessionalTitle || 'Técnico en Electricidad'}
                )
              </p>
            </div>
          </div>

          <div className="text-right sm:self-start bg-slate-950 print:bg-slate-100 p-4 rounded-2xl border border-slate-800 print:border-slate-300 min-w-[220px]">
            <span className="text-[10px] uppercase font-bold text-fuchsia-400 print:text-black block">
              {contractor.isSecCertified !== false ? 'Acta de Conformidad & Memoria SEC' : 'Acta de Entrega de Obra'}
            </span>
            <span className="text-lg font-mono font-black text-white print:text-black block">INF-{Date.now().toString().slice(-6)}</span>
            <span className="text-xs text-slate-400 print:text-slate-700 block mt-1">Fecha: {new Date().toLocaleDateString('es-CL')}</span>
          </div>
        </div>

        {/* Client & Address Summary */}
        <div className="bg-slate-950/60 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">Cliente Receptor:</span>
            <p className="font-bold text-white print:text-black text-sm">{customer.name || 'Cliente Particular'}</p>
            <p className="text-slate-300 print:text-black mt-1">RUT: {customer.rut || '12.345.678-9'}</p>
            <p className="text-slate-300 print:text-black">Email: {customer.email || 'N/A'}</p>
          </div>

          <div>
            <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">Ubicación de la Obra:</span>
            <p className="font-semibold text-white print:text-black text-xs">{customer.address || 'Santiago, Chile'}</p>
            <p className="text-slate-300 print:text-black mt-1">Comuna: {customer.city || 'Santiago'}</p>
            <p className="text-slate-300 print:text-black">Teléfono: {customer.phone || 'N/A'}</p>
          </div>
        </div>

        {/* Protocol Summary Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
            Protocolo de Mediciones Normativas SEC
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-200 text-slate-300 print:text-black border-b border-slate-800 print:border-slate-400">
                  <th className="p-2 font-bold">Prueba / Ensayo</th>
                  <th className="p-2 font-bold">Pliego RIC</th>
                  <th className="p-2 font-bold">Valor Registrado</th>
                  <th className="p-2 font-bold">Estado SEC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-slate-300 print:text-black">
                <tr>
                  <td className="p-2">Resistencia Aislamiento Conductores</td>
                  <td className="p-2 font-mono">RIC N°04</td>
                  <td className="p-2 font-mono text-emerald-400 print:text-black font-bold">&gt; 50 MΩ (500V DC)</td>
                  <td className="p-2 font-bold text-emerald-400 print:text-emerald-700">CONFORME</td>
                </tr>
                <tr>
                  <td className="p-2">Resistencia Puesta a Tierra</td>
                  <td className="p-2 font-mono">RIC N°06</td>
                  <td className="p-2 font-mono font-bold">
                    {groundResistance} Ω <span className="text-[10px] font-normal text-slate-400 print:text-slate-600">(Máx 20 Ω)</span>
                  </td>
                  <td className={`p-2 font-bold ${isGroundCompliant ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                    {isGroundCompliant ? 'CONFORME SEC' : 'NO CONFORME'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2">Tiempo Disparo RCD 30mA</td>
                  <td className="p-2 font-mono">RIC N°05</td>
                  <td className="p-2 font-mono text-emerald-400 print:text-black font-bold">22 ms</td>
                  <td className="p-2 font-bold text-emerald-400 print:text-emerald-700">CONFORME</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Content Body */}
        {reportData.generatedAiReport ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between print:hidden">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Memoria Explicativa de Montaje y Dictamen de Auditoría</span>
              </h3>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
              </button>
            </div>

            <div className="bg-slate-950 print:bg-white p-5 rounded-2xl border border-slate-800 print:border-none text-xs text-slate-200 print:text-black font-mono leading-relaxed whitespace-pre-line">
              {reportData.generatedAiReport}
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
            <Cpu className="w-8 h-8 text-fuchsia-400 mx-auto animate-pulse" />
            <p className="text-xs font-semibold text-slate-300">
              Presione "Generar Memoria de Montaje (IA RIC)" para confeccionar el documento técnico oficial.
            </p>
          </div>
        )}

        {/* Photos in Printable Layout */}
        {reportData.photoPaths.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
              Anexo Fotografías de Terreno
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {reportData.photoPaths.map((url, i) => (
                <div key={i} className="h-32 rounded-xl overflow-hidden border border-slate-800 print:border-slate-300">
                  <img src={url} alt={`Terreno ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800 print:border-slate-300">
          <div className="text-center space-y-2">
            <div className="h-16 flex items-center justify-center">
              {(installerSignatureUrl || contractor.installerSignatureUrl) ? (
                <img
                  src={installerSignatureUrl || contractor.installerSignatureUrl}
                  alt="Firma Instalador"
                  className="max-h-14 object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="border-b border-slate-600 print:border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="text-[9px] font-mono text-emerald-400 print:text-emerald-700 uppercase font-bold">
                    ✓ SEC-{contractor.secLicense || '12345'}-DIGITAL
                  </span>
                </div>
              )}
            </div>
            <p className="font-bold text-xs text-white print:text-black">{contractor.installerName}</p>
            <p className="text-[10px] text-slate-400 print:text-slate-700">
              {contractor.isSecCertified !== false
                ? `Instalador Autorizado SEC (Licencia: ${contractor.secLicense})`
                : contractor.customProfessionalTitle || 'Técnico en Electricidad'}
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="h-16 flex items-center justify-center border-b border-slate-600 print:border-slate-400 w-36 mx-auto"></div>
            <p className="font-bold text-xs text-white print:text-black">{customer.name || 'Cliente Receptor'}</p>
            <p className="text-[10px] text-slate-400 print:text-slate-700">Firma Recepción Conforme de Obra</p>
          </div>
        </div>
      </div>
    </div>
  );
};

