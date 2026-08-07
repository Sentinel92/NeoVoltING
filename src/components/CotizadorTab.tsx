import React, { useState, useRef } from 'react';
import { BudgetItem, CustomerDetails, ContractorConfig, ClientSignature, RoomData, HighAppliance } from '../types';
import { NeovoltLogo } from './NeovoltLogo';
import { SignaturePad } from './SignaturePad';
import {
  Send,
  Mail,
  Plus,
  Trash2,
  Calculator,
  Eye,
  EyeOff,
  Printer,
  ShieldCheck,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Edit3,
  RotateCcw,
  Check,
} from 'lucide-react';
import { LaborPricingCalculatorModal } from './LaborPricingCalculatorModal';
import { downloadPdfFromElement, generatePdfBlob } from '../utils/pdfGenerator';

export interface ContractClause {
  id: string;
  title: string;
  content: string;
}

const DEFAULT_CLAUSES: ContractClause[] = [
  {
    id: '1',
    title: 'PRIMERA (Objeto del Contrato)',
    content:
      'EL CONTRATISTA se compromete a ejecutar los trabajos de instalación, modificación o armado de tablero eléctrico descritos en el presente presupuesto, garantizando el estricto cumplimiento de los Pliegos Técnicos Normativos RIC N°01 al RIC N°11 aprobados por la Superintendencia de Electricidad y Combustibles (SEC) de Chile.',
  },
  {
    id: '2',
    title: 'SEGUNDA (Monto y Forma de Pago)',
    content:
      'El valor total de los servicios asciende a la suma señalada en este presupuesto. Las partes acuerdan un anticipo del 50% al momento de la firma para la adquisición de materiales e insumos, y el 50% restante contra la finalización exitosa de las pruebas de protocolo e inyección de diferencial.',
  },
  {
    id: '3',
    title: 'TERCERA (Plazo de Ejecución y Validez)',
    content:
      'Esta cotización mantiene su validez por 30 días corridos a contar de su emisión. El plazo de ejecución será fijado de común acuerdo tras la recepción del primer pago de anticipo, condicionado a que el CLIENTE provea acceso irrestricto al inmueble y empalme correspondiente.',
  },
  {
    id: '4',
    title: 'CUARTA (Garantía de la Instalación)',
    content:
      'EL CONTRATISTA otorga una garantía legal de 12 meses a contar de la recepción conforme de la obra, cubriendo fallas de montaje o defectos en las protecciones instaladas. Quedan excluidas manipulaciones de terceros o sobretensiones de la red pública.',
  },
  {
    id: '5',
    title: 'QUINTA (Tramitación TE1 SEC)',
    content:
      'La instalación resultante queda habilitada para su posterior declaración y tramitación de certificado TE1 ante la SEC según la clase de licencia asignada al profesional a cargo.',
  },
  {
    id: '6',
    title: 'SEXTA (Firma Electrónica y Aceptación Legal)',
    content:
      'La firma estampada a continuación otorga plena validez y eficacia jurídica al presente acuerdo comercial conforme a la Ley N° 19.799 sobre Documentos Electrónicos y Firma Electrónica en Chile.',
  },
];

interface CotizadorTabProps {
  items: BudgetItem[];
  setItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  customer: CustomerDetails;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  contractor: ContractorConfig;
  setContractor: React.Dispatch<React.SetStateAction<ContractorConfig>>;
  rooms?: RoomData[];
  highAppliances?: HighAppliance[];
}

