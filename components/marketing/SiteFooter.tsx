import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Sistem billing hotspot Mikrotik modern untuk RT/RW Net, reseller, dan operator jaringan
            Indonesia.
          </p>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_1px_var(--color-primary)]" />
            SYSTEM OPERATIONAL
          </div>
        </div>
        {[
          {
            title: "Produk",
            links: ["Fitur", "Integrasi Mikrotik", "Payment Gateway", "WhatsApp API", "Harga"],
          },
          {
            title: "Sumber Daya",
            links: ["Dokumentasi", "API Reference", "Panduan Setup", "Status", "Changelog"],
          },
          {
            title: "Perusahaan",
            links: ["Tentang", "Reseller Partner", "Kontak", "Kebijakan Privasi", "Syarat"],
          },
        ].map((col) => (
          <div key={col.title}>
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {col.title}
            </div>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-foreground/80 transition-colors hover:text-primary">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} ARNET BILLING. Dibuat untuk operator jaringan.</div>
          <div className="font-mono">v1.0.0 · build.arnet.id</div>
        </div>
      </div>
    </footer>
  );
}
