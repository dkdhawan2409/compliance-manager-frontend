import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import toast from 'react-hot-toast';
import { companyService, ComplianceDeadlines } from '../api/companyService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Tabs, Tab, Box } from '@mui/material';

const initialDeadlines = {
  basMonthly: '',
  basQuarterly: {
    q1: '',
    q2: '',
    q3: '',
    q4: '',
  },
  basAnnual: '',
  iasMonthly: '',
  iasQuarterly: {
    q1: '',
    q2: '',
    q3: '',
    q4: '',
  },
  fbtAnnual: { self: '', agent: '' },
  annualRadio: 'standard',
};

type Quarter = 'q1' | 'q2' | 'q3' | 'q4';
type QuarterField = Quarter | `${Quarter}Start` | `${Quarter}End`;

const quarterLabels: Array<{
  key: Quarter;
  label: string;
  deadline: string;
}> = [
  { key: 'q1', label: 'Q1 (Jul–Sep)', deadline: '28 Oct' },
  { key: 'q2', label: 'Q2 (Oct–Dec)', deadline: '28 Feb' },
  { key: 'q3', label: 'Q3 (Jan–Mar)', deadline: '28 Apr' },
  { key: 'q4', label: 'Q4 (Apr–Jun)', deadline: '28 Jul' },
];

const formatDate = (date: Dayjs | null) => (date ? date.format('DD MMM YYYY') : '');
const parseDate = (str: string) => (str ? dayjs(str, 'DD MMM YYYY') : null);

