import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
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

describe("KPI Dashboard API", () => {
  describe("departments router", () => {
    it("should list departments for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a new department", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.create({
        name: "Test Department",
        description: "A test department",
        color: "#3B82F6",
      });

      expect(result).toHaveProperty("id");
      expect(result.name).toBe("Test Department");
    });

    it("should reject empty department name", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.create({ name: "" })
      ).rejects.toThrow();
    });
  });

  describe("categories router", () => {
    it("should list KPI categories including system categories", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.categories.list();

      expect(Array.isArray(result)).toBe(true);
      // Should have system categories initialized
      const categoryNames = result.map((c: { name: string }) => c.name);
      expect(categoryNames).toContain("Mandatory");
      expect(categoryNames).toContain("Respiratory");
      expect(categoryNames).toContain("Renal");
    });

    it("should create a custom category", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.categories.create({
        name: "Custom Category",
        requiresPatientInfo: true,
      });

      expect(result).toHaveProperty("id");
      expect(result.name).toBe("Custom Category");
    });
  });

  describe("indicators router", () => {
    it("should list KPI indicators including system indicators", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.indicators.list();

      expect(Array.isArray(result)).toBe(true);
      // Should have system indicators initialized
      const indicatorNames = result.map((i: { name: string }) => i.name);
      expect(indicatorNames).toContain("Pressure Sore");
      expect(indicatorNames).toContain("Fall Incidents");
      expect(indicatorNames).toContain("NIV Cases");
      expect(indicatorNames).toContain("Intubated Cases");
      expect(indicatorNames).toContain("RDU Sessions");
    });
  });

  describe("monthlyData router", () => {
    it("should upsert monthly KPI data", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First create a department
      const dept = await caller.departments.create({
        name: "Monthly Data Test Dept",
      });

      // Get indicators
      const indicators = await caller.indicators.list();
      const rduIndicator = indicators.find((i: { name: string }) => i.name === "RDU Sessions");

      if (rduIndicator) {
        const result = await caller.monthlyData.upsert({
          departmentId: dept.id,
          indicatorId: rduIndicator.id,
          year: 2026,
          month: 7,
          value: "11",
        });

        expect(result).toHaveProperty("id");
        expect(result.value).toBe("11");
      }
    });

    it("should get monthly KPI data for a quarter", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First create a department
      const dept = await caller.departments.create({
        name: "Quarterly Data Test Dept",
      });

      const result = await caller.monthlyData.get({
        departmentId: dept.id,
        year: 2026,
        quarter: 3,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("patientCases router", () => {
    it("should create a patient case", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create department
      const dept = await caller.departments.create({
        name: "Patient Case Test Dept",
      });

      // Get indicators
      const indicators = await caller.indicators.list();
      const fallIndicator = indicators.find((i: { name: string }) => i.name === "Fall Incidents");

      if (fallIndicator) {
        const result = await caller.patientCases.create({
          departmentId: dept.id,
          indicatorId: fallIndicator.id,
          year: 2026,
          month: 7,
          hospitalId: "H12345",
          patientName: "John Doe",
          notes: "Test case",
        });

        expect(result).toHaveProperty("id");
        expect(result.hospitalId).toBe("H12345");
        expect(result.patientName).toBe("John Doe");
      }
    });

    it("should list patient cases by department", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create department
      const dept = await caller.departments.create({
        name: "List Cases Test Dept",
      });

      const result = await caller.patientCases.listByDepartment({
        departmentId: dept.id,
        year: 2026,
        quarter: 3,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("auth router", () => {
    it("should return current user from me query", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Test User");
      expect(result?.email).toBe("test@example.com");
    });

    it("should logout successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });
});
