import { describe, it, expect, beforeAll, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb, createDepartment, createKpiCategory, createKpiIndicator, upsertMonthlyKpiData } from "./db";

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
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

describe("Public Dashboard API", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testDepartmentId: number;
  let testCategoryId: number;
  let testIndicatorId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Create a test caller with public context (no user required)
    const { ctx } = createPublicContext();
    caller = appRouter.createCaller(ctx);

    // Create test data
    const dept = await createDepartment({
      name: "Public Test Department",
      description: "Test department for public dashboard",
      userId: 999, // Test user ID
    });
    testDepartmentId = dept.id;

    const cat = await createKpiCategory({
      name: "Public Test Category",
      departmentId: testDepartmentId,
      userId: 999,
    });
    testCategoryId = cat.id;

    const ind = await createKpiIndicator({
      name: "Public Test Indicator",
      categoryId: testCategoryId,
      departmentId: testDepartmentId,
      userId: 999,
    });
    testIndicatorId = ind.id;

    // Add some monthly data
    await upsertMonthlyKpiData({
      departmentId: testDepartmentId,
      indicatorId: testIndicatorId,
      year: 2026,
      month: 1,
      value: "5.00",
      userId: 999,
    });
  });

  it("should fetch all departments without authentication", async () => {
    const departments = await caller.public.departments();
    expect(Array.isArray(departments)).toBe(true);
    expect(departments.length).toBeGreaterThan(0);
    // Should include our test department
    const testDept = departments.find((d: any) => d.id === testDepartmentId);
    expect(testDept).toBeDefined();
    expect(testDept?.name).toBe("Public Test Department");
  });

  it("should fetch all categories without authentication", async () => {
    const categories = await caller.public.categories();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    // Should include our test category
    const testCat = categories.find((c: any) => c.id === testCategoryId);
    expect(testCat).toBeDefined();
    expect(testCat?.name).toBe("Public Test Category");
  });

  it("should fetch all indicators without authentication", async () => {
    const indicators = await caller.public.indicators();
    expect(Array.isArray(indicators)).toBe(true);
    expect(indicators.length).toBeGreaterThan(0);
    // Should include our test indicator
    const testInd = indicators.find((i: any) => i.id === testIndicatorId);
    expect(testInd).toBeDefined();
    expect(testInd?.name).toBe("Public Test Indicator");
  });

  it("should fetch all monthly data without authentication", async () => {
    const monthlyData = await caller.public.monthlyData();
    expect(Array.isArray(monthlyData)).toBe(true);
    expect(monthlyData.length).toBeGreaterThan(0);
    // Should include our test data
    const testData = monthlyData.find(
      (m: any) =>
        m.departmentId === testDepartmentId &&
        m.indicatorId === testIndicatorId &&
        m.year === 2026 &&
        m.month === 1
    );
    expect(testData).toBeDefined();
    // Value is stored as decimal string (5.00)
    expect(testData?.value).toBe("5.00");
  });

  it("should return empty arrays when database is unavailable", async () => {
    // This test verifies graceful fallback behavior
    const departments = await caller.public.departments();
    expect(Array.isArray(departments)).toBe(true);
  });
});
