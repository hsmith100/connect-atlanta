export type Submission = Record<string, unknown>;
export type DateFilter = '7' | '30' | '90' | 'all';

export function filterByDate(items: Submission[], days: DateFilter): Submission[] {
  if (days === 'all') return items;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(days));
  return items.filter((item) => {
    const d = item.createdAt as string | undefined;
    return d ? new Date(d) >= cutoff : false;
  });
}

export function fmt(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Submission[],
  cols: (keyof Submission)[],
): void {
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((r) => cols.map((c) => escape(r[c])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: '7',   label: 'Last 7 days' },
  { value: '30',  label: 'Last 30 days' },
  { value: '90',  label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];
