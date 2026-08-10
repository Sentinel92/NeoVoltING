import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { ProjectPhotoGallery } from './ProjectPhotoGallery';
import {
  ElectricalProject,
  ProjectAttachment,
  ProjectScopeItem,
  ProjectType,
  ClientRecord,
  CustomerDetails,
  ContractorConfig,
  BudgetItem,
  CustomServiceType,
} from '../types';
import {
  FolderPlus,
  FileText,
  Paperclip,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Eye,
  X,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Check,
  Settings,
  Calculator,
  RefreshCw,
  Wrench,
  HelpCircle,
  Package,
  CheckSquare,
  MessageSquare,
  Camera,
  Share2,
} from 'lucide-react';
import { downloadPdfFromElement } from '../utils/pdfGenerator';
import { NeovoltLogo } from './NeovoltLogo';

interface ProjectsManagerModuleProps {
  projects: ElectricalProject[];
  setProjects: React.Dispatch<React.SetStateAction<ElectricalProject[]>>;
  clients: ClientRecord[];
  setClients: React.Dispatch<React.SetStateAction<ClientRecord[]>>;
  contractor: ContractorConfig;
  onTransferToGlobalQuote: (customer: CustomerDetails, items: BudgetItem[], laborAmount: number) => void;
  onNavigateToTab?: (tabId: string) => void;
  initialSelectedClientId?: string;
}

// Default Service Types List
const DEFAULT_SERVICE_TYPES: CustomServiceType[] = [
  {
    id: 'st_1',
    name: 'Mantención preventiva',
    description: 'Revisión técnica periódica, apriete de bornes en tablero, termografía y pruebas de aislamientos.',
    isDefault: true,
  },
  {
    id: 'st_2',
    name: 'Instalación nueva',
    description: 'Montaje de canalizaciones, cableados, nuevos centros y tableros TDA en obras nuevas.',
    isDefault: true,
  },
  {
    id: 'st_3',
    name: 'Detección de falla',
    description: 'Búsqueda y solución de fugas a tierra, cortocircuitos, caídas de tensión y sobrecargas.',
    isDefault: true,
  },
  {
    id: 'st_4',
    name: 'Cambio de accesorios',
    description: 'Reemplazo de enchufes, interruptores, módulos, dimmers y luminarias.',
    isDefault: true,
  },
  {
    id: 'st_5',
    name: 'Aumento de capacidad / Remodelación',
    description: 'Adecuación de empalme, cambio de automático general IGA y reestructuración de tablero.',
    isDefault: true,
  },
  {
    id: 'st_6',
    name: 'Revisión e Inspección Técnica SEC',
    description: 'Auditoría normativa RIC SEC, protocolo de tierras y trámite de declaración TE1.',
    isDefault: true,
  },
  {
    id: 'st_7',
    name: 'Instalación de Cámaras (CCTV)',
    description: 'Montaje de cámaras de seguridad, cableado de red o coaxial y configuración DVR/NVR.',
    isDefault: true,
  },
];

// Presets for Scope Items when selecting service types
const DEFAULT_SCOPE_PRESETS: Record<string, ProjectScopeItem[]> = {
  'Mantención preventiva': [
    {
      id: 'm1',
      description: 'Inspección técnica y reapriete de bornes de conexión en tablero TDA',
      quantity: 1,
      unitPrice: 25000,
      unit: 'global',
      category: 'MANO_DE_OBRA',
    },
    {
      id: 'm2',
      description: 'Prueba de disparo de interruptores diferenciales con inyección 30mA',
      quantity: 1,
      unitPrice: 18000,
      unit: 'global',
      category: 'REVISION_TECNICA',
    },
    {
      id: 'm3',
      description: 'Limpieza técnica con limpiacontactos y verificación térmica',
      quantity: 1,
      unitPrice: 15000,
      unit: 'global',
      category: 'MANO_DE_OBRA',
    },
  ],
  'Instalación nueva': [
    {
      id: 'n1',
      description: 'Instalación completa de centro de alumbrado / enchufe (cable EVA + ducto)',
      quantity: 10,
      unitPrice: 28000,
      unit: 'punto',
      category: 'MATERIALES',
    },
    {
      id: 'n2',
      description: 'Armado y peinado de tablero de distribución TDA 18 módulos',
      quantity: 1,
      unitPrice: 110000,
      unit: 'global',
      category: 'MANO_DE_OBRA',
    },
    {
      id: 'n3',
      description: 'Tramitación y Declaración TE1 SEC con Certificado de Inscripción',
      quantity: 1,
      unitPrice: 95000,
      unit: 'global',
      category: 'TRAMITES_SEC',
    },
  ],
  'Detección de falla': [
    {
      id: 'f1',
      description: 'Diagnóstico técnico y detección de falla de fuga a tierra / cortocircuito',
      quantity: 1,
      unitPrice: 38000,
      unit: 'global',
      category: 'REVISION_TECNICA',
    },
    {
      id: 'f2',
      description: 'Aislamiento de tramo fallado y reconexión de circuito afectado',
      quantity: 1,
      unitPrice: 32000,
      unit: 'global',
      category: 'MANO_DE_OBRA',
    },
  ],
  'Cambio de accesorios': [
    {
      id: 'a1',
      description: 'Reemplazo de Enchufe Doble 16A Embutido Bticino / Schneider',
      quantity: 6,
      unitPrice: 4890,
      unit: 'unid',
      category: 'ARTEFACTOS',
    },
    {
      id: 'a2',
      description: 'Reemplazo de Interruptor Simple / 9/12 o Doble 9/15',
      quantity: 4,
      unitPrice: 3990,
      unit: 'unid',
      category: 'ARTEFACTOS',
    },
    {
      id: 'a3',
      description: 'Mano de obra por recambio y verificación de conexiones de accesorios',
      quantity: 10,
      unitPrice: 8500,
      unit: 'punto',
      category: 'MANO_DE_OBRA',
    },
  ],
  'Instalación de Cámaras (CCTV)': [
    {
      id: 'cctv1',
      description: 'Kit de 4 Cámaras IP / Analógicas HD con DVR/NVR y Disco Duro',
      quantity: 1,
      unitPrice: 185000,
      unit: 'global',
      category: 'MATERIALES',
    },
    {
      id: 'cctv2',
      description: 'Mano de obra: Instalación, cableado estructurado y configuración de red',
      quantity: 1,
      unitPrice: 140000,
      unit: 'global',
      category: 'MANO_DE_OBRA',
    },
    {
      id: 'cctv3',
      description: 'Materiales extra: Cajas de paso, tubería PVC conduit, baluns',
      quantity: 1,
      unitPrice: 45000,
      unit: 'global',
      category: 'MATERIALES',
    },
  ],
};

