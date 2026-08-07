import React, { useState, useMemo } from 'react';
import { ContractorConfig, UserSession } from '../types';
import { NeovoltLogo } from './NeovoltLogo';
import { SignaturePad } from './SignaturePad';
import {
  UserCheck,
  Building,
  CreditCard,
  Upload,
  Check,
  ShieldCheck,
  FileCheck,
  RefreshCw,
  Cloud,
  CloudUpload,
  Download,
  Smartphone,
  Sparkles,
  Award,
  GraduationCap,
  Bell,
  AlertTriangle,
  Camera,
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
  onLoadFromCloud,
  onInstallApp,
  isCloudSyncing = false,
  lastCloudSyncTime,
}) => {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(() => {
    const saved = localStorage.getItem('neovolt_backup_reminder_days');
    return saved ? parseInt(saved, 10) : 7;
  });

  const daysSinceLastBackup = useMemo(() => {
    if (!lastCloudSyncTime) return 999;
    const lastDate = new Date(lastCloudSyncTime);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [lastCloudSyncTime]);

  const isBackupOverdue = reminderDays > 0 && daysSinceLastBackup >= reminderDays;

  const handleReminderDaysChange = (days: number) => {
    setReminderDays(days);
    localStorage.setItem('neovolt_backup_reminder_days', days.toString());
  };

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
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-fuchsia-400" />
            <span>Perfil Ingeniero en Electricidad y Automatización Industrial</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Perfil Profesional del Ingeniero & Datos de Empresa</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ficha profesional del Ingeniero en Electricidad y Automatización Industrial, número de licencia SEC, firma digital y respaldos en la nube.
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>¡Perfil guardado y respaldado en la nube!</span>
          </div>
        )}
      </div>

      {/* Cloud Backup & Mobile PWA Installation Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloud Sync Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sincronización en la Nube con tu Correo</h3>
                <p className="text-[11px] text-emerald-400 font-medium">Anclado a {user?.email || 'tu correo'}</p>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Nube Activa</span>
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Toda tu información (clientes, levantamientos de proyectos, tableros, cubicación y cotizaciones) se guarda respaldada en la nube asociada a tu correo electrónico. Si desinstalas la app o cambias de celular, al ingresar con tu correo recuperarás el 100% de tus datos.
          </p>

          {lastCloudSyncTime && (
            <div className="text-[11px] text-slate-400">
              Último respaldo en la nube: <span className="text-slate-200 font-mono font-bold">{new Date(lastCloudSyncTime).toLocaleString('es-CL')}</span>
            </div>
          )}

          {/* Periodic Cloud Backup Reminder Config */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Recordatorio Periódico de Respaldo:</span>
              </label>

              <select
                value={reminderDays}
                onChange={(e) => handleReminderDaysChange(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value={7}>Cada 7 días (Recomendado)</option>
                <option value={14}>Cada 14 días</option>
                <option value={30}>Cada 30 días</option>
                <option value={0}>Desactivado</option>
              </select>
            </div>

            {isBackupOverdue ? (
              <div className="bg-rose-950/60 border border-rose-800/80 p-2.5 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  ¡Atención! Han transcurrido <strong className="text-white">{daysSinceLastBackup} días</strong> desde tu último respaldo en la nube. Realiza un respaldo completo para proteger tus proyectos.
                </span>
              </div>
            ) : reminderDays > 0 ? (
              <p className="text-[11px] text-slate-400">
                La app te alertará cuando pasen más de <strong className="text-slate-200">{reminderDays} días</strong> sin sincronizar tus proyectos con la nube.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 pt-1">
            {onSaveToCloud && (
              <button
                type="button"
                onClick={onSaveToCloud}
                disabled={isCloudSyncing}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <CloudUpload className={`w-4 h-4 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
                <span>{isCloudSyncing ? 'Guardando...' : 'Respaldar en la Nube Ahora'}</span>
              </button>
            )}

            {onLoadFromCloud && (
              <button
                type="button"
                onClick={onLoadFromCloud}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                title="Recuperar respaldo de proyectos y clientes desde la nube"
              >
                <Download className="w-4 h-4 text-fuchsia-400" />
                <span>Restaurar Datos</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile PWA Installation Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950/40 border border-fuchsia-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Instalación en Smartphone / Tablet</h3>
                <p className="text-[11px] text-fuchsia-400 font-medium">Aplicación Web Progresiva (PWA)</p>
              </div>
            </div>
            <span className="bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-fuchsia-500/30">
              Android & iOS
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Instala NEOVOLT directamente en tu teléfono móvil para acceder desde el ícono en tu pantalla de inicio como una app nativa, rápida y optimizada para terreno.
          </p>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-200">📱 Pasos para instalar en tu teléfono:</div>
            <div>• <strong className="text-fuchsia-300">Android (Chrome):</strong> Toca los 3 puntos arriba ➔ "Instalar aplicación" o "Agregar a pantalla principal".</div>
            <div>• <strong className="text-fuchsia-300">iPhone (Safari):</strong> Toca el botón Compartir ➔ "Agregar a inicio".</div>
          </div>

          {onInstallApp && (
            <button
              type="button"
              onClick={onInstallApp}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Instalar App en Pantalla de Inicio del Celular</span>
            </button>
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
                    required={contractor.isSecCertified !== false}
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
