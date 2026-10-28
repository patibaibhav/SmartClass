import { expect, test } from '@playwright/test';

test('login page renders without a mock-data fallback', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SmartClass' })).toBeVisible();
  await expect(page.getByPlaceholder(/Enter your User ID/i)).toBeVisible();
  await expect(page.getByPlaceholder(/Enter your password/i)).toBeVisible();
});

test('student login can load a database-backed dashboard when test credentials are supplied', async ({ page }) => {
  test.skip(!process.env.E2E_STUDENT_ID || !process.env.E2E_STUDENT_PASSWORD,
    'Set isolated E2E_STUDENT_ID and E2E_STUDENT_PASSWORD to run credentialed smoke tests.');
  await page.goto('/');
  await page.getByPlaceholder(/Enter your User ID/i).fill(process.env.E2E_STUDENT_ID!);
  await page.getByPlaceholder(/Enter your password/i).fill(process.env.E2E_STUDENT_PASSWORD!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText(/Welcome,/)).toBeVisible();
});