const AdminCronSettings: React.FC = () => {
  const [deadlines, setDeadlines] = useState<typeof initialDeadlines>(initialDeadlines);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState(0);

  // Map API data to form state
  const apiToForm = (data: ComplianceDeadlines) => ({
    basMonthly: data.bas.monthly || '',
    basQuarterly: {
      q1: data.bas.quarterly.q1 || '',
      q2: data.bas.quarterly.q2 || '',
      q3: data.bas.quarterly.q3 || '',
      q4: data.bas.quarterly.q4 || '',
    },
    basAnnual: '',
    iasMonthly: data.ias.monthly || '',
    iasQuarterly: {
      q1: data.ias.quarterly.q1 || '',
      q2: data.ias.quarterly.q2 || '',
      q3: data.ias.quarterly.q3 || '',
      q4: data.ias.quarterly.q4 || '',
    },
    fbtAnnual: {
      self: data.fbt.annual.selfLodgement || '',
      agent: data.fbt.annual.taxAgentElectronic || '',
    },
    annualRadio:
      data.annual && data.annual.noTaxReturn && data.annual.noTaxReturn.trim() !== ''
        ? 'late'
        : 'standard',
  });

  // Map form state to API payload
  const formToApi = (form: typeof initialDeadlines): ComplianceDeadlines => ({
    bas: {
      monthly: form.basMonthly,
      quarterly: {
        q1: form.basQuarterly.q1,
        q2: form.basQuarterly.q2,
        q3: form.basQuarterly.q3,
        q4: form.basQuarterly.q4,
      },
    },
    annual: form.annualRadio === 'late'
      ? { standard: '', noTaxReturn: '28 Feb' }
      : { standard: '31 Oct', noTaxReturn: '' },
    ias: {
      monthly: form.iasMonthly,
      quarterly: {
        q1: form.iasQuarterly.q1,
        q2: form.iasQuarterly.q2,
        q3: form.iasQuarterly.q3,
        q4: form.iasQuarterly.q4,
      },
    },
    fbt: {
      annual: {
        selfLodgement: form.fbtAnnual.self,
        taxAgentElectronic: form.fbtAnnual.agent,
      },
    },
  });

  useEffect(() => {
    setLoading(true);
    companyService
      .getComplianceDeadlines()
      .then((data) => {
        setDeadlines(apiToForm(data));
      })
      .catch(() => {
        toast.error('Failed to load deadlines');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (
    field: 'basMonthly' | 'iasMonthly' | 'annualRadio',
    value: string
  ) => {
    setDeadlines((prev) => ({ ...prev, [field]: value }));
  };
  const handleQuarterChange = (
    section: 'basQuarterly' | 'iasQuarterly',
    quarter: QuarterField,
    value: string
  ) => {
    setDeadlines((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [quarter]: value,
        },
      }));
  };
  const handleAnnualRadio = (value: string) => {
    setDeadlines((prev) => ({ ...prev, annualRadio: value }));
  };
  const handleFbtAnnual = (type: string, value: string) => {
    setDeadlines((prev) => ({
      ...prev,
      fbtAnnual: {
        ...prev.fbtAnnual,
        [type]: value,
        },
      }));
  };

  // Single submit handler for the full form
  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companyService.updateComplianceDeadlines(formToApi(deadlines));
      toast.success('Deadlines updated! All clients now see the new due‑dates.');
    } catch {
      toast.error('Failed to save deadlines');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto py-10 px-4 md:px-0">
        <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 mb-2 text-center tracking-tight">Compliance Deadlines</h1>
        <p className="text-gray-600 text-center mb-8 text-base md:text-lg">Set the statutory due‑dates that will appear in every client dashboard. All dates must be in DD MMM format (e.g., 21 Aug).</p>
        {loading ? (
          <div className="flex justify-center items-center py-20 text-lg text-indigo-600 font-semibold animate-pulse">Loading deadlines...</div>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => !saving && setTab(v)}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{ mb: 4, borderRadius: 2, boxShadow: 1, background: '#f8fafc' }}
            >
              <Tab label="BAS" disabled={saving} />
              <Tab label="IAS" disabled={saving} />
              <Tab label="FBT" disabled={saving} />
            </Tabs>
            <form onSubmit={handleSubmitAll} className="space-y-10 bg-white rounded-xl shadow p-6 border border-slate-100">
              {/* BAS Tab */}
              {tab === 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">BAS</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-medium mb-1">Monthly deadline</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="rounded-lg border border-slate-300 px-3 py-2 w-32"
                          placeholder="21"
                          value={deadlines.basMonthly}
                          onChange={e => handleChange('basMonthly', e.target.value)}
                        />
                        <span className="text-gray-500 text-sm">Day of following month</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">e.g. July BAS → 21 Aug</p>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Annual deadline</label>
                      <div className="flex flex-col gap-2 mt-1">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="annualRadio"
                            value="standard"
                            checked={deadlines.annualRadio === 'standard'}
                            onChange={() => handleAnnualRadio('standard')}
                          />
                          <span>Standard 31 Oct</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                            type="radio"
                            name="annualRadio"
                            value="late"
                            checked={deadlines.annualRadio === 'late'}
                            onChange={() => handleAnnualRadio('late')}
                          />
                          <span>No tax‑return lodged ➜ 28 Feb</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block font-medium mb-1">Quarterly periods</label>
                    <div className="grid grid-cols-1 gap-4">
                      {quarterLabels.map(q => (
                        <div key={q.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 bg-gray-50 border border-slate-200 rounded-xl px-4 py-3">
                          <span className="w-32 font-medium text-gray-700 text-sm mb-1 md:mb-0">{q.label}</span>
                          <div className="flex flex-col md:flex-row gap-2 flex-1">
                            <div className="flex flex-col flex-1">
                              <label className="text-xs text-gray-500 mb-1">Deadline</label>
                              <DatePicker
                                format="DD MMM YYYY"
                                value={parseDate(deadlines.basQuarterly[q.key])}
                                onChange={date => handleQuarterChange('basQuarterly', q.key, formatDate(date))}
                                slotProps={{ textField: { size: 'small', fullWidth: true, variant: 'outlined', placeholder: q.deadline + ' 2024' } }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 flex justify-end">
                    <button
                      type="button"
                      className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
                      onClick={() => setTab(1)}
                      disabled={saving}
                    >
                      Next
                    </button>
                  </div>
                </section>
              )}
              {/* IAS Tab */}
              {tab === 1 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">IAS (Income Activity Statement)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-medium mb-1">Monthly deadline</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="rounded-lg border border-slate-300 px-3 py-2 w-32"
                          placeholder="21"
                          value={deadlines.iasMonthly}
                          onChange={e => handleChange('iasMonthly', e.target.value)}
                        />
                        <span className="text-gray-500 text-sm">Day of following month</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">e.g. July IAS → 21 Aug</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block font-medium mb-1">Quarterly periods</label>
                    <div className="grid grid-cols-1 gap-4">
                      {quarterLabels.map(q => (
                        <div key={q.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 bg-gray-50 border border-slate-200 rounded-xl px-4 py-3">
                          <span className="w-32 font-medium text-gray-700 text-sm mb-1 md:mb-0">{q.label}</span>
                          <div className="flex flex-col md:flex-row gap-2 flex-1">
                            <div className="flex flex-col flex-1">
                              <label className="text-xs text-gray-500 mb-1">Deadline</label>
                              <DatePicker
                                format="DD MMM YYYY"
                                value={parseDate(deadlines.iasQuarterly[q.key])}
                                onChange={date => handleQuarterChange('iasQuarterly', q.key, formatDate(date))}
                                slotProps={{ textField: { size: 'small', fullWidth: true, variant: 'outlined', placeholder: q.deadline + ' 2024' } }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 flex justify-between">
                    <button
                      type="button"
                      className="px-8 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold text-lg shadow hover:bg-slate-300 transition disabled:opacity-50"
                      onClick={() => setTab(0)}
                      disabled={saving}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
                      onClick={() => setTab(2)}
                      disabled={saving}
                    >
                      Next
                    </button>
                  </div>
                </section>
              )}
              {/* FBT Tab */}
              {tab === 2 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">FBT (Fringe Benefits Tax)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-medium mb-1">Annual</label>
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 text-sm w-40">Self‑lodgement</span>
                          <DatePicker
                            format="DD MMM YYYY"
                            value={parseDate(deadlines.fbtAnnual.self)}
                            onChange={date => handleFbtAnnual('self', formatDate(date))}
                            slotProps={{ textField: { size: 'small', fullWidth: false, variant: 'outlined', placeholder: '21 May 2024' } }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 text-sm w-40">Tax agent electronic</span>
                          <DatePicker
                            format="DD MMM YYYY"
                            value={parseDate(deadlines.fbtAnnual.agent)}
                            onChange={date => handleFbtAnnual('agent', formatDate(date))}
                            slotProps={{ textField: { size: 'small', fullWidth: false, variant: 'outlined', placeholder: '25 Jun 2024' } }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Quarterly instalments</label>
                      <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 text-sm mt-2">
                        Follows BAS quarterly due‑dates (read‑only).
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 flex justify-between">
                    <button
                      type="button"
                      className="px-8 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold text-lg shadow hover:bg-slate-300 transition disabled:opacity-50"
                      onClick={() => setTab(1)}
                      disabled={saving}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold text-lg shadow hover:bg-green-700 transition disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </section>
              )}
            </form>
          </Box>
        )}
      </div>
    </SidebarLayout>
  );
};
export default AdminCronSettings; 