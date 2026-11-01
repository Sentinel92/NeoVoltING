import React, { useState, useEffect } from 'react';
import { CustomerDetails, ContractorConfig, BudgetItem } from '../types';
import {
  Plug,
  Lightbulb,
  Wrench,
  Sparkles,
  Calculator,
  Plus,
  Minus,
  Check,
  Send,
  Download,
  Share2,
  ShieldCheck,
  Info,
  DollarSign,
  ArrowRight,
  Layers,
  CheckCircle2,
  Home,
  Clock,
  RotateCcw,
  Zap,
  Pencil,
  Settings,
  ShoppingCart,
  ListChecks,
  Save,
  X,
  Store,
} from 'lucide-react';
import { exportQuoteJsPdf, ClientMaterialItem } from '../utils/pdfGenerator';
import { ClientMaterialsModal } from './ClientMaterialsModal';
import { ContractClause } from './CotizadorTab';

export interface BasicServiceItem {
  id: string;
  category: 'ENCHUFES' | 'LUMINARIAS' | 'REPARACIONES';
  title: string;
  description: string;
  materialsDetail: string;
  defaultLaborCLP: number;
  defaultMaterialCLP: number;
  unit: string;
  count: number;
  iconType: 'plug' | 'light' | 'wrench' | 'outdoor';
}

