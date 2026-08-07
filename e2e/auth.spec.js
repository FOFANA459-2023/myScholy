import { expect, test } from "@playwright/test";

const ADMIN = { username: "e2e-admin", password: "E2eAdminPass123" };

async function login(page, { username, password }) {
  await page.goto("/login");
  await page.getByLabel(/email or username/i).fill(username);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("authentication", () => {
  test("wrong password surfaces the backend's error, not a crash", async ({
    page,
  }) => {
    await login(page, { username: ADMIN.username, password: "wrong-password" });
    await expect(page.getByText(/password is not correct/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("unknown account is told so and offered signup", async ({ page }) => {
    await login(page, { username: "nobody-here", password: "whatever123" });
    await expect(page.getByText(/could not find an account/i)).toBeVisible();
  });

  test("admin can sign in, sees admin navigation, and can log out", async ({
    page,
  }) => {
    await login(page, ADMIN);
    // Admins land on the dashboard; the nav link reads "Admin Dashboard" or
    // "Super Admin Dashboard" depending on the tier (the seeded account is a
    // super admin).
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("link", { name: /admin dashboard/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /log out/i }).click();
    // Logging out from an admin page may land on / or /login (see Navbar
    // handleLogout); what matters is the signed-out state itself.
    await expect(page).toHaveURL(/\/(login)?$/);
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /admin dashboard/i }),
    ).not.toBeVisible();
  });

  test("admin routes are locked for anonymous visitors", async ({ page }) => {
    await page.goto("/admin/scholarships");
    await expect(page).toHaveURL(/\/login/);
  });
});
