import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSaveSignature: (dataUrl: string) => void;
  savedSignatureUrl?: string;
  label?: string;
  placeholderText?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSaveSignature,
  savedSignatureUrl,
  label = 'Firma Digital del Cliente',
  placeholderText = 'Dibuje su firma aquí con el mouse o dedo',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | null>(savedSignatureUrl || null);

  useEffect(() => {
    if (savedSignatureUrl) {
      setCurrentSignature(savedSignatureUrl);
    }
  }, [savedSignatureUrl]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#38bdf8'; // Sky blue stroke in canvas
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCurrentCanvas();
  };

  const saveCurrentCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setCurrentSignature(dataUrl);
    onSaveSignature(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
    setCurrentSignature(null);
    onSaveSignature('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 print:bg-white print:border-slate-300">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 print:text-black flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-fuchsia-400 print:hidden" />
          <span>{label}</span>
        </label>
        <button
          onClick={clearCanvas}
          type="button"
          className="print:hidden flex items-center gap-1 text-slate-400 hover:text-rose-400 text-xs px-2.5 py-1 rounded hover:bg-slate-800 transition-colors font-semibold"
          title="Limpiar firma"
        >
          <Eraser className="w-3.5 h-3.5 text-rose-400" />
          <span>Limpiar</span>
        </button>
      </div>

      {currentSignature && !isDrawing && !hasDrawn ? (
        <div className="bg-slate-950 print:bg-white border border-slate-800 print:border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center space-y-2">
          <img
            src={currentSignature}
            alt="Firma"
            className="max-h-24 object-contain filter invert-0"
          />
          <button
            type="button"
            onClick={clearCanvas}
            className="print:hidden flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 px-3 py-1.5 rounded-xl transition-all font-semibold"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
            <span>Limpiar / Trazar Nueva Firma</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative bg-slate-950 print:bg-white border-2 border-dashed border-slate-700 print:border-slate-300 rounded-xl overflow-hidden touch-none">
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 print:hidden text-xs text-center px-4">
                {placeholderText}
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={480}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 cursor-crosshair bg-slate-950 print:bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
