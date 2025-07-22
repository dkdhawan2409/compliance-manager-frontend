import React, { useEffect, useState } from 'react';
import { companyService, ComplianceDeadlines } from '../api/companyService';

const AdminComplianceDeadlines: React.FC = () => {
  const [deadlines, setDeadlines] = useState<ComplianceDeadlines | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    companyService.getComplianceDeadlines()
      .then(setDeadlines)
      .catch(() => setError('Failed to load deadlines'))
      .finally(() => setLoading(false));
  }, []);

  // Type-safe change handler for top-level and nested fields
  const handleChange = (
    section: keyof ComplianceDeadlines,
    field: string,
    value: string,
    subSection?: string
  ) => {
    if (!deadlines) return;
    setDeadlines(prev => {
      if (!prev) return prev;
      if (subSection) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: {
              ...((prev[section] as any)[field]),
              [subSection]: value,
            },
          },
        };
      } else {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };
      }
    });
  };

  const handleSave = async () => {
    if (!deadlines) return;
    setSaving(true);
    setError(null);
    try {
      await companyService.updateComplianceDeadlines(deadlines);
      alert('Deadlines updated successfully');
    } catch (e) {
      setError('Failed to update deadlines');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!deadlines) return <div>No data</div>;

  return (
    <div>
      <h2>Compliance Deadlines</h2>
      {/* BAS Monthly */}
      <div>
        <label>BAS Monthly Deadline:</label>
        <input
          type="date"
          value={deadlines.bas.monthly}
          onChange={e => handleChange('bas', 'monthly', e.target.value)}
        />
      </div>
      {/* BAS Quarterly */}
      <div>
        <label>BAS Quarterly Deadlines:</label>
        {['q1', 'q2', 'q3', 'q4'].map(q => (
          <div key={q}>
            <span>{q.toUpperCase()}:</span>
            <input
              type="date"
              value={deadlines.bas.quarterly[q as keyof typeof deadlines.bas.quarterly]}
              onChange={e => handleChange('bas', 'quarterly', e.target.value, q)}
            />
          </div>
        ))}
      </div>
      {/* Annual */}
      <div>
        <label>Annual Standard Deadline:</label>
        <input
          type="date"
          value={deadlines.annual.standard}
          onChange={e => handleChange('annual', 'standard', e.target.value)}
        />
        <label>Annual No Tax Return Deadline:</label>
        <input
          type="date"
          value={deadlines.annual.noTaxReturn}
          onChange={e => handleChange('annual', 'noTaxReturn', e.target.value)}
        />
      </div>
      {/* IAS Monthly */}
      <div>
        <label>IAS Monthly Deadline:</label>
        <input
          type="date"
          value={deadlines.ias.monthly}
          onChange={e => handleChange('ias', 'monthly', e.target.value)}
        />
      </div>
      {/* IAS Quarterly */}
      <div>
        <label>IAS Quarterly Deadlines:</label>
        {['q1', 'q2', 'q3', 'q4'].map(q => (
          <div key={q}>
            <span>{q.toUpperCase()}:</span>
            <input
              type="date"
              value={deadlines.ias.quarterly[q as keyof typeof deadlines.ias.quarterly]}
              onChange={e => handleChange('ias', 'quarterly', e.target.value, q)}
            />
          </div>
        ))}
      </div>
      {/* FBT Annual */}
      <div>
        <label>FBT Annual Self Lodgement:</label>
        <input
          type="date"
          value={deadlines.fbt.annual.selfLodgement}
          onChange={e => handleChange('fbt', 'annual', e.target.value, 'selfLodgement')}
        />
        <label>FBT Annual Tax Agent Electronic:</label>
        <input
          type="date"
          value={deadlines.fbt.annual.taxAgentElectronic}
          onChange={e => handleChange('fbt', 'annual', e.target.value, 'taxAgentElectronic')}
        />
      </div>
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

export default AdminComplianceDeadlines; 