const DEFAULT_HOME_SERVICES: BasicServiceItem[] = [
  // --- ENCHUFES ---
  {
    id: 's_ench_nuevo_moldura',
    category: 'ENCHUFES',
    title: 'Punto de Enchufe Nuevo con Canalización a la Vista',
    description: 'Instalación de nuevo punto de enchufe doble 10/16A con moldura/canaleta 20x10mm sobrepuesta y cable EVA 2.5 mm² libre de halógenos.',
    materialsDetail: 'Placa doble 10/16A, moldura 20x10 (3m), conductor EVA 2.5mm² (fase, neutro, tierra), tarugos y tornillos.',
    defaultLaborCLP: 22000,
    defaultMaterialCLP: 13500,
    unit: 'punto',
    count: 0,
    iconType: 'plug',
  },
  {
    id: 's_ench_nuevo_embutido',
    category: 'ENCHUFES',
    title: 'Punto de Enchufe Nuevo Embutido en Tabique',
    description: 'Instalación embutida en tabique de yeso-cartón o madera, con caja chuqui plástica, tubería conduit corrugada y placa doble 10/16A.',
    materialsDetail: 'Caja chuqui embutida, tubería conduit 20mm, conductor EVA 2.5mm², placa doble 10/16A.',
    defaultLaborCLP: 28000,
    defaultMaterialCLP: 15500,
    unit: 'punto',
    count: 0,
    iconType: 'plug',
  },
  {
    id: 's_ench_recambio',
    category: 'ENCHUFES',
    title: 'Recambio / Sustitución de Enchufe Existente',
    description: 'Desmontaje de placa o enchufe antiguo dañado/gastado, chequeo de cableado existente, reapriete y montaje de nueva placa doble 10/16A.',
    materialsDetail: 'Placa módulo doble 10/16A con soporte y tornillos de fijación.',
    defaultLaborCLP: 9500,
    defaultMaterialCLP: 5800,
    unit: 'punto',
    count: 0,
    iconType: 'plug',
  },
  {
    id: 's_ench_fuerza_16a',
    category: 'ENCHUFES',
    title: 'Enchufe Especial Reforzado 16A (Electrodomésticos)',
    description: 'Instalación de toma de corriente reforzada 16A exclusiva para lavadora, refrigerador, microondas, horno eléctrico o secadora.',
    materialsDetail: 'Placa de fuerza 16A Schuko/Italiano, conductor EVA 2.5mm², canalización reforzada.',
    defaultLaborCLP: 26000,
    defaultMaterialCLP: 16500,
    unit: 'punto',
    count: 0,
    iconType: 'plug',
  },
  {
    id: 's_ench_exterior_ip55',
    category: 'ENCHUFES',
    title: 'Enchufe Exterior Intemperie IP55 / IP65 (Patio o Terraza)',
    description: 'Enchufe con caja estanca y tapa hermética a prueba de lluvia, salpicaduras y polvo para quinchos, patios y jardines.',
    materialsDetail: 'Caja sobrepuesta estanca IP55/IP65 con membrana de cierre, conductor EVA 2.5mm², fijaciones inoxidables.',
    defaultLaborCLP: 32000,
    defaultMaterialCLP: 19500,
    unit: 'punto',
    count: 0,
    iconType: 'outdoor',
  },

  // --- LUMINARIAS ---
  {
    id: 's_lum_plafon_led',
    category: 'LUMINARIAS',
    title: 'Instalación / Cambio de Foco Plafón LED de Techo',
    description: 'Desmontaje de artefacto anterior, fijación a cielo y conexión segura de nuevo foco plafón LED de 18W o 24W (cálido o frío).',
    materialsDetail: 'Foco plafón LED 18W/24W, tarugos para cielo/concreto, conectores rápidos Wago / capuchones.',
    defaultLaborCLP: 14000,
    defaultMaterialCLP: 11000,
    unit: 'artefacto',
    count: 0,
    iconType: 'light',
  },
  {
    id: 's_lum_downlight_embutido',
    category: 'LUMINARIAS',
    title: 'Foco Downlight LED Embutido en Cielo Yeso-Cartón',
    description: 'Calado circular en cielo falso, conexionado eléctrico y montaje de panel downlight LED extraplano con resortes.',
    materialsDetail: 'Panel LED embutido 12W/18W con transformador driver integrado, conectores de empalme.',
    defaultLaborCLP: 16000,
    defaultMaterialCLP: 9500,
    unit: 'artefacto',
    count: 0,
    iconType: 'light',
  },
  {
    id: 's_lum_lampara_colgante',
    category: 'LUMINARIAS',
    title: 'Montaje de Lámpara Colgante o Apliqué de Pared',
    description: 'Armado de estructura, fijación con gancho/soporte de carga, regulación de altura de cables y prueba de encendido.',
    materialsDetail: 'Fijaciones de anclaje, tarugos especiales para cielo, ampolletas LED alta eficiencia.',
    defaultLaborCLP: 19000,
    defaultMaterialCLP: 7500,
    unit: 'artefacto',
    count: 0,
    iconType: 'light',
  },
  {
    id: 's_lum_centro_completo',
    category: 'LUMINARIAS',
    title: 'Nuevo Centro de Luz Completo + Interruptor 9/12',
    description: 'Línea nueva desde caja de derivación con moldura/canaleta, instalación de interruptor 9/12 en pared y centro de luz en cielo.',
    materialsDetail: 'Interruptor 9/12, foco LED, moldura 20x10 (4m), conductor EVA 1.5mm² (fase y retorno).',
    defaultLaborCLP: 34000,
    defaultMaterialCLP: 18500,
    unit: 'punto completo',
    count: 0,
    iconType: 'light',
  },
  {
    id: 's_lum_combinacion_924',
    category: 'LUMINARIAS',
    title: 'Interruptor de Combinación / Escala 9/24 (2 Controles)',
    description: 'Control de la misma luminaria desde 2 interruptores separados (ideal para pasillos largos, escaleras o dormitorios principales).',
    materialsDetail: '2 placas con módulos 9/24, cableado de puente viajeros EVA 1.5mm², canalización.',
    defaultLaborCLP: 42000,
    defaultMaterialCLP: 22000,
    unit: 'juego (2 pts)',
    count: 0,
    iconType: 'light',
  },
  {
    id: 's_lum_proyector_sensor',
    category: 'LUMINARIAS',
    title: 'Foco Proyector LED Exterior con Sensor PIR de Movimiento',
    description: 'Foco proyector LED de 30W/50W IP65 para patio o entrada de vehículo, calibración de distancia y temporizador de encendido.',
    materialsDetail: 'Foco proyector LED 30W/50W IP65 con sensor PIR integrado, tarugos de expansión, caja de empalme.',
    defaultLaborCLP: 28000,
    defaultMaterialCLP: 26000,
    unit: 'artefacto',
    count: 0,
    iconType: 'outdoor',
  },
  {
    id: 's_lum_tira_led',
    category: 'LUMINARIAS',
    title: 'Instalación de Tira LED Decorativa con Fuente 12V/24V',
    description: 'Montaje de tira LED en bajo-mueble de cocina, cornisa o repisa, con perfil disipador de aluminio y conexión a toma eléctrica.',
    materialsDetail: 'Perfil de aluminio con difusor opal (2m), tira LED cálida/fría, fuente de poder switching 12V.',
    defaultLaborCLP: 25000,
    defaultMaterialCLP: 22000,
    unit: 'tramo (2-3m)',
    count: 0,
    iconType: 'light',
  },

  // --- REPARACIONES Y SERVICIOS RÁPIDOS ---
  {
    id: 's_rep_visita_diagnostico',
    category: 'REPARACIONES',
    title: 'Visita Técnica de Diagnóstico y Chequeo Domiciliario',
    description: 'Inspección de circuitos con instrumental técnico (tester, multímetro), detección de enchufes sin tensión o fugas menores.',
    materialsDetail: 'Informe técnico verbal con recomendaciones de seguridad y cotización detallada.',
    defaultLaborCLP: 25000,
    defaultMaterialCLP: 0,
    unit: 'visita',
    count: 0,
    iconType: 'wrench',
  },
  {
    id: 's_rep_reapriete_cajas',
    category: 'REPARACIONES',
    title: 'Mantenimiento y Reapriete en Cajas de Derivación',
    description: 'Apertura de cajas de paso en cielo/muro, eliminación de empalmes sueltos o encintados defectuosos y aislamiento con conectores rápidos.',
    materialsDetail: 'Conectores resorte tipo Wago / capuchones plásticos ignífugos, cinta aisladora de goma autofundente.',
    defaultLaborCLP: 24000,
    defaultMaterialCLP: 6500,
    unit: 'servicio',
    count: 0,
    iconType: 'wrench',
  },
  {
    id: 's_rep_timbre',
    category: 'REPARACIONES',
    title: 'Instalación / Cambio de Timbre Domiciliario',
    description: 'Instalación de pulsador exterior en reja o puerta y campanilla de aviso acústica de 220V o inalámbrica.',
    materialsDetail: 'Pulsador intemperie, campanilla acústica 220V o kit receptor/transmisor, fijaciones.',
    defaultLaborCLP: 18000,
    defaultMaterialCLP: 14000,
    unit: 'instalación',
    count: 0,
    iconType: 'wrench',
  },
];

export const HOME_SERVICE_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: '1',
    title: 'PRIMERA (Objeto del Servicio Domiciliario)',
    content:
      'EL CONTRATISTA se compromete a ejecutar los servicios básicos de instalación, recambio o reparación de enchufes, luminarias y canalizaciones descritos en este presupuesto, asegurando la correcta polaridad, aislamiento y cumplimiento de los estándares de seguridad de la normativa eléctrica chilena RIC N°10 (Instalaciones de Uso General) de la SEC.',
  },
  {
    id: '2',
    title: 'SEGUNDA (Monto y Forma de Pago)',
    content:
      'El valor total de los servicios asciende a la suma señalada en el presupuesto. Para trabajos domiciliarios de resolución inmediata, el pago se efectúa contra la entrega conforme de los artefactos en funcionamiento. Para trabajos que requieran suministro integral de materiales, se solicitará un 50% de anticipo al inicio de los trabajos.',
  },
  {
    id: '3',
    title: 'TERCERA (Calidad de Materiales y Conexiones)',
    content:
      'Todos los materiales e insumos suministrados (módulos, placas, conductores y canalizaciones) cuentan con certificación y sello SEC vigente. Los conductores utilizados son libres de halógenos y retardantes a la llama según exigencias vigentes.',
  },
  {
    id: '4',
    title: 'CUARTA (Garantía de Mano de Obra)',
    content:
      'EL CONTRATISTA otorga una garantía de 6 meses sobre los puntos intervenidos, conexiones y fijaciones mecánicas realizadas, cubriendo cualquier desajuste imputable a la mano de obra. Quedan excluidos daños por sobretensiones externas de la red o manipulación indebida de terceros.',
  },
  {
    id: '5',
    title: 'QUINTA (Condiciones del Inmueble)',
    content:
      'El CLIENTE facilitará el acceso despejado a las zonas de trabajo y al empalme o desconectador para realizar los cortes breves de energía necesarios para la ejecución segura sin riesgo eléctrico.',
  },
];

