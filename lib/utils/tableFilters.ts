import type { FilterFn, RowData } from "@tanstack/react-table";

/**
 * Shared TanStack filter that searches row.original.title and row.original.description.
 * Cast as FilterFn<any> so it can be assigned to columns typed against specific row shapes
 * without fighting the generic variance in TanStack's FilterFn<TData> signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const titleDescFilter: FilterFn<any> = <TData extends RowData>(
  row: { original: { title?: string; description?: string | null } },
  _columnId: string,
  value: unknown,
): boolean => {
  void (row as { original: TData }); // preserve generic reference for callers
  const q = (value as string).toLowerCase();
  if (!q) return true;
  const title = (row.original.title ?? "").toLowerCase();
  const desc = (row.original.description ?? "").toLowerCase();
  return title.includes(q) || desc.includes(q);
};
titleDescFilter.autoRemove = (val: unknown) => !val;
