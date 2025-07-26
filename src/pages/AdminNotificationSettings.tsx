import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { FaSms, FaEnvelope, FaBell, FaSave } from 'react-icons/fa';
import apiClient from '../api/client';

const notificationTypes = [
  { key: 'BAS', label: 'BAS', desc: 'Business Activity Statement' },
  { key: 'FBT', label: 'FBT', desc: 'Fringe Benefits Tax' },
  { key: 'IAS', label: 'IAS', desc: 'Income Activity Statement' },
  { key: 'FED', label: 'FED', desc: 'Financial End Date' },
] as const;

type NotificationTypeKey = typeof notificationTypes[number]['key'];
type ChannelSettings = { enabled: boolean; duration: string };
const initialSettings: Record<NotificationTypeKey, { sms: ChannelSettings; email: ChannelSettings }> = {
  BAS: { sms: { enabled: false, duration: '15' }, email: { enabled: false, duration: '7' } },
  FBT: { sms: { enabled: true, duration: '10' }, email: { enabled: false, duration: '10' } },
  IAS: { sms: { enabled: true, duration: '10' }, email: { enabled: true, duration: '10' } },
  FED: { sms: { enabled: true, duration: '10' }, email: { enabled: true, duration: '10' } },
};

function parseDurations(input: string): number[] {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => !isNaN(n) && n > 0);
}

