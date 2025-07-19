import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { companyService, NotificationTemplate, NotificationTemplateInput } from '../api/companyService';

const adminNavLinks = [
  { name: 'Company List', to: '/admin/companies' },
  { name: 'Send Notification', to: '/admin/notify' },
  { name: 'Settings', to: '/admin/settings' },
];

const emptyTemplate: NotificationTemplateInput = {
  type: 'email',
  name: '',
  subject: '',
  body: '',
};

const AdminNotify: React.FC = () => {
  const location = useLocation();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<NotificationTemplateInput>(emptyTemplate);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getTemplates();
      setTemplates(data);
    } catch {
      setError('Failed to fetch templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openAdd = () => { setEditId(null); setForm(emptyTemplate); setShowModal(true); };
  const openEdit = (tpl: NotificationTemplate) => { setEditId(tpl.id); setForm({ type: tpl.type, name: tpl.name, subject: tpl.subject, body: tpl.body }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditId(null); setForm(emptyTemplate); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await companyService.updateTemplate(editId, form);
      } else {
        await companyService.createTemplate(form);
      }
      await fetchTemplates();
      closeModal();
    } catch {
      setError('Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await companyService.deleteTemplate(id);
      await fetchTemplates();
    } catch {
      setError('Failed to delete template.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-100 to-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white/90 border-r border-slate-200 shadow-lg hidden md:flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-slate-100">
          <span className="text-2xl font-bold text-indigo-600 tracking-tight">Super Admin</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {adminNavLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-4 py-2 rounded-lg font-medium transition-all duration-150 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${location.pathname === link.to ? 'bg-indigo-600 text-white shadow-lg scale-105' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start py-10 px-2">
        <div className="bg-white/90 rounded-2xl shadow-2xl p-8 max-w-4xl w-full mt-8 md:mt-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-indigo-700">Notification Templates</h1>
            <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition">Add Template</button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="text-indigo-600 font-semibold animate-pulse">Loading templates...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-6">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700">Subject</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-indigo-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(tpl => (
                    <tr key={tpl.id} className="border-b last:border-b-0 hover:bg-indigo-50 transition">
                      <td className="px-4 py-2 capitalize">{tpl.type}</td>
                      <td className="px-4 py-2">{tpl.name}</td>
                      <td className="px-4 py-2">{tpl.subject}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={() => openEdit(tpl)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                        <button onClick={() => handleDelete(tpl.id)} disabled={deleteId === tpl.id} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50">{deleteId === tpl.id ? 'Deleting...' : 'Delete'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Modal for Add/Edit */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg relative">
              <button onClick={closeModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              <h2 className="text-2xl font-bold mb-4 text-indigo-700">{editId ? 'Edit' : 'Add'} Template</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full rounded border-gray-300" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'email' | 'sms' }))}>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input className="w-full rounded border-gray-300" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input className="w-full rounded border-gray-300" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required={form.type === 'email'} disabled={form.type === 'sms'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <textarea className="w-full rounded border-gray-300 min-h-[100px]" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required />
                </div>
                <button type="submit" className="w-full py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50" disabled={saving}>{saving ? (editId ? 'Saving...' : 'Adding...') : (editId ? 'Save Changes' : 'Add Template')}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminNotify; 