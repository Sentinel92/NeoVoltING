import React, { useState, useMemo, useEffect } from 'react';
import { ElectricalProject, ClientRecord, BudgetHistoryRecord, RoomData, HighAppliance } from '../types';
import { QuickStartGuideModal } from './QuickStartGuideModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { motion } from 'motion/react';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  FolderCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Users,
  HelpCircle,
  Sparkles,
  RotateCcw,
  History,
  Edit2,
  CalendarDays,
  Check,
} from 'lucide-react';

interface DashboardModuleProps {
  projects: ElectricalProject[];
  clients?: ClientRecord[];
  budgetHistory?: BudgetHistoryRecord[];
  onRevertBudgetHistory?: (record: BudgetHistoryRecord) => void;
  onNavigateToTab?: (tab: string) => void;
  onSelectProjectForQuote?: (project: ElectricalProject) => void;
  rooms?: RoomData[];
  highAppliances?: HighAppliance[];
  contractedCapacityKW?: number;
  onUpdateProject?: (project: ElectricalProject) => void;
}

// Status definitions & theme colors
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgClass: string; borderClass: string; textClass: string }
> = {
  COTIZACION: {
    label: 'Cotización',
    color: '#f59e0b', // amber-500
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-400',
  },
  APROBADO: {
    label: 'Aprobado',
    color: '#3b82f6', // blue-500
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-400',
  },
  EN_EJECUCION: {
    label: 'En Ejecución',
    color: '#d946ef', // fuchsia-500
    bgClass: 'bg-fuchsia-500/10',
    borderClass: 'border-fuchsia-500/30',
    textClass: 'text-fuchsia-400',
  },
  COMPLETADO: {
    label: 'Finalizado',
    color: '#10b981', // emerald-500
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-400',
  },
  CANCELADO: {
    label: 'Cancelado',
    color: '#f43f5e', // rose-500
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-400',
  },
};

const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