export const CotizadorTab: React.FC<CotizadorTabProps> = ({
  items,
  setItems,
  customer,
  setCustomer,
  contractor,
  setContractor,
  rooms = [],
  highAppliances = [],
}) => {
  const [isClientView, setIsClientView] = useState(true);
  const [includeContingency15, setIncludeContingency15] = useState(true);
  const [laborCost, setLaborCost] = useState(180000);
  const [customMaterialsTotal, setCustomMaterialsTotal] = useState<number | null>(null);
  const [showClauses, setShowClauses] = useState(true);
  const [isEditingClauses, setIsEditingClauses] = useState(false);
  const [clauses, setClauses] = useState<ContractClause[]>(DEFAULT_CLAUSES);
  const [isLaborModalOpen, setIsLaborModalOpen] = useState(false);

  // Client Signature State
  const [clientSignature, setClientSignature] = useState<ClientSignature>({
    signedBy: customer.name || '',
    signedRut: customer.rut || '',
    signedAt: '',
    signatureDataUrl: '',
    termsAccepted: false,
  });

  const rawMaterialsTotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const effectiveMaterialsTotal = customMaterialsTotal !== null ? customMaterialsTotal : rawMaterialsTotal;

  const baseSubtotal = effectiveMaterialsTotal + laborCost;
  const contingencyVal = includeContingency15 ? baseSubtotal * 0.15 : 0;
  const totalFinalCLP = baseSubtotal + contingencyVal;

  const handleAddItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name: 'Nuevo Insumo / Canalización',
      quantity: 1,
      price: 2500,
      category: 'GENERAL',
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleAddClause = () => {
    const newClause: ContractClause = {
      id: Date.now().toString(),
      title: 'NUEVA CLÁUSULA',
      content: 'Escriba aquí las condiciones o especificaciones adicionales del contrato...',
    };
    setClauses([...clauses, newClause]);
    setIsEditingClauses(true);
  };

  const handleRemoveClause = (id: string) => {
    setClauses(clauses.filter((c) => c.id !== id));
  };

  const handleResetClauses = () => {
    setClauses(DEFAULT_CLAUSES);
    setIsEditingClauses(false);
  };

  const handleSaveClientSignature = (sigDataUrl: string) => {
    setClientSignature({
      ...clientSignature,
      signedBy: customer.name,
      signedRut: customer.rut || '',
      signedAt: sigDataUrl ? new Date().toLocaleString('es-CL') : '',
      signatureDataUrl: sigDataUrl,
    });
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const quoteDocRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const clientSlug = (customer.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      await downloadPdfFromElement(quoteDocRef.current, {
        filename: `Cotizacion_Presupuesto_${clientSlug}.pdf`,
        margin: 10,
        orientation: 'portrait',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintQuote = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const clientSlug = (customer.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Cotizacion_Presupuesto_${clientSlug}.pdf`;

      // Generate PDF Blob
      const pdfBlob = await generatePdfBlob(quoteDocRef.current, {
        filename,
        margin: 10,
        orientation: 'portrait',
      });

      if (pdfBlob) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        // Attempt Native Web Share API if supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Cotización Eléctrica SEC - ${contractor.companyName}`,
              text: `Hola ${customer.name}, te adjunto la cotización formal de trabajos eléctricos de ${contractor.companyName}.`,
              files: [file],
            });
            return;
          } catch (shareErr) {
            console.log('Navegador canceló WebShare, usando descarga directa.');
          }
        }

        // Automatic Download Fallback
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      // Clean customer phone number
      let cleanPhone = (customer.phone || '').replace(/\D/g, '');
      if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
        cleanPhone = '56' + cleanPhone;
      }

      // Open WhatsApp Web / App directly to client's phone if provided
      const text = encodeURIComponent(
        `Hola *${customer.name || 'Estimado/a'}*, adjunto la propuesta y cotización de servicios eléctricos de *${
          contractor.companyName
        }* para la obra en ${customer.address || 'su domicilio'}:

📍 *RESUMEN DE COTIZACIÓN COMERCIAL:*
• Materiales e Insumos Eléctricos: $${effectiveMaterialsTotal.toLocaleString('es-CL')} CLP
• Mano de Obra Ejecución Especializada SEC: $${laborCost.toLocaleString('es-CL')} CLP
${includeContingency15 ? `• Imprevistos / Contingencias de Obra (15%): Incluido\n` : ''}-----------------------------------
💰 *PRECIO TOTAL FINAL:* $${totalFinalCLP.toLocaleString('es-CL')} CLP

📎 *DOCUMENTO PDF OFICIAL:*
Se ha adjuntado/generado el PDF oficial: *${filename}*.

💳 *DATOS PARA TRANSFERENCIA BANCARIA:*
• Banco: ${contractor.bankDetails.bankName}
• Tipo Cuenta: ${contractor.bankDetails.accountType} N° ${contractor.bankDetails.accountNumber}
• Titular: ${contractor.bankDetails.holderName} (RUT: ${contractor.bankDetails.holderRut})
• Email Comprobante: ${contractor.bankDetails.emailForNotify}

Cualquier duda o ajuste quedo a su entera disposición.
Atentamente,
*${contractor.installerName}* (${
          contractor.isSecCertified !== false
            ? `SEC ${contractor.secLicense} - ${contractor.secClass}`
            : contractor.customProfessionalTitle || 'Técnico en Electricidad'
        })`
      );

      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${text}`
        : `https://wa.me/?text=${text}`;

      window.open(waUrl, '_blank');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    setIsGeneratingPdf(true);
    try {
      const clientSlug = (customer.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Cotizacion_Presupuesto_${clientSlug}.pdf`;

      // Generate PDF Blob
      const pdfBlob = await generatePdfBlob(quoteDocRef.current, {
        filename,
        margin: 10,
        orientation: 'portrait',
      });

      if (pdfBlob) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Cotización & Contrato Trabajos Eléctricos SEC - ${contractor.companyName}`,
              text: `Estimado/a ${customer.name},\n\nJunto con saludar, adjuntamos la propuesta comercial y contractual en PDF.`,
              files: [file],
            });
            return;
          } catch (shareErr) {
            console.log('WebShare cancelado, usando fallback mailto.');
          }
        }

        // Automatic Download Fallback
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      const subject = encodeURIComponent(`Cotización & Contrato Trabajos Eléctricos SEC - ${contractor.companyName}`);
      const body = encodeURIComponent(
        `Estimado/a ${customer.name || 'Cliente'},

Junto con saludar, adjuntamos la propuesta comercial y contractual para la obra eléctrica en ${customer.address || 'su domicilio'}:

RESUMEN DEL PRESUPUESTO ELÉCTRICO SEC:
• Materiales e Insumos: $${effectiveMaterialsTotal.toLocaleString('es-CL')} CLP
• Mano de Obra Ejecución Especializada: $${laborCost.toLocaleString('es-CL')} CLP
${includeContingency15 ? `• Margen Imprevistos de Obra (15%): Incluido\n` : ''}--------------------------------------------------
PRECIO TOTAL FINAL: $${totalFinalCLP.toLocaleString('es-CL')} CLP

DOCUMENTO ADJUNTO:
Se ha descargado automáticamente en su equipo el archivo PDF oficial:
"${filename}" (Favor adjuntar este archivo a su respuesta).

CONDICIONES DE PAGO Y TRANSFERENCIA:
• 50% de anticipo para compra de materiales e inicio de obra.
• 50% saldo contra entrega y pruebas de funcionamiento.
Banco: ${contractor.bankDetails.bankName}
Tipo Cuenta: ${contractor.bankDetails.accountType}
N° Cuenta: ${contractor.bankDetails.accountNumber}
Titular: ${contractor.bankDetails.holderName} (RUT: ${contractor.bankDetails.holderRut})
Email Comprobante: ${contractor.bankDetails.emailForNotify}

Atentamente,
${contractor.companyName}
${contractor.installerName} (Licencia SEC: ${contractor.secLicense} - ${contractor.secClass})
Teléfono: ${contractor.phone}`
      );

      window.location.href = `mailto:${customer.email}?subject=${subject}&body=${body}`;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls (Hidden in Print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Etapa 5 • Presupuesto Comercial & Contrato Formal</span>
          </div>
          <h2 className="text-xl font-bold text-white">Cotización Comercial & Cláusulas SEC</h2>
          <p className="text-xs text-slate-400 mt-1">
            Genera presupuestos empresariales con firma digital del cliente y cláusulas legales editables conforme a la normativa chilena.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsLaborModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition-all"
            title="Calculadora & Tarifario de Mano de Obra para proyectos en Chile"
          >
            <Calculator className="w-4 h-4 text-amber-300" />
            <span>Tarifario & Sugerencia Mano Obra</span>
          </button>

          <button
            onClick={() => setIsClientView(!isClientView)}
            className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ${
              isClientView
                ? 'bg-fuchsia-600 border-fuchsia-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {isClientView ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{isClientView ? 'Vista Cliente' : 'Vista Detallada'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-all active:scale-95"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGeneratingPdf ? 'Generando PDF...' : 'Generar PDF'}</span>
          </button>

          <button
            onClick={handlePrintQuote}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-all"
            title="Vista de impresión directa"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Corporate Document Frame (Print Friendly Container) */}
      <div
        ref={quoteDocRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0"
      >
        {/* Document Header with Company Logo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 print:border-black pb-6">
          <div>
            <NeovoltLogo customLogoUrl={contractor.customLogoUrl} variant="dark" />
            <div className="mt-3 text-xs text-slate-400 print:text-black space-y-0.5">
              <p className="font-bold text-slate-200 print:text-black">{contractor.companyName}</p>
              <p>
                RUT: {contractor.rut} | Teléfono: {contractor.phone}
              </p>
              <p>
                Técnico: {contractor.installerName} (
                {contractor.isSecCertified !== false
                  ? `Licencia SEC: ${contractor.secLicense} - ${contractor.secClass}`
                  : contractor.customProfessionalTitle || 'Técnico en Electricidad'}
                )
              </p>
              <p>Email: {contractor.senderEmail}</p>
            </div>
          </div>

          <div className="text-right sm:self-start bg-slate-950 print:bg-slate-100 p-4 rounded-2xl border border-slate-800 print:border-slate-300 min-w-[220px]">
            <span className="text-[10px] uppercase font-bold text-fuchsia-400 print:text-black block">
              {contractor.isSecCertified !== false ? 'Presupuesto Comercial SEC' : 'Presupuesto Trabajo Eléctrico'}
            </span>
            <span className="text-lg font-mono font-black text-white print:text-black block">
              COT-{Date.now().toString().slice(-6)}
            </span>
            <span className="text-xs text-slate-400 print:text-slate-700 block mt-1">
              Fecha: {new Date().toLocaleDateString('es-CL')}
            </span>
            <span className="text-xs text-emerald-400 print:text-emerald-800 font-bold block">
              Validez: 30 Días Corridos
            </span>
          </div>
        </div>

        {/* Customer Details Section */}
        <div className="bg-slate-950/60 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <strong className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">
              Cliente / Razón Social:
            </strong>
            <input
              type="text"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="bg-transparent font-bold text-white print:text-black w-full border-b border-slate-700 print:border-slate-400 focus:outline-none text-sm"
              placeholder="Nombre del Cliente"
            />
            <div className="mt-2 space-y-1 text-slate-300 print:text-black">
              <p>
                RUT Cliente:{' '}
                <input
                  type="text"
                  value={customer.rut || ''}
                  onChange={(e) => setCustomer({ ...customer, rut: e.target.value })}
                  className="bg-transparent font-mono border-b border-slate-700 print:border-slate-400 w-32 focus:outline-none"
                  placeholder="12.345.678-9"
                />
              </p>
              <p>
                Email:{' '}
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="bg-transparent border-b border-slate-700 print:border-slate-400 w-48 focus:outline-none"
                  placeholder="cliente@correo.cl"
                />
              </p>
            </div>
          </div>

          <div>
            <strong className="text-slate-400 print:text-slate-600 block text-[10px] uppercase font-bold">
              Ubicación de la Obra:
            </strong>
            <input
              type="text"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              className="bg-transparent font-semibold text-white print:text-black w-full border-b border-slate-700 print:border-slate-400 focus:outline-none text-xs"
              placeholder="Dirección de la Propiedad"
            />
            <div className="mt-2 space-y-1 text-slate-300 print:text-black">
              <p>
                Teléfono:{' '}
                <input
                  type="text"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="bg-transparent border-b border-slate-700 print:border-slate-400 w-36 focus:outline-none"
                  placeholder="+56 9 1234 5678"
                />
              </p>
              <p>Comuna/Ciudad: {customer.city || 'Santiago'}</p>
            </div>
          </div>
        </div>

        {/* Breakdown Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
              1. Desglose de Insumos, Materiales y Ejecución
            </h3>
            {!isClientView && (
              <button
                onClick={handleAddItem}
                className="print:hidden flex items-center gap-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-3 py-1 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Item</span>
              </button>
            )}
          </div>

          {!isClientView ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-800 print:bg-slate-200 text-slate-300 print:text-black font-bold border-b border-slate-700">
                    <th className="p-2.5 rounded-l-xl">Descripción del Insumo / Servicio</th>
                    <th className="p-2.5 text-center">Cant</th>
                    <th className="p-2.5 text-right">P. Unitario</th>
                    <th className="p-2.5 text-right rounded-r-xl">Total CLP</th>
                    <th className="p-2.5 text-center print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                      <td className="p-2.5 font-medium text-slate-200 print:text-black">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, name: val } : i)));
                          }}
                          className="bg-transparent w-full focus:outline-none font-medium"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 1;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: val } : i)));
                          }}
                          className="bg-transparent w-12 text-center font-bold focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setItems(items.map((i) => (i.id === item.id ? { ...i, price: val } : i)));
                          }}
                          className="bg-transparent w-20 text-right font-mono font-bold text-emerald-400 print:text-black focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-white print:text-black">
                        ${(item.quantity * item.price).toLocaleString('es-CL')}
                      </td>
                      <td className="p-2.5 text-center print:hidden">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-slate-500 hover:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-slate-950/80 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800 print:border-slate-300">
                <span className="font-semibold text-slate-300 print:text-black">
                  Materiales, Protecciones DIN, Conductores EVA y Canalizaciones:
                </span>
                <span className="font-mono font-bold text-emerald-400 print:text-black">
                  ${effectiveMaterialsTotal.toLocaleString('es-CL')} CLP
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-1 border-b border-slate-800 print:border-slate-300 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300 print:text-black">
                    Mano de Obra, Montaje de Tablero y Pruebas SEC:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLaborModalOpen(true)}
                    className="print:hidden text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-all"
                  >
                    <Calculator className="w-3 h-3 text-amber-300" />
                    <span>Sugerencia / Tarifario</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-700 print:border-none print:bg-transparent rounded px-2 py-0.5 font-mono font-bold text-emerald-400 print:text-black w-28 text-right focus:outline-none focus:border-fuchsia-500"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">CLP</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Summary Box */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 print:border-slate-300 print:bg-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-slate-400 print:text-slate-700 font-semibold">
              Subtotal Insumos + Ejecución: ${baseSubtotal.toLocaleString('es-CL')} CLP
            </p>
            {includeContingency15 && (
              <p className="text-amber-400 print:text-amber-800 font-bold">
                Imprevistos de Obra (15%): ${contingencyVal.toLocaleString('es-CL')} CLP
              </p>
            )}
            <p className="text-[11px] text-slate-500 print:text-slate-600">
              Valores exentos / gravados conforme a régimen tributario del prestador.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase font-bold text-slate-400 print:text-black block">
              Total General de la Propuesta:
            </span>
            <span className="text-2xl font-black text-emerald-400 print:text-black font-mono">
              ${totalFinalCLP.toLocaleString('es-CL')} CLP
            </span>
          </div>
        </div>

        {/* Bank Transfer Information */}
        <div className="bg-slate-950/70 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-300 space-y-2 text-xs">
          <h4 className="font-bold text-white print:text-black flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400 print:text-black" />
            <span>2. Datos de Transferencia Bancaria para Pago de Servicios</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300 print:text-black pt-1">
            <p>
              <strong>Banco:</strong> {contractor.bankDetails.bankName}
            </p>
            <p>
              <strong>Tipo Cuenta:</strong> {contractor.bankDetails.accountType}
            </p>
            <p>
              <strong>N° Cuenta:</strong>{' '}
              <span className="font-mono font-bold">{contractor.bankDetails.accountNumber}</span>
            </p>
            <p>
              <strong>Titular:</strong> {contractor.bankDetails.holderName}
            </p>
            <p>
              <strong>RUT Titular:</strong>{' '}
              <span className="font-mono">{contractor.bankDetails.holderRut}</span>
            </p>
            <p>
              <strong>Email Comprobante:</strong> {contractor.bankDetails.emailForNotify}
            </p>
          </div>
        </div>

        {/* Contract Clauses Section (Fully Editable) */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 print:border-slate-300 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 print:border-slate-300 pb-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setShowClauses(!showClauses)}
            >
              <ShieldCheck className="w-4 h-4 text-fuchsia-400 print:text-black" />
              <h4 className="font-bold text-white print:text-black text-xs uppercase tracking-wider">
                3. Cláusulas del Contrato de Prestación de Servicios Eléctricos SEC ({clauses.length})
              </h4>
              <button type="button" className="print:hidden text-slate-400 hover:text-white ml-1">
                {showClauses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="print:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingClauses(!isEditingClauses)}
                className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  isEditingClauses
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isEditingClauses ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditingClauses ? 'Guardar Cambios' : 'Editar Cláusulas'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddClause}
                className="flex items-center gap-1 text-xs font-bold bg-fuchsia-600/80 hover:bg-fuchsia-600 text-white px-2.5 py-1 rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Cláusula</span>
              </button>

              <button
                type="button"
                onClick={handleResetClauses}
                className="text-slate-400 hover:text-amber-300 text-xs p-1 rounded transition-all"
                title="Restablecer cláusulas predeterminadas"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {(showClauses || isGeneratingPdf || window.matchMedia('print').matches) && (
            <div className="space-y-3 pt-1">
              {isEditingClauses && !isGeneratingPdf ? (
                <div className="print:hidden space-y-3">
                  {clauses.map((clause, index) => (
                    <div
                      key={clause.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-mono text-fuchsia-400">
                          Cláusula #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveClause(clause.id)}
                          className="text-slate-500 hover:text-rose-400"
                          title="Eliminar cláusula"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Título / Encabezado:</label>
                        <input
                          type="text"
                          value={clause.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setClauses(clauses.map((c) => (c.id === clause.id ? { ...c, title: val } : c)));
                          }}
                          className="bg-slate-950 border border-slate-700 text-white text-xs rounded font-bold px-2.5 py-1 w-full focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Contenido / Texto Legal:</label>
                        <textarea
                          rows={3}
                          value={clause.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setClauses(clauses.map((c) => (c.id === clause.id ? { ...c, content: val } : c)));
                          }}
                          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 w-full focus:outline-none focus:border-fuchsia-500 leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-300 print:text-black space-y-2.5 leading-relaxed">
                  {clauses.map((clause) => (
                    <p key={clause.id}>
                      <strong className="text-white print:text-black font-bold">{clause.title}:</strong> {clause.content}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Signatures Section */}
        <div className="space-y-4 pt-4 border-t border-slate-800 print:border-slate-300">
          <h4 className="font-bold text-white print:text-black text-xs uppercase tracking-wider">
            4. Firmas y Conformidad de las Partes
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Installer Signature Display */}
            <div className="bg-slate-950 print:bg-white border border-slate-800 print:border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-3">
              <span className="text-[10px] font-bold text-slate-400 print:text-black uppercase">
                {contractor.isSecCertified !== false ? 'Instalador Autorizado SEC' : (contractor.customProfessionalTitle || 'Instalador Responsable')}
              </span>

              <div className="h-24 flex items-center justify-center">
                {contractor.installerSignatureUrl ? (
                  <img
                    src={contractor.installerSignatureUrl}
                    alt="Firma Instalador"
                    className="max-h-20 object-contain filter invert-0"
                  />
                ) : (
                  <span className="text-xs text-slate-500 italic">Firma registrada en perfil</span>
                )}
              </div>

              <div className="border-t border-slate-800 print:border-slate-300 w-full pt-2 text-xs">
                <p className="font-bold text-white print:text-black">{contractor.installerName}</p>
                {contractor.isSecCertified !== false && contractor.secLicense && (
                  <p className="text-[10px] text-emerald-400 print:text-black font-mono">
                    Licencia SEC: {contractor.secLicense}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 print:text-black">{contractor.companyName}</p>
              </div>
            </div>

            {/* Client Signature Canvas */}
            <div className="space-y-3">
              <SignaturePad
                label="Firma de Aceptación del Cliente"
                placeholderText="Dibuje su firma aquí para aceptar los términos"
                savedSignatureUrl={clientSignature.signatureDataUrl}
                onSaveSignature={handleSaveClientSignature}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer (Hidden in Print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          ¿Listo para enviar? Al presionar WhatsApp o Correo, el PDF de la cotización se generará automáticamente para adjuntarlo o compartirlo.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleSendWhatsApp}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Enviar por WhatsApp</span>
          </button>

          <button
            onClick={handleSendEmail}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            <span>Enviar por Correo</span>
          </button>
        </div>
      </div>

      {/* Labor Pricing Calculator Modal */}
      <LaborPricingCalculatorModal
        isOpen={isLaborModalOpen}
        onClose={() => setIsLaborModalOpen(false)}
        rooms={rooms}
        highAppliances={highAppliances}
        currentLaborCost={laborCost}
        onApplyLaborCost={(newCost) => setLaborCost(newCost)}
      />
    </div>
  );
};
