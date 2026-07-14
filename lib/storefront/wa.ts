// WhatsApp gateway dispatcher with WA Cloud + Fonnte + Wablas fallback.
export type WaConfig = {
  cloudPhoneId: string | null;
  cloudToken: string | null;
  cloudTemplateName: string | null;
  fonnteToken: string | null;
  wablasToken: string | null;
  wablasDomain: string | null;
  providerOrder: string[];
};

export type SendResult = { provider: string; ok: boolean; response: string };

function normalizeNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

async function sendViaCloud(cfg: WaConfig, to: string, body: string): Promise<SendResult | null> {
  if (!cfg.cloudPhoneId || !cfg.cloudToken) return null;
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${cfg.cloudPhoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.cloudToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    return { provider: "wa_cloud", ok: res.ok, response: text.slice(0, 600) };
  } catch (err) {
    return { provider: "wa_cloud", ok: false, response: err instanceof Error ? err.message : String(err) };
  }
}

async function sendViaFonnte(cfg: WaConfig, to: string, body: string): Promise<SendResult | null> {
  if (!cfg.fonnteToken) return null;
  try {
    const form = new URLSearchParams({ target: to, message: body });
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: cfg.fonnteToken, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    return { provider: "fonnte", ok: res.ok, response: text.slice(0, 600) };
  } catch (err) {
    return { provider: "fonnte", ok: false, response: err instanceof Error ? err.message : String(err) };
  }
}

async function sendViaWablas(cfg: WaConfig, to: string, body: string): Promise<SendResult | null> {
  if (!cfg.wablasToken || !cfg.wablasDomain) return null;
  try {
    const res = await fetch(`${cfg.wablasDomain.replace(/\/$/, "")}/api/send-message`, {
      method: "POST",
      headers: { Authorization: cfg.wablasToken, "Content-Type": "application/json" },
      body: JSON.stringify({ phone: to, message: body }),
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    return { provider: "wablas", ok: res.ok, response: text.slice(0, 600) };
  } catch (err) {
    return { provider: "wablas", ok: false, response: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendWhatsApp(
  cfg: WaConfig,
  to: string,
  body: string,
): Promise<SendResult[]> {
  const target = normalizeNumber(to);
  const attempts: SendResult[] = [];
  const order = cfg.providerOrder?.length ? cfg.providerOrder : ["wa_cloud", "fonnte", "wablas"];
  for (const provider of order) {
    let res: SendResult | null = null;
    if (provider === "wa_cloud") res = await sendViaCloud(cfg, target, body);
    else if (provider === "fonnte") res = await sendViaFonnte(cfg, target, body);
    else if (provider === "wablas") res = await sendViaWablas(cfg, target, body);
    if (!res) continue;
    attempts.push(res);
    if (res.ok) break;
  }
  return attempts;
}

export function buildVoucherMessage(input: {
  brand: string;
  customer: string;
  packageName: string;
  duration: string;
  username: string;
  password: string;
  ssid?: string;
  orderId: string;
}): string {
  return [
    `Halo ${input.customer}!`,
    `Voucher hotspot *${input.brand}* kamu sudah aktif.`,
    "",
    `Paket    : ${input.packageName}`,
    `Durasi   : ${input.duration}`,
    input.ssid ? `SSID     : ${input.ssid}` : null,
    `Username : ${input.username}`,
    `Password : ${input.password}`,
    "",
    "Cara pakai: hubungkan ke WiFi, buka browser,",
    "lalu login dengan username & password di atas.",
    "",
    `Order ID: ${input.orderId}`,
    "Terima kasih! — ARNET BILLING",
  ].filter(Boolean).join("\n");
}