// Helper to format currency in Chilean Pesos CLP
const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Robust helper to parse dates in DD/MM/YYYY, YYYY-MM-DD, or ISO strings
const parseProjectDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  // Check DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  projects,
  clients = [],
  budgetHistory,
  onRevertBudgetHistory,
  onNavigateToTab,
  onSelectProjectForQuote,
  rooms = [],
  highAppliances = [],
  contractedCapacityKW = 5.5,
  onUpdateProject,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('ALL');
  const [timeFrameFilter, setTimeFrameFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR'>('ALL');
  const [selectedProjectTypeFilter, setSelectedProjectTypeFilter] = useState<string>('ALL');
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editDeadline, setEditDeadline] = useState<string>('');

  // Auto-open quick start guide on first visit
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('neovolt_quickstart_seen');
    if (hasSeenGuide !== 'true') {
      setShowQuickGuide(true);
    }
  }, []);

  // Extract available years from projects
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    projects.forEach((p) => {
      const d = parseProjectDate(p.createdAt);
      if (d) yearsSet.add(d.getFullYear().toString());
    });
    const yearsArr = Array.from(yearsSet).sort().reverse();
    if (!yearsArr.includes('2026')) yearsArr.unshift('2026');
    return yearsArr;
  }, [projects]);

  // Extract available project types from projects
  const availableProjectTypes = useMemo(() => {
    const typesSet = new Set<string>();
    projects.forEach((p) => {
      if (p.projectType) typesSet.add(p.projectType);
    });
    return Array.from(typesSet).sort();
  }, [projects]);

  // Filtered projects list based on dropdowns
  const filteredProjects = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return projects.filter((p) => {
      if (selectedStatusFilter !== 'ALL' && p.status !== selectedStatusFilter) {
        return false;
      }
      if (selectedProjectTypeFilter !== 'ALL' && p.projectType !== selectedProjectTypeFilter) {
        return false;
      }
      if (selectedYearFilter !== 'ALL') {
        const d = parseProjectDate(p.createdAt);
        if (d && d.getFullYear().toString() !== selectedYearFilter) {
          return false;
        }
      }

      const pDate = parseProjectDate(p.createdAt);
      if (pDate) {
        if (timeFrameFilter === 'THIS_MONTH') {
          if (pDate.getMonth() !== currentMonth || pDate.getFullYear() !== currentYear) return false;
        } else if (timeFrameFilter === 'LAST_3_MONTHS') {
          const diffMs = now.getTime() - pDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays > 90) return false;
        } else if (timeFrameFilter === 'THIS_YEAR') {
          if (pDate.getFullYear() !== currentYear) return false;
        }
      }

      return true;
    });
  }, [projects, selectedStatusFilter, selectedYearFilter, timeFrameFilter]);

  // Completed Projects Net Profitability & Average Margin Metric
  const completedProjectsStats = useMemo(() => {
    const completedList = filteredProjects.filter((p) => p.status === 'COMPLETADO');
    let totalIncome = 0;
    let totalMaterials = 0;
    let totalNetProfit = 0;
    let marginSum = 0;

    completedList.forEach((p) => {
      const price = p.totalPrice || 0;
      const mat = p.materialsPrice || 0;
      const net = price - mat;
      totalIncome += price;
      totalMaterials += mat;
      totalNetProfit += net;

      if (price > 0) {
        marginSum += (net / price) * 100;
      }
    });

    const completedCount = completedList.length;
    const avgUtilityMarginPercent =
      completedCount > 0 ? Math.round(marginSum / completedCount) : 0;

    return {
      completedCount,
      totalIncome,
      totalMaterials,
      totalNetProfit,
      avgUtilityMarginPercent,
    };
  }, [filteredProjects]);

  // Overall KPI statistics
  const stats = useMemo(() => {
    let totalBudget = 0;
    let completedBudget = 0;
    let inProgressBudget = 0;
    let quoteBudget = 0;

    let totalCount = filteredProjects.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let quoteCount = 0;
    let approvedCount = 0;

    filteredProjects.forEach((p) => {
      const price = p.totalPrice || 0;
      totalBudget += price;

      if (p.status === 'COMPLETADO') {
        completedCount++;
        completedBudget += price;
      } else if (p.status === 'EN_EJECUCION') {
        inProgressCount++;
        inProgressBudget += price;
      } else if (p.status === 'COTIZACION') {
        quoteCount++;
        quoteBudget += price;
      } else if (p.status === 'APROBADO') {
        approvedCount++;
      }
    });

    const averageProjectValue = totalCount > 0 ? Math.round(totalBudget / totalCount) : 0;
    const conversionRate =
      totalCount > 0
        ? Math.round(((completedCount + inProgressCount + approvedCount) / totalCount) * 100)
        : 0;

    return {
      totalBudget,
      completedBudget,
      inProgressBudget,
      quoteBudget,
      totalCount,
      completedCount,
      inProgressCount,
      quoteCount,
      approvedCount,
      averageProjectValue,
      conversionRate,
    };
  }, [filteredProjects]);

  // 1. Chart Data: Projects count by Status
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {
      COTIZACION: 0,
      APROBADO: 0,
      EN_EJECUCION: 0,
      COMPLETADO: 0,
      CANCELADO: 0,
    };

    filteredProjects.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      } else {
        counts.COTIZACION++;
      }
    });

    return Object.keys(counts).map((key) => ({
      statusKey: key,
      name: STATUS_CONFIG[key]?.label || key,
      cantidad: counts[key],
      color: STATUS_CONFIG[key]?.color || '#94a3b8',
    }));
  }, [filteredProjects]);

  // 2. Chart Data: Monthly Budget Managed
  const monthlyBudgetData = useMemo(() => {
    // Array of 12 months for selected year (or default current year)
    const monthlyMap = MONTH_NAMES.map((monthLabel, monthIndex) => ({
      monthIndex,
      month: monthLabel,
      totalPresupuesto: 0,
      cotizado: 0,
      ejecucionYCompletado: 0,
      cantidadProyectos: 0,
    }));

    filteredProjects.forEach((p) => {
      const date = parseProjectDate(p.createdAt);
      if (date) {
        const monthIdx = date.getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          const val = p.totalPrice || 0;
          monthlyMap[monthIdx].totalPresupuesto += val;
          monthlyMap[monthIdx].cantidadProyectos += 1;

          if (p.status === 'COTIZACION') {
            monthlyMap[monthIdx].cotizado += val;
          } else if (p.status === 'EN_EJECUCION' || p.status === 'COMPLETADO' || p.status === 'APROBADO') {
            monthlyMap[monthIdx].ejecucionYCompletado += val;
          }
        }
      }
    });

    return monthlyMap;
  }, [filteredProjects]);

  // 3. Chart Data: Budget distribution by Project Type
  const projectTypeData = useMemo(() => {
    const typeMap: Record<string, { count: number; totalBudget: number }> = {};

    filteredProjects.forEach((p) => {
      const typeStr = p.projectType || 'Instalación nueva';
      if (!typeMap[typeStr]) {
        typeMap[typeStr] = { count: 0, totalBudget: 0 };
      }
      typeMap[typeStr].count += 1;
      typeMap[typeStr].totalBudget += p.totalPrice || 0;
    });

    return Object.entries(typeMap).map(([type, val]) => ({
      tipo: type.replace(/_/g, ' '),
      monto: val.totalBudget,
      cantidad: val.count,
    }));
  }, [filteredProjects]);

  // 4. Chart Data: Monthly Presupuesto Total Estimado vs. Mano de Obra (Rentabilidad)
  const monthlyProfitabilityData = useMemo(() => {
    const monthlyMap = MONTH_NAMES.map((monthLabel, monthIndex) => ({
      monthIndex,
      month: monthLabel,
      totalPresupuesto: 0,
      manoDeObra: 0,
      materiales: 0,
      rentabilidadPct: 0,
      cantidadProyectos: 0,
    }));

    filteredProjects.forEach((p) => {
      const date = parseProjectDate(p.createdAt);
      if (date) {
        const monthIdx = date.getMonth();
        if (monthIdx >= 0 && monthIdx < 12) {
          const totalVal = p.totalPrice || 0;
          const laborVal = p.laborPrice || 0;
          const matVal = p.materialsPrice || Math.max(0, totalVal - laborVal);

          monthlyMap[monthIdx].totalPresupuesto += totalVal;
          monthlyMap[monthIdx].manoDeObra += laborVal;
          monthlyMap[monthIdx].materiales += matVal;
          monthlyMap[monthIdx].cantidadProyectos += 1;
        }
      }
    });

    return monthlyMap.map((m) => ({
      ...m,
      rentabilidadPct:
        m.totalPresupuesto > 0
          ? Math.round((m.manoDeObra / m.totalPresupuesto) * 100)
          : 0,
    }));
  }, [filteredProjects]);

  // Totals for Profitability KPIs
  const profitabilityTotals = useMemo(() => {
    const totalPresupuesto = monthlyProfitabilityData.reduce((acc, m) => acc + m.totalPresupuesto, 0);
    const totalLabor = monthlyProfitabilityData.reduce((acc, m) => acc + m.manoDeObra, 0);
    const totalMaterials = monthlyProfitabilityData.reduce((acc, m) => acc + m.materiales, 0);
    const avgMargin = totalPresupuesto > 0 ? Math.round((totalLabor / totalPresupuesto) * 100) : 0;
    return { totalPresupuesto, totalLabor, totalMaterials, avgMargin };
  }, [monthlyProfitabilityData]);

  // Chart Data: Load Census (Rooms & High Appliances) vs Contracted Capacity
  const loadCensusData = useMemo(() => {
    const activeRooms = rooms.length > 0 ? rooms : [
      { id: 'r1', name: 'Cocina & Logia', lightPoints: 2, socketPoints: 4, devices: [{ name: 'Hervidor', powerWatts: 1800, quantity: 1, hoursPerDay: 0.5 }, { name: 'Microondas', powerWatts: 1200, quantity: 1, hoursPerDay: 0.5 }] },
      { id: 'r2', name: 'Living / Comedor', lightPoints: 4, socketPoints: 6, devices: [{ name: 'TV LED 55"', powerWatts: 150, quantity: 1, hoursPerDay: 5 }, { name: 'Equipo Música', powerWatts: 200, quantity: 1, hoursPerDay: 2 }] },
      { id: 'r3', name: 'Dormitorio Principal', lightPoints: 2, socketPoints: 4, devices: [{ name: 'Aire Acondicionado Inverter', powerWatts: 1200, quantity: 1, hoursPerDay: 6 }] },
      { id: 'r4', name: 'Baño Principal', lightPoints: 2, socketPoints: 2, devices: [{ name: 'Secador Pelo', powerWatts: 1600, quantity: 1, hoursPerDay: 0.2 }] },
    ];

    const activeHigh = highAppliances.length > 0 ? highAppliances : [
      { id: 'ha1', name: 'Horno Eléctrico Empotrable', powerWatts: 2800, quantity: 1, hoursPerDay: 1 },
      { id: 'ha2', name: 'Termoeléctrico 100L', powerWatts: 2000, quantity: 1, hoursPerDay: 3 },
    ];

    const chartItems: Array<{
      category: string;
      consumoProyectadoKW: number;
      capacidadContratadaKW: number;
      consumoDiarioKWh: number;
    }> = [];

    let totalProjectedWatts = 0;

    activeRooms.forEach((r) => {
      const lightsPower = (r.lightPoints || 0) * 100;
      const socketsPower = (r.socketPoints || 0) * 150;
      const devPower = (r.devices || []).reduce((acc, d) => acc + (d.powerWatts || 0) * (d.quantity || 1), 0);
      const roomWatts = lightsPower + socketsPower + devPower;
      totalProjectedWatts += roomWatts;

      const roomKW = Math.round((roomWatts / 1000) * 100) / 100;
      const devKWhDay = (r.devices || []).reduce((acc, d) => acc + ((d.powerWatts || 0) * (d.quantity || 1) * (d.hoursPerDay || 1)) / 1000, 0);

      chartItems.push({
        category: r.name,
        consumoProyectadoKW: roomKW,
        capacidadContratadaKW: contractedCapacityKW,
        consumoDiarioKWh: Math.round(devKWhDay * 10) / 10,
      });
    });

    if (activeHigh.length > 0) {
      const highWatts = activeHigh.reduce((acc, h: any) => acc + (h.powerWatts || 0) * (h.quantity || 1), 0);
      totalProjectedWatts += highWatts;
      const highKW = Math.round((highWatts / 1000) * 100) / 100;
      const highKWhDay = activeHigh.reduce((acc, h: any) => acc + ((h.powerWatts || 0) * (h.quantity || 1) * (h.hoursPerDay || 2)) / 1000, 0);

      chartItems.push({
        category: 'Cargas Gran Potencia',
        consumoProyectadoKW: highKW,
        capacidadContratadaKW: contractedCapacityKW,
        consumoDiarioKWh: Math.round(highKWhDay * 10) / 10,
      });
    }

    const totalProjectedKW = Math.round((totalProjectedWatts / 1000) * 100) / 100;
    const capacityUsagePercent = Math.round((totalProjectedKW / contractedCapacityKW) * 100);

    return {
      chartItems,
      totalProjectedKW,
      contractedCapacityKW,
      capacityUsagePercent,
      isOverCapacity: totalProjectedKW > contractedCapacityKW,
    };
  }, [rooms, highAppliances, contractedCapacityKW]);

  // Custom Tooltip for Load Census Comparative Chart
  const CustomLoadCensusTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
          <p className="font-bold text-sky-400 text-sm border-b border-slate-800 pb-1">
            Zona / Carga: {label}
          </p>
          <div className="text-white space-y-1">
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Potencia Proyectada:</span>
              <strong className="text-sky-300 font-mono">{data.consumoProyectadoKW} kW</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Capacidad Contratada Empalme:</span>
              <strong className="text-amber-400 font-mono">{data.capacidadContratadaKW} kW</strong>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-800 pt-1 text-[11px]">
              <span className="text-slate-400">Consumo Estimado Diario:</span>
              <strong className="text-emerald-300 font-mono">{data.consumoDiarioKWh} kWh/día</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Monthly Profitability Chart
  const CustomProfitabilityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
          <p className="font-bold text-fuchsia-400 text-sm border-b border-slate-800 pb-1">
            Rentabilidad Mes: {label}
          </p>
          <div className="text-white space-y-1">
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Presupuesto Total Estimado:</span>
              <strong className="text-emerald-400">{formatCLP(data.totalPresupuesto)}</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Mano de Obra & Servicios:</span>
              <strong className="text-fuchsia-400">{formatCLP(data.manoDeObra)}</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Materiales e Insumos:</span>
              <strong className="text-amber-400">{formatCLP(data.materiales)}</strong>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-800 pt-1 text-[11px]">
              <span className="text-slate-400">% Margen Mano de Obra:</span>
              <strong className="text-emerald-300 font-mono">{data.rentabilidadPct}% del total</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Recharts Monthly Budget Chart
  const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
          <p className="font-bold text-fuchsia-400 text-sm border-b border-slate-800 pb-1">
            Mes: {label}
          </p>
          <div className="text-white space-y-1">
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Presupuesto Total:</span>
              <strong className="text-emerald-400">{formatCLP(data.totalPresupuesto)}</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Ejecución / Aprobado:</span>
              <strong className="text-blue-400">{formatCLP(data.ejecucionYCompletado)}</strong>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">En Cotización:</span>
              <strong className="text-amber-400">{formatCLP(data.cotizado)}</strong>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-800 pt-1 text-[11px]">
              <span className="text-slate-400">Proyectos registrados:</span>
              <strong className="text-slate-200">{data.cantidadProyectos} obra(s)</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Status Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
          <span className="font-bold text-slate-200" style={{ color: data.color }}>
            {data.name}
          </span>
          : <strong className="text-white ml-1">{data.cantidad} proyecto(s)</strong>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Guide Modal */}
      <QuickStartGuideModal
        isOpen={showQuickGuide}
        onClose={() => setShowQuickGuide(false)}
        onNavigateToTab={onNavigateToTab}
      />

      

      {/* Access to Physical Board Generator (Tablero 2D) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-fuchsia-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-fuchsia-500/20 transition-all"></div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl border border-fuchsia-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg">Generador de Tableros 2D Físicos</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Diseña el diagrama unilineal y físico de tus tableros de forma interactiva.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab && onNavigateToTab('physical')}
            className="w-full sm:w-auto bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Abrir Simulador 2D</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FolderCheck className="w-5 h-5" />
            </div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Proyectos Activos</h3>
          </div>
          <p className="text-3xl font-black text-white mb-1 relative z-10">
            {stats.inProgressCount}
          </p>
          <p className="text-xs text-emerald-400 font-medium relative z-10">
            {formatCLP(stats.inProgressBudget)} en ejecución
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-fuchsia-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2.5 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl border border-fuchsia-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Margen Total del Mes</h3>
          </div>
          <p className="text-3xl font-black text-white mb-1 relative z-10">
            {formatCLP(profitabilityTotals.totalLabor)}
          </p>
          <p className="text-xs text-fuchsia-400 font-medium relative z-10">
            {profitabilityTotals.avgMargin}% rentabilidad promedio
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Clientes Registrados</h3>
          </div>
          <p className="text-3xl font-black text-white mb-1 relative z-10">
            {clients?.length || 0}
          </p>
          <p className="text-xs text-blue-400 font-medium relative z-10">
            En base de datos CRM
          </p>
        </motion.div>
      </div>

      {/* Module Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold tracking-wider uppercase mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Métricas & Indicadores Financieros SEC</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Dashboard de Proyectos & Presupuestos
            </h2>
            <button
              onClick={() => setShowQuickGuide(true)}
              className="flex items-center gap-1.5 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
              title="Ver Guía de Inicio Rápido"
            >
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Guía de Inicio</span>
            </button>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Visualiza el rendimiento operativo, distribución de estados y el flujo de caja mensual de tus obras eléctricas.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 self-stretch md:self-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
            <Filter className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="font-semibold">Filtros:</span>
          </div>

          <select
            value={timeFrameFilter}
            onChange={(e) => setTimeFrameFilter(e.target.value as any)}
            className="bg-slate-900 text-fuchsia-300 border border-fuchsia-500/40 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
          >
            <option value="ALL">📅 Todos los períodos</option>
            <option value="THIS_MONTH">⚡ Este mes</option>
            <option value="LAST_3_MONTHS">⏳ Últimos 3 meses</option>
            <option value="THIS_YEAR">🏆 Este año (2026)</option>
          </select>

          <select
            value={selectedProjectTypeFilter}
            onChange={(e) => setSelectedProjectTypeFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
          >
            <option value="ALL">Todos los servicios</option>
            {availableProjectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={selectedYearFilter}
            onChange={(e) => setSelectedYearFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
          >
            <option value="ALL">Todos los años</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Año {yr}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
          >
            <option value="ALL">Todos los estados</option>
            <option value="COTIZACION">Cotización</option>
            <option value="APROBADO">Aprobado</option>
            <option value="EN_EJECUCION">En Ejecución</option>
            <option value="COMPLETADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Rentabilidad Neta (Ingresos - Materiales) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Rentabilidad Neta (Ingresos - Mat.)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCLP(completedProjectsStats.totalNetProfit)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ingresos: <strong className="text-emerald-400">{formatCLP(completedProjectsStats.totalIncome)}</strong></span>
            <span>Mat: <strong className="text-amber-400">{formatCLP(completedProjectsStats.totalMaterials)}</strong></span>
          </div>
        </div>

        {/* KPI 2: Margen de Utilidad Promedio (Proyectos Finalizados) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-fuchsia-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Margen Utilidad Promedio (Finalizados)</span>
            <div className="p-2 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-fuchsia-400 tracking-tight flex items-baseline gap-1">
            <span>{completedProjectsStats.avgUtilityMarginPercent}%</span>
            <span className="text-xs font-normal text-slate-400">margen neto</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">{completedProjectsStats.completedCount} obras</span>
            <span>finalizadas con éxito</span>
          </div>
        </div>

        {/* KPI 3: Presupuesto Promedio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Valor Promedio por Proyecto</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCLP(stats.averageProjectValue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-blue-400 font-bold">{stats.conversionRate}%</span>
            <span>tasa de efectividad</span>
          </div>
        </div>

        {/* KPI 4: Obras Activas en Terreno */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>En Cotización (En Espera)</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-2">
            <span className="text-amber-400">{stats.quoteCount}</span>
            <span className="text-xs font-normal text-slate-400">cotizaciones</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-amber-300 font-bold">{formatCLP(stats.quoteBudget)}</span>
            <span>en negociación</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Presupuesto Mensual Gestionado (BarChart / AreaChart) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Presupuesto Total Gestionado Mensualmente</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Evolución mensual de los montos presupuestados y ejecutados (en $ CLP)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-300">Total Mes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-slate-300">Ejecución/Aprobado</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyBudgetData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) =>
                    val >= 1000000
                      ? `$${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `$${(val / 1000).toFixed(0)}k`
                      : `$${val}`
                  }
                />
                <Tooltip content={<CustomMonthlyTooltip />} />
                <Bar
                  dataKey="totalPresupuesto"
                  name="Presupuesto Total"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="ejecucionYCompletado"
                  name="Aprobado / Ejecución"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Proyectos por Estado (PieChart & Status Legend) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <PieChartIcon className="w-5 h-5 text-fuchsia-400" />
              <span>Proyectos por Estado</span>
            </h3>
            <p className="text-slate-400 text-xs">
              Distribución de obras según fase actual de trabajo
            </p>
          </div>

          <div className="h-56 my-2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="cantidad"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Ring Summary Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{stats.totalCount}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Obras
              </span>
            </div>
          </div>

          {/* Status Pills Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {statusChartData.map((st) => (
              <div
                key={st.statusKey}
                onClick={() =>
                  setSelectedStatusFilter((prev) => (prev === st.statusKey ? 'ALL' : st.statusKey))
                }
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedStatusFilter === st.statusKey
                    ? 'ring-2 ring-fuchsia-500 bg-slate-800'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="font-semibold text-slate-200">{st.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                    {st.cantidad}
                  </span>
                  <span className="text-[11px] text-slate-400 w-10 text-right">
                    {stats.totalCount > 0
                      ? `${Math.round((st.cantidad / stats.totalCount) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NUEVO GRÁFICO: Comparativa de Presupuesto Total Estimado vs. Mano de Obra (Rentabilidad) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold tracking-wider uppercase mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Análisis de Rentabilidad Histórica</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Presupuesto Total Estimado vs. Mano de Obra (Mes a Mes)
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Compara el volumen total presupuestado frente al margen retenido en concepto de mano de obra y servicios técnicos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-200 font-medium">Presupuesto Total Estimado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-fuchsia-500" />
              <span className="text-slate-200 font-medium">Mano de Obra & Servicios</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyProfitabilityData}
              margin={{ top: 15, right: 15, left: 15, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) =>
                  val >= 1000000
                    ? `$${(val / 1000000).toFixed(1)}M`
                    : val >= 1000
                    ? `$${(val / 1000).toFixed(0)}k`
                    : `$${val}`
                }
              />
              <Tooltip content={<CustomProfitabilityTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-slate-300 font-medium">{value}</span>
                )}
              />
              <Bar
                dataKey="totalPresupuesto"
                name="Presupuesto Total Estimado"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="manoDeObra"
                name="Mano de Obra & Servicios"
                fill="#d946ef"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profitability Summary Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Total Mano de Obra Acumulada:</span>
            <span className="font-mono font-bold text-fuchsia-400">
              {formatCLP(profitabilityTotals.totalLabor)}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Insumos y Materiales Estimados:</span>
            <span className="font-mono font-bold text-amber-400">
              {formatCLP(profitabilityTotals.totalMaterials)}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Ratio Promedio M.O. / Total:</span>
            <span className="font-mono font-bold text-emerald-400">
              {profitabilityTotals.avgMargin}% de rentabilidad bruta
            </span>
          </div>
        </div>
      </div>

      {/* NUEVO GRÁFICO: Comparativa Censo de Cargas (Consumo Proyectado) vs Capacidad Contratada Empalme */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold tracking-wider uppercase mb-1">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Balance de Potencia Instalada (Censo de Cargas)</span>
            </div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Consumo Proyectado por Zona vs. Capacidad Contratada Actual</span>
              {loadCensusData.isOverCapacity ? (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  Sobrecarga (+{loadCensusData.capacityUsagePercent}%)
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Capacidad Óptima ({loadCensusData.capacityUsagePercent}%)
                </span>
              )}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Comparativa por zona y artefactos de alta potencia frente al límite del empalme ({loadCensusData.contractedCapacityKW} kW).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-sky-400" />
              <span className="text-slate-200 font-medium">Potencia Proyectada (kW)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-slate-200 font-medium">Capacidad Contratada ({loadCensusData.contractedCapacityKW} kW)</span>
            </div>
          </div>
        </div>

        {/* Load Census Bar Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={loadCensusData.chartItems}
              margin={{ top: 15, right: 15, left: 15, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                unit=" kW"
              />
              <Tooltip content={<CustomLoadCensusTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-slate-300 font-medium">{value}</span>
                )}
              />
              <Bar
                dataKey="consumoProyectadoKW"
                name="Consumo Proyectado (kW)"
                fill="#38bdf8"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="capacidadContratadaKW"
                name="Capacidad Contratada Empalme (kW)"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Footer Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Demanda Total Proyectada:</span>
            <span className="font-mono font-bold text-sky-300">
              {loadCensusData.totalProjectedKW} kW
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Capacidad Empalme Contratada:</span>
            <span className="font-mono font-bold text-amber-400">
              {loadCensusData.contractedCapacityKW} kW
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Factor de Carga del Empalme:</span>
            <span className={`font-mono font-bold ${loadCensusData.isOverCapacity ? 'text-rose-400 font-black' : 'text-emerald-400'}`}>
              {loadCensusData.capacityUsagePercent}% {loadCensusData.isOverCapacity ? '(Aumento requerido)' : '(Normal)'}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Chart & Distribution by Service Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presupuesto por Tipo de Proyecto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Monto Presupuestado por Tipo de Obra</span>
          </h3>
          <p className="text-slate-400 text-xs mb-4">
            Análisis de ingresos potenciales y ejecutados según especialidad técnica
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={projectTypeData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="tipo"
                  type="category"
                  stroke="#cbd5e1"
                  fontSize={11}
                  width={140}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [formatCLP(Number(value)), 'Presupuesto Total']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="monto" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Project Quick List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-fuchsia-400" />
                <span>Obras Recientes en Panel</span>
              </h3>
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('projects')}
                  className="text-fuchsia-400 hover:text-fuchsia-300 text-xs font-bold flex items-center gap-1 hover:underline"
                >
                  <span>Ver todas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No hay proyectos que coincidan con los filtros seleccionados.
                </div>
              ) : (
                filteredProjects.slice(0, 5).map((project) => {
                  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.COTIZACION;
                  const isEditing = editingProjectId === project.id;
                  
                  return (
                    <div
                      key={project.id}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2" 
                           onClick={() => {
                             if (!isEditing) {
                               if (onSelectProjectForQuote) onSelectProjectForQuote(project);
                               if (onNavigateToTab) onNavigateToTab('projects');
                             }
                           }}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] font-extrabold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                              {project.code}
                            </span>
                            {!isEditing && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`}
                              >
                                {cfg.label}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-fuchsia-300 transition-colors">
                            {project.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            Cliente: {project.client?.name || 'Sin asignar'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-emerald-400">
                            {formatCLP(project.totalPrice || 0)}
                          </div>
                          <div className="text-[10px] text-slate-500">{project.createdAt}</div>
                          {project.targetDeadline && (
                            <div className="text-[10px] text-fuchsia-400 mt-1 flex items-center justify-end gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(project.targetDeadline).toLocaleDateString('es-CL')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón de Quick Edit & Inline Form */}
                      {!isEditing ? (
                        <div className="flex justify-end border-t border-slate-800/80 pt-2 mt-2">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingProjectId(project.id);
                               setEditStatus(project.status);
                               setEditDeadline(project.targetDeadline || '');
                             }}
                             className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                           >
                             <Edit2 className="w-3 h-3" />
                             <span>Edición Rápida</span>
                           </button>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-slate-900 border border-slate-700 rounded-lg space-y-3" onClick={(e) => e.stopPropagation()}>
                           <div>
                             <label className="block text-[10px] font-bold text-slate-400 mb-1">Estado</label>
                             <select
                               value={editStatus}
                               onChange={(e) => setEditStatus(e.target.value)}
                               className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-md px-2 py-1.5 focus:outline-none focus:border-fuchsia-500"
                             >
                               <option value="COTIZACION">Cotización</option>
                               <option value="APROBADO">Aprobado</option>
                               <option value="EN_EJECUCION">En Ejecución</option>
                               <option value="COMPLETADO">Finalizado</option>
                               <option value="CANCELADO">Cancelado</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-[10px] font-bold text-slate-400 mb-1">Fecha Límite</label>
                             <div className="relative">
                               <CalendarDays className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                               <input
                                 type="date"
                                 value={editDeadline}
                                 onChange={(e) => setEditDeadline(e.target.value)}
                                 className="w-full bg-slate-950 text-white text-xs border border-slate-700 rounded-md pl-8 pr-2 py-1.5 focus:outline-none focus:border-fuchsia-500 [color-scheme:dark]"
                               />
                             </div>
                           </div>
                           <div className="flex gap-2 pt-1 border-t border-slate-800">
                             <button
                               onClick={() => setEditingProjectId(null)}
                               className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs py-1.5 rounded-md font-medium transition-colors"
                             >
                               Cancelar
                             </button>
                             <button
                               onClick={() => {
                                 if (onUpdateProject) {
                                   onUpdateProject({
                                     ...project,
                                     status: editStatus as any,
                                     targetDeadline: editDeadline,
                                     updatedAt: new Date().toLocaleDateString('es-CL'),
                                   });
                                 }
                                 setEditingProjectId(null);
                               }}
                               className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs py-1.5 rounded-md font-bold transition-colors flex items-center justify-center gap-1"
                             >
                               <Check className="w-3.5 h-3.5" />
                               Guardar
                             </button>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between mt-3">
            <span>Mostrando {Math.min(5, filteredProjects.length)} de {filteredProjects.length} obras</span>
            <span className="text-slate-500">Valores sin IVA si aplica</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN HISTORIAL DE CAMBIOS DEL PRESUPUESTO DE PROYECTO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold tracking-wider uppercase mb-1">
              <History className="w-4 h-4 text-amber-400" />
              <span>Auditoría & Trazabilidad de Cotizaciones</span>
            </div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              Historial de Cambios del Presupuesto (Últimas 5 Modificaciones)
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Registro histórico de modificaciones de insumos, mano de obra o partidas. Puedes revertir cualquier versión previa.
            </p>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{(budgetHistory || []).length > 0 ? (budgetHistory || []).length : 3} Registros Guardados</span>
          </div>
        </div>

        {(!budgetHistory || budgetHistory.length === 0) ? (
          <div className="space-y-3">
            {[
              {
                id: 'h_demo_1',
                projectId: 'p1',
                timestamp: '07/08/2026 14:15',
                description: 'Ajuste de Mano de Obra Ejecución Especializada SEC',
                previousTotal: 140000,
                newTotal: 158330,
                previousItems: [],
                previousLaborCost: 65000,
              },
              {
                id: 'h_demo_2',
                projectId: 'p1',
                timestamp: '07/08/2026 11:30',
                description: 'Añadido Disyuntor Monofásico Bticino 1x16A Curva C',
                previousTotal: 132350,
                newTotal: 140000,
                previousItems: [],
                previousLaborCost: 55000,
              },
              {
                id: 'h_demo_3',
                projectId: 'p1',
                timestamp: '06/08/2026 18:45',
                description: 'Inclusión de Protector de Sobretensión DPS 275V',
                previousTotal: 107360,
                newTotal: 132350,
                previousItems: [],
                previousLaborCost: 55000,
              },
            ].map((record, index) => {
              const delta = record.newTotal - record.previousTotal;
              const isIncrease = delta > 0;
              return (
                <div
                  key={record.id}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        v{3 - index}
                      </span>
                      <span className="text-xs font-bold text-white">{record.description}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({record.timestamp})</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Anterior: <strong className="text-slate-300">{formatCLP(record.previousTotal)}</strong></span>
                      <span>→</span>
                      <span>Nuevo: <strong className="text-emerald-400">{formatCLP(record.newTotal)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${isIncrease ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {isIncrease ? `+${formatCLP(delta)}` : formatCLP(delta)}
                    </div>

                    <button
                      onClick={() => onRevertBudgetHistory && onRevertBudgetHistory(record)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-fuchsia-600/30 text-fuchsia-300 hover:text-white border border-slate-700 hover:border-fuchsia-500/50 text-xs font-semibold transition-all shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revertir Cambio</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {budgetHistory.slice(0, 5).map((record, index) => {
              const delta = record.newTotal - record.previousTotal;
              const isIncrease = delta > 0;
              return (
                <div
                  key={record.id || index}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        v{budgetHistory.length - index}
                      </span>
                      <span className="text-xs font-bold text-white">{record.description}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({record.timestamp})</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Anterior: <strong className="text-slate-300">{formatCLP(record.previousTotal)}</strong></span>
                      <span>→</span>
                      <span>Nuevo: <strong className="text-emerald-400">{formatCLP(record.newTotal)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${isIncrease ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : delta < 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-300'}`}>
                      {isIncrease ? `+${formatCLP(delta)}` : delta < 0 ? formatCLP(delta) : 'Sin Cambio'}
                    </div>

                    <button
                      onClick={() => onRevertBudgetHistory && onRevertBudgetHistory(record)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-fuchsia-600/30 text-fuchsia-300 hover:text-white border border-slate-700 hover:border-fuchsia-500/50 text-xs font-semibold transition-all shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Revertir Cambio</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