export const ProjectsManagerModule: React.FC<ProjectsManagerModuleProps> = ({
  projects,
  setProjects,
  clients,
  setClients,
  contractor,
  onTransferToGlobalQuote,
  onNavigateToTab,
  initialSelectedClientId,
}) => {
  // Service Types Customization State
  const [serviceTypes, setServiceTypes] = useState<CustomServiceType[]>(() => {
    try {
      const saved = localStorage.getItem('neovolt_service_types_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error('Error loading service types:', err);
    }
    return DEFAULT_SERVICE_TYPES;
  });

  // Save Service Types to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('neovolt_service_types_v1', JSON.stringify(serviceTypes));
    } catch (err) {
      console.error('Failed to save service types:', err);
    }
  }, [serviceTypes]);

  // Service Types Manager Modal State
  const [isServiceTypesModalOpen, setIsServiceTypesModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDesc, setEditTypeDesc] = useState('');

  // Main Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State for New / Edit Project
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'client_info' | 'attachments' | 'scope_quote' | 'history'>('client_info');
  const [editingProject, setEditingProject] = useState<ElectricalProject | null>(null);

  // Budget Mode State ('WITH_MATERIALS' vs 'WITHOUT_MATERIALS')
  const [budgetMode, setBudgetMode] = useState<'WITH_MATERIALS' | 'WITHOUT_MATERIALS'>('WITH_MATERIALS');

  // Toast & Delete Confirmation States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ElectricalProject | null>(null);
  const [serviceTypeToDelete, setServiceTypeToDelete] = useState<CustomServiceType | null>(null);
  const [showResetServicesConfirm, setShowResetServicesConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Preview PDF & Gallery Modal State
  const [previewProject, setPreviewProject] = useState<ElectricalProject | null>(null);
  const [galleryProject, setGalleryProject] = useState<ElectricalProject | null>(null);
  const pdfPrintRef = useRef<HTMLDivElement>(null);

  const handleShareEmailQuote = (project: ElectricalProject) => {
    const scopeSummary = project.scopeItems
      .map(
        (item) =>
          `• ${item.description} (${item.quantity} ${item.unit || 'unid'}) - $${(
            item.quantity * item.unitPrice
          ).toLocaleString('es-CL')} CLP`
      )
      .join('\n');

    const subject = encodeURIComponent(`Cotización de Proyecto Eléctrico: ${project.title}`);
    const body = encodeURIComponent(`Estimado/a ${project.client.name},

Junto con saludar, le adjunto el resumen de su cotización eléctrica:

Código: ${project.code}
Servicio: ${project.projectType}
Dirección: ${project.client.address || 'N/A'}
${project.isFaultDiagnosis ? `\nDiagnóstico Inicial:\n${project.faultDiagnosisDetails}\n` : ''}${project.isModification ? `\nModificaciones Solicitadas:\n${project.modificationDetails}\n` : ''}
Resumen de Alcance y Trabajos:
${scopeSummary || '• Trabajos de instalación y cubicación técnica.'}

PRESUPUESTO TOTAL COTIZADO: $${project.totalPrice.toLocaleString('es-CL')} CLP

Quedamos atentos a cualquier duda o consulta.

Atentamente,
${contractor.installerName}
Licencia SEC: ${contractor.secLicense}`);

    window.open(`mailto:${project.client.email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShareWhatsAppQuote = (project: ElectricalProject) => {
    const scopeSummary = project.scopeItems
      .map(
        (item) =>
          `• ${item.description} (${item.quantity} ${item.unit || 'unid'}) - $${(
            item.quantity * item.unitPrice
          ).toLocaleString('es-CL')} CLP`
      )
      .join('\n');

    const text =
      `⚡ *COTIZACIÓN OFICIAL DE PROYECTO ELÉCTRICO NEOVOLT* ⚡\n\n` +
      `📌 *Código:* ${project.code}\n` +
      `🛠️ *Servicio:* ${project.projectType}\n` +
      `📄 *Proyecto:* ${project.title}\n` +
      `🏢 *Cliente:* ${project.client.name}\n` +
      `📍 *Dirección:* ${project.client.address || 'Chile'}\n\n` +
      (project.isFaultDiagnosis ? `⚠️ *Diagnóstico Inicial:*\n${project.faultDiagnosisDetails}\n\n` : '') +
      (project.isModification ? `🛠️ *Modificaciones Solicitadas:*\n${project.modificationDetails}\n\n` : '') +
      `📋 *Resumen de Alcance y Trabajos:*\n${
        scopeSummary || '• Trabajos de instalación y cubicación técnica.'
      }\n\n` +
      `💰 *PRESUPUESTO TOTAL COTIZADO:* $${project.totalPrice.toLocaleString('es-CL')} CLP\n\n` +
      `📄 *Informe PDF:* Puedes revisar el informe técnico PDF oficial generado por la app SEC NEOVOLT.\n` +
      `👤 *Instalador SEC:* ${contractor.installerName} (${contractor.secLicense})`;

    const rawPhone = project.client.phone ? project.client.phone.replace(/[^0-9]/g, '') : '';
    const url = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  // Project Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(initialSelectedClientId || '');
  const [projectCode, setProjectCode] = useState<string>(`PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('Mantención preventiva');
  const [projectStatus, setProjectStatus] = useState<'COTIZACION' | 'APROBADO' | 'EN_EJECUCION' | 'COMPLETADO' | 'CANCELADO'>('COTIZACION');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [isFaultDiagnosis, setIsFaultDiagnosis] = useState(false);
  const [faultDiagnosisDetails, setFaultDiagnosisDetails] = useState('');
  const [isModification, setIsModification] = useState(false);
  const [modificationDetails, setModificationDetails] = useState('');
  const [targetDeadline, setTargetDeadline] = useState('');
  const [includeTaxIVA, setIncludeTaxIVA] = useState(false);

  // Client Details Form (if adding/modifying client on the fly)
  const [clientDetails, setClientDetails] = useState<CustomerDetails>({
    name: '',
    rut: '',
    address: '',
    city: 'Santiago',
    phone: '+56 9 ',
    email: '',
    emergencyPhone: '',
    propertyType: 'Residencial',
  });

  // Attachments State
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);

  // Scope & Budget Items State
  const [scopeItems, setScopeItems] = useState<ProjectScopeItem[]>(DEFAULT_SCOPE_PRESETS['Mantención preventiva']);

  // Handle Adding New Custom Service Type
  const handleAddServiceType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const newType: CustomServiceType = {
      id: `st_${Date.now()}`,
      name: newTypeName.trim(),
      description: newTypeDesc.trim() || 'Servicio personalizado',
      isDefault: false,
    };

    setServiceTypes((prev) => [...prev, newType]);
    setNewTypeName('');
    setNewTypeDesc('');
  };

  // Handle Editing Service Type
  const handleStartEditServiceType = (st: CustomServiceType) => {
    setEditingTypeId(st.id);
    setEditTypeName(st.name);
    setEditTypeDesc(st.description || '');
  };

  const handleSaveEditServiceType = (id: string) => {
    if (!editTypeName.trim()) return;
    setServiceTypes((prev) =>
      prev.map((st) => (st.id === id ? { ...st, name: editTypeName.trim(), description: editTypeDesc.trim() } : st))
    );
    setEditingTypeId(null);
  };

  // Handle Deleting Custom Service Type
  const handleDeleteServiceType = (id: string) => {
    setServiceTypes((prev) => prev.filter((st) => st.id !== id));
    showToast('Tipo de servicio eliminado.');
  };

  // Handle Reset Service Types to Defaults
  const handleResetServiceTypes = () => {
    setServiceTypes(DEFAULT_SERVICE_TYPES);
    showToast('Tipos de servicio restablecidos a valores por defecto.');
  };

  // Open Modal for New Project
  const handleOpenNewProjectModal = (preselectedClientId?: string) => {
    setEditingProject(null);
    const code = `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setProjectCode(code);
    setProjectTitle('');
    
    // Default to first service type
    const initialType = serviceTypes[0]?.name || 'Mantención preventiva';
    setSelectedServiceType(initialType);
    setProjectStatus('COTIZACION');
    setProjectDescription('');
    setProjectNotes('');
    setIsFaultDiagnosis(false);
    setFaultDiagnosisDetails('');
    setIsModification(false);
    setModificationDetails('');
    setTargetDeadline(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setIncludeTaxIVA(false);
    setAttachments([]);
    setBudgetMode('WITH_MATERIALS');

    // Load initial preset scope if available
    const preset = DEFAULT_SCOPE_PRESETS[initialType] || DEFAULT_SCOPE_PRESETS['Mantención preventiva'];
    setScopeItems([...preset]);

    const targetClientId = preselectedClientId || selectedClientId || (clients[0] ? clients[0].id : '');
    setSelectedClientId(targetClientId);

    if (targetClientId) {
      const foundClient = clients.find((c) => c.id === targetClientId);
      if (foundClient) {
        setClientDetails({
          name: foundClient.name,
          rut: foundClient.rut,
          address: foundClient.address,
          city: foundClient.city || 'Santiago',
          phone: foundClient.phone,
          email: foundClient.email,
          emergencyPhone: '',
          propertyType: foundClient.propertyType || 'Residencial',
        });
      }
    } else {
      setClientDetails({
        name: '',
        rut: '',
        address: '',
        city: 'Santiago',
        phone: '+56 9 ',
        email: '',
        emergencyPhone: '',
        propertyType: 'Residencial',
      });
    }

    setActiveModalTab('client_info');
    setIsModalOpen(true);
  };

  // Open Modal for Editing Project
  const handleOpenEditProjectModal = (project: ElectricalProject) => {
    setEditingProject(project);
    setProjectCode(project.code);
    setProjectTitle(project.title);
    setSelectedServiceType(project.projectType || 'Mantención preventiva');
    setProjectStatus(project.status);
    setProjectDescription(project.description);
    setProjectNotes(project.notes || '');
    setIsFaultDiagnosis(project.isFaultDiagnosis || false);
    setFaultDiagnosisDetails(project.faultDiagnosisDetails || '');
    setIsModification(project.isModification || false);
    setModificationDetails(project.modificationDetails || '');
    setTargetDeadline(project.targetDeadline || '');
    setIncludeTaxIVA(project.includeTaxIVA);
    setClientDetails({ ...project.client });
    setAttachments([...project.attachments]);
    setScopeItems([...project.scopeItems]);

    // Check if materials are present to detect budget mode
    const hasMaterials = project.scopeItems.some(
      (i) => i.category === 'MATERIALES' || i.category === 'ARTEFACTOS' || i.category === 'PROTECCIONES'
    );
    setBudgetMode(hasMaterials ? 'WITH_MATERIALS' : 'WITHOUT_MATERIALS');

    // Check matching client id
    const matchedClient = clients.find((c) => c.email === project.client.email || c.name === project.client.name);
    setSelectedClientId(matchedClient ? matchedClient.id : 'NEW');

    setActiveModalTab('client_info');
    setIsModalOpen(true);
  };

  // Handle Client Selection Change in Modal
  const handleClientSelectChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'NEW') {
      setClientDetails({
        name: '',
        rut: '',
        address: '',
        city: 'Santiago',
        phone: '+56 9 ',
        email: '',
        emergencyPhone: '',
        propertyType: 'Residencial',
      });
    } else {
      const found = clients.find((c) => c.id === clientId);
      if (found) {
        setClientDetails({
          name: found.name,
          rut: found.rut,
          address: found.address,
          city: found.city || 'Santiago',
          phone: found.phone,
          email: found.email,
          emergencyPhone: '',
          propertyType: found.propertyType || 'Residencial',
        });
      }
    }
  };

  // Handle Service Type Change & Offer Presets
  const handleServiceTypeChange = (typeName: string) => {
    setSelectedServiceType(typeName);
    const preset = DEFAULT_SCOPE_PRESETS[typeName];
    if (preset && preset.length > 0) {
      setScopeItems([...preset]);
      showToast(`Cargados ítems predeterminados para ${typeName}`);
    }
  };

  // Handle File Upload Attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: ProjectAttachment = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          name: file.name,
          sizeBytes: file.size,
          type: file.type || 'document',
          dataUrl: dataUrl,
          uploadedAt: new Date().toLocaleDateString('es-CL'),
          notes: '',
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  // Scope Items Handlers
  const handleAddMaterialItem = () => {
    const newItem: ProjectScopeItem = {
      id: Date.now().toString(),
      description: 'Nuevo Material / Insumo',
      quantity: 1,
      unitPrice: 5000,
      unit: 'unid',
      category: 'MATERIALES',
    };
    setScopeItems([...scopeItems, newItem]);
  };

  const handleAddLaborItem = () => {
    const newItem: ProjectScopeItem = {
      id: Date.now().toString(),
      description: 'Mano de Obra / Servicio Técnico',
      quantity: 1,
      unitPrice: 25000,
      unit: 'global',
      category: 'MANO_DE_OBRA',
    };
    setScopeItems([...scopeItems, newItem]);
  };

  const handleUpdateScopeItem = (id: string, field: keyof ProjectScopeItem, value: any) => {
    setScopeItems(
      scopeItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveScopeItem = (id: string) => {
    setScopeItems(scopeItems.filter((item) => item.id !== id));
  };

  // Calculate totals separated by Materials & Labor using React useMemo for instant recalculation
  const { totalMaterials, totalLabor, subtotalNeto, ivaMonto, totalConIva, materialItems, laborItems } = useMemo(() => {
    const matList = scopeItems.filter(
      (i) => i.category === 'MATERIALES' || i.category === 'ARTEFACTOS' || i.category === 'PROTECCIONES'
    );
    const labList = scopeItems.filter(
      (i) => i.category === 'MANO_DE_OBRA' || i.category === 'REVISION_TECNICA' || i.category === 'TRAMITES_SEC'
    );

    const mTotal = budgetMode === 'WITH_MATERIALS' 
      ? matList.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)
      : 0;

    const lTotal = labList.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

    const sub = mTotal + lTotal;
    const iva = includeTaxIVA ? Math.round(sub * 0.19) : 0;
    const tot = sub + iva;

    return {
      totalMaterials: mTotal,
      totalLabor: lTotal,
      subtotalNeto: sub,
      ivaMonto: iva,
      totalConIva: tot,
      materialItems: matList,
      laborItems: labList,
    };
  }, [scopeItems, budgetMode, includeTaxIVA]);

  // Save Project Handler
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) {
      alert('Por favor ingrese un título para el proyecto.');
      return;
    }
    if (!clientDetails.name.trim() || !clientDetails.address.trim()) {
      alert('Por favor complete el nombre y dirección del cliente.');
      return;
    }

    // Save client to clients database if new
    if (selectedClientId === 'NEW' || !clients.some((c) => c.email === clientDetails.email && c.name === clientDetails.name)) {
      const newClientRecord: ClientRecord = {
        id: Date.now().toString(),
        name: clientDetails.name,
        rut: clientDetails.rut || '12.345.678-9',
        email: clientDetails.email || '',
        phone: clientDetails.phone || '',
        address: clientDetails.address || '',
        city: clientDetails.city || 'Santiago',
        propertyType: clientDetails.propertyType || 'Residencial',
        notes: `Cliente registrado desde Proyecto ${projectCode}`,
        createdAt: new Date().toLocaleDateString('es-CL'),
      };
      setClients([newClientRecord, ...clients]);
    }

    const now = new Date().toLocaleDateString('es-CL');

    // If budgetMode is WITHOUT_MATERIALS, filter out materials items or keep only labor
    const finalScopeItems = budgetMode === 'WITHOUT_MATERIALS' ? laborItems : scopeItems;

    if (editingProject) {
      const newVersion = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('es-CL'),
        modifiedBy: 'Usuario Actual',
        changesSummary: `Actualización de presupuesto - Total anterior: ${editingProject.totalPrice} - Total nuevo: ${totalConIva}`,
        materialsPriceOld: editingProject.materialsPrice,
        materialsPriceNew: totalMaterials,
        laborPriceOld: editingProject.laborPrice,
        laborPriceNew: totalLabor,
        scopeItemsOld: [...editingProject.scopeItems],
      };
      
      const history = editingProject.versionHistory ? [...editingProject.versionHistory, newVersion] : [newVersion];

      const updated: ElectricalProject = {
        ...editingProject,
        code: projectCode,
        title: projectTitle,
        projectType: selectedServiceType as ProjectType,
        status: projectStatus,
        client: { ...clientDetails },
        description: projectDescription,
        isFaultDiagnosis,
        faultDiagnosisDetails,
        isModification,
        modificationDetails,
        attachments: [...attachments],
        scopeItems: [...finalScopeItems],
        materialsPrice: totalMaterials,
        laborPrice: totalLabor,
        totalPrice: totalConIva,
        includeTaxIVA: includeTaxIVA,
        notes: projectNotes,
        updatedAt: now,
        targetDeadline: targetDeadline,
        versionHistory: history
      };
      setProjects(projects.map((p) => (p.id === editingProject.id ? updated : p)));
    } else {
      const created: ElectricalProject = {
        id: Date.now().toString(),
        code: projectCode,
        title: projectTitle,
        projectType: selectedServiceType as ProjectType,
        status: projectStatus,
        client: { ...clientDetails },
        description: projectDescription,
        isFaultDiagnosis,
        faultDiagnosisDetails,
        isModification,
        modificationDetails,
        attachments: [...attachments],
        scopeItems: [...finalScopeItems],
        materialsPrice: totalMaterials,
        laborPrice: totalLabor,
        totalPrice: totalConIva,
        includeTaxIVA: includeTaxIVA,
        notes: projectNotes,
        createdAt: now,
        updatedAt: now,
        targetDeadline: targetDeadline,
      };
      setProjects([created, ...projects]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    const found = projects.find((p) => p.id === id);
    if (found) {
      setProjectToDelete(found);
    }
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    const deletedTitle = projectToDelete.title;
    setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
    showToast(`Proyecto "${deletedTitle}" eliminado correctamente.`);
    setProjectToDelete(null);
    if (editingProject && editingProject.id === projectToDelete.id) {
      setIsModalOpen(false);
      setEditingProject(null);
    }
  };

  // Transfer Project Scope to Global Cotizador Tab
  const handleTransferToGlobalQuoteClick = (project: ElectricalProject) => {
    const budgetItems: BudgetItem[] = project.scopeItems.map((item) => ({
      id: item.id,
      name: `${item.description} (${item.unit.toUpperCase()})`,
      quantity: item.quantity,
      price: item.unitPrice,
      category: item.category === 'MANO_DE_OBRA' ? 'MANO DE OBRA' : item.category === 'PROTECCIONES' ? 'PROTECCIONES' : 'MATERIALES',
    }));

    onTransferToGlobalQuote(project.client, budgetItems, project.laborPrice);
    if (onNavigateToTab) {
      onNavigateToTab('quote');
    }
  };

  // PDF Export for Project Quote
  const handleExportPdf = (project: ElectricalProject) => {
    setPreviewProject(project);
    setTimeout(async () => {
      if (pdfPrintRef.current) {
        await downloadPdfFromElement(pdfPrintRef.current, {
          filename: `Cotizacion_${project.code}_${project.client.name.replace(/\s+/g, '_')}.pdf`,
          format: 'letter',
          margin: 10,
        });
      }
    }, 300);
  };

  // Filtering Projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.rut?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || p.projectType === filterType;
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: ElectricalProject['status']) => {
    switch (status) {
      case 'COTIZACION':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Cotización</span>;
      case 'APROBADO':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Aprobado</span>;
      case 'EN_EJECUCION':
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Zap className="w-3 h-3 animate-pulse" /> En Ejecución</span>;
      case 'COMPLETADO':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Completado</span>;
      case 'CANCELADO':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"><X className="w-3 h-3" /> Cancelado</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-2xl">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Gestor de Proyectos & Servicios Eléctricos</span>
                  <span className="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                    Multiservicio
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Crea proyectos para instalaciones, mantenciones, detección de fallas y cambios de accesorios con presupuestos personalizables con/sin materiales.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsServiceTypesModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-3 rounded-2xl shadow transition-all active:scale-95"
              title="Configurar Tipos de Servicios"
            >
              <Settings className="w-4 h-4 text-fuchsia-400" />
              <span>Tipos de Servicios ({serviceTypes.length})</span>
            </button>

            <button
              onClick={() => handleOpenNewProjectModal()}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-lg shadow-fuchsia-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por proyecto, código, cliente o RUT..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="ALL">Todos los Tipos de Servicios</option>
              {serviceTypes.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="COTIZACION">⏳ En Cotización</option>
              <option value="APROBADO">✅ Aprobado</option>
              <option value="EN_EJECUCION">⚡ En Ejecución</option>
              <option value="COMPLETADO">🏆 Completado</option>
              <option value="CANCELADO">❌ Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* PROJECTS LIST GRID */}
      {filteredProjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <FolderPlus className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-white">No hay proyectos registrados</h3>
            <p className="text-xs text-slate-400">
              Crea proyectos para mantención preventiva, instalaciones nuevas, detección de fallas o cambios de accesorios con presupuestos a medida.
            </p>
          </div>
          <button
            onClick={() => handleOpenNewProjectModal()}
            className="inline-flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Proyecto Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider block">
                      {project.code}
                    </span>
                    <h3 className="text-sm font-extrabold text-white leading-snug group-hover:text-fuchsia-300 transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  <div className="shrink-0">{getStatusBadge(project.status)}</div>
                </div>

                {/* Scope & Client Info */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <Users className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-200">{project.client.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{project.client.address}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-950/30 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between">
                    <span className="font-semibold text-fuchsia-300 flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      <span>{project.projectType}</span>
                    </span>
                    <span className="font-mono text-slate-300 font-bold">{project.scopeItems.length} ítems</span>
                  </div>

                  {project.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">
                      "{project.description}"
                    </p>
                  )}

                  {project.isFaultDiagnosis && (
                    <div className="bg-rose-950/20 border border-rose-900/50 p-2 rounded-lg mt-1">
                      <span className="text-[10px] font-bold text-rose-400 block mb-0.5">⚠️ Requiere Diagnóstico</span>
                      <p className="text-[10px] text-rose-200 line-clamp-2">{project.faultDiagnosisDetails || 'Diagnóstico general requerido.'}</p>
                    </div>
                  )}

                  {project.isModification && (
                    <div className="bg-emerald-950/20 border border-emerald-900/50 p-2 rounded-lg mt-1">
                      <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">🛠️ Modificaciones Solicitadas</span>
                      <p className="text-[10px] text-emerald-200 line-clamp-2">{project.modificationDetails || 'Cambios o accesorios solicitados.'}</p>
                    </div>
                  )}

                  {/* Materials vs Labor Breakdown Badge */}
                  <div className="flex items-center justify-between gap-2 text-[10px] pt-1">
                    <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400">
                      Mat: <strong className="text-slate-200 font-mono">${(project.materialsPrice || 0).toLocaleString('es-CL')}</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400">
                      M.O: <strong className="text-slate-200 font-mono">${(project.laborPrice || 0).toLocaleString('es-CL')}</strong>
                    </span>
                  </div>

                  {/* Attachments Counter */}
                  {project.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg w-fit">
                      <Paperclip className="w-3 h-3" />
                      <span>{project.attachments.length} archivo(s) adjunto(s)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Total & Actions */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Cotizado:</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    ${project.totalPrice.toLocaleString('es-CL')} CLP
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  <button
                    onClick={() => handleShareWhatsAppQuote(project)}
                    className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 font-bold py-1.5 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                    title="Enviar resumen y PDF por WhatsApp"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleShareEmailQuote(project)}
                    className="bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/60 font-bold py-1.5 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                    title="Enviar resumen por Email"
                  >
                    <Mail className="w-3 h-3 text-blue-400" />
                    <span className="hidden sm:inline">Email</span>
                  </button>

                  <button
                    onClick={() => handleExportPdf(project)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1.5 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1"
                    title="Exportar Cotización PDF"
                  >
                    <Printer className="w-3 h-3 text-fuchsia-400" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    onClick={() => setGalleryProject(project)}
                    className="bg-slate-800 hover:bg-slate-700 text-fuchsia-300 border border-fuchsia-800/40 font-bold py-1.5 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1"
                    title="Ver Galería de Fotos del Proyecto"
                  >
                    <Camera className="w-3 h-3 text-fuchsia-400" />
                    <span className="hidden sm:inline">Fotos ({project.attachments?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => handleTransferToGlobalQuoteClick(project)}
                    className="bg-fuchsia-950/80 hover:bg-fuchsia-900 text-fuchsia-300 border border-fuchsia-800/50 font-bold py-1.5 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1"
                    title="Transferir a Cotizador Global"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Cotizar</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditProjectModal(project)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1.5 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1"
                    title="Editar proyecto"
                  >
                    <Edit3 className="w-3 h-3 text-sky-400" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-bold py-1.5 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CONFIGURACION DE TIPOS DE SERVICIOS */}
      {isServiceTypesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-fuchsia-600/20 text-fuchsia-400 rounded-2xl border border-fuchsia-500/30">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Configuración de Tipos de Servicios</h2>
                  <p className="text-xs text-slate-400">
                    Define y edita la lista de servicios seleccionables para proyectos y cotizaciones.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsServiceTypesModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form to Add New Service Type */}
            <form onSubmit={handleAddServiceType} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-fuchsia-400" />
                <span>Añadir Nuevo Tipo de Servicio</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Nombre servicio (ej: Mantención preventiva, Detección de falla)"
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                />

                <input
                  type="text"
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  placeholder="Descripción breve del trabajo o alcance..."
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar a la Lista</span>
                </button>
              </div>
            </form>

            {/* List of Defined Service Types */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Lista de Tipos de Servicios Disponibles ({serviceTypes.length}):</span>
                <button
                  onClick={handleResetServiceTypes}
                  type="button"
                  className="text-[11px] text-slate-400 hover:text-fuchsia-400 flex items-center gap-1 underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restablecer por defecto</span>
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {serviceTypes.map((st) => (
                  <div
                    key={st.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm"
                  >
                    {editingTypeId === st.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editTypeName}
                          onChange={(e) => setEditTypeName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                        />
                        <input
                          type="text"
                          value={editTypeDesc}
                          onChange={(e) => setEditTypeDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingTypeId(null)}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditServiceType(st.id)}
                            className="text-[10px] bg-fuchsia-600 text-white font-bold px-2.5 py-1 rounded-lg"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-white">{st.name}</h4>
                            {st.isDefault && (
                              <span className="bg-slate-800 text-slate-400 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">
                                Base
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">{st.description}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditServiceType(st)}
                            className="text-slate-400 hover:text-sky-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                            title="Editar Tipo de Servicio"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteServiceType(st.id)}
                            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                            title="Eliminar Tipo de Servicio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsServiceTypesModalOpen(false)}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all"
              >
                Listo / Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT PROJECT WITH BUDGET CALCULATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-fuchsia-600/20 text-fuchsia-400 rounded-xl border border-fuchsia-500/30">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    {editingProject ? `Editar Proyecto: ${editingProject.code}` : 'Crear Nuevo Proyecto / Servicio'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Asocia cliente, adjunta requerimientos y calcula presupuestos a medida con o sin materiales.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveModalTab('client_info')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  activeModalTab === 'client_info'
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Cliente y Servicio</span>
              </button>

              <button
                onClick={() => setActiveModalTab('attachments')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  activeModalTab === 'attachments'
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>2. Adjuntos & Fotos ({attachments.length})</span>
              </button>

              <button
                onClick={() => setActiveModalTab('scope_quote')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                  activeModalTab === 'scope_quote'
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>3. Calculador de Presupuesto (${totalConIva.toLocaleString('es-CL')})</span>
              </button>
              {editingProject && (
                <button
                  type="button"
                  onClick={() => setActiveModalTab('history')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                    activeModalTab === 'history'
                      ? 'bg-fuchsia-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>4. Historial de Versiones</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProject} className="space-y-6">
              {/* TAB 1: CLIENT & PROJECT INFO */}
              {activeModalTab === 'client_info' && (
                <div className="space-y-4">
                  {/* Select Client */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-fuchsia-400" />
                        <span>Seleccionar o Registrar Cliente</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <select
                          value={selectedClientId}
                          onChange={(e) => handleClientSelectChange(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                        >
                          <option value="">-- Seleccionar de la Base de Datos --</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.rut}) - {c.city}
                            </option>
                          ))}
                          <option value="NEW">➕ Registrar Nuevo Cliente</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={clientDetails.name}
                          onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                          placeholder="Nombre Completo / Razon Social *"
                          required
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <input
                        type="text"
                        value={clientDetails.rut || ''}
                        onChange={(e) => setClientDetails({ ...clientDetails, rut: e.target.value })}
                        placeholder="RUT (ej: 15.482.910-3)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                      />

                      <input
                        type="text"
                        value={clientDetails.address}
                        onChange={(e) => setClientDetails({ ...clientDetails, address: e.target.value })}
                        placeholder="Dirección Inmueble *"
                        required
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                      />

                      <input
                        type="text"
                        value={clientDetails.phone}
                        onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                        placeholder="Teléfono (+56 9 ...)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Código Proyecto:</label>
                      <input
                        type="text"
                        value={projectCode}
                        onChange={(e) => setProjectCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-fuchsia-400 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Estado Actual:</label>
                      <select
                        value={projectStatus}
                        onChange={(e) => setProjectStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="COTIZACION">⏳ En Cotización</option>
                        <option value="APROBADO">✅ Aprobado por Cliente</option>
                        <option value="EN_EJECUCION">⚡ En Ejecución / Trabajo</option>
                        <option value="COMPLETADO">🏆 Completado & Entregado</option>
                        <option value="CANCELADO">❌ Cancelado</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Título del Trabajo / Proyecto *:</label>
                      <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="Ej: Mantención preventiva tablero, Detección de falla o Cambio de accesorios"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>

                    {/* SELECT DYNAMIC SERVICE TYPE */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-300">Tipo de Servicio Personalizado:</label>
                        <button
                          type="button"
                          onClick={() => setIsServiceTypesModalOpen(true)}
                          className="text-[10px] text-fuchsia-400 hover:underline flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Editar lista</span>
                        </button>
                      </div>
                      <select
                        value={selectedServiceType}
                        onChange={(e) => handleServiceTypeChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-fuchsia-300 font-bold"
                      >
                        {serviceTypes.map((st) => (
                          <option key={st.id} value={st.name}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                      {serviceTypes.find((s) => s.name === selectedServiceType)?.description && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          {serviceTypes.find((s) => s.name === selectedServiceType)?.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Fecha Estimada de Entrega:</label>
                      <input
                        type="date"
                        value={targetDeadline}
                        onChange={(e) => setTargetDeadline(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Descripción / Solicitud del Cliente:</label>
                      <textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        rows={3}
                        placeholder="Describe la necesidad del cliente: mantención preventiva, falla en automáticos, cambio de interruptores, etc."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                      ></textarea>
                    </div>

                    {/* NEW: Fault Diagnosis Fields */}
                    <div className="sm:col-span-2 space-y-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isFaultDiagnosis}
                          onChange={(e) => setIsFaultDiagnosis(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-fuchsia-600 focus:ring-fuchsia-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">
                          Requiere Diagnóstico / Es por falla
                        </span>
                      </label>

                      {isFaultDiagnosis && (
                        <textarea
                          value={faultDiagnosisDetails}
                          onChange={(e) => setFaultDiagnosisDetails(e.target.value)}
                          rows={2}
                          placeholder="Ingresa el diagnóstico inicial (ej: 'Cortocircuito en enchufe de cocina', 'Diferencial salta recurrentemente')."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-fuchsia-100 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                        ></textarea>
                      )}
                    </div>

                    {/* NEW: Modification/Changes Fields */}
                    <div className="sm:col-span-2 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isModification}
                          onChange={(e) => setIsModification(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">
                          Incluye Modificaciones / Cambios
                        </span>
                      </label>

                      {isModification && (
                        <textarea
                          value={modificationDetails}
                          onChange={(e) => setModificationDetails(e.target.value)}
                          rows={2}
                          placeholder="Detalla los cambios (ej: 'Cambiar 3 enchufes simples a dobles', 'Agregar lámpara en pasillo', 'Instalar 2 cámaras')."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-emerald-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        ></textarea>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTACHMENTS & DOCUMENTS */}
              {activeModalTab === 'attachments' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border-2 border-dashed border-slate-800 hover:border-fuchsia-500/50 rounded-2xl p-6 text-center space-y-3 transition-colors">
                    <Upload className="w-8 h-8 text-fuchsia-400 mx-auto animate-bounce" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Adjuntar Archivos, Planos o Fotos del Trabajo</h4>
                      <p className="text-[11px] text-slate-400">
                        Sube imágenes del tablero actual, fotos de artefactos a reemplazar, bocetos, planos o documentos del cliente.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer shadow transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Seleccionar Archivos</span>
                      <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  {/* List of Attachments */}
                  {attachments.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs italic">
                      No hay archivos adjuntos aún para este proyecto.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {att.type.startsWith('image/') ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-fuchsia-400 shrink-0 font-bold text-xs">
                                PDF
                              </div>
                            )}
                            <div className="truncate text-xs">
                              <div className="font-bold text-slate-200 truncate">{att.name}</div>
                              <div className="text-[10px] text-slate-500">
                                {Math.round(att.sizeBytes / 1024)} KB - {att.uploadedAt}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors shrink-0"
                            title="Eliminar adjunto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BUDGET CALCULATOR (CON / SIN MATERIALES) */}
              {activeModalTab === 'scope_quote' && (
                <div className="space-y-5">
                  {/* MODE SELECTOR TOGGLE: CON MATERIALES VS SIN MATERIALES */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-fuchsia-400" />
                        <span>Modalidad de Calculador de Presupuesto:</span>
                      </span>

                      <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setBudgetMode('WITH_MATERIALS')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                            budgetMode === 'WITH_MATERIALS'
                              ? 'bg-fuchsia-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Con Materiales</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBudgetMode('WITHOUT_MATERIALS')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                            budgetMode === 'WITHOUT_MATERIALS'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Sin Materiales (Solo M.O.)</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {budgetMode === 'WITH_MATERIALS'
                        ? 'Permite desglosar y editar valores de lista de materiales/artefactos e incluir el costo de mano de obra.'
                        : 'Calcula exclusivamente la mano de obra / servicio técnico sin incluir materiales ni insumos.'}
                    </p>
                  </div>

                  {/* SECTION 1: MATERIALS ITEMIZER (Visible ONLY when budgetMode === 'WITH_MATERIALS') */}
                  {budgetMode === 'WITH_MATERIALS' && (
                    <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400">
                          <Package className="w-4 h-4" />
                          <span>1. Materiales e Insumos Editables</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddMaterialItem}
                          className="bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-[11px] font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir Material</span>
                        </button>
                      </div>

                      {materialItems.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-xs italic">
                          No hay materiales agregados. Haz clic en "Añadir Material" para incluir insumos.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {/* Column Headers */}
                          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-900/50 rounded-lg">
                            <span className="col-span-4">Descripción del Insumo</span>
                            <span className="col-span-2">Categoría</span>
                            <span className="col-span-2 text-center">Cantidad</span>
                            <span className="col-span-2 text-right">Precio Unit. ($)</span>
                            <span className="col-span-1 text-right">Subtotal</span>
                            <span className="col-span-1 text-right"></span>
                          </div>

                          {materialItems.map((item) => {
                            const subtotalItem = item.quantity * item.unitPrice;
                            return (
                              <div
                                key={item.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 grid grid-cols-12 gap-2 items-center text-xs"
                              >
                                <div className="col-span-4">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleUpdateScopeItem(item.id, 'description', e.target.value)}
                                    placeholder="Descripción del material"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <select
                                    value={item.category}
                                    onChange={(e) => handleUpdateScopeItem(item.id, 'category', e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[10px] text-emerald-400 font-bold"
                                  >
                                    <option value="MATERIALES">Materiales</option>
                                    <option value="ARTEFACTOS">Artefactos</option>
                                    <option value="PROTECCIONES">Protecciones</option>
                                  </select>
                                </div>

                                <div className="col-span-2 flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateScopeItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                    min={1}
                                    className="w-12 bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 text-xs text-white text-center font-bold"
                                  />
                                  <span className="text-[10px] text-slate-500 font-mono truncate">{item.unit}</span>
                                </div>

                                <div className="col-span-2 relative">
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">$</span>
                                  <input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => handleUpdateScopeItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                                    step={100}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-1.5 py-1 text-xs text-emerald-400 font-bold text-right"
                                  />
                                </div>

                                <div className="col-span-1 text-right font-mono text-[11px] font-extrabold text-emerald-400 truncate">
                                  ${subtotalItem.toLocaleString('es-CL')}
                                </div>

                                <div className="col-span-1 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveScopeItem(item.id)}
                                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                    title="Eliminar ítem"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs font-bold text-emerald-400 pt-1 border-t border-slate-800/80">
                        <span className="text-slate-400 font-normal text-[11px]">Subtotal acumulado de materiales e insumos:</span>
                        <span>Total Materiales: ${totalMaterials.toLocaleString('es-CL')} CLP</span>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: LABOR & SERVICES ITEMIZER */}
                  <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-fuchsia-400">
                        <Wrench className="w-4 h-4" />
                        <span>{budgetMode === 'WITH_MATERIALS' ? '2. Mano de Obra y Servicios' : 'Desglose de Mano de Obra y Servicios'}</span>
                        <span className="text-[10px] font-normal bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 px-2 py-0.5 rounded-full">
                          ⚡ Recálculo Automático
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddLaborItem}
                        className="bg-fuchsia-600/20 text-fuchsia-300 hover:bg-fuchsia-600 hover:text-white border border-fuchsia-500/30 text-[11px] font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Servicio / M.O.</span>
                      </button>
                    </div>

                    {laborItems.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-xs italic">
                        No hay ítems de mano de obra. Haz clic en "Añadir Servicio / M.O." para costear la mano de obra.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {/* Column Headers */}
                        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-900/50 rounded-lg">
                          <span className="col-span-4">Descripción del Servicio</span>
                          <span className="col-span-2">Categoría</span>
                          <span className="col-span-2 text-center">Cantidad</span>
                          <span className="col-span-2 text-right">Precio Unit. ($)</span>
                          <span className="col-span-1 text-right">Subtotal</span>
                          <span className="col-span-1 text-right"></span>
                        </div>

                        {laborItems.map((item) => {
                          const subtotalLaborItem = item.quantity * item.unitPrice;
                          return (
                            <div
                              key={item.id}
                              className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 grid grid-cols-12 gap-2 items-center text-xs"
                            >
                              <div className="col-span-4">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleUpdateScopeItem(item.id, 'description', e.target.value)}
                                  placeholder="Descripción del servicio o tarea"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                                />
                              </div>

                              <div className="col-span-2">
                                <select
                                  value={item.category}
                                  onChange={(e) => handleUpdateScopeItem(item.id, 'category', e.target.value as any)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[10px] text-fuchsia-300 font-bold"
                                >
                                  <option value="MANO_DE_OBRA">Mano de Obra</option>
                                  <option value="REVISION_TECNICA">Revisión SEC</option>
                                  <option value="TRAMITES_SEC">Trámites SEC</option>
                                </select>
                              </div>

                              <div className="col-span-2 flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateScopeItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                  min={1}
                                  className="w-10 bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 text-xs text-white text-center font-bold"
                                />
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => handleUpdateScopeItem(item.id, 'unit', e.target.value)}
                                  className="w-10 bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 text-[10px] text-slate-400 font-mono text-center"
                                />
                              </div>

                              <div className="col-span-2 relative">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">$</span>
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => handleUpdateScopeItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                                  step={500}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-1.5 py-1 text-xs text-fuchsia-300 font-bold text-right"
                                />
                              </div>

                              <div className="col-span-1 text-right font-mono text-[11px] font-extrabold text-fuchsia-400 truncate">
                                ${subtotalLaborItem.toLocaleString('es-CL')}
                              </div>

                              <div className="col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveScopeItem(item.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                  title="Eliminar ítem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs font-bold text-fuchsia-400 pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400 font-normal text-[11px]">Subtotal acumulado de servicios:</span>
                      <span>Total Mano de Obra: ${totalLabor.toLocaleString('es-CL')} CLP</span>
                    </div>
                  </div>

                  {/* TOTAL BREAKDOWN SUMMARY CARD */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    {budgetMode === 'WITH_MATERIALS' && (
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Total Materiales:</span>
                        <span className="font-mono text-slate-200">${totalMaterials.toLocaleString('es-CL')} CLP</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Total Mano de Obra / Servicios:</span>
                      <span className="font-mono text-slate-200">${totalLabor.toLocaleString('es-CL')} CLP</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 font-bold pt-1 border-t border-slate-800/80">
                      <span>Subtotal Neto:</span>
                      <span className="font-mono">${subtotalNeto.toLocaleString('es-CL')} CLP</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeTaxIVA}
                          onChange={(e) => setIncludeTaxIVA(e.target.checked)}
                          className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                        />
                        <span>Agregar IVA (19% Factura):</span>
                      </label>
                      <span className="font-mono font-bold">${ivaMonto.toLocaleString('es-CL')} CLP</span>
                    </div>

                    <div className="flex items-center justify-between text-base font-extrabold text-emerald-400 pt-2 border-t border-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-fuchsia-400" />
                        <span>Monto Total Presupuestado:</span>
                      </span>
                      <span className="text-lg font-mono">${totalConIva.toLocaleString('es-CL')} CLP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Navigation / Submit Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                
              {/* TAB 4: VERSION HISTORY */}
              {activeModalTab === 'history' && editingProject && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-fuchsia-400" />
                      Historial de Modificaciones
                    </h3>
                    
                    {!editingProject.versionHistory || editingProject.versionHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-6">
                        No hay historial de versiones para este proyecto.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {editingProject.versionHistory.map((version, idx) => (
                          <div key={version.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-400">Versión {idx + 1}</span>
                              <p className="text-slate-300">{version.changesSummary}</p>
                              <p className="text-[10px] text-slate-500">
                                Fecha: {version.timestamp} • Editado por: {version.modifiedBy}
                              </p>
                            </div>
                            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 shrink-0 self-start sm:self-auto min-w-[150px]">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-slate-400">Materiales:</span>
                                <span className="text-white font-mono">
                                  ${version.materialsPriceOld.toLocaleString('es-CL')} {"->"} ${version.materialsPriceNew.toLocaleString('es-CL')}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Mano de Obra:</span>
                                <span className="text-white font-mono">
                                  ${version.laborPriceOld.toLocaleString('es-CL')} {"->"} ${version.laborPriceNew.toLocaleString('es-CL')}
                                </span>
                              </div>
                              {version.scopeItemsOld && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('¿Estás seguro de revertir la cubicación a esta versión? Perderás los cambios actuales que no hayas guardado.')) {
                                      setScopeItems([...version.scopeItemsOld!]);
                                      setActiveModalTab('scope_quote');
                                      showToast('Cubicación revertida correctamente. Revisa el calculador y guarda los cambios.');
                                    }
                                  }}
                                  className="mt-2 w-full flex items-center justify-center gap-1 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-300 border border-fuchsia-500/30 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Revertir a esta versión
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
<div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>

                  {editingProject && (
                    <button
                      type="button"
                      onClick={() => setProjectToDelete(editingProject)}
                      className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Eliminar Proyecto</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeModalTab !== 'scope_quote' ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveModalTab(activeModalTab === 'client_info' ? 'attachments' : 'scope_quote')
                      }
                      className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      <span>Siguiente paso</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-fuchsia-600/30 transition-all active:scale-95"
                    >
                      <span>{editingProject ? 'Guardar Cambios' : 'Guardar Proyecto & Cotización'}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT / PDF SHEET FOR PROJECT QUOTATION */}
      {previewProject && (
        <div className="hidden">
          <div ref={pdfPrintRef} className="p-8 bg-white text-slate-900 space-y-6 max-w-2xl mx-auto font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">COTIZACIÓN DE SERVICIO</h1>
                <p className="text-xs font-bold text-fuchsia-600 font-mono">
                  {previewProject.code} - {previewProject.createdAt}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">{contractor.companyName}</div>
                <div className="text-xs text-slate-600">Licencia SEC: {contractor.secLicense} ({contractor.secClass})</div>
                <div className="text-xs text-slate-600">{contractor.phone} | {contractor.senderEmail}</div>
              </div>
            </div>

            {/* Client & Scope Details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-100 p-4 rounded-xl border border-slate-300 text-xs">
              <div>
                <div className="font-bold text-slate-500 uppercase text-[10px]">CLIENTE:</div>
                <div className="font-extrabold text-slate-900">{previewProject.client.name}</div>
                <div>RUT: {previewProject.client.rut || 'N/A'}</div>
                <div>Dirección: {previewProject.client.address}</div>
                <div>Teléfono: {previewProject.client.phone}</div>
              </div>

              <div>
                <div className="font-bold text-slate-500 uppercase text-[10px]">TIPO DE TRABAJO:</div>
                <div className="font-extrabold text-slate-900">{previewProject.projectType}</div>
                <div className="mt-1 font-semibold">{previewProject.title}</div>
                {previewProject.targetDeadline && <div>Fecha Entrega Estimada: {previewProject.targetDeadline}</div>}
              </div>
            </div>

            {/* Scope Items Table */}
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="py-2">Descripción del Ítem / Trabajo</th>
                  <th className="py-2 text-center">Cant.</th>
                  <th className="py-2 text-right">P. Unitario</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewProject.scopeItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 font-medium">{item.description}</td>
                    <td className="py-2.5 text-center font-bold">{item.quantity} {item.unit}</td>
                    <td className="py-2.5 text-right font-mono">${item.unitPrice.toLocaleString('es-CL')}</td>
                    <td className="py-2.5 text-right font-mono font-bold">${(item.quantity * item.unitPrice).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end pt-4 border-t-2 border-slate-900">
              <div className="w-1/2 space-y-1 text-xs">
                {previewProject.materialsPrice > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Total Materiales:</span>
                    <span className="font-mono">${previewProject.materialsPrice.toLocaleString('es-CL')} CLP</span>
                  </div>
                )}
                {previewProject.laborPrice > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Total Mano de Obra:</span>
                    <span className="font-mono">${previewProject.laborPrice.toLocaleString('es-CL')} CLP</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-300 pt-1">
                  <span>TOTAL ESTIMADO:</span>
                  <span className="font-mono">${previewProject.totalPrice.toLocaleString('es-CL')} CLP</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Cotización válida por 30 días. Cumple con exigencias Pliegos Técnicos Normativos RIC SEC N°01-N°11.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmActionDialog
        isOpen={!!projectToDelete}
        title={`¿Eliminar Proyecto ${projectToDelete?.code || ''}?`}
        description={
          <>
            ¿Estás seguro de que deseas eliminar permanentemente el proyecto <strong className="text-white">"{projectToDelete?.title}"</strong> del cliente <strong className="text-white">{projectToDelete?.client.name}</strong>? Esta acción borrará el presupuesto, ítems y archivos adjuntos.
          </>
        }
        confirmText="Sí, Eliminar Definitivamente"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={confirmDeleteProject}
        onClose={() => setProjectToDelete(null)}
      />

      {/* PROJECT PHOTO GALLERY MODAL */}
      {galleryProject && (
        <ProjectPhotoGallery
          isOpen={true}
          project={galleryProject}
          onClose={() => setGalleryProject(null)}
          onUpdateProjectAttachments={(updatedAttachments) => {
            if (!galleryProject) return;
            const projectId = galleryProject.id;
            setProjects((prev) =>
              prev.map((p) => (p.id === projectId ? { ...p, attachments: updatedAttachments } : p))
            );
            setGalleryProject((prev) =>
              prev && prev.id === projectId ? { ...prev, attachments: updatedAttachments } : prev
            );
          }}
        />
      )}

      {/* FLOATING TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-slideUp">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
