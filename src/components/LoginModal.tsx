import React, { useState } from 'react';
import { UserSession } from '../types';
import {
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  User,
  Building2,
  FileCheck2,
  Phone,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (session: UserSession) => void;
  initialTab?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login',
}) => {
  const { login, register, resetPassword, setGuestMode, userSession } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  // Form Fields
  const [email, setEmail] = useState('ineovolt@gmail.com');
  const [password, setPassword] = useState('noah0412');
  const [fullName, setFullName] = useState('');
  const [rut, setRut] = useState('');
  const [secLicense, setSecLicense] = useState('Clase A');
  const [companyName, setCompanyName] = useState('Servicios Eléctricos Integrales');
  const [phone, setPhone] = useState('+56 9 ');

  // UI state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (onLoginSuccess) {
          onLoginSuccess(userSession);
        }
        onClose();
      } else {
        setError(res.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!fullName.trim()) {
      setError('Por favor ingresa tu Nombre Completo o Razón Social.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        email,
        password,
        fullName: fullName.trim(),
        rut: rut.trim(),
        secLicense: secLicense.trim(),
        secClass: secLicense.trim(),
        companyName: companyName.trim(),
        phone: phone.trim(),
      });

      if (res.success) {
        setSuccessMessage('¡Cuenta creada exitosamente! Conectado a la nube.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'Error al registrar la cuenta.');
      }
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico registrado.');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(email);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Enlace de recuperación enviado. Revisa tu bandeja de entrada.');
    } else {
      setError(res.error || 'No se pudo enviar el correo de recuperación.');
    }
  };

  const handleAutofillCredentials = () => {
    setEmail('ineovolt@gmail.com');
    setPassword('noah0412');
    setError('');
  };

  const handleEnterGuestMode = () => {
    setGuestMode(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* MODAL TOP HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 border border-fuchsia-400/40 text-white flex items-center justify-center shadow-lg shadow-fuchsia-950/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">NEOVOLT Cloud Suite</h3>
                <span className="text-[10px] bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700 px-2 py-0.5 rounded-full font-bold">
                  SEC Multi-Usuario
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sincronización en la nube & Aislamiento de Proyectos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="grid grid-cols-2 bg-slate-950/80 p-1.5 border-b border-slate-800 gap-1 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setError('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Crear Cuenta SEC</span>
          </button>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ingeniero@neovolt.cl"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 underline"
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                  />
                </div>
              </div>

              {/* Quick prefill card */}
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Acceso rápido demo: <span className="text-fuchsia-300 font-mono font-bold">ineovolt@gmail.com</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillCredentials}
                  className="text-[11px] bg-fuchsia-950 hover:bg-fuchsia-900 text-fuchsia-300 border border-fuchsia-700/60 px-2 py-0.5 rounded-lg font-bold transition"
                >
                  Autocompletar
                </button>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnterGuestMode}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <span>Modo Local / Demo</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-fuchsia-950/50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <span>Conectando...</span> : <span>Iniciar Sesión</span>}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ing. Camilo Rojas"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Empresa / Razón Social
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Servicios Eléctricos SpA"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    RUT / Licencia SEC (Opcional)
                  </label>
                  <div className="relative">
                    <FileCheck2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={secLicense}
                      onChange={(e) => setSecLicense(e.target.value)}
                      placeholder="Clase A / 12345678-9"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teléfono de Contacto
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+56 9 8765 4321"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu-correo@empresa.cl"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contraseña (Mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-fuchsia-950/50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <span>Creando cuenta...</span> : <span>Registrar Cuenta & Crear Workspace</span>}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="p-3 bg-indigo-950/40 border border-indigo-700/60 rounded-xl text-xs text-indigo-300 leading-relaxed">
                Ingresa el correo electrónico asociado a tu cuenta para recibir las instrucciones de restablecimiento de contraseña.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Registrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ingeniero@neovolt.cl"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Volver al Login
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-fuchsia-950/50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Correo'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-500 text-center flex items-center justify-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Tus proyectos y levantamientos se almacenan de forma segura y aislada en Firestore.</span>
        </div>
      </div>
    </div>
  );
};
