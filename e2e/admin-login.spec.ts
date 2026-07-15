import { test, expect } from '@playwright/test';

test('admin login flow: redirect guard then authenticated dashboard', async ({ page }) => {
  // Unauthenticated access to a guarded route must bounce to /login.
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);

  // Sign in with the seeded super-admin credentials.
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('12345678');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // After sign-in the app lands on "/" (login pushes there) or "/dashboard".
  await expect(page).toHaveURL(/\/($|\?)|.*\/dashboard.*/);

  // Re-enter the dashboard now that the session cookie exists; the layout guard
  // must pass and useSession must resolve to show the greeting.
  await page.goto('/dashboard');
  await expect(page.getByText('Selamat datang kembali')).toBeVisible();
});
