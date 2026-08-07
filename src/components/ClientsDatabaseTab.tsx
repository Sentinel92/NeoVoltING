import React, { useState } from 'react';
import { ClientRecord } from '../types';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Send, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Search, 
  X, 
  CheckCircle2, 
  FileSpreadsheet, 
  ExternalLink,
  DollarSign,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface ClientsDatabaseTabProps {
  clients?: ClientRecord[];
  setClients?: React.Dispatch<React.SetStateAction<ClientRecord[]>>;
  onSelectClientForQuote?: (selectedCustomer: any) => void;
  onSelectClientForReport?: (selectedCustomer: any) => void;
  onSelectClientForProject?: (client: ClientRecord) => void;
}

export function ClientsDatabaseTab({ 
  clients = [], 
  setClients,
  onSelectClientForQuote,
  onSelectClientForReport,
  onSelectClientForProject,
}: ClientsDatabaseTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Client to Delete confirmation modal
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);

  // Client to Edit modal
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  // Form State for new or editing client
  const [formData, setFormData] = useState<Partial<ClientRecord>>({
    name: '',
    email: '',
    phone: '',
    rut: '',
    address: '',
    city: 'Santiago',
    propertyType: 'Residencial',
    notes: '',
  });

  const safeClients = Array.isArray(clients) ? clients : [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddForm = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      rut: '',
      address: '',
      city: 'Santiago',
      propertyType: 'Residencial',
      notes: '',
    });
    setShowForm(true);
  };

  const handleOpenEditForm = (client: ClientRecord) => {
    setEditingClient(client);
    setFormData({ ...client });
    setShowForm(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    if (!setClients) return;

    if (editingClient) {
      // Edit existing
      setClients((prev) =>
        prev.map((c) => (c.id === editingClient.id ? ({ ...c, ...formData } as ClientRecord) : c))
      );
      showToast(`¡Cliente "${formData.name}" actualizado correctamente!`);
    } else {
      // Create new
      const created: ClientRecord = {
        id: `c_${Date.now()}`,
        name: formData.name.trim(),
        email: formData.email?.trim() || '',
        phone: formData.phone?.trim() || '',
        rut: formData.rut?.trim() || '',
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || 'Santiago',
        propertyType: formData.propertyType || 'Residencial',
        notes: formData.notes?.trim() || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setClients((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      showToast(`¡Cliente "${created.name}" agregado a la base de datos!`);
    }

    setShowForm(false);
    setEditingClient(null);
  };

  const confirmDeleteClient = () => {
    if (!clientToDelete || !setClients) return;
    const clientName = clientToDelete.name;
    setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
    setClientToDelete(null);
    showToast(`Cliente "${clientName}" eliminado correctamente.`);
  };

  // Helper WhatsApp formatting
  const handleSendWhatsAppQuote = (client: ClientRecord) => {
    const rawPhone = (client.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 9 ? `56${rawPhone}` : rawPhone;
    const msg = encodeURIComponent(
      `Hola *${client.name}*, le saluda el Ingeniero Electricista Sec. Le adjunto los detalles de la *Cotización de Servicios Eléctricos* para su propiedad en ${client.address || client.city || 'su domicilio'}. ¿Cuándo coordinamos la ejecución? Quedo atento a sus comentarios.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleSendEmailQuote = (client: ClientRecord) => {
    const subject = encodeURIComponent(`Cotización de Instalación Eléctrica SEC - ${client.name}`);
    const body = encodeURIComponent(
      `Estimado(a) ${client.name},\n\nJunto con saludar, le enviamos la Cotización formal para los servicios eléctricos solicitados en su propiedad ubicados en ${client.address || client.city}.\n\nAtentamente,\nServicios de Ingeniería Electrica SEC.`
    );
    window.open(`mailto:${client.email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSendWhatsAppReport = (client: ClientRecord) => {
    const rawPhone = (client.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 9 ? `56${rawPhone}` : rawPhone;
    const msg = encodeURIComponent(
      `Hola *${client.name}*, le adjunto el *Informe Técnico de Trabajo Eléctrico* respecto a la inspección y protocolo realizado en ${client.address || client.city}. Quedamos a su entera disposición.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleSendEmailReport = (client: ClientRecord) => {
    const subject = encodeURIComponent(`Informe Técnico de Inspección Eléctrica SEC - ${client.name}`);
    const body = encodeURIComponent(
      `Estimado(a) ${client.name},\n\nAdjuntamos el Informe Técnico correspondiente a las pruebas de aislamiento, protecciones y levantamiento eléctrico efectuidas.\n\nAtentamente,\nDepartamento Técnico SEC.`
    );
    window.open(`mailto:${client.email || ''}?subject=${subject}&body=${body}`, '_blank');
  };

  const filteredClients = safeClients.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.rut || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-fuchsia-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-fuchsia-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Base de Datos CRM • Clientes & Obras</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Gestión de Clientes ({safeClients.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Crea, edita o elimina clientes. Genera y envía cotizaciones e informes técnicos directamente por WhatsApp o Correo.
          </p>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-fuchsia-950 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 shadow-md">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Buscar por nombre, RUT, comuna o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-white placeholder-slate-500 w-full outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-white mr-2">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
            <Users className="w-12 h-12 text-slate-700 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No se encontraron clientes registrados</div>
            <p className="text-xs text-slate-500">Haz clic en "+ Nuevo Cliente" para ingresar uno a la base de datos.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-fuchsia-500/40 transition-all shadow-xl relative group"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/60 text-[10px] font-bold px-2 py-0.5 rounded">
                        {client.propertyType || 'Residencial'}
                      </span>
                      {client.rut && (
                        <span className="text-[11px] text-slate-400 font-medium">RUT: {client.rut}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Top: Edit / Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditForm(client)}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-all"
                      title="Editar Cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setClientToDelete(client)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                      title="Eliminar Cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5 text-xs text-slate-300 py-3 border-b border-slate-800/80">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{client.address} ({client.city || 'Santiago'})</span>
                    </div>
                  )}
                  {client.notes && (
                    <div className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg mt-2 border border-slate-800/60">
                      "{client.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="space-y-2 pt-1">
                {/* Cotización Actions */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 flex items-center justify-between">
                    <span>📑 Cotización / Presupuesto</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {onSelectClientForQuote && (
                      <button
                        onClick={() => onSelectClientForQuote(client)}
                        className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                        title="Cargar cliente y abrir Cotizador"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Cotizar</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleSendWhatsAppQuote(client)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                      title="Enviar cotización por WhatsApp"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleSendEmailQuote(client)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all border border-slate-700"
                      title="Enviar cotización por Correo"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                  </div>
                </div>

                {/* Informe Técnico Actions */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                    <span>📄 Informe Técnico de Obra</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {onSelectClientForReport && (
                      <button
                        onClick={() => onSelectClientForReport(client)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                        title="Cargar cliente y abrir Informe"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Informe</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleSendWhatsAppReport(client)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                      title="Enviar informe por WhatsApp"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleSendEmailReport(client)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all border border-slate-700"
                      title="Enviar informe por Correo"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM: CREATE / EDIT CLIENT */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveClient}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-fuchsia-400" />
                <span>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Camilo Henríquez / Inmobiliaria SpA"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">RUT Cliente</label>
                  <input
                    type="text"
                    placeholder="12.345.678-9"
                    value={formData.rut || ''}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tipo de Propiedad</label>
                  <select
                    value={formData.propertyType || 'Residencial'}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Comunidad">Comunidad</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Teléfono WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+56 9 1234 5678"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="contacto@cliente.cl"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">Dirección</label>
                  <input
                    type="text"
                    placeholder="Av. Providencia 1240"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Comuna / Ciudad</label>
                  <input
                    type="text"
                    placeholder="Santiago"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Notas / Observaciones de la Propiedad</label>
                <textarea
                  rows={2}
                  placeholder="Detalles particulares del tablero, empalme o requierimientos especiales..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-fuchsia-950"
            >
              {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL CONFIRM DELETE */}
      <ConfirmActionDialog
        isOpen={!!clientToDelete}
        title="¿Eliminar Cliente CRM?"
        description={
          <>
            Estás a punto de eliminar permanentemente a <span className="font-bold text-rose-400">{clientToDelete?.name}</span> de la base de datos CRM. Esta acción no se puede deshacer.
          </>
        }
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={confirmDeleteClient}
        onClose={() => setClientToDelete(null)}
      />
    </div>
  );
}

export default ClientsDatabaseTab;
