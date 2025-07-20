import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { companyService, NotificationTemplate, NotificationTemplateInput } from '../api/companyService';
import AppNavbar from '../components/AppNavbar';
import SidebarLayout from '../components/SidebarLayout';

const adminNavLinks = [
  { name: 'Company List', to: '/admin/companies' },
  { name: 'Send Notification', to: '/admin/notify' },
  { name: 'Settings', to: '/admin/settings' },
  { name: 'Cronjob Settings', to: '/admin/cron-settings' },
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
  const [showDrawer, setShowDrawer] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<NotificationTemplateInput>(emptyTemplate);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [notifTypes, setNotifTypes] = useState<{BAS: boolean, FBT: boolean, IAS: boolean, FYEND: boolean}>({ BAS: false, FBT: false, IAS: false, FYEND: false });
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<string | null>(null);

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

  const openAdd = () => { setEditId(null); setForm(emptyTemplate); setNotifTypes({ BAS: false, FBT: false, IAS: false, FYEND: false }); setShowDrawer(true); };
  const openEdit = (tpl: NotificationTemplate) => { setEditId(tpl.id); setForm({ type: tpl.type, name: tpl.name, subject: tpl.subject, body: tpl.body }); setNotifTypes({ BAS: false, FBT: false, IAS: false, FYEND: false }); setShowDrawer(true); };
  const closeDrawer = () => { setShowDrawer(false); setEditId(null); setForm(emptyTemplate); setNotifTypes({ BAS: false, FBT: false, IAS: false, FYEND: false }); };

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
      closeDrawer();
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

  const handleSendSmsToAll = async () => {
    setSmsSending(true);
    setSmsResult(null);
    try {
      const res = await companyService.sendSmsToAllUsers(smsMessage);
      setSmsResult(res.success ? 'SMS sent to all users!' : res.message);
      setSmsMessage('');
    } catch (err: any) {
      setSmsResult('Failed to send SMS.');
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col items-center justify-start min-h-screen">
        <AppNavbar />
        <div className="bg-white/90 rounded-2xl shadow-2xl p-8 max-w-4xl w-full mt-8 md:mt-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-indigo-700">Notification Templates</h1>
            <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition">Add Template</button>
          </div>
          {/* --- SMS to All Users Section --- */}
          <div className="mb-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h2 className="text-xl font-semibold mb-2 text-indigo-800">Send SMS to All Users</h2>
            <textarea
              className="w-full rounded border-gray-300 min-h-[60px] mb-2"
              placeholder="Enter SMS message to send to all users"
              value={smsMessage}
              onChange={e => setSmsMessage(e.target.value)}
              disabled={smsSending}
            />
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-50"
              onClick={handleSendSmsToAll}
              disabled={smsSending || !smsMessage.trim()}
            >
              {smsSending ? 'Sending...' : 'Send SMS to All Users'}
            </button>
            {smsResult && <div className="mt-2 text-sm text-indigo-700">{smsResult}</div>}
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
        {/* Drawer for Add/Edit */}
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={closeDrawer}></div>
            <div className="relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-indigo-700">{editId ? 'Edit' : 'Add'} Template</h2>
                <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notification Types</label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifTypes.BAS} onChange={e => setNotifTypes(t => ({ ...t, BAS: e.target.checked }))} /> BAS
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifTypes.FBT} onChange={e => setNotifTypes(t => ({ ...t, FBT: e.target.checked }))} /> FBT
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifTypes.IAS} onChange={e => setNotifTypes(t => ({ ...t, IAS: e.target.checked }))} /> IAS
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifTypes.FYEND} onChange={e => setNotifTypes(t => ({ ...t, FYEND: e.target.checked }))} /> Financial Year End Date
                    </label>
                  </div>
                </div>
                <button type="submit" className="w-full py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50" disabled={saving}>{saving ? (editId ? 'Saving...' : 'Adding...') : (editId ? 'Save Changes' : 'Add Template')}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
export default AdminNotify; 