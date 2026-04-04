import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Flow/);
  });

  test("renders hero content", async ({ page }) => {
    await page.goto("/");
    // Landing page has a CTA button that navigates to the planner
    const startButton = page.getByRole("link", { name: /get started|start|begin/i }).first();
    await expect(startButton).toBeVisible();
  });

  test("displays feature sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Evaluate where you are now")).toBeVisible();
    await expect(page.getByText("See your full picture in one dashboard")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("navigates to planner from landing page", async ({ page }) => {
    await page.goto("/");
    // Click the primary CTA — should navigate to /app/plan
    await page.getByRole("link", { name: /get started|start|begin/i }).first().click();
    await expect(page).toHaveURL(/\/app\/plan/);
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    // App should render something (not a blank crash) for unknown routes
    await expect(page.locator("#root")).not.toBeEmpty();
  });
});
