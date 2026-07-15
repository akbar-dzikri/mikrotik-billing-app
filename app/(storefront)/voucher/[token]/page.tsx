"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Wifi,
  ShieldCheck,
  MessageCircle,
  Router as RouterIcon,
  PowerOff,
} from "lucide-react";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { PackageCard } from "@/components/storefront/PackageCard";
import { CheckoutSheet } from "@/components/storefront/CheckoutSheet";
import type { StorePackage, StoreTenant } from "@/lib/storefront/types";

export default function VoucherTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [tenant, setTenant] = useState<StoreTenant | null>(null);
  const [packages, setPackages] = useState<StorePackage[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StorePackage | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/voucher/${token}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404)
            throw new Error("Link voucher tidak ditemukan");
          throw new Error("Gagal memuat data");
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const data = json.data;
        setTenant(data.tenant);
        setPackages(data.packages);
        setEnabled(data.enabled);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Gagal memuat data");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSelect = (p: StorePackage) => {
    setSelected(p);
    setOpen(true);
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-xl font-semibold">Link voucher tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Token tidak dikenal atau sudah dinonaktifkan.
        </p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="mx-auto max-w-md p-10 text-center text-muted-foreground">
        Memuat data…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StorefrontHeader tenant={tenant} />

      <section className="border-b border-border/60 bg-card/20">
        <div className="mx-auto max-w-4xl px-5 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
            <RouterIcon className="h-3 w-3" /> Voucher Online · Router{" "}
            {tenant.name}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Beli Voucher Hotspot
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {tenant.tagline ??
              "Voucher yang kamu beli otomatis dibuat di router Mikrotik dan dikirim ke WhatsApp."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Pembayaran
              QRIS
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-primary" /> Auto-sync ke
              Mikrotik
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-primary" /> Kirim ke
              WhatsApp
            </span>
          </div>
        </div>
      </section>

      {!enabled ? (
        <section className="mx-auto max-w-md px-5 py-16 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500">
            <PowerOff className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            Voucher online sedang nonaktif
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin router sedang menonaktifkan pembelian voucher online. Coba
            lagi nanti.
          </p>
          {tenant.waSupport && (
            <a
              href={`https://wa.me/${tenant.waSupport.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary"
            >
              <MessageCircle className="h-4 w-4" /> Hubungi admin via WA
            </a>
          )}
        </section>
      ) : (
        <section className="mx-auto max-w-4xl px-5 py-10">
          <h2 className="text-lg font-semibold text-foreground">
            Pilih paket
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bayar sekali, voucher otomatis dibuat di router dan dikirim ke
            WhatsApp.
          </p>
          {packages.length === 0 ? (
            <div className="mt-6 rounded-lg border border-border/70 bg-card/40 p-6 text-sm text-muted-foreground">
              Belum ada paket yang aktif untuk router ini.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => (
                <PackageCard key={p.id} pkg={p} onSelect={onSelect} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mx-auto max-w-4xl px-5 pb-10">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Cara pakai
          </div>
          <ol className="mt-3 grid gap-4 text-sm sm:grid-cols-4">
            <li className="rounded-lg border border-border/70 bg-background/40 p-3">
              <div className="font-mono text-primary">01</div>
              <div className="mt-1 font-medium">Pilih paket</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Pilih durasi & harga voucher.
              </div>
            </li>
            <li className="rounded-lg border border-border/70 bg-background/40 p-3">
              <div className="font-mono text-primary">02</div>
              <div className="mt-1 font-medium">Bayar QRIS</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Scan QR pakai e-wallet / m-banking.
              </div>
            </li>
            <li className="rounded-lg border border-border/70 bg-background/40 p-3">
              <div className="font-mono text-primary">03</div>
              <div className="mt-1 font-medium">Voucher masuk WA</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Username & password dikirim otomatis.
              </div>
            </li>
            <li className="rounded-lg border border-border/70 bg-background/40 p-3">
              <div className="font-mono text-primary">04</div>
              <div className="mt-1 font-medium">Login hotspot</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Sudah aktif di router Mikrotik.
              </div>
            </li>
          </ol>
          <div className="mt-5 flex items-center justify-end text-xs text-muted-foreground">
            <span>
              Powered by{" "}
              <span className="font-semibold text-foreground">
                ARNET BILLING
              </span>
            </span>
          </div>
        </div>
      </section>

      <CheckoutSheet
        tenant={tenant}
        pkg={selected}
        open={open}
        onOpenChange={setOpen}
        token={token}
      />
    </div>
  );
}
