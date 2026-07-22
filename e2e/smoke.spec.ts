import { expect, test } from "@playwright/test";

const publicRoutes = [
  { path: "/", heading: /North Country|Home Services|Find/i },
  { path: "/services", heading: /Services/i },
  { path: "/locations", heading: /Locations/i },
  { path: "/businesses", heading: /Business/i },
  { path: "/guides", heading: /Guides/i },
  { path: "/calculators", heading: /Calculator/i },
  { path: "/request-a-quote", heading: /quote|Request/i },
  { path: "/for-contractors", heading: /contractor|Grow/i },
];

test.describe("public smoke", () => {
  for (const route of publicRoutes) {
    test(`${route.path} renders a main landmark and heading`, async ({
      page,
    }) => {
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.ok() || response?.status() === 304).toBeTruthy();
      await expect(page.locator("main#main-content")).toBeVisible();
      await expect(page.getByRole("heading").first()).toBeVisible();
      const text = await page.locator("main").innerText();
      expect(text.length).toBeGreaterThan(20);
    });
  }

  test("robots.txt disallows private areas", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /api");
    expect(body).toContain("Sitemap:");
  });

  test("security headers are present on homepage", async ({ request }) => {
    const res = await request.get("/");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["x-frame-options"]?.toLowerCase()).toBe("deny");
    expect(res.headers()["x-content-type-options"]?.toLowerCase()).toBe(
      "nosniff",
    );
    expect(res.headers()["content-security-policy"]).toBeTruthy();
  });

  test("skip link exists for keyboard users", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: /skip to main content/i });
    await expect(skip).toHaveCount(1);
  });
});
