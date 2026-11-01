import React, { useState } from 'react';
import { CustomerDetails, ContractorConfig } from '../types';
import { ClientMaterialItem, exportClientMaterialsListJsPdf } from '../utils/pdfGenerator';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  ShoppingCart,
  ShieldCheck,
  Store,
  Info,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ClientMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDetails;
  contractor: ContractorConfig;
  initialMaterials: ClientMaterialItem[];
  projectTitle?: string;
}

export const ClientMaterialsModal: React.FC<ClientMaterialsModalProps> = ({
  isOpen,
  onClose,
  customer,
  contractor,
  initialMaterials,
  projectTitle = 'Instalación Básica Domiciliaria (Sin Tablero)',
}) => {
  const [materials, setMaterials] = useState<ClientMaterialItem[]>(initialMaterials);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSpec, setNewItemSpec] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('unid.');
  const [newItemBrand, setNewItemBrand] = useState('BTicino / Schneider (Sodimac/Easy)');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  // Sync when initialMaterials change
  React.useEffect(() => {
    setMaterials(initialMaterials);
  }, [initialMaterials]);

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateQuantity = (id: string, delta: number) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, quantity: Math.max(1, m.quantity + delta) } : m))
    );
  };

  const removeItem = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ClientMaterialItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newItemName.trim(),
      specification: newItemSpec.trim() || 'Certificado SEC con sello visible',
      quantity: Math.max(1, newItemQty),
      unit: newItemUnit.trim() || 'unid.',
      suggestedStoreOrBrand: newItemBrand.trim() || 'Sodimac / Easy / Ferretería',
    };

    setMaterials([...materials, newItem]);
    setNewItemName('');
    setNewItemSpec('');
    setNewItemQty(1);
    setShowAddForm(false);
  };

  const handleExportPdf = async () => {
    if (materials.length === 0) {
      alert('La lista de materiales está vacía.');
      return;
    }

    setIsExporting(true);
    try {
      await exportClientMaterialsListJsPdf({
        customer,
        contractor,
        materials,
        projectTitle,
      });
    } catch (err) {
      console.error('Error al generar PDF de materiales:', err);
      alert('No se pudo generar el PDF de materiales.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateWhatsAppText = () => {
    let cleanPhone = (customer.phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
      cleanPhone = '56' + cleanPhone;
    }

    const itemsText = materials
      .map(
        (m, idx) =>
          `[ ] *${idx + 1}. ${m.name}* (Cant: ${m.quantity} ${m.unit})\n    ↳ *Especificación SEC:* ${m.specification}\n    ↳ *Marca/Tienda:* ${m.suggestedStoreOrBrand || 'Sodimac / Easy'}`
      )
      .join('\n\n');

    return `Hola *${customer.name || 'Estimado/a'}*, te comparto la *LISTA DE MATERIALES E INSUMOS ELÉCTRICOS* para que puedas comprarlos en la tienda (Sodimac, Easy, Construmart o ferretería):

📍 *PROYECTO:* ${projectTitle}
🏠 *DIRECCIÓN:* ${customer.address || 'Tu domicilio'}

📋 *MATERIALES REQUERIDOS (PARA COMPRA DEL CLIENTE):*
${itemsText}

⚠️ *RECOMENDACIONES DE SEGURIDAD SEC AL COMPRAR:*
1. Exige *Sello SEC* con código QR en todos los artefactos (enchufes, interruptores, focos).
2. Los cables deben ser de cobre *EVA / H07Z1-K libre de halógenos* (Norma RIC N°04). No compres cable THHN para interiores de casa.
3. Marcas recomendadas en placas: *BTicino (Modus Pro)*, *Schneider (Marisio)* o *Legrand*.

Si tienes cualquier duda mientras estés en la tienda, ¡me puedes llamar o enviar una foto antes de pagar!

Atentamente,
*${contractor.installerName}*
${contractor.isSecCertified !== false ? `Instalador Autorizado SEC Licencia ${contractor.secLicense}` : contractor.companyName}
Fono: ${contractor.phone}`;
  };

  const handleSendWhatsApp = () => {
    if (materials.length === 0) {
      alert('La lista de materiales está vacía.');
      return;
    }

    let cleanPhone = (customer.phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
      cleanPhone = '56' + cleanPhone;
    }

    const text = encodeURIComponent(generateWhatsAppText());
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyClipboard = () => {
    if (materials.length === 0) return;
    navigator.clipboard.writeText(generateWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Lista de Compra de Materiales para el Cliente
                </h2>
                <span className="bg-cyan-500/20 text-cyan-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {materials.length} {materials.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Genera la lista de compras con especificaciones técnicas SEC para que el cliente adquiera sus propios insumos en tienda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client & Contractor quick banner */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-slate-400">Cliente:</span>
            <span className="font-bold text-white">{customer.name || 'Cliente Particular'}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 truncate max-w-[240px]">{customer.address || 'Domicilio'}</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Exigencia Sello SEC & RIC N°04</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Notice */}
          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-cyan-200">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Esta lista consolida los insumos exactos requeridos para los trabajos cotizados. El cliente puede llevar el PDF impreso o en su celular a tiendas como <strong className="text-white">Sodimac, Easy, Construmart o distribuidores eléctricos (Dartel, RHona, Byp)</strong>.
            </p>
          </div>

          {/* Table of Materials */}
          {materials.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 space-y-2">
              <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No hay materiales en la lista</p>
              <p className="text-xs text-slate-500">
                Selecciona servicios con materiales o haz clic en "Agregar Insumo Manual" abajo.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((item, idx) => {
                const isChecked = !!checkedIds[item.id];
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      isChecked
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-400'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                        }`}
                        title="Marcar como comprado"
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white">
                            {idx + 1}. {item.name}
                          </span>
                          <span className="bg-slate-800 text-slate-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          <strong className="text-slate-300">Especificación SEC:</strong> {item.specification}
                        </p>
                        {item.suggestedStoreOrBrand && (
                          <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                            <Store className="w-3 h-3" />
                            <span>{item.suggestedStoreOrBrand}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity Adjustment & Delete */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Item Form Toggle */}
          {showAddForm ? (
            <form onSubmit={handleAddNewItem} className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Insumo o Accesorio Adicional
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nombre del Material / Artefacto *</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="ej. Cinta aisladora 3M Temflex 1700"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Especificación Técnica SEC</label>
                  <input
                    type="text"
                    value={newItemSpec}
                    onChange={(e) => setNewItemSpec(e.target.value)}
                    placeholder="ej. Autoextinguible, 600V, uso profesional"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-1/2">
                    <label className="text-[11px] text-slate-400 block mb-1">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="text-[11px] text-slate-400 block mb-1">Unidad</label>
                    <input
                      type="text"
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      placeholder="unid., metros, rollo"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Marca o Tienda Sugerida</label>
                  <input
                    type="text"
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    placeholder="Sodimac / Easy / 3M / Dartel"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-colors"
                >
                  Guardar en Lista
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 rounded-2xl border border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-400 hover:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Material o Insumo Adicional a la Lista</span>
            </button>
          )}

          {/* SEC Recommendations Summary */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instrucciones que van incluidas en el PDF para el cliente:</span>
            </h4>
            <ul className="text-slate-400 space-y-1 pl-4 list-disc text-[11px] leading-relaxed">
              <li>Exigir Sello SEC visible con código QR en artefactos y empaques.</li>
              <li>Conductores de cobre deben ser EVA / H07Z1-K libre de halógeno (Norma RIC N°04).</li>
              <li>Marcas recomendadas en placas: BTicino (Modus Pro / Matix), Schneider (Marisio) o Legrand.</li>
              <li>Marcas recomendadas en conductores: Nexans, Covisa o Madeco.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyClipboard}
            disabled={materials.length === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all active:scale-95"
            title="Copiar lista como texto formateado"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={materials.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={materials.length === 0 || isExporting}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all active:scale-95"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isExporting ? 'Generando...' : 'Descargar PDF Cliente'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
