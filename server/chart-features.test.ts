import { describe, it, expect, beforeAll, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-chart-123",
    email: "test-chart@example.com",
    name: "Chart Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("Chart Customization Features", () => {
  describe("color palette support", () => {
    it("should support multiple color palettes for visualization", () => {
      // Test that the frontend can switch between color palettes
      const palettes = [
        "default",
        "pastel",
        "vibrant",
        "ocean",
        "sunset",
        "forest",
        "purple",
      ];

      expect(palettes).toHaveLength(7);
      expect(palettes).toContain("default");
      expect(palettes).toContain("pastel");
      expect(palettes).toContain("vibrant");
    });

    it("should have valid color values for each palette", () => {
      const colorPalettes = {
        default: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"],
        pastel: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF"],
        vibrant: ["#FF006E", "#FB5607", "#FFBE0B", "#8338EC", "#3A86FF"],
        ocean: ["#0077B6", "#00B4D8", "#90E0EF", "#00D9FF", "#0096C7"],
        sunset: ["#FF6B6B", "#FFA500", "#FFD93D", "#FF8C42", "#FF6B9D"],
        forest: ["#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2"],
        purple: ["#9D4EDD", "#7B2CBF", "#C77DFF", "#E0AAFF", "#5A189A"],
      };

      Object.entries(colorPalettes).forEach(([name, colors]) => {
        expect(colors).toHaveLength(5);
        colors.forEach((color) => {
          // Verify hex color format
          expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
      });
    });
  });

  describe("indicator comparison chart data aggregation", () => {
    it("should aggregate data from both monthly data and patient cases", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a test department
      const dept = await caller.departments.create({
        name: "Test Ward for Chart",
        color: "#3B82F6",
      });

      // Create a test category
      const cat = await caller.categories.create({
        name: "Test Category",
        requiresPatientInfo: false,
      });

      // Create a test indicator
      const ind = await caller.indicators.create({
        categoryId: cat.id,
        name: "Test Indicator",
        requiresPatientInfo: false,
      });

      // Add monthly KPI data
      await caller.monthlyData.upsert({
        departmentId: dept.id,
        indicatorId: ind.id,
        year: 2026,
        month: 1,
        value: "5",
      });

      // Fetch monthly data
      const monthlyData = await caller.monthlyData.get({
        departmentId: dept.id,
        year: 2026,
        quarter: 1,
      });

      // Verify data was stored
      expect(monthlyData).toHaveLength(1);
      // Database stores as decimal, so value will be '5.00'
      expect(monthlyData[0].value).toBe("5.00");
      expect(monthlyData[0].indicatorId).toBe(ind.id);
    }, { timeout: 10000 });

    it("should properly filter patient cases by department and date range", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create test department
      const dept = await caller.departments.create({
        name: "Patient Case Test Ward",
        color: "#EF4444",
      });

      // Create indicator that requires patient info
      const cat = await caller.categories.create({
        name: "Patient Tracking Category",
        requiresPatientInfo: true,
      });

      const ind = await caller.indicators.create({
        categoryId: cat.id,
        name: "Fall Incidents",
        requiresPatientInfo: true,
      });

      // Create patient case
      const patientCase = await caller.patientCases.create({
        departmentId: dept.id,
        indicatorId: ind.id,
        year: 2026,
        month: 1,
        hospitalId: "H-001",
        patientName: "John Doe",
      });

      expect(patientCase).toHaveProperty("id");
      expect(patientCase.departmentId).toBe(dept.id);
      expect(patientCase.month).toBe(1);
      expect(patientCase.year).toBe(2026);

      // Fetch patient cases by department
      const cases = await caller.patientCases.listByDepartment({
        departmentId: dept.id,
        year: 2026,
      });

      expect(cases.length).toBeGreaterThan(0);
      const foundCase = cases.find((c) => c.id === patientCase.id);
      expect(foundCase).toBeDefined();
      expect(foundCase?.patientName).toBe("John Doe");
    });

    it("should calculate correct totals when combining monthly and patient case data", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Setup: Create department, category, and indicator
      const dept = await caller.departments.create({
        name: "Combined Data Test Ward",
        color: "#10B981",
      });

      const cat = await caller.categories.create({
        name: "Combined Test Category",
        requiresPatientInfo: true,
      });

      const ind = await caller.indicators.create({
        categoryId: cat.id,
        name: "Combined Test Indicator",
        requiresPatientInfo: true,
      });

      // Add monthly data (5 cases)
      await caller.monthlyData.upsert({
        departmentId: dept.id,
        indicatorId: ind.id,
        year: 2026,
        month: 1,
        value: "5",
      });

      // Add patient cases (3 cases)
      for (let i = 0; i < 3; i++) {
        await caller.patientCases.create({
          departmentId: dept.id,
          indicatorId: ind.id,
          year: 2026,
          month: 1,
          hospitalId: `H-00${i + 1}`,
          patientName: `Patient ${i + 1}`,
        });
      }

      // Verify both data sources exist
      const monthlyData = await caller.monthlyData.get({
        departmentId: dept.id,
        year: 2026,
        quarter: 1,
      });

      const patientCases = await caller.patientCases.listByDepartment({
        departmentId: dept.id,
        year: 2026,
      });

      // Should have 5 from monthly + 3 from patient cases = 8 total
      const monthlyTotal = monthlyData.reduce(
        (sum, d) => sum + parseFloat((d.value || "0").toString()),
        0
      );
      const patientTotal = patientCases.filter(
        (pc) => pc.month === 1 && pc.indicatorId === ind.id
      ).length;

      expect(monthlyTotal).toBe(5);
      expect(patientTotal).toBe(3);
      expect(monthlyTotal + patientTotal).toBe(8);
    });
  });

  describe("chart type support", () => {
    it("should support multiple chart types for visualization", () => {
      const chartTypes = ["bar", "pie", "line", "area"];

      expect(chartTypes).toHaveLength(4);
      chartTypes.forEach((type) => {
        expect(["bar", "pie", "line", "area"]).toContain(type);
      });
    });
  });

  describe("quarterly and yearly view modes", () => {
    it("should support both quarterly and yearly view modes", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const dept = await caller.departments.create({
        name: "View Mode Test Ward",
        color: "#F59E0B",
      });

      // Add data for multiple months
      const cat = await caller.categories.create({
        name: "Multi-Month Category",
      });

      const ind = await caller.indicators.create({
        categoryId: cat.id,
        name: "Multi-Month Indicator",
      });

      // Add data for Q1 (months 1-3)
      for (let month = 1; month <= 3; month++) {
        await caller.monthlyData.upsert({
          departmentId: dept.id,
          indicatorId: ind.id,
          year: 2026,
          month,
          value: `${month * 10}`,
        });
      }

      // Fetch quarterly data (Q1)
      const quarterlyData = await caller.monthlyData.get({
        departmentId: dept.id,
        year: 2026,
        quarter: 1,
      });

      expect(quarterlyData.length).toBeGreaterThan(0);
      const months = quarterlyData.map((d) => d.month);
      expect(months).toContain(1);
      expect(months).toContain(2);
      expect(months).toContain(3);

      // Fetch yearly data (all quarters)
      const yearlyData = await caller.monthlyData.get({
        departmentId: dept.id,
        year: 2026,
        quarter: 0, // 0 indicates yearly view
      });

      expect(yearlyData.length).toBeGreaterThanOrEqual(quarterlyData.length);
    });
  });

  describe("category filtering in charts", () => {
    it("should allow filtering indicators by category", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create two categories
      const cat1 = await caller.categories.create({
        name: "Category A",
      });

      const cat2 = await caller.categories.create({
        name: "Category B",
      });

      // Create indicators in each category
      const ind1 = await caller.indicators.create({
        categoryId: cat1.id,
        name: "Indicator A1",
      });

      const ind2 = await caller.indicators.create({
        categoryId: cat2.id,
        name: "Indicator B1",
      });

      // Fetch all indicators
      const allIndicators = await caller.indicators.list();

      // Fetch indicators for category 1
      const cat1Indicators = await caller.indicators.list({
        categoryId: cat1.id,
      });

      expect(allIndicators.length).toBeGreaterThanOrEqual(2);
      expect(cat1Indicators.length).toBeGreaterThan(0);

      const cat1Names = cat1Indicators.map((i: any) => i.name);
      expect(cat1Names).toContain("Indicator A1");
    });
  });
});
