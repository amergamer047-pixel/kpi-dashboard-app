import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-interactivity",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("KPI Dashboard Interactivity", () => {
  let departmentId: number;
  let categoryId: number;
  let indicatorId: number;

  it("should create a department", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.departments.create({
      name: "Test Ward",
      description: "Test department for interactivity",
      color: "#3B82F6",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Ward");
    departmentId = result.id;
  });

  it("should list departments", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.departments.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should create a category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.create({
      name: "Mandatory",
      requiresPatientInfo: true,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Mandatory");
    categoryId = result.id;
  });

  it("should create an indicator", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.indicators.create({
      name: "Fall Incidents",
      categoryId,
      unit: "cases",
      requiresPatientInfo: true,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Fall Incidents");
    indicatorId = result.id;
  });

  it("should upsert monthly KPI data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.monthlyData.upsert({
      departmentId,
      indicatorId,
      year: 2026,
      month: 1,
      value: "5",
    });

    expect(result).toBeDefined();
    expect(result.value).toBe("5");
  });

  it("should get monthly KPI data for a quarter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.monthlyData.get({
      departmentId,
      year: 2026,
      quarter: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should create a patient case", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patientCases.create({
      departmentId,
      indicatorId,
      year: 2026,
      month: 1,
      hospitalId: "PT001",
      patientName: "John Doe",
      notes: "Test patient case",
    });

    expect(result).toBeDefined();
    expect(result.hospitalId).toBe("PT001");
    expect(result.patientName).toBe("John Doe");
  });

  it("should list patient cases by department", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patientCases.listByDepartment({
      departmentId,
      year: 2026,
      quarter: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update a department", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.departments.update({
      id: departmentId,
      name: "Updated Test Ward",
      description: "Updated description",
      color: "#22C55E",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Updated Test Ward");
  });

  it("should delete a patient case", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a patient case to delete
    const created = await caller.patientCases.create({
      departmentId,
      indicatorId,
      year: 2026,
      month: 2,
      hospitalId: "PT002",
      patientName: "Jane Doe",
    });

    const result = await caller.patientCases.delete({
      id: created.id,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should delete an indicator", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.indicators.delete({
      id: indicatorId,
    });

    expect(result).toBeDefined();
  });

  it("should delete a category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.delete({
      id: categoryId,
    });

    expect(result).toBeDefined();
  });

  it("should delete a department", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.departments.delete({
      id: departmentId,
    });

    expect(result).toBeDefined();
  });
});
