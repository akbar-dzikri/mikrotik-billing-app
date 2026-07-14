import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CircuitBoard,
  CreditCard,
  Gauge,
  Layers,
  MessageSquare,
  QrCode,
  Router,
  ShieldCheck,
  Sparkles,
  Terminal,
  Ticket,
  Wifi,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <TrustBar />
      <Features />
      <Integrations />
      <HowItWorks />
      <Pricing />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div className="absolute inset-0 bg-hero" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            v1.0 · Rilis untuk RT/RW Net Indonesia
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Billing hotspot Mikrotik yang{" "}
            <span className="text-gradient-primary">berjalan sendiri</span>.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            ARNET BILLING menghubungkan router Mikrotik, payment gateway, dan WhatsApp API dalam satu
            dashboard. Pelanggan bayar via QRIS atau Midtrans — voucher hotspot terbit otomatis, dikirim
            ke WA, dan langsung aktif di router.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="hero">
              <Link href="/beli/arnet-cafe">
                Coba Storefront <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outlineGlow">
              <Link href="/login">
                <Terminal className="h-4 w-4" /> Lihat Dashboard
              </Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
            {[
              { k: "Uptime", v: "99.98%" },
              { k: "Voucher/hari", v: "12.4K" },
              { k: "Reseller aktif", v: "480+" },
            ].map((s) => (
              <div key={s.k} className="border-l border-border/60 pl-4">
                <dd className="font-mono text-xl font-semibold text-foreground">{s.v}</dd>
                <dt className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.k}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 blur-2xl" />
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: Router, label: "Mikrotik RouterOS" },
    { icon: CreditCard, label: "Midtrans" },
    { icon: QrCode, label: "QRIS / QRIN" },
    { icon: MessageSquare, label: "WhatsApp Cloud API" },
    { icon: Bot, label: "WA Gateway" },
  ];
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Terhubung native ke
          </span>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {items.map((i) => (
              <div
                key={i.label}
                className="flex items-center gap-2 text-sm text-foreground/80"
              >
                <i.icon className="h-4 w-4 text-primary" />
                {i.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Ticket,
      title: "Voucher hotspot otomatis",
      desc: "Generate voucher massal dengan template kode kustom. Sinkron langsung ke user-profile Mikrotik tanpa input manual.",
    },
    {
      icon: CircuitBoard,
      title: "Mikrotik REST API",
      desc: "Kontrol multi-router lewat REST atau API-SSL. Auto-provision user, monitoring bandwidth, dan disconnect on-demand.",
    },
    {
      icon: CreditCard,
      title: "Midtrans + QRIS/QRIN",
      desc: "Pembayaran Snap, QRIS statis/dinamis, e-wallet, dan VA. Callback aman via webhook, rekonsiliasi otomatis.",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Cloud & Gateway",
      desc: "Kirim voucher, invoice, dan notifikasi expired via WA Cloud API resmi atau WA Gateway (WPPConnect/Baileys).",
    },
    {
      icon: Layers,
      title: "Multi-tenant reseller",
      desc: "Setiap reseller punya subdomain, katalog paket, komisi, dan dashboard sendiri — dengan role & permission granular.",
    },
    {
      icon: Gauge,
      title: "Laporan realtime",
      desc: "Grafik penjualan, top-up saldo, laporan pajak, dan export CSV. Filter per router, per paket, per periode.",
    },
  ];
  return (
    <section id="fitur" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Fitur inti"
          title="Semua yang dibutuhkan operator hotspot, tanpa scripting manual."
          subtitle="ARNET BILLING dirancang ulang dari nol untuk workflow RT/RW Net modern — dari on-boarding router sampai kirim voucher ke WhatsApp pelanggan."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-xl border border-border/70 bg-card/60 p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              <div className="mt-5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Aktif <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  return (
    <section id="integrasi" className="relative border-y border-border/60 bg-card/40 py-24">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeader
            align="left"
            eyebrow="Integrasi"
            title="Terhubung ke stack yang sudah kamu pakai."
            subtitle="Tidak perlu ganti router, tidak perlu ganti nomor WhatsApp bisnis. Cukup masukkan kredensial, ARNET BILLING mengurus sisanya."
          />
          <ul className="mt-8 space-y-4">
            {[
              {
                icon: Router,
                title: "Mikrotik REST API & API-SSL",
                desc: "Terhubung ke RouterOS 7.x, auto-create user hotspot, sinkron paket, dan monitoring.",
              },
              {
                icon: CreditCard,
                title: "Midtrans Snap & Core API",
                desc: "Semua metode pembayaran Midtrans, termasuk QRIS dinamis, VA, e-wallet, dan kartu.",
              },
              {
                icon: QrCode,
                title: "QRIS Statis (QRIN)",
                desc: "Deteksi mutasi bank/QRIS otomatis via QRIN, cocokkan ke invoice tanpa kirim bukti manual.",
              },
              {
                icon: MessageSquare,
                title: "WhatsApp Cloud API (Meta)",
                desc: "Template resmi untuk kirim voucher, invoice PDF, dan notifikasi expired.",
              },
              {
                icon: Bot,
                title: "WhatsApp Gateway",
                desc: "Alternatif via gateway (Baileys/WPPConnect) untuk pengiriman cepat non-template.",
              },
            ].map((i) => (
              <li key={i.title} className="flex gap-4">
                <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                  <i.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{i.title}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{i.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-border/70 bg-background/80 p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                POST /api/v1/voucher.provision
              </div>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
                200 OK · 84ms
              </span>
            </div>
            <pre className="mt-4 overflow-x-auto font-mono text-[12px] leading-relaxed text-foreground/90">
{`{
  "invoice": "INV-2026-8421",
  "payment": {
    "provider": "midtrans",
    "method": "qris",
    "status": "settlement"
  },
  "voucher": {
    "code": "ARN-8A2K-91XZ",
    "package": "Paket 1 Hari · 5rb",
    "expires_in": "24h",
    "mikrotik": {
      "router": "rt-jaksel-01",
      "profile": "hotspot-1d",
      "synced_at": "2026-07-07T09:14:22+07:00"
    }
  },
  "delivery": {
    "whatsapp": "wa_cloud",
    "to": "+62812xxxx8421",
    "status": "delivered"
  }
}`}
            </pre>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "Webhook", value: "sub-detik" },
              { icon: ShieldCheck, label: "Signed HMAC", value: "SHA-256" },
              { icon: Wifi, label: "Uptime", value: "99.98%" },
            ].map((i) => (
              <div
                key={i.label}
                className="rounded-lg border border-border/70 bg-background/60 p-3"
              >
                <i.icon className="h-4 w-4 text-primary" />
                <div className="mt-2 font-mono text-sm text-foreground">{i.value}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {i.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Hubungkan router Mikrotik",
      desc: "Masukkan host, port API, dan kredensial. ARNET langsung tes koneksi dan menampilkan status interface.",
    },
    {
      n: "02",
      title: "Buat paket voucher & harga",
      desc: "Tentukan durasi, kuota, bandwidth, dan harga. Sinkron ke hotspot user-profile secara otomatis.",
    },
    {
      n: "03",
      title: "Bagikan link storefront",
      desc: "Pelanggan pilih paket → bayar via QRIS/Midtrans → voucher terbit di router dan terkirim ke WhatsApp.",
    },
  ];
  return (
    <section id="cara-kerja" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Cara kerja"
          title="Tiga langkah, hotspot kamu jualan sendiri."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="relative rounded-xl border border-border/70 bg-card/60 p-6"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-4xl font-bold text-primary/40">{s.n}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  step
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-border md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "Gratis",
      desc: "Cocok untuk 1 router & belajar sistem.",
      features: ["1 router Mikrotik", "50 voucher/bulan", "WA Gateway", "Support komunitas"],
      cta: "Mulai gratis",
      highlight: false,
    },
    {
      name: "Reseller",
      price: "Rp 99K",
      period: "/bulan",
      desc: "Untuk RT/RW Net aktif dengan pelanggan reguler.",
      features: [
        "3 router Mikrotik",
        "Voucher tak terbatas",
        "Midtrans + QRIS",
        "WA Cloud API resmi",
        "Storefront custom",
      ],
      cta: "Coba 14 hari",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "Multi-tenant, white-label, SLA & onboarding.",
      features: [
        "Unlimited router",
        "White-label domain",
        "Multi-reseller & komisi",
        "SLA 99.9% + priority",
      ],
      cta: "Hubungi kami",
      highlight: false,
    },
  ];
  return (
    <section id="harga" className="border-t border-border/60 bg-card/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Harga"
          title="Sederhana. Tanpa biaya transaksi tersembunyi."
          subtitle="Bayar bulanan, batalkan kapan saja. Semua paket termasuk update fitur dan integrasi baru."
        />
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-xl border p-6 ${
                p.highlight
                  ? "border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-glow"
                  : "border-border/70 bg-card/60"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary-foreground">
                  Paling populer
                </span>
              )}
              <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{p.price}</span>
                {p.period && (
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-8"
                variant={p.highlight ? "hero" : "outline"}
              >
                <Link href="/login">{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
          <Sparkles className="h-3 w-3" /> Siap dijalankan hari ini
        </div>
        <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
          Jadikan hotspot kamu <span className="text-gradient-primary">bekerja 24/7</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Setup dalam 10 menit. Tidak perlu server sendiri, tidak perlu skrip Mikrotik yang panjang.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="hero">
            <Link href="/login">
              Buka Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outlineGlow">
            <a href="#harga">Lihat harga</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
