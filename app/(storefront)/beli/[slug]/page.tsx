"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wifi, ShieldCheck, MessageCircle } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { PackageCard } from "@/components/storefront/PackageCard";
import { CheckoutSheet } from "@/components/storefront/CheckoutSheet";
import { Button } from "@/components/ui/button";
import type { StorePackage, StoreTenant } from "@/lib/storefront/types";

export default function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState<StoreTenant | null>(null);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StorePackage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/tenant/${slug}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Storefront tidak ditemukan");
          throw new Error("Gagal memuat storefront");
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const { tenant: t, packages: p } = json.data;
        setTenant(t);
        setPackages(p);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Gagal memuat storefront");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const onSelect = (p: StorePackage) => {
    setSelected(p);
    setOpen(true);
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-xl font-semibold">{loadError}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Link yang kamu buka mungkin salah. Coba{" "}
          <Link href="/beli/arnet-cafe" className="text-primary underline">
            buka demo
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="mx-auto max-w-md p-10 text-center text-muted-foreground">
        Memuat storefront…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StorefrontHeader tenant={tenant} />

      <section className="border-b border-border/60 bg-card/20">
        <div className="mx-auto max-w-4xl px-5 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
            <Wifi className="h-3 w-3" /> Storefront {tenant.slug}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {tenant.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {tenant.tagline ??
              "Beli voucher hotspot online, bayar QRIS, langsung aktif."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Pembayaran aman via QRIS
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-primary" /> Voucher dikirim ke WhatsApp
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-10">
        <h2 className="text-lg font-semibold text-foreground">Pilih paket</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bayar sekali, voucher otomatis dibuat di router dan dikirim ke WhatsApp.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <PackageCard key={p.id} pkg={p} onSelect={onSelect} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card/30 py-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-2 px-5 text-xs text-muted-foreground sm:flex-row">
          <span>
            Powered by{" "}
            <span className="font-semibold text-foreground">ARNET BILLING</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            Tentang ARNET
          </Button>
        </div>
      </footer>

      <CheckoutSheet
        tenant={tenant}
        pkg={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