interface BasicHomeServicesTabProps {
  customer: CustomerDetails;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  contractor: ContractorConfig;
  onTransferToQuote: (items: BudgetItem[], laborAmount: number, isHomeServiceMode?: boolean) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const BasicHomeServicesTab: React.FC<BasicHomeServicesTabProps> = ({
  customer,
  setCustomer,
  contractor,
  onTransferToQuote,
  onNavigateToTab,
}) => {
  // Initial services state loaded with persistent custom prices if available
  const [services, setServices] = useState<BasicServiceItem[]>(() => {
    try {
      const saved = localStorage.getItem('neovolt_home_services_custom_rates');
      if (saved) {
        const rates: Record<string, { labor: number; material: number }> = JSON.parse(saved);
        return DEFAULT_HOME_SERVICES.map((s) => {
          if (rates[s.id]) {
            return {
              ...s,
              defaultLaborCLP: typeof rates[s.id].labor === 'number' ? rates[s.id].labor : s.defaultLaborCLP,
              defaultMaterialCLP: typeof rates[s.id].material === 'number' ? rates[s.id].material : s.defaultMaterialCLP,
            };
          }
          return s;
        });
      }
    } catch (e) {
      console.warn('Error reading custom rates from storage:', e);
    }
    return DEFAULT_HOME_SERVICES;
  });

  const [includeMaterials, setIncludeMaterials] = useState<boolean>(true);
  const [hardwareBrand, setHardwareBrand] = useState<'bticino' | 'marisio' | 'legrand' | 'estandar'>('bticino');
  const [includeContingency, setIncludeContingency] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'ENCHUFES' | 'LUMINARIAS' | 'REPARACIONES'>('TODOS');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Price Editing States
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [inlineLaborPrice, setInlineLaborPrice] = useState<number>(0);
  const [inlineMaterialPrice, setInlineMaterialPrice] = useState<number>(0);
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState<boolean>(false);

  // Client Materials List Modal State
  const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState<boolean>(false);

  // Brand multiplier for materials
  const getBrandMultiplier = () => {
    switch (hardwareBrand) {
      case 'bticino':
        return 1.15; // Línea premium Modus Pro
      case 'marisio':
        return 1.05; // Schneider Marisio clásica
      case 'legrand':
        return 1.10; // Legrand Vela
      default:
        return 0.95; // Estándar económica certificada
    }
  };

  const updateCount = (id: string, delta: number) => {
    setServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item))
    );
  };

  const setCountDirect = (id: string, val: number) => {
    setServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, count: Math.max(0, val) } : item))
    );
  };

  const resetAllCounts = () => {
    setServices((prev) => prev.map((item) => ({ ...item, count: 0 })));
  };

  // Price modification handlers
  const handleStartInlineEdit = (service: BasicServiceItem) => {
    setEditingCardId(service.id);
    setInlineLaborPrice(service.defaultLaborCLP);
    setInlineMaterialPrice(service.defaultMaterialCLP);
  };

  const handleSaveInlineEdit = (serviceId: string) => {
    updateServicePrice(serviceId, inlineLaborPrice, inlineMaterialPrice);
    setEditingCardId(null);
  };

  const updateServicePrice = (id: string, newLabor: number, newMaterial: number) => {
    setServices((prev) => {
      const updated = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              defaultLaborCLP: Math.max(0, newLabor),
              defaultMaterialCLP: Math.max(0, newMaterial),
            }
          : item
      );

      try {
        const rates: Record<string, { labor: number; material: number }> = {};
        updated.forEach((s) => {
          rates[s.id] = { labor: s.defaultLaborCLP, material: s.defaultMaterialCLP };
        });
        localStorage.setItem('neovolt_home_services_custom_rates', JSON.stringify(rates));
      } catch (e) {
        console.warn('Could not save custom rates to localStorage:', e);
      }

      return updated;
    });
  };

  const resetPricesToDefault = () => {
    if (window.confirm('¿Deseas restablecer todos los precios y tarifas a los valores recomendados por la SEC?')) {
      localStorage.removeItem('neovolt_home_services_custom_rates');
      setServices((prev) =>
        prev.map((s) => {
          const defaultItem = DEFAULT_HOME_SERVICES.find((d) => d.id === s.id);
          return defaultItem
            ? {
                ...s,
                defaultLaborCLP: defaultItem.defaultLaborCLP,
                defaultMaterialCLP: defaultItem.defaultMaterialCLP,
              }
            : s;
        })
      );
      setEditingCardId(null);
    }
  };

  // Quick Preset Packs
  const applyPreset = (presetName: string) => {
    resetAllCounts();
    setServices((prev) =>
      prev.map((item) => {
        if (presetName === 'pack_enchufes') {
          if (item.id === 's_ench_nuevo_moldura') return { ...item, count: 3 };
          if (item.id === 's_ench_recambio') return { ...item, count: 2 };
        } else if (presetName === 'pack_luminarias') {
          if (item.id === 's_lum_plafon_led') return { ...item, count: 4 };
          if (item.id === 's_lum_lampara_colgante') return { ...item, count: 1 };
        } else if (presetName === 'pack_hogar_confort') {
          if (item.id === 's_ench_nuevo_moldura') return { ...item, count: 4 };
          if (item.id === 's_lum_plafon_led') return { ...item, count: 3 };
          if (item.id === 's_ench_fuerza_16a') return { ...item, count: 1 };
        } else if (presetName === 'pack_exterior') {
          if (item.id === 's_ench_exterior_ip55') return { ...item, count: 2 };
          if (item.id === 's_lum_proyector_sensor') return { ...item, count: 1 };
        } else if (presetName === 'pack_renovacion_placas') {
          if (item.id === 's_ench_recambio') return { ...item, count: 8 };
          if (item.id === 's_lum_centro_completo') return { ...item, count: 1 };
        }
        return { ...item, count: 0 };
      })
    );
  };

  // Calculations
  const brandMult = getBrandMultiplier();
  const selectedItems = services.filter((s) => s.count > 0);
  const totalPointsCount = selectedItems.reduce((acc, s) => acc + s.count, 0);

  const rawMaterialsTotal = includeMaterials
    ? selectedItems.reduce((acc, s) => acc + s.count * Math.round(s.defaultMaterialCLP * brandMult), 0)
    : 0;

  const rawLaborTotal = selectedItems.reduce((acc, s) => acc + s.count * s.defaultLaborCLP, 0);

  const subtotalBase = rawMaterialsTotal + rawLaborTotal;
  const contingencyAmount = includeContingency ? Math.round(subtotalBase * 0.1) : 0;
  const grandTotalCLP = subtotalBase + contingencyAmount;

  // Extract consolidated physical materials for Client Shopping List
  const getConsolidatedMaterials = (): ClientMaterialItem[] => {
    const list: ClientMaterialItem[] = [];
    const brandName =
      hardwareBrand === 'bticino'
        ? 'BTicino Modus Pro'
        : hardwareBrand === 'marisio'
        ? 'Schneider Marisio'
        : hardwareBrand === 'legrand'
        ? 'Legrand Vela'
        : 'Línea Certificada SEC';

    selectedItems.forEach((s) => {
      const c = s.count;
      if (c <= 0) return;

      if (s.id === 's_ench_nuevo_moldura') {
        list.push({
          id: `mat_ench_placa_${s.id}`,
          name: `Placa con Enchufe Doble 10/16A + Tierra (${brandName})`,
          specification: 'Alvéolos protegidos para niños, 250V / 16A, certificado SEC vigente',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: `${brandName} (Sodimac o Easy)`,
        });
        list.push({
          id: `mat_moldura_${s.id}`,
          name: 'Canaleta / Moldura sobrepuesta 20x10mm con cinta adhesiva (tiras de 2m)',
          specification: 'PVC autoextinguible retardante a la llama, tabique divisor',
          quantity: Math.max(1, Math.ceil(c * 1.5)),
          unit: 'tiras (2m)',
          suggestedStoreOrBrand: 'Legrand / Dexson / Sodimac / Easy',
        });
        list.push({
          id: `mat_cable_eva_25_${s.id}`,
          name: 'Conductor Cobre EVA / H07Z1-K 2.5 mm² libre de halógeno (Fase, Neutro y Tierra)',
          specification: 'Norma RIC N°04 SEC, libre de halógenos y baja emisión de humo tóxico',
          quantity: c * 10,
          unit: 'metros',
          suggestedStoreOrBrand: 'Nexans / Covisa / Madeco (Ferretería o Distribuidor)',
        });
        list.push({
          id: `mat_tarugos_${s.id}`,
          name: 'Bolsa de Tarugos 6mm con tornillos para yeso-cartón o concreto',
          specification: 'Fijaciones mecánicas para canaletas y cajas',
          quantity: Math.max(1, Math.ceil(c / 3)),
          unit: 'bolsa',
          suggestedStoreOrBrand: 'Fischer / Mamut / Sodimac',
        });
      } else if (s.id === 's_ench_nuevo_embutido') {
        list.push({
          id: `mat_caja_chuqui_${s.id}`,
          name: 'Caja Chuqui Embutida de aparato (tabique o concreto)',
          specification: 'Termoplástico autoextinguible o metálica 5/8" con orejas de fijación',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'BTicino / Schneider / Sodimac',
        });
        list.push({
          id: `mat_ench_embutido_${s.id}`,
          name: `Placa con Enchufe Doble 10/16A embutida con soporte y tornillos (${brandName})`,
          specification: 'Módulos 10/16A con alvéolos protegidos, certificado SEC',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: `${brandName} (Sodimac / Easy)`,
        });
        list.push({
          id: `mat_conduit_20_${s.id}`,
          name: 'Tubería Conduit corrugada de 20mm (naranja/gris)',
          specification: 'PVC no propagador de la llama para tabiquería',
          quantity: c * 4,
          unit: 'metros',
          suggestedStoreOrBrand: 'Tigre / Vinilit / Sodimac',
        });
        list.push({
          id: `mat_cable_eva_emb_${s.id}`,
          name: 'Conductor de Cobre EVA 2.5 mm² libre de halógeno (3 colores)',
          specification: 'Colores SEC (Fase: Azul/Rojo, Neutro: Blanco, Tierra: Verde-Amarillo)',
          quantity: c * 12,
          unit: 'metros',
          suggestedStoreOrBrand: 'Nexans / Covisa',
        });
      } else if (s.id === 's_ench_recambio') {
        list.push({
          id: `mat_recambio_${s.id}`,
          name: `Placa Enchufe Doble 10/16A Completa con soporte (${brandName})`,
          specification: 'Para recambio de placa antigua gastada en caja chuqui existente',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: `${brandName} (Sodimac / Easy)`,
        });
      } else if (s.id === 's_ench_fuerza_16a') {
        list.push({
          id: `mat_fuerza_${s.id}`,
          name: 'Placa con Toma de Fuerza Reforzada 16A (Schuko / Italiano de potencia)',
          specification: 'Capacidad 16A continua 250V para horno, secadora o lavadora',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'BTicino / Mennekes / Schneider',
        });
        list.push({
          id: `mat_cable_fuerza_${s.id}`,
          name: 'Conductor de Cobre EVA 2.5 mm² libre de halógeno reforzado',
          specification: 'Alimentación de fuerza directa según RIC N°10',
          quantity: c * 8,
          unit: 'metros',
          suggestedStoreOrBrand: 'Nexans / Covisa',
        });
      } else if (s.id === 's_ench_exterior_ip55') {
        list.push({
          id: `mat_exterior_${s.id}`,
          name: 'Caja Estanca Sobrepuesta IP55 / IP65 con Tapa Hermética Abatible',
          specification: 'Protección intemperie contra lluvia y polvo con membrana flexible',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'BTicino Idrobox / Gewiss / Schneider',
        });
        list.push({
          id: `mat_modulo_ext_${s.id}`,
          name: 'Módulo Enchufe 10/16A + Tierra para caja estanca',
          specification: 'Certificado SEC para uso en exteriores / quinchos / patios',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'BTicino / Schneider',
        });
        list.push({
          id: `mat_prensa_${s.id}`,
          name: 'Prensaestopas de hermeticidad PG11 o PG13.5',
          specification: 'Sellado impermeable para entrada de cable en caja',
          quantity: c * 2,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Sodimac / Ferretería industrial',
        });
      } else if (s.id === 's_lum_plafon_led') {
        list.push({
          id: `mat_plafon_${s.id}`,
          name: 'Foco Plafón LED de Techo 18W o 24W (Sobrepuesto)',
          specification: 'Diámetro ~22cm, driver integrado 220V, tono a elección (3000K cálido o 6500K frío)',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Philips / Osram / Megabright (Sodimac o Easy)',
        });
        list.push({
          id: `mat_conectores_plafon_${s.id}`,
          name: 'Conectores Rápidos de Palanca tipo Wago 221 (2 o 3 vías)',
          specification: 'Para conexionado seguro sin cinta aisladora suelta en cielo',
          quantity: c * 3,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Wago / Finder / Sodimac',
        });
      } else if (s.id === 's_lum_downlight_embutido') {
        list.push({
          id: `mat_downlight_${s.id}`,
          name: 'Panel Downlight LED Embutido Extraplano 12W o 18W con resortes',
          specification: 'Calado circular 15-20cm en cielo falso, incluye transformador driver 220V',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Philips / Megabright / Easy',
        });
      } else if (s.id === 's_lum_lampara_colgante') {
        list.push({
          id: `mat_gancho_lampara_${s.id}`,
          name: 'Gancho o Soporte de Anclaje de Techo para Carga Pesada',
          specification: 'Tarugos expansivos metálicos para concreto o mariposa para cielo falso',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Fischer / Mamut / Sodimac',
        });
        list.push({
          id: `mat_ampolletas_led_${s.id}`,
          name: 'Ampolletas LED E27 de Alta Eficiencia (9W / 12W)',
          specification: 'Sello de Eficiencia Energética Letra A+, luz cálida o fría',
          quantity: c * 2,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Philips / Osram',
        });
      } else if (s.id === 's_lum_centro_completo') {
        list.push({
          id: `mat_interr_912_${s.id}`,
          name: `Placa con Interruptor 9/12 (1 Efecto) (${brandName})`,
          specification: 'Módulo interruptor 10AX 250V con placa y soporte de pared',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: `${brandName} (Sodimac / Easy)`,
        });
        list.push({
          id: `mat_foco_centro_${s.id}`,
          name: 'Foco Plafón LED 18W o Base Soquete Loza E27',
          specification: 'Luminaria principal de cielo con fijación',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Sodimac / Easy',
        });
        list.push({
          id: `mat_cable_eva_luz_${s.id}`,
          name: 'Conductor de Cobre EVA 1.5 mm² libre de halógeno (Fase y Retorno)',
          specification: 'Norma RIC N°04 para circuitos de iluminación domiciliaria',
          quantity: c * 15,
          unit: 'metros',
          suggestedStoreOrBrand: 'Nexans / Covisa',
        });
        list.push({
          id: `mat_moldura_luz_${s.id}`,
          name: 'Canaleta / Moldura sobrepuesta 20x10mm con adhesivo (tiras de 2m)',
          specification: 'PVC autoextinguible retardante a la llama',
          quantity: Math.max(1, Math.ceil(c * 2)),
          unit: 'tiras (2m)',
          suggestedStoreOrBrand: 'Legrand / Dexson',
        });
      } else if (s.id === 's_lum_combinacion_924') {
        list.push({
          id: `mat_comb_924_${s.id}`,
          name: `Placas con Interruptor de Combinación 9/24 (3 Vías) (${brandName})`,
          specification: '2 placas completas para control de luz desde 2 puntos separados (escaleras/pasillos)',
          quantity: c * 2,
          unit: 'unid.',
          suggestedStoreOrBrand: `${brandName} (Sodimac / Easy)`,
        });
        list.push({
          id: `mat_cable_viajeros_${s.id}`,
          name: 'Conductor EVA 1.5 mm² libre de halógeno para Puentes Viajeros',
          specification: 'Línea de interconexión entre ambos controles 9/24',
          quantity: c * 20,
          unit: 'metros',
          suggestedStoreOrBrand: 'Nexans / Covisa',
        });
      } else if (s.id === 's_lum_proyector_sensor') {
        list.push({
          id: `mat_proyector_${s.id}`,
          name: 'Foco Proyector LED Exterior 30W / 50W IP65 con Sensor de Movimiento PIR',
          specification: 'Protección intemperie, sensor regulable en tiempo y distancia',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Megabright / Philips (Sodimac o Easy)',
        });
        list.push({
          id: `mat_caja_deriv_ext_${s.id}`,
          name: 'Caja de Derivación Estanca IP55 sobrepuesta 80x80mm',
          specification: 'Para conexionado hermético en muro exterior',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Gewiss / Scame / Sodimac',
        });
      } else if (s.id === 's_lum_tira_led') {
        list.push({
          id: `mat_tira_led_${s.id}`,
          name: 'Rollo Tira LED 12V o 24V SMD (5 metros) IP20/IP65',
          specification: 'Tono cálido 3000K o neutro 4000K, alta densidad de LEDs',
          quantity: Math.max(1, Math.ceil(c / 2)),
          unit: 'rollo (5m)',
          suggestedStoreOrBrand: 'Sodimac / Easy / Casa de la Iluminación',
        });
        list.push({
          id: `mat_fuente_poder_${s.id}`,
          name: 'Fuente de Poder Switching 12V o 24V (60W - 100W)',
          specification: 'Transformador estabilizado para iluminación LED',
          quantity: c,
          unit: 'unid.',
          suggestedStoreOrBrand: 'Mean Well / Sodimac',
        });
        list.push({
          id: `mat_perfil_alum_${s.id}`,
          name: 'Perfil de Aluminio para Tira LED con Difusor Opal (barras de 2m)',
          specification: 'Disipador térmico con difusor lechoso para bajo muebles',
          quantity: c,
          unit: 'barras (2m)',
          suggestedStoreOrBrand: 'Sodimac / Easy',
        });
      } else if (s.id === 's_rep_reapriete_cajas') {
        list.push({
          id: `mat_conectores_reapriete_${s.id}`,
          name: 'Caja de Conectores Resorte tipo Wago / Capuchones Ignífugos',
          specification: 'Para sustituir empalmes con huincha vieja por conexiones mecánicas seguras',
          quantity: 1,
          unit: 'caja (20-30 pcs)',
          suggestedStoreOrBrand: 'Wago / 3M / Sodimac',
        });
        list.push({
          id: `mat_cinta_aisladora_${s.id}`,
          name: 'Cinta Aisladora Profesional de Goma Autofundente y Cinta PVC 3M',
          specification: 'Aislamiento clase H para cajas de derivación',
          quantity: 1,
          unit: 'rollo',
          suggestedStoreOrBrand: '3M Temflex 1700 / Scotch 23',
        });
      } else if (s.id === 's_rep_timbre') {
        list.push({
          id: `mat_timbre_kit_${s.id}`,
          name: 'Kit de Timbre Domiciliario (Pulsador Intemperie + Campanilla)',
          specification: '220V cableado o inalámbrico de largo alcance con pila sellada',
          quantity: c,
          unit: 'kit',
          suggestedStoreOrBrand: 'Legrand / BTicino / Sodimac',
        });
      }
    });

    return list;
  };

  // Convert selected services to BudgetItem[] for CotizadorTab
  const generateBudgetItems = (): BudgetItem[] => {
    const items: BudgetItem[] = [];
    selectedItems.forEach((s) => {
      // 1. Material item if included
      if (includeMaterials && s.defaultMaterialCLP > 0) {
        items.push({
          id: `mat_${s.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: `Insumos: ${s.title} (${s.materialsDetail})`,
          quantity: s.count,
          price: Math.round(s.defaultMaterialCLP * brandMult),
          category: s.category === 'ENCHUFES' ? 'ENCHUFES' : s.category === 'LUMINARIAS' ? 'LUMINARIAS' : 'REPARACION',
          unit: s.unit,
        });
      }
    });

    // If no materials included, add a descriptive item so table is not empty
    if (items.length === 0) {
      items.push({
        id: `mat_none_${Date.now()}`,
        name: 'Insumos aportados directamente por el cliente / Sin cargo de compra',
        quantity: 1,
        price: 0,
        category: 'INSUMOS_CLIENTE',
        unit: 'global',
      });
    }

    return items;
  };

  // Transfer directly to Quote
  const handleProceedToQuote = () => {
    if (totalPointsCount === 0) {
      alert('Por favor selecciona al menos un servicio o punto de instalación para cotizar.');
      return;
    }
    const items = generateBudgetItems();
    onTransferToQuote(items, rawLaborTotal, true);
    onNavigateToTab('quote');
  };

  // Quick Direct PDF Download
  const handleDirectPdfDownload = async () => {
    if (totalPointsCount === 0) {
      alert('Por favor selecciona al menos un servicio o punto de instalación para generar el PDF.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const quoteItems = generateBudgetItems();
      await exportQuoteJsPdf({
        items: quoteItems,
        customer,
        contractor,
        laborCost: rawLaborTotal,
        includeContingency15: includeContingency,
        clauses: HOME_SERVICE_CONTRACT_CLAUSES,
      });
    } catch (e) {
      console.error('Error al generar PDF directo:', e);
      alert('Hubo un inconveniente al generar el PDF. Puedes transferir la cotización al módulo Cotizador formal.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Quick WhatsApp Message
  const handleDirectWhatsApp = () => {
    if (totalPointsCount === 0) {
      alert('Por favor selecciona al menos un servicio o punto de instalación.');
      return;
    }

    let cleanPhone = (customer.phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
      cleanPhone = '56' + cleanPhone;
    }

    const itemsSummary = selectedItems
      .map((s) => `• ${s.count}x ${s.title}`)
      .join('\n');

    const msg = encodeURIComponent(
      `Hola *${customer.name || 'Estimado/a'}*, te comparto la propuesta económica para los trabajos de instalación en tu domicilio (${customer.address || 'tu casa'}):

🛠️ *DETALLE DE SERVICIOS A REALIZAR:*
${itemsSummary}

📦 *MODALIDAD:* ${includeMaterials ? `Materiales certificados SEC incluidos (${hardwareBrand.toUpperCase()})` : 'Solo mano de obra (artefactos provistos por el cliente)'}

💰 *RESUMEN DE COSTOS:*
${includeMaterials ? `• Materiales e Insumos: $${rawMaterialsTotal.toLocaleString('es-CL')} CLP\n` : ''}• Mano de Obra Especializada: $${rawLaborTotal.toLocaleString('es-CL')} CLP
${includeContingency ? `• Margen de Imprevistos (10%): $${contingencyAmount.toLocaleString('es-CL')} CLP\n` : ''}---------------------------------
⭐ *VALOR TOTAL FINAL:* $${grandTotalCLP.toLocaleString('es-CL')} CLP

🛡️ *GARANTÍA:* 6 meses en conexiones y mano de obra.
Instalador: *${contractor.installerName}* (${contractor.secLicense ? `SEC ${contractor.secLicense}` : contractor.companyName})
Fono: ${contractor.phone}

¿Te acomoda agendar para coordinar la visita? Quedo atento.`
    );

    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const filteredServices = services.filter((s) => {
    if (activeFilter === 'TODOS') return true;
    return s.category === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                <Home className="w-3.5 h-3.5" />
                Servicios Domiciliarios Rápidos (Sin Tablero)
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Norma RIC N°10 SEC
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Instalación de Enchufes & Luminarias en Casa
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Genera presupuestos inmediatos para trabajos domiciliarios cotidianos sin necesidad de modificar el tablero eléctrico: nuevos puntos de enchufes, recambios, focos plafón LED, apliqués, lámparas y canalizaciones limpias.
            </p>
          </div>

          {/* Quick Client Summary Card */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shrink-0 min-w-[260px] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Cliente Destino:</span>
              <button
                onClick={() => onNavigateToTab('crm')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Cambiar
              </button>
            </div>
            <input
              type="text"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              placeholder="Nombre del Cliente"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
            />
            <input
              type="text"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              placeholder="Dirección (ej. Pasaje Las Rosas 1420, Maipú)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* 1-Click Popular Preset Packs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Packs Populares de Casa (Carga Inmediata en 1 Clic):
            </h2>
          </div>
          {totalPointsCount > 0 && (
            <button
              onClick={resetAllCounts}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar Selección</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={() => applyPreset('pack_enchufes')}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Plug className="w-4 h-4" />
              <span className="font-bold text-xs">Pack 3 Enchufes</span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              3 enchufes con moldura + 2 recambios
            </p>
          </button>

          <button
            onClick={() => applyPreset('pack_luminarias')}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Lightbulb className="w-4 h-4" />
              <span className="font-bold text-xs">Pack Iluminación</span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              4 plafones LED techo + 1 lámpara colgante
            </p>
          </button>

          <button
            onClick={() => applyPreset('pack_hogar_confort')}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Home className="w-4 h-4" />
              <span className="font-bold text-xs">Pack Confort Casa</span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              4 enchufes + 3 luces + 1 enchufe 16A cocina
            </p>
          </button>

          <button
            onClick={() => applyPreset('pack_exterior')}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-bold text-xs">Pack Patio / Quincho</span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              2 enchufes IP55 exterior + 1 foco sensor PIR
            </p>
          </button>

          <button
            onClick={() => applyPreset('pack_renovacion_placas')}
            className="flex flex-col items-start p-3 rounded-xl bg-slate-950 hover:bg-fuchsia-950/40 border border-slate-800 hover:border-fuchsia-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-fuchsia-400 mb-1">
              <Layers className="w-4 h-4" />
              <span className="font-bold text-xs">Renovación Placas</span>
            </div>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
              Cambio de 8 enchufes antiguos a nueva línea
            </p>
          </button>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['TODOS', 'ENCHUFES', 'LUMINARIAS', 'REPARACIONES'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                activeFilter === tab
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab === 'TODOS'
                ? 'Todos los Servicios'
                : tab === 'ENCHUFES'
                ? '🔌 Enchufes'
                : tab === 'LUMINARIAS'
                ? '💡 Luminarias'
                : '🛠️ Reparaciones'}
            </button>
          ))}
        </div>

        {/* Action Buttons: Materials List & Custom Price Sheet */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsMaterialsModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-all active:scale-95"
            title="Generar y descargar lista de materiales para que el cliente compre en Sodimac/Easy"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-cyan-200" />
            <span>Lista de Materiales Cliente</span>
            {selectedItems.length > 0 && (
              <span className="bg-cyan-900/80 text-cyan-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {selectedItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsPriceListModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
            title="Personalizar tarifas de mano de obra y materiales para todos los servicios"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tarifario Personalizado</span>
          </button>
        </div>

        {/* Materials & Brand Settings */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Include Materials Switch */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <input
              type="checkbox"
              checked={includeMaterials}
              onChange={(e) => setIncludeMaterials(e.target.checked)}
              className="rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-200">
              {includeMaterials ? 'Incluir Materiales + Mano de Obra' : 'Solo Mano de Obra (Cliente compra)'}
            </span>
          </label>

          {/* Hardware Brand Selector */}
          {includeMaterials && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 font-medium">Línea:</span>
              <select
                value={hardwareBrand}
                onChange={(e) => setHardwareBrand(e.target.value as any)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="bticino" className="bg-slate-900 text-white">
                  BTicino Modus Pro / Matix
                </option>
                <option value="marisio" className="bg-slate-900 text-white">
                  Schneider Marisio
                </option>
                <option value="legrand" className="bg-slate-900 text-white">
                  Legrand Vela
                </option>
                <option value="estandar" className="bg-slate-900 text-white">
                  Estándar Certificado SEC
                </option>
              </select>
            </div>
          )}

          {/* Contingency 10% */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <input
              type="checkbox"
              checked={includeContingency}
              onChange={(e) => setIncludeContingency(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
            />
            <span className="text-slate-300 font-medium">+10% Imprevistos</span>
          </label>
        </div>
      </div>

      {/* Main Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => {
          const isSelected = service.count > 0;
          const isEditingThisCard = editingCardId === service.id;
          const unitMaterialCLP = Math.round(service.defaultMaterialCLP * brandMult);
          const unitTotalCLP = includeMaterials ? service.defaultLaborCLP + unitMaterialCLP : service.defaultLaborCLP;
          const serviceSubtotal = service.count * unitTotalCLP;

          return (
            <div
              key={service.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-900/95 border-cyan-500/60 shadow-xl shadow-cyan-950/20 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2.5">
                {/* Header of Item */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        service.category === 'ENCHUFES'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : service.category === 'LUMINARIAS'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-fuchsia-500/20 text-fuchsia-400'
                      }`}
                    >
                      {service.category === 'ENCHUFES' ? (
                        <Plug className="w-4 h-4" />
                      ) : service.category === 'LUMINARIAS' ? (
                        <Lightbulb className="w-4 h-4" />
                      ) : (
                        <Wrench className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{service.title}</h3>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {service.unit}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="bg-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                      x{service.count}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">{service.description}</p>

                {/* Material Details (if included) */}
                {includeMaterials && service.defaultMaterialCLP > 0 && (
                  <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300 block">Insumos contemplados:</span>
                    <p className="leading-normal">{service.materialsDetail}</p>
                  </div>
                )}

                {/* Inline Price Editing Form */}
                {isEditingThisCard && (
                  <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                      <span>Editar Tarifas Unitarias:</span>
                      <button
                        type="button"
                        onClick={() => setEditingCardId(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Mano de Obra ($)</label>
                        <input
                          type="number"
                          step={500}
                          value={inlineLaborPrice}
                          onChange={(e) => setInlineLaborPrice(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Material Base ($)</label>
                        <input
                          type="number"
                          step={500}
                          value={inlineMaterialPrice}
                          onChange={(e) => setInlineMaterialPrice(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingCardId(null)}
                        className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveInlineEdit(service.id)}
                        className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow"
                      >
                        <Check className="w-3 h-3" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Price & Counter Controls */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Precio Unitario:</span>
                      <button
                        type="button"
                        onClick={() => handleStartInlineEdit(service)}
                        className="text-cyan-400 hover:text-cyan-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        title="Modificar precio unitario de este servicio"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-mono font-bold text-slate-200">
                      ${unitTotalCLP.toLocaleString('es-CL')} CLP
                    </span>
                    {includeMaterials && (
                      <span className="text-[10px] text-slate-500 block">
                        (M.O: ${service.defaultLaborCLP.toLocaleString('es-CL')} + Mat: ${unitMaterialCLP.toLocaleString('es-CL')})
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] block">Subtotal:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${serviceSubtotal.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  )}
                </div>

                {/* Counter Buttons */}
                <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold pl-2">Cantidad:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCount(service.id, -1)}
                      disabled={service.count <= 0}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 flex items-center justify-center text-white transition-colors"
                      title="Restar 1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min={0}
                      value={service.count}
                      onChange={(e) => setCountDirect(service.id, parseInt(e.target.value) || 0)}
                      className="w-12 text-center bg-transparent font-mono font-bold text-white text-sm focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => updateCount(service.id, 1)}
                      className="w-8 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white transition-colors shadow"
                      title="Sumar 1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom / Summary Bar */}
      <div className="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-3xl p-5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-5">
        {/* Left Stats */}
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Puntos Seleccionados
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-cyan-400">{totalPointsCount}</span>
              <span className="text-xs text-slate-400">puntos / servicios</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Materiales {includeMaterials ? `(${hardwareBrand.toUpperCase()})` : '(No incluidos)'}
            </span>
            <span className="text-base font-bold font-mono text-slate-200">
              ${rawMaterialsTotal.toLocaleString('es-CL')} CLP
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
              Mano de Obra SEC
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              ${rawLaborTotal.toLocaleString('es-CL')} CLP
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-[11px] uppercase font-bold text-amber-400 block tracking-wider">
              Total Presupuesto Hogar
            </span>
            <span className="text-2xl font-black font-mono text-white">
              ${grandTotalCLP.toLocaleString('es-CL')} <span className="text-xs font-normal text-slate-400">CLP</span>
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsMaterialsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-cyan-500/30 transition-all active:scale-95"
            title="Ver y descargar lista de materiales para el cliente"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Lista Materiales</span>
          </button>

          <button
            onClick={handleDirectWhatsApp}
            disabled={totalPointsCount === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all active:scale-95"
            title="Enviar propuesta detallada por WhatsApp al cliente"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleDirectPdfDownload}
            disabled={totalPointsCount === 0 || isExportingPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all active:scale-95"
            title="Descargar presupuesto oficial en PDF vectorizado"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>{isExportingPdf ? 'Generando...' : 'Descargar PDF'}</span>
          </button>

          <button
            onClick={handleProceedToQuote}
            disabled={totalPointsCount === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
          >
            <span>Generar Contrato & Cotización Formal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Price Customization Modal */}
      {isPriceListModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    Personalizar Tarifario de Precios
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifica tus tarifas estándar de mano de obra e insumos base para servicios residenciales en Chile. Se guardarán en tu navegador.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPriceListModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-3">
                {services.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{item.title}</span>
                        <span className="text-[10px] text-cyan-400 uppercase font-semibold">
                          ({item.unit})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Mano de Obra ($ CLP)</label>
                        <input
                          type="number"
                          step={500}
                          value={item.defaultLaborCLP}
                          onChange={(e) =>
                            updateServicePrice(item.id, parseInt(e.target.value) || 0, item.defaultMaterialCLP)
                          }
                          className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Material Base ($ CLP)</label>
                        <input
                          type="number"
                          step={500}
                          value={item.defaultMaterialCLP}
                          onChange={(e) =>
                            updateServicePrice(item.id, item.defaultLaborCLP, parseInt(e.target.value) || 0)
                          }
                          className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetPricesToDefault}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Precios Sugeridos SEC</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPriceListModalOpen(false)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow transition-colors"
              >
                Listo y Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Materials Shopping List Modal */}
      <ClientMaterialsModal
        isOpen={isMaterialsModalOpen}
        onClose={() => setIsMaterialsModalOpen(false)}
        customer={customer}
        contractor={contractor}
        initialMaterials={getConsolidatedMaterials()}
        projectTitle="Instalación Domiciliaria de Enchufes y Luminarias"
      />
    </div>
  );
};
