import { type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  mobileHidden?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string);
  emptyMessage?: string;
  loading?: boolean;
}

function renderCellValue<T extends Record<string, unknown>>(
  row: T,
  col: Column<T>,
  index: number,
): ReactNode {
  if (col.render) return col.render(row, index);
  return String(row[col.key] ?? "—");
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = "id" as keyof T,
  emptyMessage = "No records found.",
  loading = false,
}: DataTableProps<T>) {
  const getKey = (row: T, index: number): string => {
    if (typeof keyField === "function") return keyField(row);
    const value = row[keyField];
    return value != null ? String(value) : String(index);
  };

  const visibleColumns = columns.filter((col) => !col.mobileHidden);
  const detailColumns = visibleColumns.filter((col) => col.key !== "actions");
  const actionColumn = visibleColumns.find((col) => col.key === "actions");

  return (
    <>
      <div className="md:hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-text-muted">
            <svg
              className="h-5 w-5 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </div>
        ) : data.length === 0 ? (
          <p className="px-4 py-12 text-center text-text-muted">{emptyMessage}</p>
        ) : (
          <div className="divide-y divide-border">
            {data.map((row, index) => (
              <article key={getKey(row, index)} className="space-y-3 p-4">
                {detailColumns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="shrink-0 text-text-secondary">
                      {col.header}
                    </span>
                    <span
                      className={`text-right text-text-primary ${col.className ?? ""}`}
                    >
                      {renderCellValue(row, col, index)}
                    </span>
                  </div>
                ))}
                {actionColumn && (
                  <div className="border-t border-border pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      {actionColumn.header}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {renderCellValue(row, actionColumn, index)}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-border-light/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-text-muted"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getKey(row, index)}
                  className="transition-colors hover:bg-border-light/40"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-text-primary ${col.className ?? ""}`}
                    >
                      {renderCellValue(row, col, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
