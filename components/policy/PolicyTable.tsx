"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
} from "@tanstack/react-table";
import { formatDate } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PolicyRow = {
  id: string;
  external_id: string | null;
  title: string;
  description: string | null;
  policy_type: string | null;
  jurisdiction: string | null;
  status: string | null;
  sponsor_entity_id: string | null;
  document_url: string | null;
  introduced_date: string | null;
  last_action_date: string | null;
  ai_relevance_score: number | null;
  metadata: Record<string, unknown> | null;
};

export type EntityStub = {
  id: string;
  name: string;
};

type Props = {
  rows: PolicyRow[];
  entities: EntityStub[];
};

// ---------------------------------------------------------------------------
// Policy type badge
// ---------------------------------------------------------------------------

type PolicyType =
  | "state_bill"
  | "federal_rule"
  | "executive_order"
  | "agency_guidance"
  | "court_ruling";

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  state_bill: "State Bill",
  federal_rule: "Federal Rule",
  executive_order: "Executive Order",
  agency_guidance: "Agency Guidance",
  court_ruling: "Court Ruling",
};

const POLICY_TYPE_STYLES: Record<PolicyType, string> = {
  state_bill:
    "bg-[hsl(189_94%_43%/0.12)] text-[var(--color-aurora-cyan)] border-[hsl(189_94%_43%/0.3)]",
  federal_rule:
    "bg-[hsl(258_90%_66%/0.12)] text-[var(--color-aurora-purple)] border-[hsl(258_90%_66%/0.3)]",
  executive_order:
    "bg-[hsl(158_64%_39%/0.15)] text-[var(--color-aurora-green)] border-[hsl(158_64%_39%/0.3)]",
  agency_guidance:
    "bg-[hsl(40_100%_60%/0.12)] text-[hsl(40_100%_65%)] border-[hsl(40_100%_60%/0.3)]",
  court_ruling:
    "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]",
};

function PolicyTypeBadge({ policyType }: { policyType: string | null }) {
  if (!policyType) return null;
  const key = policyType as PolicyType;
  const label = POLICY_TYPE_LABELS[key] ?? policyType;
  const style =
    POLICY_TYPE_STYLES[key] ??
    "bg-[hsl(220_6%_47%/0.12)] text-[var(--color-text-tertiary)] border-[var(--color-border-soft)]";
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sort indicator
// ---------------------------------------------------------------------------

function SortIcon({ dir }: { dir: "asc" | "desc" | false }) {
  if (!dir)
    return (
      <span className="ml-1 text-[var(--color-border-strong)] opacity-50">
        ↕
      </span>
    );
  return (
    <span className="ml-1 text-[var(--color-aurora-cyan)]">
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Custom filter function — searches title + description
// ---------------------------------------------------------------------------

const titleDescFilter: FilterFn<PolicyRow> = (row, _columnId, value) => {
  const q = (value as string).toLowerCase();
  if (!q) return true;
  const title = (row.original.title ?? "").toLowerCase();
  const desc = (row.original.description ?? "").toLowerCase();
  return title.includes(q) || desc.includes(q);
};
titleDescFilter.autoRemove = (val: unknown) => !val;

// ---------------------------------------------------------------------------
// Column definition
// ---------------------------------------------------------------------------

const helper = createColumnHelper<PolicyRow>();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PolicyTable({ rows, entities }: Props) {
  const entityMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entities) m.set(e.id, e.name);
    return m;
  }, [entities]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Derive unique statuses for dropdown
  const statusOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      if (r.status) seen.add(r.status);
    }
    return Array.from(seen).sort();
  }, [rows]);

  // Apply status filter before passing to table
  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const columns = useMemo(
    () => [
      helper.accessor("title", {
        header: "Title",
        cell: (info) => (
          <Link
            href={`/policy/${info.row.original.id}`}
            className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-aurora-cyan)]"
          >
            {info.getValue()}
          </Link>
        ),
        enableSorting: false,
        filterFn: titleDescFilter,
      }),
      helper.accessor("policy_type", {
        header: "Type",
        cell: (info) => <PolicyTypeBadge policyType={info.getValue() ?? null} />,
        enableSorting: false,
      }),
      helper.accessor("jurisdiction", {
        header: "Jurisdiction",
        cell: (info) => {
          const v = info.getValue();
          return v ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {v}
            </span>
          ) : null;
        },
        enableSorting: false,
      }),
      helper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const v = info.getValue();
          return v ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {v.replace(/_/g, " ")}
            </span>
          ) : null;
        },
        enableSorting: false,
      }),
      helper.accessor("sponsor_entity_id", {
        id: "sponsor",
        header: "Sponsor",
        cell: (info) => {
          const id = info.getValue();
          if (!id) return <span className="text-[var(--color-text-tertiary)]">—</span>;
          const name = entityMap.get(id) ?? id;
          return (
            <span className="text-sm text-[var(--color-text-secondary)]">
              {name}
            </span>
          );
        },
        enableSorting: false,
      }),
      helper.accessor("last_action_date", {
        header: "Last Action",
        cell: (info) => {
          const v = info.getValue();
          return v ? (
            <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
              {formatDate(v)}
            </span>
          ) : null;
        },
        enableSorting: true,
        sortUndefined: "last",
      }),
    ],
    [entityMap],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: titleDescFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalVisible = table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            table.setPageIndex(0);
          }}
          placeholder="Search title or description..."
          className="h-9 min-w-[240px] flex-1 rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-aurora-cyan)] focus:ring-0"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            table.setPageIndex(0);
          }}
          className="h-9 rounded border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 font-mono text-xs uppercase tracking-wider text-[var(--color-text-secondary)] outline-none transition-colors focus:border-[var(--color-aurora-cyan)]"
        >
          <option value="all">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
          {totalVisible} result{totalVisible !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border-soft)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]"
              >
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={[
                        "px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]",
                        canSort
                          ? "cursor-pointer select-none hover:text-[var(--color-text-secondary)]"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {canSort && <SortIcon dir={sorted} />}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center font-mono text-sm text-[var(--color-text-tertiary)]"
                >
                  No matching policies.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface-elevated)]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1 text-sm">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="font-mono text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] disabled:pointer-events-none disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
            page {pageIndex + 1} of {pageCount}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="font-mono text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] disabled:pointer-events-none disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
