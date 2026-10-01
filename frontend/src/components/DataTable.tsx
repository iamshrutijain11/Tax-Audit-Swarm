import React from 'react';
import { Loader2 } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}

function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found.',
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {columns.map(col => (
              <th key={col.key} className={`table-head ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-white/[0.04]">
                {columns.map(col => (
                  <td key={col.key} className="table-cell">
                    <div
                      className="h-4 rounded animate-pulse"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        width: `${Math.random() * 40 + 40}%`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-500 text-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center">
                    <Loader2 size={20} className="text-slate-600" />
                  </div>
                  {emptyMessage}
                </div>
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={keyExtractor(row)}
                className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className={`table-cell ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
export type { Column };
