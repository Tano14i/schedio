import type { ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

export function DataTable<T>({
  columns,
  data
}: {
  columns: TableColumn<T>[];
  data: T[];
}) {
  const templateColumns = `repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <div
        className="hidden gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:[grid-template-columns:var(--table-cols)]"
        style={{ ["--table-cols" as string]: templateColumns }}
      >
        {columns.map((column) => (
          <div key={column.key} className={column.headerClassName}>
            {column.header}
          </div>
        ))}
      </div>
      <div className="divide-y divide-slate-200">
        {data.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-3 px-4 py-4 md:items-center md:[grid-template-columns:var(--table-cols)]"
            style={{ ["--table-cols" as string]: templateColumns }}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className={`text-sm text-slate-700 ${column.cellClassName ?? ""}`}
              >
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                  {column.header}
                </div>
                {column.render(item)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
