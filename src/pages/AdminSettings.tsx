import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  companyService,
  NotificationSetting,
  NotificationSettingInput,
  NotificationSettingType,
} from '../api/companyService';
import AppNavbar from '../components/AppNavbar';
import SidebarLayout from '../components/SidebarLayout';

const adminNavLinks = [
  { name: 'Company List', to: '/admin/companies' },
  { name: 'Send Notification', to: '/admin/notify' },
  { name: 'Settings', to: '/admin/settings' },
  { name: 'Cronjob Settings', to: '/admin/cron-settings' },
];

const emptySetting: NotificationSettingInput = {
  type: 'smtp',
  config: {},
};

const twilioFields = [
  { key: 'accountSid', label: 'Account SID', type: 'text' },
  { key: 'authToken', label: 'Auth Token', type: 'password' },
  { key: 'fromNumber', label: 'From Number', type: 'text' },
];
const sendgridFields = [
  { key: 'apiKey', label: 'API Key', type: 'password' },
  { key: 'fromEmail', label: 'From Email', type: 'email' },
  { key: 'fromName', label: 'From Name', type: 'text' },
];

const AdminSettings: React.FC = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editType, setEditType] = useState<'twilio' | 'sendgrid' | null>(null);
  const [editForm, setEditForm] = useState<NotificationSettingInput | null>(null);
  const [twilioForm, setTwilioForm] = useState<NotificationSettingInput>({ type: 'twilio', config: {} });
  const [sendgridForm, setSendgridForm] = useState<NotificationSettingInput>({ type: 'sendgrid', config: {} });
  const [twilioId, setTwilioId] = useState<number | null>(null);
  const [sendgridId, setSendgridId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const handleAddNew = () => {
    setEditId(null);
    setTwilioForm(emptySetting);
    setSendgridForm(emptySetting);
  };

  const handleEdit = (type: 'twilio' | 'sendgrid', setting: NotificationSettingInput) => {
    setEditType(type);
    setEditForm(setting);
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setEditType(null);
    setEditForm(null);
  };

  const handleSaveTwilio = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      if (twilioId) {
        await companyService.updateSetting(twilioId, twilioForm.config);
      } else {
        await companyService.createSetting(twilioForm);
      }
      await fetchSettings();
    } catch {
      setError('Failed to save Twilio setting.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSendgrid = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      if (sendgridId) {
        await companyService.updateSetting(sendgridId, sendgridForm.config);
      } else {
        await companyService.createSetting(sendgridForm);
      }
      await fetchSettings();
    } catch {
      setError('Failed to save SendGrid setting.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await companyService.deleteSetting(id);
      await fetchSettings();
    } catch {
      setError('Failed to delete setting.');
    } finally {
      setDeleteId(null);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const settings = await companyService.getSettings();
      setSettings(settings);
      settings.forEach(s => {
        if (s.type === 'twilio') {
          setTwilioForm({
            type: 'twilio',
            config: {
              accountSid: s.accountSid || '',
              authToken: s.authToken || '',
              fromNumber: s.fromNumber || ''
            }
          });
          setTwilioId(s.id);
        } else if (s.type === 'sendgrid') {
          setSendgridForm({
            type: 'sendgrid',
            config: {
              apiKey: s.apiKey || '',
              fromEmail: s.fromEmail || '',
              fromName: s.fromName || ''
            }
          });
          setSendgridId(s.id);
        }
      });
    } catch (err) {
      setError('Failed to fetch settings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fields =
    twilioForm.type === 'twilio'
      ? twilioFields
      : sendgridForm.type === 'sendgrid'
      ? sendgridFields
      : [];

  /* -------------------------- JSX -------------------------- */
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col items-center py-10 px-4 md:px-8">
        <div className="w-full max-w-3xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-100/80">
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 mb-10 text-center tracking-tight">
            Notification Settings
          </h1>

          {/* ===================== Twilio ===================== */}
          <section className="mb-12">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="inline-flex h-3 w-3 rounded-full bg-indigo-500/80 animate-pulse"></span> Twilio Settings
              </h2>
              {twilioId && (
                <button
                  onClick={() => handleEdit('twilio', { type: 'twilio', config: twilioForm.config })}
                  className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 transition"
                >
                  Edit
                </button>
              )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {twilioFields.map(field => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600">{field.label}</label>
                  <input
                    type={field.type}
                    value={twilioForm.config[field.key] || ''}
                    disabled
                    onChange={e =>
                      setTwilioForm(f => ({
                        ...f,
                        config: { ...f.config, [field.key]: e.target.value },
                      }))
                    }
                    className="rounded-xl border border-slate-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ===================== SendGrid ===================== */}
          <section className="mb-8">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="inline-flex h-3 w-3 rounded-full bg-sky-500/80 animate-pulse"></span> SendGrid Settings
              </h2>
              <button
                onClick={() => handleEdit('sendgrid', { type: 'sendgrid', config: sendgridForm.config })}
                className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 transition"
              >
                Edit
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sendgridFields.map(field => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-600">{field.label}</label>
                  <input
                    type={field.type}
                    value={sendgridForm.config[field.key] || ''}
                    disabled
                    onChange={e =>
                      setSendgridForm(f => ({
                        ...f,
                        config: { ...f.config, [field.key]: e.target.value },
                      }))
                    }
                    className="rounded-xl border border-slate-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* helper text */}
          {error && <p className="text-red-600 text-center text-sm mt-6">{error}</p>}
          {(!twilioId || !sendgridId) && (
            <p className="text-yellow-600 text-center text-sm mt-6">
              Some settings are missing. Please contact your administrator.
            </p>
          )}
        </div>

        {/* ===================== Drawer ===================== */}
        {showDrawer && editForm && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseDrawer}></div>
            <aside className="relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slideInRight rounded-l-3xl overflow-hidden">
              <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-indigo-50/90">
                <h2 className="text-2xl font-bold text-indigo-700">
                  Edit {editType === 'twilio' ? 'Twilio' : 'SendGrid'} Settings
                </h2>
                <button
                  onClick={handleCloseDrawer}
                  className="text-slate-500 hover:text-slate-700 text-3xl leading-none font-semibold focus:outline-none"
                >
                  &times;
                </button>
              </header>

              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (editType === 'twilio') {
                    await handleSaveTwilio(e);
                    setTwilioForm(editForm);
                  } else if (editType === 'sendgrid') {
                    await handleSaveSendgrid(e);
                    setSendgridForm(editForm);
                  }
                  handleCloseDrawer();
                }}
                className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
              >
                {(editType === 'twilio' ? twilioFields : sendgridFields).map(field => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">{field.label}</label>
                    <input
                      type={field.type}
                      value={editForm!.config[field.key] || ''}
                      onChange={e =>
                        setEditForm(f =>
                          f ? { ...f, config: { ...f.config, [field.key]: e.target.value }, type: f.type } : f,
                        )
                      }
                      required
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                    />
                  </div>
                ))}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>

                {error && <p className="text-red-600 text-sm pt-2 text-center">{error}</p>}
              </form>
            </aside>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
export default AdminSettings;