function validateDurations(input: string): string | null {
  if (!input.trim()) return null;
  const values = input.split(',').map(s => s.trim()).filter(Boolean);
  const seen = new Set<number>();
  for (const v of values) {
    const n = Number(v);
    if (!/^[0-9]+$/.test(v) || isNaN(n) || n < 1 || n > 31) {
      return 'Each value must be a number between 1 and 31.';
    }
    if (seen.has(n)) {
      return 'Each value must be unique and between 1 and 31.';
    }
    seen.add(n);
  }
  return null;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
  <div className="flex items-center gap-2" aria-label={label} tabIndex={0} role="switch" aria-checked={checked}>
    <button
      type="button"
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
      onClick={onChange}
      aria-pressed={checked}
      tabIndex={-1}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : ''}`}
      />
    </button>
    <span className={`text-xs font-semibold ml-2 ${checked ? 'text-green-600' : 'text-gray-400'}`}>{checked ? 'On' : 'Off'}</span>
  </div>
);

const Snackbar: React.FC<{ open: boolean; message: string; onClose: () => void }> = ({ open, message, onClose }) => (
  <div
    className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl font-semibold text-lg animate-fade-in">
      <FaSave className="text-2xl" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white/80 hover:text-white text-xl font-bold focus:outline-none">×</button>
    </div>
  </div>
);

const AdminNotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<typeof initialSettings>(initialSettings);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [snackbar, setSnackbar] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch notification settings on component mount
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/companies/notification-settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Fetched notification settings:', result);
          
          if (result.success && result.data) {
            // Map API data to form state
            const newSettings = { ...initialSettings };
            
            result.data.forEach((item: any) => {
              const typeKey = item.type as NotificationTypeKey;
              if (newSettings[typeKey]) {
                newSettings[typeKey] = {
                  sms: {
                    enabled: item.smsEnabled,
                    duration: item.smsDays || '',
                  },
                  email: {
                    enabled: item.emailEnabled,
                    duration: item.emailDays || '',
                  },
                };
              }
            });
            
            setSettings(newSettings);
          }
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationSettings();
  }, []);

  const handleToggle = (type: NotificationTypeKey, channel: 'sms' | 'email') => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: {
          ...prev[type][channel],
          enabled: !prev[type][channel].enabled,
        },
      },
    }));
  };

  const handleDurationChange = (type: NotificationTypeKey, channel: 'sms' | 'email', value: string) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: {
          ...prev[type][channel],
          duration: value,
        },
      },
    }));
    setErrors(prev => ({
      ...prev,
      [`${type}_${channel}`]: validateDurations(value),
    }));
  };

  // Check if any error exists
  const hasError = Object.values(errors).some(Boolean);

  const handleSaveAll = async () => {
    const payload = notificationTypes.map(type => ({
      type: type.key,
      sms: {
        enabled: settings[type.key].sms.enabled,
        days: parseDurations(settings[type.key].sms.duration),
      },
      email: {
        enabled: settings[type.key].email.enabled,
        days: parseDurations(settings[type.key].email.duration),
      },
    }));
    try {      const apiBase = import.meta.env.VITE_API_URL || 'https://compliance-manager-backend.onrender.com/api';

      // const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
      const token = localStorage.getItem('token');
      await fetch(`${apiBase}/companies/notification-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ settings: payload }),
      });
      setSnackbar(true);
      setTimeout(() => setSnackbar(false), 3000);
    } catch (e) {
      setSnackbar(true);
      setTimeout(() => setSnackbar(false), 3000);
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-sans">
        <div className="max-w-4xl mx-auto py-10 px-4 md:px-0">
          <div className="flex items-center gap-4 mb-8">
            <FaBell className="text-blue-500 text-4xl" />
            <div>
              <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight leading-tight">Cron Job Notification Settings</h1>
              <p className="text-gray-500 mt-1 text-lg">Configure reminders for each compliance type. Enter one or more days (comma-separated) for when reminders should be sent before the due date.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notification settings...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
              <div className="grid grid-cols-1 gap-8 divide-y divide-blue-100">
                {notificationTypes.map(type => (
                  <div key={type.key} className="py-6 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-2xl font-bold text-blue-700 w-16 flex-shrink-0">{type.label}</span>
                      <span className="text-gray-500 text-base">{type.desc}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* SMS */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          <FaSms className="text-blue-400 text-lg" title="SMS" />
                          <span className="font-semibold text-gray-700">SMS Reminders</span>
                        </div>
                        <div className="relative flex items-center gap-2">
                          <input
                            type="text"
                            className={`w-full border ${errors[`${type.key}_sms`] ? 'border-red-500' : 'border-blue-200'} rounded px-4 py-2 text-base focus:ring-2 focus:ring-blue-300 shadow-sm pr-12`}
                            value={settings[type.key].sms.duration}
                            onChange={e => handleDurationChange(type.key, 'sms', e.target.value)}
                            placeholder="e.g. 7,14,21"
                            title="Enter days before due date, separated by commas"
                            aria-label="SMS Duration"
                          />
                          <span className="absolute right-3 text-gray-400 text-sm" title="Comma-separated days">days</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parseDurations(settings[type.key].sms.duration).map((d, i) => (
                            <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">{d} days</span>
                          ))}
                        </div>
                        <div className="mt-2">
                          <ToggleSwitch
                            checked={settings[type.key].sms.enabled}
                            onChange={() => handleToggle(type.key, 'sms')}
                            label="SMS"
                          />
                        </div>
                        {errors[`${type.key}_sms`] && (
                          <div className="text-xs text-red-600 mt-1">{errors[`${type.key}_sms`]}</div>
                        )}
                      </div>
                      {/* Email */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          <FaEnvelope className="text-indigo-400 text-lg" title="Email" />
                          <span className="font-semibold text-gray-700">Email Reminders</span>
                        </div>
                        <div className="relative flex items-center gap-2">
                          <input
                            type="text"
                            className={`w-full border ${errors[`${type.key}_email`] ? 'border-red-500' : 'border-blue-200'} rounded px-4 py-2 text-base focus:ring-2 focus:ring-indigo-300 shadow-sm pr-12`}
                            value={settings[type.key].email.duration}
                            onChange={e => handleDurationChange(type.key, 'email', e.target.value)}
                            placeholder="e.g. 7,14,21"
                            title="Enter days before due date, separated by commas"
                            aria-label="Email Duration"
                          />
                          <span className="absolute right-3 text-gray-400 text-sm" title="Comma-separated days">days</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parseDurations(settings[type.key].email.duration).map((d, i) => (
                            <span key={i} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">{d} days</span>
                          ))}
                        </div>
                        <div className="mt-2">
                          <ToggleSwitch
                            checked={settings[type.key].email.enabled}
                            onChange={() => handleToggle(type.key, 'email')}
                            label="Email"
                          />
                        </div>
                        {errors[`${type.key}_email`] && (
                          <div className="text-xs text-red-600 mt-1">{errors[`${type.key}_email`]}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-10">
            <button
              className="fixed bottom-8 right-8 px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold shadow-xl hover:scale-105 hover:from-indigo-600 hover:to-blue-700 transition-all duration-200 z-50 flex items-center gap-3"
              onClick={handleSaveAll}
              type="button"
              title="Save all notification settings"
              aria-label="Save all notification settings"
              disabled={hasError}
            >
              <FaSave className="text-2xl" /> Save All
            </button>
          </div>
        </div>
        <Snackbar open={snackbar} message="Settings saved!" onClose={() => setSnackbar(false)} />
      </div>
    </SidebarLayout>
  );
};

export default AdminNotificationSettings; 