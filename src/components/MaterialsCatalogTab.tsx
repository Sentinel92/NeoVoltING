import React, { useState, useEffect, useMemo } from 'react';
import { BudgetItem, CatalogMaterialItem } from '../types';
import { ALL_CATALOG_MATERIALS, mapCatalogItemToBudgetItem } from '../data/materialsCatalog';
import {
  Search,
  Plus,
  Package,
  Edit2,
  Trash2,
  Tag,
  RotateCcw,
  X,
  Save,
  Shield,
  Zap,
  Cable,
  Box,
  Plug,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  ShoppingCart,
  Layers,
  Sparkles,
  Download,
  Copy,
  Minus,
  SlidersHorizontal,
  FolderTree,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';

interface MaterialsCatalogTabProps {
  onAddItemToBudget: (item: BudgetItem) => void;
  onNavigateToQuote?: () => void;
}

export const MaterialsCatalogTab: React.FC<MaterialsCatalogTabProps> = ({
  onAddItemToBudget,
  onNavigateToQuote,
}) => {
  // Main Catalog items loaded from localStorage or default
  const [materials, setMaterials] = useState<CatalogMaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem('neovolt_expanded_materials_catalog');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ALL_CATALOG_MATERIALS;
  });

  // Save changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('neovolt_expanded_materials_catalog', JSON.stringify(materials));
    } catch (e) {
      console.error(e);
    }
  }, [materials]);

  // Filtering states
  const [search, setSearch] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('TODAS');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('TODAS');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('TODOS');
  const [onlyPopular, setOnlyPopular] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Cubicación / Takeoff State
  const [cubedItems, setCubedItems] = useState<{ item: CatalogMaterialItem; quantity: number }[]>(() => {
    try {
      const saved = localStorage.getItem('neovolt_cubed_materials');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('neovolt_cubed_materials', JSON.stringify(cubedItems));
    } catch (e) {
      console.error(e);
    }
  }, [cubedItems]);

  const [isCubicadorDrawerOpen, setIsCubicadorDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Product Creation Modal State
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<'Canalizaciones y Conducción' | 'Insumos y Materiales de Montaje' | 'Accesorios, Aparatos y Protecciones'>('Canalizaciones y Conducción');
  const [newItemSubcategory, setNewItemSubcategory] = useState('PVC');
  const [newItemName, setNewItemName] = useState('');
  const [newItemMaterial, setNewItemMaterial] = useState('PVC');
  const [newItemPrice, setNewItemPrice] = useState<number>(3500);
  const [newItemUnit, setNewItemUnit] = useState('unidad');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemBadge, setNewItemBadge] = useState('');
  const [newItemDiametro, setNewItemDiametro] = useState('');
  const [newItemCalibre, setNewItemCalibre] = useState('');
  const [newItemAmperaje, setNewItemAmperaje] = useState('');
  const [newItemTension, setNewItemTension] = useState('');

  // Editing state for individual material
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editNombre, setEditNombre] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Get available subcategories based on current main category selection
  const availableSubcategories = useMemo(() => {
    if (selectedMainCategory === 'TODAS') {
      const set = new Set(materials.map((m) => m.subcategoria));
      return Array.from(set);
    }
    const filtered = materials.filter((m) => m.categoria === selectedMainCategory);
    return Array.from(new Set(filtered.map((m) => m.subcategoria)));
  }, [materials, selectedMainCategory]);

  // Get available materials list for filter
  const availableMaterialsList = useMemo(() => {
    const set = new Set(materials.map((m) => m.material).filter(Boolean));
    return Array.from(set);
  }, [materials]);

  // Filter materials list
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      // Main Category
      if (selectedMainCategory !== 'TODAS' && item.categoria !== selectedMainCategory) {
        return false;
      }
      // Subcategory
      if (selectedSubcategory !== 'TODAS' && item.subcategoria !== selectedSubcategory) {
        return false;
      }
      // Material
      if (selectedMaterialFilter !== 'TODOS' && item.material !== selectedMaterialFilter) {
        return false;
      }
      // Popular filter
      if (onlyPopular && !item.isPopular) {
        return false;
      }
      // Text Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = item.nombre.toLowerCase().includes(query);
        const matchSub = item.subcategoria.toLowerCase().includes(query);
        const matchMat = item.material.toLowerCase().includes(query);
        const matchSku = item.skuCode.toLowerCase().includes(query);
        const matchBadge = item.badge?.toLowerCase().includes(query) || false;
        const matchSpec =
          item.especificaciones?.diametro?.toLowerCase().includes(query) ||
          item.especificaciones?.calibre?.toLowerCase().includes(query) ||
          item.especificaciones?.amperaje?.toLowerCase().includes(query) ||
          item.especificaciones?.tension?.toLowerCase().includes(query) ||
          item.especificaciones?.medidas?.toLowerCase().includes(query) ||
          false;

        return matchName || matchSub || matchMat || matchSku || matchBadge || matchSpec;
      }

      return true;
    });
  }, [materials, selectedMainCategory, selectedSubcategory, selectedMaterialFilter, onlyPopular, search]);

  // Group filtered materials by subcategory for List Mode
  const groupedBySubcategory = useMemo(() => {
    const map = new Map<string, CatalogMaterialItem[]>();
    filteredMaterials.forEach((item) => {
      const key = item.subcategoria || 'General';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });
    return Array.from(map.entries());
  }, [filteredMaterials]);

  // Cubicación total calculation
  const totalCubedCost = useMemo(() => {
    return cubedItems.reduce((sum, ci) => sum + ci.item.precioEstimado * ci.quantity, 0);
  }, [cubedItems]);

  const totalCubedItemsCount = useMemo(() => {
    return cubedItems.reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cubedItems]);

  // Handle adding item to cubicador
  const handleAddToCubicador = (material: CatalogMaterialItem, qtyToAdd = 1) => {
    setCubedItems((prev) => {
      const idx = prev.findIndex((ci) => ci.item.id === material.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qtyToAdd };
        return copy;
      }
      return [...prev, { item: material, quantity: qtyToAdd }];
    });
    triggerToast(`Agregado al cubicador: ${material.nombre}`);
  };

  const handleUpdateCubedQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCubedItems((prev) => prev.filter((ci) => ci.item.id !== id));
    } else {
      setCubedItems((prev) =>
        prev.map((ci) => (ci.item.id === id ? { ...ci, quantity: newQty } : ci))
      );
    }
  };

  const handleRemoveCubedItem = (id: string) => {
    setCubedItems((prev) => prev.filter((ci) => ci.item.id !== id));
  };

  const handleClearCubicador = () => {
    setCubedItems([]);
    triggerToast('Lista de cubicación vaciada');
  };

  // Direct single item add to Global Budget Quote
  const handleDirectAddQuote = (material: CatalogMaterialItem) => {
    const budgetItem = mapCatalogItemToBudgetItem(material, 1);
    onAddItemToBudget(budgetItem);
    triggerToast(`¡Agregado a la Cotización: ${material.nombre}!`);
  };

  // Transfer all cubed items to Global Budget Quote
  const handleTransferAllCubedToQuote = () => {
    if (cubedItems.length === 0) return;
    cubedItems.forEach((ci) => {
      const budgetItem = mapCatalogItemToBudgetItem(ci.item, ci.quantity);
      onAddItemToBudget(budgetItem);
    });
    triggerToast(`¡${cubedItems.length} insumos traspasados a la Cotización Global!`);
    if (onNavigateToQuote) {
      onNavigateToQuote();
    }
  };

  // Copy cubicación to Clipboard
  const handleCopyCubedText = () => {
    if (cubedItems.length === 0) return;
    let text = `📋 LISTA DE MATERIALES E INSUMOS ELÉCTRICOS - NEOVOLT\n`;
    text += `Fecha: ${new Date().toLocaleDateString('es-CL')}\n\n`;
    cubedItems.forEach((ci, idx) => {
      const subtotal = ci.item.precioEstimado * ci.quantity;
      text += `${idx + 1}. [${ci.item.skuCode}] ${ci.item.nombre}\n`;
      text += `   Cantidad: ${ci.quantity} ${ci.item.unidadMedida} | Precio Ref: $${ci.item.precioEstimado.toLocaleString('es-CL')} | Subtotal: $${subtotal.toLocaleString('es-CL')}\n`;
    });
    text += `\n💰 COSTO TOTAL ESTIMADO MATERIALES: $${totalCubedCost.toLocaleString('es-CL')} CLP\n`;

    navigator.clipboard.writeText(text);
    triggerToast('¡Cubicación copiada al portapapeles!');
  };

  // Export cubicación text file
  const handleDownloadCubedText = () => {
    if (cubedItems.length === 0) return;
    let text = `LISTA DE CUBICACIÓN Y MATERIALES ELÉCTRICOS - NEOVOLT\n`;
    text += `========================================================\n\n`;
    cubedItems.forEach((ci, idx) => {
      const subtotal = ci.item.precioEstimado * ci.quantity;
      text += `${idx + 1}. ${ci.item.nombre}\n`;
      text += `   SKU: ${ci.item.skuCode} | Categoria: ${ci.item.categoria} (${ci.item.subcategoria})\n`;
      text += `   Cantidad: ${ci.quantity} ${ci.item.unidadMedida} x $${ci.item.precioEstimado.toLocaleString('es-CL')} = $${subtotal.toLocaleString('es-CL')}\n\n`;
    });
    text += `--------------------------------------------------------\n`;
    text += `TOTAL ESTIMADO DE MATERIALES: $${totalCubedCost.toLocaleString('es-CL')} CLP\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cubicacion_Materiales_Neovolt_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Create Custom Material
  const handleCreateCustomMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newMat: CatalogMaterialItem = {
      id: 'custom-' + Date.now().toString(),
      nombre: newItemName.trim(),
      categoria: newItemCategory,
      subcategoria: newItemSubcategory || 'PERSONALIZADO',
      material: newItemMaterial || 'General',
      especificaciones: {
        diametro: newItemDiametro || undefined,
        calibre: newItemCalibre || undefined,
        amperaje: newItemAmperaje || undefined,
        tension: newItemTension || undefined,
      },
      unidadMedida: newItemUnit || 'unidad',
      precioEstimado: Number(newItemPrice) || 0,
      skuCode: newItemSku.trim() || `CAT-${Math.floor(1000 + Math.random() * 9000)}`,
      badge: newItemBadge || 'Personalizado',
    };

    setMaterials((prev) => [newMat, ...prev]);
    setIsAddingModalOpen(false);
    setNewItemName('');
    triggerToast('¡Nuevo insumo agregado al catálogo!');
  };

  // Edit Material
  const handleSaveEditMaterial = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, precioEstimado: Number(editPrice) || 0, nombre: editNombre } : m
      )
    );
    setEditingId(null);
    triggerToast('Insumo actualizado correctamente');
  };

  // Delete Material
  const handleDeleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    triggerToast('Insumo eliminado del catálogo');
  };

  // Reset Default Catalog
  const handleResetCatalog = () => {
    setMaterials(ALL_CATALOG_MATERIALS);
    localStorage.removeItem('neovolt_expanded_materials_catalog');
    triggerToast('Catálogo restablecido por defecto');
  };

  // Category Icon & Styling Meta helper
  const getCategoryMeta = (cat: string, sub: string) => {
    const nameLower = (cat + ' ' + sub).toLowerCase();

    if (nameLower.includes('pvc') || nameLower.includes('canalet') || nameLower.includes('tubo pvc')) {
      return {
        icon: Box,
        bg: 'from-sky-950/60 via-slate-900 to-slate-900',
        border: 'border-sky-500/30',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        accentColor: 'text-sky-400',
      };
    }
    if (nameLower.includes('emt') || nameLower.includes('metálic') || nameLower.includes('unistrut')) {
      return {
        icon: Shield,
        bg: 'from-amber-950/50 via-slate-900 to-slate-900',
        border: 'border-amber-500/30',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        accentColor: 'text-amber-400',
      };
    }
    if (nameLower.includes('flexible') || nameLower.includes('sealtite') || nameLower.includes('bx')) {
      return {
        icon: Wrench,
        bg: 'from-indigo-950/50 via-slate-900 to-slate-900',
        border: 'border-indigo-500/30',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        accentColor: 'text-indigo-400',
      };
    }
    if (nameLower.includes('bandeja') || nameLower.includes('escalerilla')) {
      return {
        icon: Layers,
        bg: 'from-purple-950/50 via-slate-900 to-slate-900',
        border: 'border-purple-500/30',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        accentColor: 'text-purple-400',
      };
    }
    if (nameLower.includes('conductor') || nameLower.includes('cable') || nameLower.includes('eva')) {
      return {
        icon: Cable,
        bg: 'from-emerald-950/50 via-slate-900 to-slate-900',
        border: 'border-emerald-500/30',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        accentColor: 'text-emerald-400',
      };
    }
    if (nameLower.includes('protección') || nameLower.includes('disyuntor') || nameLower.includes('diferencial') || nameLower.includes('tablero')) {
      return {
        icon: Zap,
        bg: 'from-rose-950/50 via-slate-900 to-slate-900',
        border: 'border-rose-500/30',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        accentColor: 'text-rose-400',
      };
    }
    if (nameLower.includes('epp') || nameLower.includes('guante') || nameLower.includes('casco') || nameLower.includes('seguridad')) {
      return {
        icon: ShieldCheck,
        bg: 'from-emerald-950/60 via-slate-900 to-slate-900',
        border: 'border-emerald-500/40',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        accentColor: 'text-emerald-400',
      };
    }
    if (nameLower.includes('ferrule') || nameLower.includes('terminal') || nameLower.includes('conector') || nameLower.includes('wago')) {
      return {
        icon: Plug,
        bg: 'from-fuchsia-950/60 via-slate-900 to-slate-900',
        border: 'border-fuchsia-500/40',
        badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
        accentColor: 'text-fuchsia-400',
      };
    }
    if (nameLower.includes('mecanismo') || nameLower.includes('placa') || nameLower.includes('interruptor') || nameLower.includes('enchufe') || nameLower.includes('tomacorriente')) {
      return {
        icon: Plug,
        bg: 'from-blue-950/50 via-slate-900 to-slate-900',
        border: 'border-blue-500/30',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        accentColor: 'text-blue-400',
      };
    }

    return {
      icon: Plug,
      bg: 'from-fuchsia-950/50 via-slate-900 to-slate-900',
      border: 'border-fuchsia-500/30',
      badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
      accentColor: 'text-fuchsia-400',
    };
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-extrabold uppercase tracking-widest">
            <Package className="w-4 h-4 text-fuchsia-400" />
            <span>Catálogo Profesional e Integral • Insumos Eléctricos & Precios Ref.</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Catálogo de Materiales e Insumos Eléctricos
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Explora y cubica insumos normados de canalización, conductores EVA/RV-K, tableros DIN, protecciones, fijaciones y puesta a tierra. Precios de referencia de mercado actualizados en Pesos Chilenos ($ CLP).
          </p>
        </div>

        {/* Action Controls & Cubicador Quick Button */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCubicadorDrawerOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-fuchsia-900/40 transition-all active:scale-95 relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cubicador de Materiales</span>
            {cubedItems.length > 0 && (
              <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow">
                {totalCubedItemsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsAddingModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-fuchsia-300 border border-fuchsia-500/40 font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Insumo</span>
          </button>

          <button
            onClick={handleResetCatalog}
            title="Restablecer catálogo técnico oficial"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-2xl transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
        {/* Search Input & Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Global Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar insumo (ej: Tubo EMT, Cable EVA 2.5, Disyuntor 16A, Jabalina...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Subcategory Dropdown Filter */}
          <div>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-fuchsia-500"
            >
              <option value="TODAS">Subcategoría: Todas ({availableSubcategories.length})</option>
              {availableSubcategories.map((sub, i) => (
                <option key={i} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Material Type Dropdown */}
          <div>
            <select
              value={selectedMaterialFilter}
              onChange={(e) => setSelectedMaterialFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-fuchsia-500"
            >
              <option value="TODOS">Material: Todos</option>
              {availableMaterialsList.map((mat, i) => (
                <option key={i} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedMainCategory('TODAS');
                setSelectedSubcategory('TODAS');
              }}
              className={`text-xs font-black px-4 py-2 rounded-2xl border transition-all ${
                selectedMainCategory === 'TODAS'
                  ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-lg shadow-fuchsia-950/50'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Todas las Categorías
            </button>

            <button
              onClick={() => {
                setSelectedMainCategory('Canalizaciones y Conducción');
                setSelectedSubcategory('TODAS');
              }}
              className={`text-xs font-black px-4 py-2 rounded-2xl border transition-all flex items-center gap-1.5 ${
                selectedMainCategory === 'Canalizaciones y Conducción'
                  ? 'bg-sky-600 border-sky-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-sky-400" />
              <span>Canalizaciones y Conducción</span>
            </button>

            <button
              onClick={() => {
                setSelectedMainCategory('Insumos y Materiales de Montaje');
                setSelectedSubcategory('TODAS');
              }}
              className={`text-xs font-black px-4 py-2 rounded-2xl border transition-all flex items-center gap-1.5 ${
                selectedMainCategory === 'Insumos y Materiales de Montaje'
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cable className="w-3.5 h-3.5 text-emerald-400" />
              <span>Insumos y Materiales de Montaje</span>
            </button>

            <button
              onClick={() => {
                setSelectedMainCategory('Accesorios, Aparatos y Protecciones');
                setSelectedSubcategory('TODAS');
              }}
              className={`text-xs font-black px-4 py-2 rounded-2xl border transition-all flex items-center gap-1.5 ${
                selectedMainCategory === 'Accesorios, Aparatos y Protecciones'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Accesorios, Aparatos y Protecciones</span>
            </button>
          </div>

          {/* Popular Filter Toggle */}
          <button
            onClick={() => setOnlyPopular(!onlyPopular)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              onlyPopular
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Insumos Más Utilizados</span>
          </button>
        </div>
      </div>

      {/* Results Header Summary & View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1 font-semibold">
        <div className="flex items-center gap-2">
          <span>
            Mostrando <strong className="text-white">{filteredMaterials.length}</strong> insumo(s) de{' '}
            {materials.length} totales en catálogo.
          </span>
          {search && (
            <span className="text-fuchsia-400 font-bold">
              Filtro activo: &quot;{search}&quot;
            </span>
          )}
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-inner">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md shadow-fuchsia-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5 text-fuchsia-300" />
            <span>Modo Lista</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-md shadow-fuchsia-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-fuchsia-300" />
            <span>Modo Tarjetas</span>
          </button>
        </div>
      </div>

      {/* Product Catalog List or Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No se encontraron insumos</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No hay productos que coincidan con la búsqueda o filtro seleccionado. Intenta limpiar los filtros o agregar un nuevo insumo.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedMainCategory('TODAS');
              setSelectedSubcategory('TODAS');
              setSelectedMaterialFilter('TODOS');
              setOnlyPopular(false);
            }}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* MODO LISTA TÉCNICA AGRUPADO POR SUBCATEGORÍA */
        <div className="space-y-6">
          {groupedBySubcategory.map(([subCatName, items]) => {
            const firstItem = items[0];
            const meta = getCategoryMeta(firstItem.categoria, firstItem.subcategoria);
            const SubIcon = meta.icon;

            return (
              <div
                key={subCatName}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-0"
              >
                {/* Subcategory Section Header */}
                <div className="bg-slate-950/90 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${meta.badgeColor} shadow-inner`}>
                      <SubIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>{subCatName}</span>
                        <span className="text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full">
                          {items.length} insumo(s)
                        </span>
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Categoría: {firstItem.categoria}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-800/80">
                        <th className="py-2.5 px-4">Insumo / Descripción</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Especificaciones</th>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3 text-center">Unidad</th>
                        <th className="py-2.5 px-4 text-right">Precio Ref ($ CLP)</th>
                        <th className="py-2.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {items.map((mat) => {
                        const isEditing = editingId === mat.id;
                        const cubedEntry = cubedItems.find((ci) => ci.item.id === mat.id);
                        const cubedQty = cubedEntry ? cubedEntry.quantity : 0;

                        return (
                          <tr
                            key={mat.id}
                            className="hover:bg-slate-800/40 transition-colors group"
                          >
                            {/* Name & Badge */}
                            <td className="py-3 px-4 font-bold text-white max-w-xs">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editNombre}
                                  onChange={(e) => setEditNombre(e.target.value)}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                                />
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-100 font-bold group-hover:text-fuchsia-300 transition-colors">
                                      {mat.nombre}
                                    </span>
                                    {mat.isPopular && (
                                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                                        Popular
                                      </span>
                                    )}
                                  </div>
                                  {mat.badge && (
                                    <span className="text-[9px] text-fuchsia-400 font-semibold">
                                      {mat.badge}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* SKU */}
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-300 font-bold whitespace-nowrap">
                              <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">
                                {mat.skuCode}
                              </span>
                            </td>

                            {/* Specs */}
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap items-center gap-1">
                                {mat.especificaciones?.diametro && (
                                  <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded">
                                    Ø {mat.especificaciones.diametro}
                                  </span>
                                )}
                                {mat.especificaciones?.calibre && (
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded">
                                    {mat.especificaciones.calibre}
                                  </span>
                                )}
                                {mat.especificaciones?.amperaje && (
                                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded">
                                    {mat.especificaciones.amperaje}
                                  </span>
                                )}
                                {mat.especificaciones?.tension && (
                                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded">
                                    {mat.especificaciones.tension}
                                  </span>
                                )}
                                {mat.especificaciones?.medidas && (
                                  <span className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0.5 rounded">
                                    {mat.especificaciones.medidas}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Material */}
                            <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                              {mat.material}
                            </td>

                            {/* Unit */}
                            <td className="py-3 px-3 text-center text-slate-400 text-[11px] font-mono whitespace-nowrap">
                              {mat.unidadMedida}
                            </td>

                            {/* Price */}
                            <td className="py-3 px-4 text-right font-black text-emerald-400 text-xs whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(Number(e.target.value))}
                                  className="w-24 text-right bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                                />
                              ) : (
                                `$${mat.precioEstimado.toLocaleString('es-CL')}`
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleSaveEditMaterial(mat.id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded-lg"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleAddToCubicador(mat, 1)}
                                    className={`px-2.5 py-1 rounded-xl font-bold text-[10px] border transition-all active:scale-95 flex items-center gap-1 ${
                                      cubedQty > 0
                                        ? 'bg-fuchsia-950 border-fuchsia-500 text-fuchsia-300 shadow'
                                        : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-200'
                                    }`}
                                  >
                                    <ShoppingCart className="w-3 h-3 text-fuchsia-400" />
                                    <span>{cubedQty > 0 ? `(${cubedQty})` : '+ Cubicar'}</span>
                                  </button>

                                  <button
                                    onClick={() => handleDirectAddQuote(mat)}
                                    className="px-2.5 py-1 rounded-xl font-bold text-[10px] bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow transition-all active:scale-95 flex items-center gap-1"
                                    title="Agregar a la cotización"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Cotizar</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingId(mat.id);
                                      setEditPrice(mat.precioEstimado);
                                      setEditNombre(mat.nombre);
                                    }}
                                    className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg"
                                    title="Editar insumo"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteMaterial(mat.id)}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                                    title="Eliminar del catálogo"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODO TARJETAS (GRID) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMaterials.map((mat) => {
            const isEditing = editingId === mat.id;
            const meta = getCategoryMeta(mat.categoria, mat.subcategoria);
            const IconComp = meta.icon;

            const cubedEntry = cubedItems.find((ci) => ci.item.id === mat.id);
            const cubedQty = cubedEntry ? cubedEntry.quantity : 0;

            return (
              <div
                key={mat.id}
                className={`bg-slate-950 border ${meta.border} hover:border-fuchsia-500/60 rounded-3xl p-4 flex flex-col justify-between gap-3 text-xs transition-all shadow-md hover:shadow-xl relative group`}
              >
                {/* Visual Header Card */}
                <div className={`relative w-full h-28 bg-gradient-to-br ${meta.bg} rounded-2xl p-3 flex flex-col justify-between border border-slate-800`}>
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-2xl border ${meta.badgeColor} shadow-inner`}>
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {/* SKU Badge */}
                      <span className="bg-slate-900/90 text-slate-300 border border-slate-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                        <Tag className="w-2.5 h-2.5 text-fuchsia-400" />
                        <span>{mat.skuCode}</span>
                      </span>

                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {mat.subcategoria}
                      </span>
                    </div>
                  </div>

                  {/* Badges / Specs Footer inside header */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {mat.badge && (
                      <span className="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 text-[9px] font-bold px-2 py-0.5 rounded-md">
                        {mat.badge}
                      </span>
                    )}

                    {mat.especificaciones?.diametro && (
                      <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        Ø {mat.especificaciones.diametro}
                      </span>
                    )}

                    {mat.especificaciones?.calibre && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        {mat.especificaciones.calibre}
                      </span>
                    )}

                    {mat.especificaciones?.amperaje && (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        {mat.especificaciones.amperaje}
                      </span>
                    )}

                    {mat.especificaciones?.ipRating && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        {mat.especificaciones.ipRating}
                      </span>
                    )}
                  </div>

                  {/* Quick Edit / Delete Buttons on Hover */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => {
                        setEditingId(mat.id);
                        setEditPrice(mat.precioEstimado);
                        setEditNombre(mat.nombre);
                      }}
                      className="p-1.5 bg-slate-900/90 hover:bg-fuchsia-600 text-white rounded-lg border border-slate-700 shadow"
                      title="Editar Precio/Nombre"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="p-1.5 bg-slate-900/90 hover:bg-rose-600 text-white rounded-lg border border-slate-700 shadow"
                      title="Eliminar del catálogo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                {isEditing ? (
                  <div className="space-y-2 bg-slate-900 p-3 rounded-2xl border border-fuchsia-500/50 animate-fadeIn">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold">Nombre del Insumo:</label>
                      <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold">Precio Mercado CLP ($):</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-xs text-emerald-400 font-bold"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEditMaterial(mat.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1.5 rounded-xl flex items-center justify-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-[10px] px-2.5 py-1.5 rounded-xl"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-xs leading-snug line-clamp-2">
                        {mat.nombre}
                      </h4>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>Material: <strong className="text-slate-300">{mat.material}</strong></span>
                        <span>Unidad: <strong className="text-slate-300">{mat.unidadMedida}</strong></span>
                      </div>
                    </div>

                    {/* Price and Action Buttons */}
                    <div className="pt-2 border-t border-slate-900 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          Precio Ref.
                        </span>
                        <div className="font-black text-emerald-400 text-sm">
                          ${mat.precioEstimado.toLocaleString('es-CL')}{' '}
                          <span className="text-[10px] font-normal text-slate-400">CLP</span>
                        </div>
                      </div>

                      {/* Cubicación Controls & Direct Cotizar */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddToCubicador(mat, 1)}
                          className={`flex items-center justify-center gap-1.5 border font-bold text-[11px] py-2 rounded-xl transition-all active:scale-95 ${
                            cubedQty > 0
                              ? 'bg-fuchsia-950 border-fuchsia-500 text-fuchsia-300 shadow'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-fuchsia-400" />
                          <span>{cubedQty > 0 ? `Cubico (${cubedQty})` : '+ Cubicar'}</span>
                        </button>

                        <button
                          onClick={() => handleDirectAddQuote(mat)}
                          className="flex items-center justify-center gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-[11px] py-2 rounded-xl shadow transition-all active:scale-95"
                          title="Agregar 1 unidad directamente a la Cotización Global"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Cotizar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cubicación Drawer / Floating Modal */}
      {isCubicadorDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between animate-fadeIn overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/40 text-fuchsia-300">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Cubicador de Materiales</h3>
                    <p className="text-[11px] text-slate-400">
                      Resumen de cubicación y costo total estimado
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCubicadorDrawerOpen(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              {cubedItems.length === 0 ? (
                <div className="py-12 text-center space-y-3 border-2 border-dashed border-slate-800 rounded-3xl p-6">
                  <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">
                    Aún no has agregado insumos a la cubicación.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Haz clic en <strong>+ Cubicar</strong> en cualquier material del catálogo para incluirlo en el presupuesto total.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {cubedItems.map(({ item, quantity }) => {
                    const subtotal = item.precioEstimado * quantity;
                    return (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-white truncate">{item.nombre}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-fuchsia-400 font-bold">{item.skuCode}</span>
                            <span>•</span>
                            <span>Ref: ${item.precioEstimado.toLocaleString('es-CL')} / {item.unidadMedida}</span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl overflow-hidden">
                            <button
                              onClick={() => handleUpdateCubedQty(item.id, quantity - 1)}
                              className="px-2 py-1 text-slate-300 hover:bg-slate-800"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) =>
                                handleUpdateCubedQty(item.id, parseInt(e.target.value) || 1)
                              }
                              className="w-12 text-center bg-transparent text-xs text-white font-bold focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateCubedQty(item.id, quantity + 1)}
                              className="px-2 py-1 text-slate-300 hover:bg-slate-800"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <div className="text-[9px] text-slate-500 uppercase font-semibold">Subtotal</div>
                            <div className="font-extrabold text-emerald-400 text-xs">
                              ${subtotal.toLocaleString('es-CL')}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveCubedItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer & Actions */}
            <div className="space-y-4 pt-4 border-t border-slate-800 mt-4">
              {/* Cost Summary Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Costo Total Estimado Materiales
                  </div>
                  <div className="text-xs text-slate-500">
                    {totalCubedItemsCount} unidad(es) seleccionadas
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-400">
                    ${totalCubedCost.toLocaleString('es-CL')}{' '}
                    <span className="text-xs font-semibold text-slate-400">CLP</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleTransferAllCubedToQuote}
                  disabled={cubedItems.length === 0}
                  className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Traspasar Todos a Cotización Global</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyCubedText}
                    disabled={cubedItems.length === 0}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Copiar Lista</span>
                  </button>

                  <button
                    onClick={handleDownloadCubedText}
                    disabled={cubedItems.length === 0}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Descargar TXT</span>
                  </button>
                </div>

                {cubedItems.length > 0 && (
                  <button
                    onClick={handleClearCubicador}
                    className="w-full text-center text-xs text-rose-400 hover:text-rose-300 font-semibold py-1"
                  >
                    Vaciar Cubicador
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Custom Item Modal */}
      {isAddingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-fuchsia-400" />
                <span>Agregar Nuevo Insumo al Catálogo Local</span>
              </h3>
              <button
                onClick={() => setIsAddingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomMaterial} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Categoría Principal:</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) =>
                      setNewItemCategory(
                        e.target.value as 'Canalizaciones y Conducción' | 'Insumos y Materiales de Montaje' | 'Accesorios, Aparatos y Protecciones'
                      )
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-fuchsia-500"
                  >
                    <option value="Canalizaciones y Conducción">Canalizaciones y Conducción</option>
                    <option value="Insumos y Materiales de Montaje">Insumos y Materiales de Montaje</option>
                    <option value="Accesorios, Aparatos y Protecciones">Accesorios, Aparatos y Protecciones</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Subcategoría:</label>
                  <input
                    type="text"
                    placeholder="Ej: PVC, EMT, Conductores..."
                    value={newItemSubcategory}
                    onChange={(e) => setNewItemSubcategory(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nombre Completo del Insumo:</label>
                <input
                  type="text"
                  placeholder="Ej: Tubo PVC Conduit 20mm x 3m Heavy Duty"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Material Base:</label>
                  <input
                    type="text"
                    placeholder="Ej: PVC, Cobre..."
                    value={newItemMaterial}
                    onChange={(e) => setNewItemMaterial(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Precio Mercado CLP ($):</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Unidad Medida:</label>
                  <input
                    type="text"
                    placeholder="unidad, metro, tira..."
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Código SKU / Referencia:</label>
                  <input
                    type="text"
                    placeholder="Ej: PVC-2001"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Etiqueta / Badge Visual:</label>
                  <input
                    type="text"
                    placeholder="Ej: IP65, 20mm, SEC..."
                    value={newItemBadge}
                    onChange={(e) => setNewItemBadge(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              {/* Especificaciones técnicas opcionales */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Especificaciones Técnicas Opcionales
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Diámetro (ej: 20mm, 1/2&quot;)"
                    value={newItemDiametro}
                    onChange={(e) => setNewItemDiametro(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Calibre (ej: 2.5 mm²)"
                    value={newItemCalibre}
                    onChange={(e) => setNewItemCalibre(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Amperaje (ej: 16A, 25A)"
                    value={newItemAmperaje}
                    onChange={(e) => setNewItemAmperaje(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Tensión (ej: 220V, 380V)"
                    value={newItemTension}
                    onChange={(e) => setNewItemTension(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-extrabold py-2.5 rounded-2xl shadow transition-all"
                >
                  Agregar al Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-2xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
