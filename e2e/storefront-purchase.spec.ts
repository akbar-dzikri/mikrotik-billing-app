import { test, expect } from '@playwright/test';

test('storefront purchase flow: select package, pay, get credentials', async ({ page }) => {
  await page.goto('/beli/e2e-tenant');

  // Storefront loads async from /api/public/tenant/<slug>; wait for the tenant name.
  await expect(page.getByText('E2E Tenant')).toBeVisible();

  // Open checkout by clicking the package's "Beli sekarang" button.
  await page.getByRole('button', { name: 'Beli sekarang' }).first().click();

  // Fill the checkout sheet and proceed to payment.
  await page.getByLabel('Nama').fill('Budi');
  await page.getByLabel('Nomor WhatsApp').fill('08123456789');
  await page.getByRole('button', { name: 'Lanjut ke pembayaran' }).click();

  // Land on the pay page for the created order.
  await expect(page).toHaveURL(/\/beli\/e2e-tenant\/pay\/.+/);

  // Deterministic payment (avoids the 8s auto-simulate timer).
  await page.getByRole('button', { name: 'Saya sudah bayar' }).click();

  // Land on the success page and reveal the hotspot credentials.
  await expect(page).toHaveURL(/\/beli\/e2e-tenant\/success\/.+/);
  await expect(page.getByText('Pembayaran berhasil')).toBeVisible();
  await expect(page.getByText('Username')).toBeVisible();
});
