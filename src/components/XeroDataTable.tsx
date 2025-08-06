import React from 'react';

interface XeroDataTableProps {
  data: any;
  resourceType: string;
}

const XeroDataTable: React.FC<XeroDataTableProps> = ({ data, resourceType }) => {
  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderTable = () => {
    if (!data || !Array.isArray(data)) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-500">No {resourceType} found</p>
        </div>
      );
    }

    // Get all unique keys from the data
    const allKeys = new Set<string>();
    data.forEach((item: any) => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    const keys = Array.from(allKeys);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {keys.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                {keys.map((key) => (
                  <td
                    key={key}
                    className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100"
                  >
                    <div className="max-w-xs truncate" title={renderValue(item[key])}>
                      {renderValue(item[key])}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSummary = () => {
    if (!data || !Array.isArray(data)) return null;

    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-700">Total Records:</span> {data.length}
          </div>
          <div>
            <span className="font-medium text-blue-700">Resource Type:</span> {resourceType}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSummary()}
      {renderTable()}
    </div>
  );
};

export default XeroDataTable; 