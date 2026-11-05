import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, CheckCircle2, ShieldCheck, Sparkles, Type } from 'lucide-react';

export const ESignaturePad = ({
  value = null,
  onChange,
  signerName = 'Rajesh Sharma',
  designation = 'Senior Sales & Proposal Engineer',
  employeeId = 'EMP-SKP-2026-88'
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' | 'type'
  const [typedName, setTypedName] = useState(signerName || 'Rajesh Sharma');
  const [hasDrawn, setHasDrawn] = useState(false);

  // Setup canvas resolution and smoothing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0C2340'; // High-end fountain ink navy
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If initial value has drawing dataUrl, render it
    if (value?.signatureData && value.signatureType === 'drawn') {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = value.signatureData;
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onChange) {
      onChange({
        signatureData: dataUrl,
        signatureType: 'drawn',
        signedByName: signerName,
        designation,
        employeeId,
        signedAt: new Date().toISOString()
      });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onChange) {
      onChange(null);
    }
  };

  // 1-Click Adopt Sample / Cursive Digital Signature
  const adoptDigitalSignature = (nameToAdopt = typedName) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'italic 34px "Brush Script MT", "Segoe Script", cursive';
      ctx.fillStyle = '#1E5BB8';
      ctx.fillText(nameToAdopt, 40, 75);
      const dataUrl = canvas.toDataURL('image/png');

      if (onChange) {
        onChange({
          signatureData: dataUrl,
          signatureType: 'adopted',
          signedByName: nameToAdopt,
          designation,
          employeeId,
          signedAt: new Date().toISOString()
        });
      }
      setHasDrawn(true);
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 shadow-2xs">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <PenTool className="w-4 h-4 text-[#1E5BB8]" />
          <span className="text-xs font-black text-[#1E3A5F] uppercase tracking-wider">
            Requisition E-Signature &amp; Authorized Clearer
          </span>
          {hasDrawn && (
            <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
              Signed &amp; Validated
            </span>
          )}
        </div>

        {/* Tab Controls & Adopt Preset */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('draw');
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-[#1E5BB8] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-3 h-3 inline mr-1" /> Draw
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('type');
              adoptDigitalSignature(typedName);
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'type'
                ? 'bg-[#1E5BB8] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Type className="w-3 h-3 inline mr-1" /> Type &amp; Adopt
          </button>

          <button
            type="button"
            onClick={() => adoptDigitalSignature(signerName)}
            className="px-2.5 py-1 text-xs font-extrabold text-[#EE6F2D] bg-[#FFF5EE] hover:bg-[#EE6F2D] hover:text-white border border-[#FCDCC9] rounded-lg transition-all cursor-pointer flex items-center shadow-2xs"
            title="1-Click Fill Official Engineer Signature"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            1-Click Sign
          </button>

          {hasDrawn && (
            <button
              type="button"
              onClick={clearCanvas}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
              title="Clear Signature"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Signature Canvas Area */}
      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={520}
          height={120}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-28 touch-none cursor-crosshair bg-white"
        />

        {/* Faint Guide Line */}
        <div className="absolute left-8 right-8 bottom-6 border-b border-slate-200 pointer-events-none flex justify-between text-[9px] text-slate-300 font-mono select-none">
          <span>Sign along guideline</span>
          <span>SKY POWER E-SIGN G-62271</span>
        </div>

        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-xs text-slate-400 font-semibold tracking-wide">
              Draw signature here or click "1-Click Sign"
            </span>
          </div>
        )}
      </div>

      {/* Signatory Metadata Line */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-900">{signerName}</span>
          <span className="text-slate-400">•</span>
          <span className="font-medium text-slate-600">{designation}</span>
          <span className="text-slate-400">•</span>
          <span className="font-mono text-[11px] text-[#1E5BB8] font-bold">{employeeId}</span>
        </div>

        <div className="font-mono text-[11px] text-slate-500">
          Digital Timestamp: <strong>{new Date().toLocaleDateString('en-IN')} IST</strong>
        </div>
      </div>
    </div>
  );
};

