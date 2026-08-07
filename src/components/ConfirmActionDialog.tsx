import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

export interface ConfirmActionDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  icon?: React.ReactNode;
}

export const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Sí, Eliminar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onClose,
  icon,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative overflow-hidden">
        {/* Top Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isDanger ? 'bg-rose-500' : 'bg-amber-500'
          }`}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                isDanger
                  ? 'bg-rose-950/80 border-rose-800 text-rose-400'
                  : 'bg-amber-950/80 border-amber-800 text-amber-400'
              }`}
            >
              {icon || (isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />)}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400 font-mono">Confirmación de Acción Requerida</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Description */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          {description}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 font-extrabold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            {isDanger && <Trash2 className="w-4 h-4" />}
            <span>{confirmText}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-3 rounded-xl transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
