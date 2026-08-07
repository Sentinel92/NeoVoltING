import React, { useState } from 'react';
import { UserSession } from '../types';
import { Lock, Mail, UserCheck, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('ineovolt@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    
    // Check credentials as requested: ineovolt@gmail.com / noah0412
    if (cleanEmail === 'ineovolt@gmail.com' && password === 'noah0412') {
      onLoginSuccess({
        email: 'ineovolt@gmail.com',
        name: 'Ing. Camilo Rojas',
        secNumber: 'SEC-84291-CL',
        isLoggedIn: true,
        role: 'engineer',
        professionalTitle: 'Ingeniero en Electricidad y Automatización Industrial',
      });
      onClose();
    } else if (cleanEmail === 'ineovolt@gmail.com' && password !== 'noah0412') {
      setError('Contraseña incorrecta. Utilice la clave autorizada "noah0412".');
    } else {
      // Demo login for flexibility if user types another email
      if (password.length >= 4) {
        onLoginSuccess({
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          secNumber: 'SEC-84291-CL',
          isLoggedIn: true,
          role: 'engineer',
          professionalTitle: 'Ingeniero en Electricidad y Automatización Industrial',
        });
        onClose();
      } else {
        setError('Acceso denegado. Para la cuenta neovolt use la clave noah0412 o ingrese una clave válida.');
      }
    }
  };

  const handleAutofillCredentials = () => {
    setEmail('ineovolt@gmail.com');
    setPassword('noah0412');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient background blur */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Inicio de Sesión NEOVOLT</h3>
            <p className="text-xs text-slate-400">Ingeniería Eléctrica de Precisión & Normativa SEC Chile</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="ineovolt@gmail.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Clave de Acceso
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick Credential Autofill Button */}
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 flex items-center justify-between">
            <div className="text-[11px] text-slate-300 font-medium">
              ¿Usar cuenta predeterminada <span className="text-fuchsia-400 font-bold">ineovolt@gmail.com</span>?
            </div>
            <button
              type="button"
              onClick={handleAutofillCredentials}
              className="text-xs bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/30 px-2.5 py-1 rounded font-semibold transition-colors"
            >
              Autocompletar
            </button>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-fuchsia-600/20 transition-all"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
