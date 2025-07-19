import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { companyService, Company } from '../api/companyService';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  getPaginationRowModel,
} from '@tanstack/react-table';

const adminNavLinks = [
  { name: 'Company List', to: '/admin/companies' },
  { name: 'Send Notification', to: '/admin/notify' },
  { name: 'Settings', to: '/admin/settings' },
];

const AdminCompanyList: React.FC = () => {
  const location = useLocation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await companyService.getAllCompanies();
        setCompanies(res.data);
      } catch (err: any) {
        setError('Failed to fetch companies.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const columns = useMemo<ColumnDef<Company, any>[]>(
    () => [
      {
        accessorKey: 'companyName',
        header: 'Company Name',
        cell: info => <span className="font-medium text-gray-800">{info.getValue()}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: info => <span className="text-gray-700">{info.getValue()}</span>,
      },
      {
        accessorKey: 'mobileNumber',
        header: 'Mobile',
        cell: info => <span className="text-gray-700">{info.getValue()}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Active',
        cell: info =>
          info.getValue() ? (
            <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Active</span>
          ) : (
            <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">Inactive</span>
          ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: info => <span className="capitalize text-gray-700">{info.getValue() || 'user'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: info => <span className="text-gray-500 text-xs">{new Date(info.getValue()).toLocaleDateString()}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: companies,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false,
  });

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
        <div className="bg-white/90 rounded-2xl shadow-2xl p-8 max-w-5xl w-full mt-8 md:mt-0">
          <h1 className="text-3xl font-bold mb-6 text-indigo-700">Company List (Admin)</h1>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="text-indigo-600 font-semibold animate-pulse">Loading companies...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-6">{error}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-indigo-100">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            className="px-4 py-2 text-left text-sm font-semibold text-indigo-700 cursor-pointer select-none"
                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="ml-1">
                                {header.column.getIsSorted() === 'asc' ? '▲' : header.column.getIsSorted() === 'desc' ? '▼' : ''}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="border-b last:border-b-0 hover:bg-indigo-50 transition">
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-2">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {table.getPageCount() > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 disabled:opacity-50"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </button>
                  {Array.from({ length: table.getPageCount() }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1 rounded font-semibold ${table.getState().pagination.pageIndex === i ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-200'}`}
                      onClick={() => table.setPageIndex(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1 rounded bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 disabled:opacity-50"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminCompanyList; 