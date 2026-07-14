export type StoreTenant = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  brandColor: string | null;
  waSupport: string | null;
};

export type StorePackage = {
  id: string;
  name: string;
  description: string | null;
  priceIdr: number;
  durationLabel: string;
  sortOrder: number;
};

export function formatIDR(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}
