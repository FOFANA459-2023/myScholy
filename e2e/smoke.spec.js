import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("landing page renders hero, roadmap and the full FAQ", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /empowering students/i }),
    ).toBeVisible();
    await expect(page.locator("#roadmap")).toBeAttached();
    await expect(page.locator("#faq")).toBeAttached();
    await expect(
      page.getByRole("heading", { name: "Frequently asked questions" }),
    ).toBeAttached();
  });

  test("old /faq links land on the landing page FAQ section", async ({ page }) => {
    await page.goto("/faq");
    await expect(page).toHaveURL(/\/#faq$/);
    await expect(page.locator("#faq")).toBeInViewport({ timeout: 5000 });
  });

  test("consulting and academy present as coming soon with escape routes", async ({
    page,
  }) => {
    for (const path of ["/consulting", "/academy"]) {
      await page.goto(path);
      // The banner is an aside labelled "Coming soon"; plain text matching
      // would also hit the footer links that carry the same phrase.
      const banner = page.getByRole("complementary", { name: "Coming soon" });
      await expect(banner).toBeVisible();
      await expect(
        banner.getByRole("link", { name: /browse scholarships/i }),
      ).toBeVisible();
    }
  });

  test("scholarship board lists data served by the Django API", async ({ page }) => {
    await page.goto("/scholarships");
    await expect(page.getByText("E2E Test Scholarship")).toBeVisible({
      timeout: 15_000,
    });
  });
});
