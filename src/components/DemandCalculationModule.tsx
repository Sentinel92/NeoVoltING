import React, { useState } from 'react';
import { RoomData, HighAppliance } from '../types';
import {
  Calculator,
  Zap,
  ShieldCheck,
  TrendingDown,
  Building,
  Home,
  Briefcase,
  HelpCircle,
  FileCheck2,
  Copy,
  Check,
  Award,
  ChevronRight,
  Gauge,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DemandCalculationModuleProps {
  rooms: RoomData[];
  highAppliances: HighAppliance[];
}

export const DemandCalculationModule: React.FC<DemandCalculationModuleProps> = ({
  rooms,
  highAppliances,
}) => {
  // Configuration options for RIC N°01 calculation
  const [installationType, setInstallationType] = useState<'habitacional' | 'comercial' | 'industrial'>('habitacional');
  const [powerFactor, setPowerFactor] = useState<number>(0.93); // Default RIC N°03 standard
  const [supplyType, setSupplyType] = useState<'monofasico' | 'trifasico'>('monofasico');
  const [heavyApplianceFDProfile, setHeavyApplianceFDProfile] = useState<'sec_standard' | 'full_100' | 'custom'>('sec_standard');
  const [customHeavyFD, setCustomHeavyFD] = useState<number>(0.75);
  const [copiedJustification, setCopiedJustification] = useState(false);

  // 1. Calculate Base Installed Powers (Potencias Instaladas)
  const roomLightPowerW = rooms.reduce((sum, r) => {
    const devLightPower = r.devices
      .filter((d) => d.name.toLowerCase().includes('ampolleta') || d.name.toLowerCase().includes('foco') || d.name.toLowerCase().includes('led') || d.name.toLowerCase().includes('lámpara'))
      .reduce((dSum, d) => dSum + d.powerWatts * d.quantity, 0);
    const centerLightPower = r.lightPoints * 100; // Base 100W per lighting center
    return sum + devLightPower + centerLightPower;
  }, 0);

  const roomSocketPowerW = rooms.reduce((sum, r) => {
    const devSocketPower = r.devices
      .filter((d) => !(d.name.toLowerCase().includes('ampolleta') || d.name.toLowerCase().includes('foco') || d.name.toLowerCase().includes('led') || d.name.toLowerCase().includes('lámpara')))
      .reduce((dSum, d) => dSum + d.powerWatts * d.quantity, 0);
    const centerSocketPower = r.socketPoints * 150; // Base 150W per general socket
    return sum + devSocketPower + centerSocketPower;
  }, 0);

  const totalLightAndSocketInstalledW = roomLightPowerW + roomSocketPowerW;

  const heavyAppliancesList = [...highAppliances].sort((a, b) => b.powerWatts - a.powerWatts);
  const totalHeavyInstalledW = heavyAppliancesList.reduce((sum, h) => sum + h.powerWatts, 0);

  const totalInstalledPowerW = totalLightAndSocketInstalledW + totalHeavyInstalledW;
  const totalInstalledPowerKW = totalInstalledPowerW / 1000;

  // 2. Apply SEC RIC N°01 Demand Factors (Factores de Demanda)
  let demandLightAndSocketW = 0;
  let calculationDetailsLightSocket: { tier: string; wattsInstalled: number; fd: number; wattsDemand: number }[] = [];

  if (installationType === 'habitacional') {
    // SEC RIC N°01 - Viviendas / Residencial:
    // First 3.000 W @ 100% (FD = 1.0)
    // Excess over 3.000 W up to 110.000 W @ 35% (FD = 0.35)
    // Excess over 110.000 W @ 25% (FD = 0.25)
    if (totalLightAndSocketInstalledW <= 3000) {
      demandLightAndSocketW = totalLightAndSocketInstalledW * 1.0;
      calculationDetailsLightSocket.push({
        tier: 'Primeros 3.000 W (Alumbrado + Enchufes)',
        wattsInstalled: totalLightAndSocketInstalledW,
        fd: 1.0,
        wattsDemand: demandLightAndSocketW,
      });
    } else if (totalLightAndSocketInstalledW <= 110000) {
      const tier1Installed = 3000;
      const tier1Demand = 3000 * 1.0;

      const tier2Installed = totalLightAndSocketInstalledW - 3000;
      const tier2Demand = tier2Installed * 0.35;

      demandLightAndSocketW = tier1Demand + tier2Demand;

      calculationDetailsLightSocket.push({
        tier: 'Primeros 3.000 W',
        wattsInstalled: tier1Installed,
        fd: 1.0,
        wattsDemand: tier1Demand,
      });
      calculationDetailsLightSocket.push({
        tier: 'Exceso sobre 3.000 W (hasta 110 kW)',
        wattsInstalled: tier2Installed,
        fd: 0.35,
        wattsDemand: tier2Demand,
      });
    } else {
      const tier1Demand = 3000 * 1.0;
      const tier2Demand = 107000 * 0.35;
      const tier3Installed = totalLightAndSocketInstalledW - 110000;
      const tier3Demand = tier3Installed * 0.25;

      demandLightAndSocketW = tier1Demand + tier2Demand + tier3Demand;

      calculationDetailsLightSocket.push({ tier: 'Primeros 3.000 W', wattsInstalled: 3000, fd: 1.0, wattsDemand: tier1Demand });
      calculationDetailsLightSocket.push({ tier: 'Tramo 3.001 W a 110.000 W', wattsInstalled: 107000, fd: 0.35, wattsDemand: tier2Demand });
      calculationDetailsLightSocket.push({ tier: 'Exceso sobre 110.000 W', wattsInstalled: tier3Installed, fd: 0.25, wattsDemand: tier3Demand });
    }
  } else if (installationType === 'comercial') {
    // Commercial RIC N°01:
    // Alumbrado: First 10 kW @ 100%, Excess @ 90%
    // Enchufes: First 10 kVA @ 100%, Excess @ 50%
    const lightDemand = roomLightPowerW <= 10000 ? roomLightPowerW * 1.0 : 10000 * 1.0 + (roomLightPowerW - 10000) * 0.9;
    const socketDemand = roomSocketPowerW <= 10000 ? roomSocketPowerW * 1.0 : 10000 * 1.0 + (roomSocketPowerW - 10000) * 0.5;

    demandLightAndSocketW = lightDemand + socketDemand;

    calculationDetailsLightSocket.push({ tier: 'Alumbrado Comercial', wattsInstalled: roomLightPowerW, fd: roomLightPowerW > 10000 ? 0.92 : 1.0, wattsDemand: lightDemand });
    calculationDetailsLightSocket.push({ tier: 'Enchufes Comerciales', wattsInstalled: roomSocketPowerW, fd: roomSocketPowerW > 10000 ? 0.65 : 1.0, wattsDemand: socketDemand });
  } else {
    // Industrial / Taller: 100% demand for general services base
    demandLightAndSocketW = totalLightAndSocketInstalledW * 0.9;
    calculationDetailsLightSocket.push({ tier: 'Alumbrado y Enchufes Industriales', wattsInstalled: totalLightAndSocketInstalledW, fd: 0.9, wattsDemand: demandLightAndSocketW });
  }

  // 3. Heavy Appliances Demand Calculation (Equipos Especiales / Fuerza)
  let demandHeavyW = 0;
  let heavyDetails: { name: string; wattsInstalled: number; fd: number; wattsDemand: number }[] = [];

  heavyAppliancesList.forEach((app, idx) => {
    let fd = 1.0;
    if (heavyApplianceFDProfile === 'full_100') {
      fd = 1.0;
    } else if (heavyApplianceFDProfile === 'custom') {
      fd = customHeavyFD;
    } else {
      // SEC Standard (RIC N°01 Tabla N°1.1 Fuerza):
      // Highest power unit = 100% (1.0)
      // Second highest unit = 75% (0.75)
      // Third unit onwards = 50% (0.50)
      if (idx === 0) fd = 1.0;
      else if (idx === 1) fd = 0.75;
      else fd = 0.5;
    }

    const appDemand = app.powerWatts * fd;
    demandHeavyW += appDemand;
    heavyDetails.push({
      name: app.name,
      wattsInstalled: app.powerWatts,
      fd,
      wattsDemand: appDemand,
    });
  });

  // 4. Totals and Apparent Power
  const totalMaxDemandW = demandLightAndSocketW + demandHeavyW;
  const totalMaxDemandKW = totalMaxDemandW / 1000;
  const totalMaxDemandKVA = totalMaxDemandKW / powerFactor;

  // Global Demand Factor (%)
  const globalFD = totalInstalledPowerW > 0 ? (totalMaxDemandW / totalInstalledPowerW) * 100 : 100;

  // 5. Maximum Demand Current (Corriente de Demanda)
  const voltage = supplyType === 'monofasico' ? 220 : 380;
  const demandCurrentAmps =
    supplyType === 'monofasico'
      ? totalMaxDemandW / (220 * powerFactor)
      : totalMaxDemandW / (Math.sqrt(3) * 380 * powerFactor);

  // 6. Recommended Service Breaker / Service Connection (Empalme SEC)
  const getRecommendedBreaker = (amps: number, is3Phase: boolean) => {
    if (!is3Phase) {
      if (amps <= 20) return { label: 'BT1 Monofásico 25A (5,5 kVA)', amps: 25, color: 'text-emerald-400' };
      if (amps <= 28) return { label: 'BT1 Monofásico 32A (7,0 kVA)', amps: 32, color: 'text-emerald-400' };
      if (amps <= 36) return { label: 'BT1 Monofásico 40A (8,8 kVA)', amps: 40, color: 'text-emerald-400' };
      if (amps <= 45) return { label: 'BT1 Monofásico 50A (11,0 kVA)', amps: 50, color: 'text-amber-400' };
      if (amps <= 56) return { label: 'BT1 Monofásico 63A (13,8 kVA)', amps: 63, color: 'text-amber-400' };
      return { label: 'Recomendado Aumento a Empalme Trifásico BT1/BT2', amps: 80, color: 'text-rose-400' };
    } else {
      if (amps <= 14) return { label: 'BT1 Trifásico 3x16A (10,5 kVA)', amps: 16, color: 'text-emerald-400' };
      if (amps <= 18) return { label: 'BT1 Trifásico 3x20A (13,1 kVA)', amps: 20, color: 'text-emerald-400' };
      if (amps <= 22) return { label: 'BT1 Trifásico 3x25A (16,4 kVA)', amps: 25, color: 'text-emerald-400' };
      if (amps <= 28) return { label: 'BT1 Trifásico 3x32A (21,0 kVA)', amps: 32, color: 'text-emerald-400' };
      if (amps <= 36) return { label: 'BT1 Trifásico 3x40A (26,3 kVA)', amps: 40, color: 'text-emerald-400' };
      if (amps <= 45) return { label: 'BT1 Trifásico 3x50A (32,9 kVA)', amps: 50, color: 'text-amber-400' };
      return { label: 'BT1 Trifásico 3x63A (41,4 kVA)', amps: 63, color: 'text-amber-400' };
    }
  };

  const serviceBreakerRec = getRecommendedBreaker(demandCurrentAmps, supplyType === 'trifasico');

  // Justification Text for TE1 Memory Explicativa
  const generateJustificationText = () => {
    return `MEMORIA EXPLICATIVA TE1 - CÁLCULO DE DEMANDA MÁXIMA INSTALADA
Norma de Referencia: Pliego Técnico SEC RIC N°01 y RIC N°03.
----------------------------------------------------------------------
1. RESUMEN DE POTENCIA INSTALADA TOTAL:
   - Alumbrado y Enchufes Generales: ${totalLightAndSocketInstalledW.toLocaleString('es-CL')} W (${(totalLightAndSocketInstalledW / 1000).toFixed(2)} kW)
   - Equipos Especiales y Fuerza: ${totalHeavyInstalledW.toLocaleString('es-CL')} W (${(totalHeavyInstalledW / 1000).toFixed(2)} kW)
   - Potencia Instalada Total (P_inst): ${totalInstalledPowerW.toLocaleString('es-CL')} W (${totalInstalledPowerKW.toFixed(2)} kW)

2. APLICACIÓN DE FACTORES DE DEMANDA (RIC N°01):
   - Tipo de Destino: ${installationType.toUpperCase()}
   - Alumbrado + Enchufes Demanda: ${Math.round(demandLightAndSocketW).toLocaleString('es-CL')} W (Factor de Demanda aplicado a los primeros 3.000W al 100% y el exceso al 35%)
   - Equipos Especiales Demanda: ${Math.round(demandHeavyW).toLocaleString('es-CL')} W (Factores de simultaneidad SEC RIC N°01: 1er eq. 100%, 2do eq. 75%, subsiguientes 50%)

3. DEMANDA MÁXIMA INSTALADA CALCULADA (P_dem):
   - Potencia Demanda Máxima Activa (kW): ${totalMaxDemandKW.toFixed(2)} kW
   - Factor de Potencia (cos φ): ${powerFactor}
   - Potencia Demanda Máxima Aparente (kVA): ${totalMaxDemandKVA.toFixed(2)} kVA
   - Factor de Demanda Global (FD_global): ${globalFD.toFixed(1)} %

4. CORRIENTE DE DEMANDA MÁXIMA E INTERRUPTOR DE EMPALME:
   - Sistema de Alimentación: ${supplyType === 'monofasico' ? 'Monofásico 220V' : 'Trifásico 380V'}
   - Corriente de Demanda Máxima (I_dem): ${demandCurrentAmps.toFixed(2)} Amperes
   - Empalme / Termomagnético Sugerido: ${serviceBreakerRec.label}`;
  };

  const handleCopyJustification = () => {
    navigator.clipboard.writeText(generateJustificationText());
    setCopiedJustification(true);
    setTimeout(() => setCopiedJustification(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Módulo de Cálculo Oficial SEC • Pliego Técnico RIC N°01</span>
          </div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            Demanda Máxima Instalada del Proyecto
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Calcula la demanda máxima real requerida para dimensionar la capacidad del empalme, alimentador principal e IGA, aplicando rigurosamente los factores de demanda y simultaneidad normados en Chile.
          </p>
        </div>

        <button
          onClick={handleCopyJustification}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
        >
          {copiedJustification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copiedJustification ? '¡Copiado para Memoria TE1!' : 'Copiar Justificación TE1'}</span>
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Installed Power */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Potencia Instalada Total (P_inst)</div>
          <div className="text-2xl font-black text-slate-100">{totalInstalledPowerKW.toFixed(2)} <span className="text-sm font-semibold text-slate-400">kW</span></div>
          <div className="text-[10px] text-slate-500 mt-1">Suma bruta de todas las cargas declaradas</div>
          <div className="absolute top-3 right-3 p-2 bg-slate-900 rounded-lg text-slate-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Max Demand Power */}
        <div className="bg-slate-950 border-2 border-fuchsia-500/80 p-4 rounded-xl relative overflow-hidden shadow-lg shadow-fuchsia-950/40">
          <div className="text-[11px] font-bold text-fuchsia-300 uppercase tracking-wider mb-1">Demanda Máxima (P_dem)</div>
          <div className="text-2xl font-black text-fuchsia-400">{totalMaxDemandKW.toFixed(2)} <span className="text-sm font-semibold text-fuchsia-300">kW</span></div>
          <div className="text-[11px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{(totalInstalledPowerKW - totalMaxDemandKW).toFixed(2)} kW optimizados con RIC N°01</span>
          </div>
          <div className="absolute top-3 right-3 p-2 bg-fuchsia-950 border border-fuchsia-500/40 rounded-lg text-fuchsia-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Global Demand Factor & Apparent Power */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Factor de Demanda Global</div>
          <div className="text-2xl font-black text-amber-400">{globalFD.toFixed(1)} <span className="text-sm font-semibold">%</span></div>
          <div className="text-[10px] text-slate-400 mt-1">
            Demanda Aparente: <strong className="text-white">{totalMaxDemandKVA.toFixed(2)} kVA</strong> (cos φ = {powerFactor})
          </div>
          <div className="absolute top-3 right-3 p-2 bg-slate-900 rounded-lg text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Demand Current & Service Rec */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Corriente de Demanda (I_dem)</div>
          <div className="text-2xl font-black text-emerald-400">{demandCurrentAmps.toFixed(1)} <span className="text-sm font-semibold text-emerald-300">A</span></div>
          <div className={`text-[10px] font-bold mt-1 ${serviceBreakerRec.color}`}>
            {serviceBreakerRec.label}
          </div>
          <div className="absolute top-3 right-3 p-2 bg-slate-900 rounded-lg text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Interactive Controls & Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        {/* Control 1: Destination Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Destino de la Instalación:</span>
          </label>
          <select
            value={installationType}
            onChange={(e) => setInstallationType(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white p-2 focus:outline-none focus:border-fuchsia-500"
          >
            <option value="habitacional">Habitacional / Vivienda (RIC N°01 Tabla N°1.1)</option>
            <option value="comercial">Comercial / Oficinas / Servicios</option>
            <option value="industrial">Industrial / Taller / Maquinarias</option>
          </select>
          <p className="text-[10px] text-slate-500">
            {installationType === 'habitacional'
              ? 'Aplica 100% a primeros 3 kW y 35% al exceso.'
              : installationType === 'comercial'
              ? 'Aplica 100% a primeros 10 kW y escalonado en exceso.'
              : 'Aplica factores de simultaneidad industrial.'}
          </p>
        </div>

        {/* Control 2: Power Factor (cos phi) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Factor de Potencia (cos φ):</span>
            </span>
            <span className="text-fuchsia-400 font-mono font-bold">{powerFactor}</span>
          </label>
          <input
            type="range"
            min="0.85"
            max="1.0"
            step="0.01"
            value={powerFactor}
            onChange={(e) => setPowerFactor(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0.85 (Mínimo)</span>
            <span className="text-emerald-400 font-bold">0.93 (Estándar RIC N°03)</span>
            <span>1.0 (Unitario)</span>
          </div>
        </div>

        {/* Control 3: Supply Voltage */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Sistema de Suministro:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSupplyType('monofasico')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                supplyType === 'monofasico'
                  ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Monofásico 220V
            </button>
            <button
              onClick={() => setSupplyType('trifasico')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                supplyType === 'trifasico'
                  ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Trifásico 380V
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Tensión nominada para el cálculo de amperaje en el empalme.
          </p>
        </div>
      </div>

      {/* Detailed Calculation Breakdown according to RIC N°01 */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-400" />
          <span>Desglose Detallado de Factores por Grupo de Carga</span>
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Table 1: Alumbrado y Enchufes Generales */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
                <span>Alumbrado y Enchufes Generales</span>
              </div>
              <div className="text-xs font-extrabold text-fuchsia-400">
                {totalLightAndSocketInstalledW.toLocaleString('es-CL')} W Instalados
              </div>
            </div>

            <div className="space-y-2">
              {calculationDetailsLightSocket.map((item, idx) => (
                <div key={idx} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>{item.tier}</span>
                    <span className="text-emerald-400 font-bold">{Math.round(item.wattsDemand).toLocaleString('es-CL')} W Demanda</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Base Instalada: {item.wattsInstalled.toLocaleString('es-CL')} W</span>
                    <span>Factor Demanda (FD): <strong className="text-amber-300 font-mono">{(item.fd * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-bold text-white">
              <span>Subtotal Demanda Alumbrado/Enchufes:</span>
              <span className="text-fuchsia-400 text-sm">{Math.round(demandLightAndSocketW).toLocaleString('es-CL')} W</span>
            </div>
          </div>

          {/* Table 2: Equipos Especiales / Fuerza */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Equipos Especiales y Fuerza ({highAppliances.length} Artefactos)</span>
              </div>
              <div className="text-xs font-extrabold text-amber-400">
                {totalHeavyInstalledW.toLocaleString('es-CL')} W Instalados
              </div>
            </div>

            {heavyDetails.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 italic">
                No hay equipos de fuerza o alta potencia registrados en el censo.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {heavyDetails.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>#{idx + 1}. {item.name}</span>
                      <span className="text-emerald-400 font-bold">{Math.round(item.wattsDemand).toLocaleString('es-CL')} W</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Potencia Nominal: {item.wattsInstalled.toLocaleString('es-CL')} W</span>
                      <span>Factor Simultaneidad SEC: <strong className="text-amber-300 font-mono">{(item.fd * 100).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-bold text-white">
              <span>Subtotal Demanda Fuerza:</span>
              <span className="text-amber-400 text-sm">{Math.round(demandHeavyW).toLocaleString('es-CL')} W</span>
            </div>
          </div>
        </div>
      </div>

      {/* Normative Regulatory Notice */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white">Conformidad con Normativa SEC (RIC N°01 & RIC N°03)</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            El cálculo automatizado anterior cumple con la Tabla N°1.1 del Pliego Técnico RIC N°01 para el cálculo de capacidad y alimentadores en instalaciones de baja tensión. Los datos generados pueden incluirse directamente en la <strong>Memoria Explicativa del Formulario TE1</strong> ante la Superintendencia de Electricidad y Combustibles.
          </p>
        </div>
      </div>
    </div>
  );
};
