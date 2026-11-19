export const CATEGORY_LABELS: Record<string, string> = {
  employee: 'Employee',
  freelancer: 'Freelancer / Contractor',
  contractor: 'Contractor / Technician',
  guest: 'Guest / Visitor',
  delivery: 'Delivery Personnel',
  supplier: 'Supplier',
  rental_company: 'Rental Company',
  walk_in: 'WALK-INS',
  other: 'Other',
}

/** Human-readable person category. Falls back to title-casing the raw value. */
export function categoryLabel(value?: string | null): string {
  if (!value) return '-'
  return CATEGORY_LABELS[value] || value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
