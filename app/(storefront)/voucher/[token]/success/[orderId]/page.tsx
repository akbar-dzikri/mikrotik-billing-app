"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Ticket,
  Home,
  AlertTriangle,
} from "lucide-react";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { Button } from "@/components/ui/button";
import type { StoreTenant } from "@/lib/storefront/types";

export default function SuccessPage({
  params,
}: {
  params: { token: string; orderId: string };
}) {
  const { token, orderId } = params;
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/public/order/${orderId}`)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) throw new Error("Order tidak ditemukan");
            throw new Error("Gagal memuat order");
          }
          return res.json();
        })
        .then((json) => {
          if (cancelled) return;
          const data = json.data || json;
          if (!data) setError("Order tidak ditemukan");
          else setOrder(data);
        })
        .catch(
          (err) =>
            !cancelled &&
            setError(
              err instanceof Error ? err.message : "Gagal memuat order",
            ),
        );
    load();
    // In case voucher generation is still pending, poll a couple of times.
    const t = setInterval(() => {
      const vouchers = order?.storeVouchers as unknown[] | undefined;
      if (vouchers && vouchers.length > 0) return;
      load();
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const copy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const tenant: StoreTenant | null = order
    ? ({
        id: (order.tenant as { id: string })?.id ?? "",
        slug: (order.tenant as { slug: string })?.slug ?? "",
        name: (order.tenant as { name: string })?.name ?? "",
        tagline: null,
        brandColor:
          (order.tenant as { brandColor: string | null })?.brandColor ?? null,
        waSupport:
          (order.tenant as { waSupport: string | null })?.waSupport ?? null,
      } as StoreTenant)
    : null;

  if (error) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-lg font-semibold">{error}</h1>
        <Button asChild className="mt-6" variant="hero">
          <Link href={`/voucher/${token}`}>Kembali</Link>
        </Button>
      </div>
    );
  }

  if (!order || !tenant) {
    return (
      <div className="mx-auto max-w-md p-10 text-center text-muted-foreground">
        Memuat order…
      </div>
    );
  }

  const vouchers = order.storeVouchers as
    | Array<{
        id: string;
        username: string;
        password: string;
        hotspotProfile: string | null;
        mikrotikSyncedAt: string | null;
        mikrotikError: string | null;
      }>
    | undefined;
  const voucher = vouchers?.[0];
  const pkg = order.package as { name: string; durationLabel: string };

  if (!voucher) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <StorefrontHeader tenant={tenant} />
        <div className="mx-auto max-w-md p-10 text-center">
          <h1 className="text-lg font-semibold">Menyiapkan voucher…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kami sedang membuat voucher di router. Halaman ini akan otomatis
            diperbarui.
          </p>
        </div>
      </div>
    );
  }

  const waText = encodeURIComponent(
    `Voucher ${tenant.name}\nPaket: ${pkg.name}\nDurasi: ${pkg.durationLabel}\nUsername: ${voucher.username}\nPassword: ${voucher.password}`,
  );
  const waLink = `https://wa.me/${(order.waNumber as string).replace(/\D/g, "")}?text=${waText}`;
  const mikrotikOk = !!voucher.mikrotikSyncedAt;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StorefrontHeader tenant={tenant} />

      <div className="mx-auto max-w-md px-5 py-8">
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent p-6 text-center shadow-glow">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold">Pembayaran berhasil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voucher sudah dibuat{mikrotikOk ? " di router" : ""} dan siap
            dipakai.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-border/70 bg-card/60 p-5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <Ticket className="h-3.5 w-3.5 text-primary" /> Voucher Hotspot
            </div>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
              {pkg.durationLabel}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <CredentialRow
              label="Username"
              value={voucher.username}
              onCopy={() => copy("username", voucher.username)}
              copied={copied === "username"}
            />
            <CredentialRow
              label="Password"
              value={voucher.password}
              onCopy={() => copy("password", voucher.password)}
              copied={copied === "password"}
            />
          </div>

          {voucher.mikrotikError && !mikrotikOk && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-500">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <span>
                Router belum tersambung ke ARNET Billing. Voucher tetap valid —
                admin akan sinkron manual.
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button asChild variant="hero">
            <a href={waLink} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> Buka WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/voucher/${token}`}>
              <Home className="h-4 w-4" /> Beli lagi
            </Link>
          </Button>
        </div>

        <div className="mt-6 text-center text-[11px] text-muted-foreground">
          Order ID: <span className="font-mono">{order.id as string}</span>
        </div>
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2.5">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 font-mono text-base font-semibold text-foreground">
          {value}
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={onCopy} className="gap-1.5">
        <Copy className="h-3.5 w-3.5" />
        {copied ? "Tersalin" : "Salin"}
      </Button>
    </div>
  );
}
