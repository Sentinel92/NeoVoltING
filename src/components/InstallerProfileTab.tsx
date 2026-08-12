import React, { useState } from 'react';
import { ContractorConfig, UserSession } from '../types';
import { NeovoltLogo } from './NeovoltLogo';
import { SignaturePad } from './SignaturePad';
import {
  Building,
  CreditCard,
  Upload,
  Check,
  FileCheck,
  RefreshCw,
  GraduationCap,
  Camera,
  X,
} from 'lucide-react';

interface InstallerProfileTabProps {
  contractor: ContractorConfig;
  setContractor: React.Dispatch<React.SetStateAction<ContractorConfig>>;
  user?: UserSession;
  setUser?: React.Dispatch<React.SetStateAction<UserSession>>;
  onSaveToCloud?: () => void;
  onLoadFromCloud?: () => void;
  onInstallApp?: () => void;
  isCloudSyncing?: boolean;
  lastCloudSyncTime?: string | null;
}

export const InstallerProfileTab: React.FC<InstallerProfileTabProps> = ({
  contractor,
  setContractor,
  user,
  setUser,
  onSaveToCloud,
}) => {
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setContractor({ ...contractor, customLogoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setContractor({ ...contractor, customLogoUrl: undefined });
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setContractor({ ...contractor, customBannerUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleResetBanner = () => {
    setContractor({ ...contractor, customBannerUrl: undefined });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setContractor({ ...contractor, customAvatarUrl: dataUrl });
      if (setUser) {
        setUser((prev) => ({ ...prev, googleAvatarUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSignature = (sigUrl: string) => {
    setContractor({ ...contractor, installerSignatureUrl: sigUrl });
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    if (onSaveToCloud) {
      onSaveToCloud();
    }
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Compact & Editable Header Banner */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Banner Cover Image or Gradient */}
        <div className="relative h-28 sm:h-36 w-full bg-slate-950 overflow-hidden">
          {contractor.customBannerUrl ? (
            <img
              src={contractor.customBannerUrl}
              alt="Banner de Perfil"
              className="w-full h-full object-cover opacity-85"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-950 via-fuchsia-950/80 to-indigo-950 opacity-90" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

          {/* Banner Upload / Edit Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <label className="cursor-pointer bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700/80 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow backdrop-blur-md transition-all flex items-center gap-1.5 hover:text-white">
              <Camera className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Cambiar Banner</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </label>
            {contractor.customBannerUrl && (
              <button
                type="button"
                onClick={handleResetBanner}
                className="bg-slate-900/80 hover:bg-slate-900 text-slate-300 border border-slate-700/80 text-[11px] font-bold p-1.5 rounded-xl backdrop-blur-md transition-all hover:text-white"
                title="Quitar banner personalizado"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Row & Avatar */}
        <div className="p-4 sm:p-5 pt-0 sm:pt-0 -mt-10 sm:-mt-12 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex items-end gap-3 sm:gap-4">
            {/* Profile Avatar with Camera Button */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-fuchsia-500/80 shadow-2xl overflow-hidden flex items-center justify-center text-white font-bold text-2xl">
                {contractor.customAvatarUrl || user?.googleAvatarUrl ? (
                  <img
                    src={contractor.customAvatarUrl || user?.googleAvatarUrl}
                    alt="Foto de Perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-fuchsia-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-2xl">
                    {contractor.installerName ? contractor.installerName.charAt(0).toUpperCase() : 'N'}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 cursor-pointer bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-1.5 rounded-xl shadow-lg border border-slate-900 transition-all hover:scale-105" title="Cambiar Foto de Perfil">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Title & Subtitle */}
            <div className="pb-1">
              <div className="flex items-center gap-2 text-fuchsia-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Perfil Técnico e Instalador SEC</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {contractor.installerName || 'Instalador Autorizado'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {contractor.customProfessionalTitle || contractor.companyName || 'Ingeniero en Electricidad'}
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 animate-fadeIn shrink-0">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>¡Datos Guardados!</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Logo and Brand Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-fuchsia-400" />
            1. Identidad Visual & Logo de la Empresa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Logo Preview */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3 min-h-[140px]">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Vista Previa en Documentos Oficiales</span>
              <NeovoltLogo customLogoUrl={contractor.customLogoUrl} variant="dark" />
            </div>

            {/* Upload Controls */}
            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-300">
                Cargar Logo Personalizado de la Empresa (PNG, JPG, SVG)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Subir Imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Tomar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {contractor.customLogoUrl && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Usar por Defecto</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Este logo encabezará automáticamente tus cotizaciones comerciales, contratos y reportes de obra.
              </p>
            </div>
          </div>
        </div>

        {/* Installer Professional Data */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              2. Datos Profesionales & Acreditación SEC (Chile)
            </h3>

            {/* SEC Toggle Button */}
            <div className="flex items-center gap-3 bg-slate-950 p-1.5 px-3 rounded-xl border border-slate-800 shrink-0">
              <span className="text-xs font-semibold text-slate-300">¿Incluir Certificación SEC en PDFs?</span>
              <button
                type="button"
                onClick={() =>
                  setContractor({
                    ...contractor,
                    isSecCertified: contractor.isSecCertified === false ? true : false,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  contractor.isSecCertified !== false ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    contractor.isSecCertified !== false ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Nombre de la Empresa / Razón Social</label>
              <input
                type="text"
                required
                value={contractor.companyName}
                onChange={(e) => setContractor({ ...contractor, companyName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Nombre del Profesional / Ingeniero</label>
              <input
                type="text"
                required
                value={contractor.installerName}
                onChange={(e) => setContractor({ ...contractor, installerName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Título o Cargo Profesional *</label>
              <input
                type="text"
                value={contractor.customProfessionalTitle || 'Ingeniero en Electricidad y Automatización Industrial'}
                onChange={(e) => setContractor({ ...contractor, customProfessionalTitle: e.target.value })}
                placeholder="Ingeniero en Electricidad y Automatización Industrial"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-fuchsia-300 font-bold focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            {contractor.isSecCertified !== false && (
              <>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Número de Licencia SEC *</label>
                  <input
                    type="text"
                    required={Boolean(contractor.isSecCertified)}
                    value={contractor.secLicense}
                    onChange={(e) => setContractor({ ...contractor, secLicense: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Clase de Licencia SEC</label>
                  <select
                    value={contractor.secClass || 'Clase A (Alta y Baja Tensión sin Límite)'}
                    onChange={(e) => setContractor({ ...contractor, secClass: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-fuchsia-500"
                  >
                    <option value="Clase A (Alta y Baja Tensión sin Límite)">Clase A (Alta y Baja Tensión sin Límite - Ingeniero)</option>
                    <option value="Clase B (Hasta 500 kW)">Clase B (Hasta 500 kW)</option>
                    <option value="Clase C (Baja Tensión Residencial/Comercial)">Clase C (Baja Tensión)</option>
                    <option value="Clase D (Instalaciones Básicas)">Clase D (Instalaciones Básicas)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block font-semibold text-slate-400 mb-1">RUT Empresa / Profesional</label>
              <input
                type="text"
                value={contractor.rut || '76.892.410-5'}
                onChange={(e) => setContractor({ ...contractor, rut: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Teléfono Móvil / WhatsApp</label>
              <input
                type="text"
                value={contractor.phone}
                onChange={(e) => setContractor({ ...contractor, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Correo Electrónico Oficial (Anclaje a la Nube)</label>
              <input
                type="email"
                value={contractor.senderEmail}
                onChange={(e) => setContractor({ ...contractor, senderEmail: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-fuchsia-300 font-semibold focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-400 mb-1">Dirección Oficina / Taller</label>
              <input
                type="text"
                value={contractor.address || 'Santiago, Chile'}
                onChange={(e) => setContractor({ ...contractor, address: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Details for Transfers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            3. Datos Bancarios para Pago de Cotizaciones (Transferencia)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Banco</label>
              <input
                type="text"
                value={contractor.bankDetails?.bankName || 'Banco Estado / Banco de Chile'}
                onChange={(e) =>
                  setContractor({
                    ...contractor,
                    bankDetails: { ...contractor.bankDetails, bankName: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Tipo de Cuenta</label>
              <input
                type="text"
                value={contractor.bankDetails?.accountType || 'Cuenta Corriente / Vista'}
                onChange={(e) =>
                  setContractor({
                    ...contractor,
                    bankDetails: { ...contractor.bankDetails, accountType: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Número de Cuenta</label>
              <input
                type="text"
                value={contractor.bankDetails?.accountNumber || '123456789'}
                onChange={(e) =>
                  setContractor({
                    ...contractor,
                    bankDetails: { ...contractor.bankDetails, accountNumber: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Nombre Titular Cuenta</label>
              <input
                type="text"
                value={contractor.bankDetails?.holderName || contractor.companyName}
                onChange={(e) =>
                  setContractor({
                    ...contractor,
                    bankDetails: { ...contractor.bankDetails, holderName: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">RUT Titular Cuenta</label>
              <input
                type="text"
                value={contractor.bankDetails?.holderRut || contractor.rut}
                onChange={(e) =>
                  setContractor({
                    ...contractor,
                    bankDetails: { ...contractor.bankDetails, holderRut: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-fuchsia-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Correo para Comprobante</label>
              <input
                type="email"
                value={contractor.bankDetails?.emailForNotify || contractor.senderEmail}
                onChange={(e) =>
                  setContractor({
                    ...contractor,
                    bankDetails: { ...contractor.bankDetails, emailForNotify: e.target.value },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>
        </div>

        {/* Digital Signature of the Installer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCheck className="w-4 h-4 text-fuchsia-400" />
            4. Firma Digital del Ingeniero / Instalador Autorizado
          </h3>

          <SignaturePad
            label="Firma Manuscrita del Ingeniero Eléctrico SEC"
            placeholderText="Trace su firma profesional aquí"
            savedSignatureUrl={contractor.installerSignatureUrl}
            onSaveSignature={handleSaveSignature}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-sm px-8 py-3 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Guardar Perfil & Respaldar en la Nube</span>
          </button>
        </div>
      </form>
    </div>
  );
};
