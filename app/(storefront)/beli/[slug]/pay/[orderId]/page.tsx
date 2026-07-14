"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { Loader2, QrCode, Timer, CheckCircle2, ShieldCheck } from "lucide-react";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { Button } from "@/components/ui/button";
import { formatIDR, type StoreTenant } from "@/lib/storefront/types";

export default function PayPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const { slug, orderId } = params;
  const router = useRouter();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [checking, setChecking] = useState(false);
  const simTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

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
        setOrder(data);
        const payload = `QRIS|ARNET|${data.id}|${data.amountIdr}`;
        QRCode.toDataURL(payload, {
          width: 320,
          margin: 1,
          color: { dark: "#0a0f0d", light: "#ffffff" },
        })
          .then(setQrDataUrl)
          .catch(() => setQrDataUrl(null));
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Gagal memuat order");
      });

    simTimer.current = setTimeout(() => handlePaid(), 8000);
    return () => {
      cancelled = true;
      if (simTimer.current) clearTimeout(simTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    const t = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  const handlePaid = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/public/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal verifikasi pembayaran");
      }
      router.push(`/beli/${slug}/success/${orderId}`);
    } catch (err) {
      setChecking(false);
      setLoadError(err instanceof Error ? err.message : "Gagal verifikasi");
    }
  };

  const tenant: StoreTenant | null = order
    ? ({
        id: (order.tenant as { id: string })?.id ?? "",
        slug: (order.tenant as { slug: string })?.slug ?? slug,
        name: (order.tenant as { name: string })?.name ?? "",
        tagline: null,
        brandColor: (order.tenant as { brandColor: string | null })?.brandColor ?? null,
        waSupport: (order.tenant as { waSupport: string | null })?.waSupport ?? null,
      } as StoreTenant)
    : null;

  if (loadError) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-md p-10 text-center">
          <h1 className="text-lg font-semibold">{loadError}</h1>
          <Button asChild className="mt-6" variant="hero">
            <Link href={`/beli/${slug}`}>Kembali ke storefront</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!order || !tenant) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-md p-10 text-center text-muted-foreground">
          Memuat order…
        </div>
      </div>
    );
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pkg = order.package as { name: string; durationLabel: string };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StorefrontHeader tenant={tenant} />

      <div className="mx-auto max-w-md px-5 py-8">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
              <QrCode className="h-3 w-3" /> QRIS
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
              <Timer className="h-3 w-3 text-primary" /> {mm}:{ss}
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Total bayar
            </div>
            <div className="mt-1 text-3xl font-bold text-foreground">
              {formatIDR(order.amountIdr as number)}
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
              {pkg.name} · {pkg.durationLabel}
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="rounded-xl border border-border/70 bg-white p-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QRIS"
                  width={260}
                  height={260}
                  className="block"
                />
              ) : (
                <div className="flex h-[260px] w-[260px] items-center justify-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-1 text-center text-xs text-muted-foreground">
            <div>
              Scan dengan GoPay, DANA, OVO, ShopeePay, atau m-Banking.
            </div>
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-primary" /> Simulasi —
              otomatis terverifikasi dalam beberapa detik.
            </div>
          </div>

          <Button
            className="mt-6 w-full"
            variant="hero"
            size="lg"
            onClick={handlePaid}
            disabled={checking}
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Saya sudah bayar
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 rounded-lg border border-border/70 bg-card/40 p-4 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">
            Yang terjadi setelah pembayaran
          </div>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Voucher hotspot dibuat otomatis di router Mikrotik.</li>
            <li>
              Username & password dikirim ke WhatsApp{" "}
              <span className="text-foreground">
                {order.waNumber as string}
              </span>
              .
            </li>
            <li>Langsung bisa dipakai untuk login hotspot.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
