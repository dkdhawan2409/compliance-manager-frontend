import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Switch } from '@mui/material';
import { companyService, Company } from '../api/companyService';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';

/* -------------------------------------------------------------------------- */
/*                                   config                                   */
/* -------------------------------------------------------------------------- */

const adminNavLinks = [
  { name: 'Company List', to: '/admin/companies' },
  { name: 'Send Notification', to: '/admin/notify' },
  { name: 'Settings', to: '/admin/settings' },
  { name: 'Cronjob Settings', to: '/admin/cron-settings' },
];

/* -------------------------------------------------------------------------- */
/*                          AdminCompanyList Component                        */
/* -------------------------------------------------------------------------- */

const AdminCompanyList: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  /* --------------------------------- state -------------------------------- */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedCompliance, setSelectedCompliance] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  /* ---------------------------------- data -------------------------------- */
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await companyService.getAllCompanies();
        setCompanies(res.data);
      } catch {
        setError('Failed to fetch companies.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  /* ------------------------------ handlers ------------------------------- */
  const handleToggleActive = useCallback((company: Company) => {
    alert(`${company.isActive ? 'Deactivate' : 'Activate'} company: ${company.companyName}`);
    // TODO: call API to update status
  }, []);

  const handleEdit = useCallback(async (company: Company) => {
    setDrawerLoading(true);
    setEditModalOpen(true);
    try {
      const res = await companyService.getCompanyById(company.id);
      setSelectedCompany(res.data.company);
      setSelectedCompliance(res.data.compliance);
    } catch {
      setSelectedCompany(company);
      setSelectedCompliance(null);
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedCompany(null);
    setSelectedCompliance(null);
  };

  /* -------------------------------- table --------------------------------- */
  const columns = useMemo<ColumnDef<Company, any>[]>(
    () => [
      {
        id: 'select',
        header: () => <input type="checkbox" disabled className="accent-indigo-500" />,
        cell: () => <input type="checkbox" className="accent-indigo-500 focus:ring-0" />,
        size: 32,
      },
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: info => (
          <span className="font-medium text-slate-800 whitespace-nowrap">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: info => (
          <span className="text-slate-600 whitespace-nowrap">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: 'mobileNumber',
        header: 'Mobile',
        cell: info => <span className="text-slate-600">{info.getValue()}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: info =>
          info.getValue() ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="danger">Inactive</Badge>
          ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: info => <span className="capitalize text-slate-600">{info.getValue() || 'user'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: info => (
          <time className="text-slate-500 text-xs" dateTime={info.getValue()}>
            {new Date(info.getValue()).toLocaleDateString()}
          </time>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            className="px-3 py-1.5 text-xs font-semibold rounded shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </button>
        ),
      },
    ],
    [handleEdit]
  );

  const table = useReactTable({
    data: companies,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* ---------------------------- drawer markup ---------------------------- */
  const EditCompanyDrawer = () => {
    const [mobileNumber, setMobileNumber] = useState(selectedCompany?.mobileNumber || '');
    const [countryCode, setCountryCode] = useState(selectedCompany?.countryCode || '');
    const [isActive, setIsActive] = useState(selectedCompany?.isActive || false);
    
    // Compliance form state
    const [complianceForm, setComplianceForm] = useState({
      basFrequency: selectedCompliance?.basFrequency || '',
      fbtApplicable: selectedCompliance?.fbtApplicable || false,
      nextBasDue: selectedCompliance?.nextBasDue || '',
      nextFbtDue: selectedCompliance?.nextFbtDue || '',
      iasRequired: selectedCompliance?.iasRequired || false,
      iasFrequency: selectedCompliance?.iasFrequency || '',
      nextIasDue: selectedCompliance?.nextIasDue || '',
      financialYearEnd: selectedCompliance?.financialYearEnd || ''
    });

    // Update compliance form when selectedCompliance changes
    useEffect(() => {
      if (selectedCompliance) {
        setComplianceForm({
          basFrequency: selectedCompliance.basFrequency || '',
          fbtApplicable: selectedCompliance.fbtApplicable || false,
          nextBasDue: selectedCompliance.nextBasDue || '',
          nextFbtDue: selectedCompliance.nextFbtDue || '',
          iasRequired: selectedCompliance.iasRequired || false,
          iasFrequency: selectedCompliance.iasFrequency || '',
          nextIasDue: selectedCompliance.nextIasDue || '',
          financialYearEnd: selectedCompliance.financialYearEnd || ''
        });
      }
    }, [selectedCompliance]);

    if (drawerLoading) {
      return (
        <Overlay>
          <div className="animate-pulse text-indigo-600 font-bold text-lg">Loading company info…</div>
        </Overlay>
      );
    }
    if (!selectedCompany) return null;

    const handleSave = async () => {
      setModalLoading(true);
      setModalError(null);
      try {
        await companyService.updateCompanyById(selectedCompany.id, {
          companyName: selectedCompany.companyName,
          email: selectedCompany.email,
          mobileNumber,
          countryCode,
          isActive,
        });
        
        // Also update compliance data if it exists
        if (selectedCompliance) {
          await companyService.updateComplianceDetails({
            basFrequency: complianceForm.basFrequency as 'Monthly' | 'Quarterly' | 'Annually',
            nextBasDue: complianceForm.nextBasDue,
            fbtApplicable: complianceForm.fbtApplicable,
            nextFbtDue: complianceForm.nextFbtDue,
            iasRequired: complianceForm.iasRequired,
            iasFrequency: complianceForm.iasFrequency as 'Monthly' | 'Quarterly' | 'Annually',
            nextIasDue: complianceForm.nextIasDue,
            financialYearEnd: complianceForm.financialYearEnd
          });
        }
        
        handleCloseModal();
        window.location.reload();
      } catch {
        setModalError('Failed to update company.');
      } finally {
        setModalLoading(false);
      }
    };

    return (
      <Overlay>
        <section className="relative ml-auto h-full w-full max-w-lg bg-white shadow-xl flex flex-col animate-[slideIn_0.3s_ease-out]">
          {/* header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
            <h2 className="text-lg font-bold text-slate-800 truncate">Edit – {selectedCompany.companyName}</h2>
            <button
              className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              &times;
            </button>
          </header>

          {/* body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <fieldset className="space-y-4">
              <Legend>Basic details</Legend>
              <Input label="Company Name" value={selectedCompany.companyName} disabled />
              <Input label="Email" value={selectedCompany.email} disabled />
              <Input label="Mobile" value={mobileNumber} onChange={setMobileNumber} />
              <Input label="Country Code" value={countryCode} onChange={setCountryCode} />
              <Input label="Role" value={selectedCompany.role || 'user'} disabled />
              <Input label="Created" value={new Date(selectedCompany.createdAt).toLocaleDateString()} disabled />
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={isActive} onChange={() => setIsActive(v => !v)} color="success" />
                <span className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <Legend>Compliance</Legend>
              <Input label="BAS Frequency" value={complianceForm.basFrequency} onChange={(v) => setComplianceForm(prev => ({ ...prev, basFrequency: v }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FBT Applicable</label>
                <select 
                  className="w-full rounded border-gray-300 px-3 py-2" 
                  value={complianceForm.fbtApplicable ? 'Yes' : 'No'}
                  onChange={(e) => setComplianceForm(prev => ({ ...prev, fbtApplicable: e.target.value === 'Yes' }))}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <Input label="Next BAS Due" value={complianceForm.nextBasDue} onChange={(v) => setComplianceForm(prev => ({ ...prev, nextBasDue: v }))} />
              <Input label="Next FBT Due" value={complianceForm.nextFbtDue} onChange={(v) => setComplianceForm(prev => ({ ...prev, nextFbtDue: v }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IAS Required</label>
                <select 
                  className="w-full rounded border-gray-300 px-3 py-2" 
                  value={complianceForm.iasRequired ? 'Yes' : 'No'}
                  onChange={(e) => setComplianceForm(prev => ({ ...prev, iasRequired: e.target.value === 'Yes' }))}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <Input label="IAS Frequency" value={complianceForm.iasFrequency} onChange={(v) => setComplianceForm(prev => ({ ...prev, iasFrequency: v }))} />
              <Input label="Next IAS Due" value={complianceForm.nextIasDue} onChange={(v) => setComplianceForm(prev => ({ ...prev, nextIasDue: v }))} />
              <Input label="Financial Year End" value={complianceForm.financialYearEnd} onChange={(v) => setComplianceForm(prev => ({ ...prev, financialYearEnd: v }))} />
            </fieldset>

            {modalError && <p className="text-red-600 text-sm">{modalError}</p>}
          </div>

          {/* footer */}
          <footer className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white sticky bottom-0">
            <button
              className="px-4 py-2 rounded bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-300"
              onClick={handleCloseModal}
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
              onClick={handleSave}
              disabled={modalLoading}
            >
              {modalLoading ? 'Saving…' : 'Save'}
            </button>
          </footer>
        </section>
      </Overlay>
    );
  };

  /* ------------------------------- render ---------------------------------- */
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-white via-indigo-50 to-slate-50">
      {/* sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white/95 border-r border-slate-200 shadow-lg">
        <header className="h-20 flex items-center justify-center border-b border-slate-100">
          <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">Super Admin</span>
        </header>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {adminNavLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-4 py-2.5 rounded-lg font-medium transition text-sm focus-visible:ring-2 focus-visible:ring-indigo-400 focus:outline-none ${
                location.pathname === link.to
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* main */}
      <section className="flex-1 flex flex-col min-h-screen">
        <AppNavbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Company List <span className="text-indigo-600">(Admin)</span>
            </h1>
          </header>

          {editModalOpen && <EditCompanyDrawer />}

          {/* state handling */}
          {loading && <StateMsg>Loading companies…</StateMsg>}
          {error && !loading && <StateMsg isError>{error}</StateMsg>}

          {!loading && !error && (
            <div className="space-y-6">
              <div className="overflow-x-auto max-h-[calc(100vh-300px)] scrollbar-thin w-full rounded-xl shadow ring-1 ring-slate-100 bg-white/90 backdrop-blur-md">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-20 bg-white/90 backdrop-blur">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            scope="col"
                            className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-xs text-slate-600 select-none cursor-pointer"
                            onClick={
                              header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined
                            }
                          >
                            <span className="inline-flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span>
                                  {header.column.getIsSorted() === 'asc'
                                    ? '▲'
                                    : header.column.getIsSorted() === 'desc'
                                    ? '▼'
                                    : ''}
                                </span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr
                        key={row.id}
                        className="group hover:bg-indigo-50 even:bg-slate-50/40 transition-colors hover:-translate-y-px hover:shadow-sm"
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-3 py-2 whitespace-nowrap align-middle text-slate-700">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              {table.getPageCount() > 1 && <Pagination table={table} />}
            </div>
          )}
        </main>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              helper components                             */
/* -------------------------------------------------------------------------- */

interface InputProps {
  label: string;
  value: string;
  disabled?: boolean;
  onChange?: (v: string) => void;
}

const Input: React.FC<InputProps> = ({ label, value, disabled, onChange }) => (
  <label className="block">
    <span className="block text-xs font-semibold mb-1 text-slate-600">{label}</span>
    <input
      value={value}
      disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      className={`w-full px-3 py-2 rounded border text-sm ${
        disabled ? 'bg-slate-100 text-slate-500' : 'focus:ring-2 focus:ring-indigo-400 focus:outline-none'
      }`}
    />
  </label>
);

const Legend: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <legend className="text-sm font-semibold text-slate-700">{children}</legend>
);

const Badge: React.FC<{ variant: 'success' | 'danger'; children: React.ReactNode }> = ({
  variant,
  children,
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ring-1 ${
      variant === 'success'
        ? 'bg-green-50 text-green-700 ring-green-200'
        : 'bg-red-50 text-red-700 ring-red-200'
    }`}
  >
    {variant === 'success' ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-red-500" />}
    {children}
  </span>
);

const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-0 z-50 flex">
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
    <div className="relative ml-auto h-full w-full max-w-lg flex flex-col">{children}</div>
  </div>
);

const StateMsg: React.FC<{ children: React.ReactNode; isError?: boolean }> = ({ children, isError }) => (
  <div
    className={`flex items-center justify-center py-20 rounded-xl shadow-inner bg-white/60 ${
      isError ? 'text-red-600' : 'text-indigo-600'
    } font-medium animate-pulse`}
  >
    {children}
  </div>
);

const Pagination: React.FC<{ table: ReturnType<typeof useReactTable> }> = ({ table }) => (
  <nav className="flex items-center justify-center gap-2 mt-4" aria-label="Table pagination">
    <button
      className="px-3 py-1.5 rounded text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
      onClick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
    >
      Prev
    </button>
    {Array.from({ length: table.getPageCount() }).map((_, i) => (
      <button
        key={i}
        className={`px-3 py-1.5 rounded text-sm font-semibold ${
          table.getState().pagination.pageIndex === i
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-slate-50 text-slate-700 hover:bg-slate-200'
        }`}
        onClick={() => table.setPageIndex(i)}
      >
        {i + 1}
      </button>
    ))}
    <button
      className="px-3 py-1.5 rounded text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
    >
      Next
    </button>
  </nav>
);

export default AdminCompanyList;
