import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { companyService, CronjobSettings } from '../api/companyService';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const adminNavLinks = [
  { name: 'Company List', to: '/admin/companies' },
  { name: 'Send Notification', to: '/admin/notify' },
  { name: 'Settings', to: '/admin/settings' },
  { name: 'Cronjob Settings', to: '/admin/cron-settings' },
];

type Channel = 'sms' | 'email';
type ChannelType = 'BAS' | 'FBT' | 'IAS' | 'FED';
const notificationTypes: ChannelType[] = ['BAS', 'FBT', 'IAS', 'FED'];
const channels: Channel[] = ['sms', 'email'];

const channelLabels: Record<Channel, string> = { sms: 'SMS', email: 'Email' };

// For MUI-like switch
const Switch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none border-2 border-transparent ${checked ? 'bg-indigo-600' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-checked={checked}
    role="switch"
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

type CronState = Record<ChannelType, {
  sms: { enabled: boolean; duration: number | '' };
  email: { enabled: boolean; duration: number | '' };
}>;

const defaultState: CronState = notificationTypes.reduce((acc, type) => {
  acc[type] = {
    sms: { enabled: false, duration: '' },
    email: { enabled: false, duration: '' },
  };
  return acc;
}, {} as CronState);

const AdminCronSettings: React.FC = () => {
  const location = useLocation();
  const [cronState, setCronState] = useState<CronState>(defaultState);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<ChannelType | null>(null);
  const [editBuffer, setEditBuffer] = useState<CronState>(defaultState);

  useEffect(() => {
    setLoading(false);
  }, []);

  const startEdit = (type: ChannelType) => {
    setEditRow(type);
    setEditBuffer({ ...cronState });
    setError(null);
    setSuccess(false);
  };

  const cancelEdit = () => {
    setEditRow(null);
    setEditBuffer(defaultState);
    setError(null);
  };

  const saveEdit = (type: ChannelType) => {
    setCronState(editBuffer);
    setEditRow(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1500);
  };

  const handleDurationChange = (type: ChannelType, channel: Channel, value: string) => {
    if (editRow === type) {
      setEditBuffer(s => ({
        ...s,
        [type]: {
          ...s[type],
          [channel]: {
            ...s[type][channel],
            duration: value === '' ? '' : Math.max(0, Number(value)),
          },
        },
      }));
    }
  };

  const handleToggle = (type: ChannelType, channel: Channel) => {
    if (editRow === type) {
      setEditBuffer(s => ({
        ...s,
        [type]: {
          ...s[type],
          [channel]: {
            ...s[type][channel],
            enabled: !s[type][channel].enabled,
          },
        },
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    // TODO: Map cronState to API payload and call companyService.updateCronjobSettings
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
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
      <div className="flex-1 flex flex-col items-center justify-start min-h-screen">
        <AppNavbar />
        <div className="bg-white/90 rounded-2xl shadow-2xl p-4 md:p-8 max-w-4xl w-full mt-8 md:mt-0">
          <h1 className="text-3xl font-bold text-indigo-700 mb-8 text-center">Cron Job Notification Settings</h1>
          <form onSubmit={handleSave}>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 rounded-xl shadow-lg bg-white">
                <thead>
                  <tr className="bg-blue-700 text-white sticky top-0 z-10 rounded-t-xl">
                    <th className="px-6 py-4 text-left text-lg font-semibold rounded-tl-xl">Notification Type</th>
                    {channels.map(channel => (
                      <th key={channel} className="px-6 py-4 text-center text-lg font-semibold">{channelLabels[channel]}</th>
                    ))}
                    <th className="px-6 py-4 text-center text-lg font-semibold rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationTypes.map((type, idx) => (
                    <tr key={type} className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} ${editRow === type ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}> 
                      <td className="px-6 py-4 font-semibold text-gray-800 text-lg whitespace-nowrap">{type}</td>
                      {channels.map(channel => (
                        <td key={channel} className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Switch
                              checked={editRow === type ? editBuffer[type][channel].enabled : cronState[type][channel].enabled}
                              onChange={() => editRow === type && handleToggle(type, channel)}
                              disabled={editRow !== type}
                            />
                            <input
                              type="number"
                              min={0}
                              className={`w-24 rounded-lg border-2 text-center py-1 px-2 text-base font-medium transition-all duration-150 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 ${editRow === type ? 'border-indigo-400 bg-white' : 'border-gray-200 bg-gray-100'} ${editRow === type && editBuffer[type][channel].enabled ? '' : 'opacity-60'}`}
                              value={editRow === type ? editBuffer[type][channel].duration : cronState[type][channel].duration}
                              onChange={e => handleDurationChange(type, channel, e.target.value)}
                              disabled={editRow !== type || !(editRow === type ? editBuffer[type][channel].enabled : cronState[type][channel].enabled)}
                              placeholder="Days"
                            />
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center">
                        {editRow === type ? (
                          <div className="flex gap-2 justify-center">
                            <button type="button" title="Save" onClick={() => saveEdit(type)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1 shadow transition"><FaSave /> <span className="hidden md:inline">Save</span></button>
                            <button type="button" title="Cancel" onClick={cancelEdit} className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded flex items-center gap-1 shadow transition"><FaTimes /> <span className="hidden md:inline">Cancel</span></button>
                          </div>
                        ) : (
                          <button type="button" title="Edit" onClick={() => startEdit(type)} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-1 shadow transition"><FaEdit /> <span className="hidden md:inline">Edit</span></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-8">
              <button
                type="submit"
                className="w-full md:w-auto py-2 px-8 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg text-lg"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
              {success && <div className="text-green-600 text-center font-semibold animate-pulse">Settings saved!</div>}
              {error && <div className="text-red-600 text-center font-semibold animate-pulse">{error}</div>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AdminCronSettings; 