"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { QrCode, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatIDR, type StorePackage, type StoreTenant } from "@/lib/storefront/types";

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor WA Indonesia tidak valid"),
});

export function CheckoutSheet({
  tenant,
  pkg,
  open,
  onOpenChange,
  token,
}: {
  tenant: StoreTenant;
  pkg: StorePackage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, uses token-based order creation and navigates to /voucher/$token/pay */
  token?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!pkg) return null;

  const submit = async () => {
    const parsed = schema.safeParse({ name, phone });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const basePath = token ? `/voucher/${token}` : `/beli/${tenant.slug}`;
      const res = await fetch(
        token ? `/api/voucher/${token}/order` : `/api/public/order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(token ? { token } : { slug: tenant.slug }),
            packageId: pkg.id,
            customerName: parsed.data.name,
            waNumber: parsed.data.phone,
          }),
        },
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal membuat order");
      }
      const data = await res.json();
      const { orderId } = data.data || data;
      router.push(`${basePath}/pay/${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat order");
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Checkout · {pkg.name}</SheetTitle>
          <SheetDescription>
            Voucher akan dikirim ke nomor WhatsApp yang kamu masukkan.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-border/70 bg-card/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Paket</span>
              <span className="font-medium text-foreground">{pkg.name}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Durasi</span>
              <span className="text-foreground">{pkg.durationLabel}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">{formatIDR(pkg.priceIdr)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              placeholder="Nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor WhatsApp</Label>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={16}
            />
            <p className="text-[11px] text-muted-foreground">
              Voucher hotspot akan dikirim ke nomor ini setelah pembayaran berhasil.
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-background/60 p-4">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Metode pembayaran
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-md border border-primary/40 bg-primary/5 p-3">
              <QrCode className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">QRIS / QRIN</div>
                <div className="text-xs text-muted-foreground">
                  Scan dengan aplikasi apa pun (GoPay, DANA, OVO, m-Banking).
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button className="w-full" variant="hero" size="lg" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lanjut ke pembayaran"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Mode simulasi QRIS aktif — pembayaran akan otomatis diverifikasi.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
