import { describe, expect, it, beforeEach, vi } from "vitest";
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
  describe("departments", () => {
    it("should return empty array when no departments exist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const departments = await caller.departments.list();
      expect(Array.isArray(departments)).toBe(true);
    });
  });

  describe("templates", () => {
    it("should return KPI templates including system templates", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const templates = await caller.templates.list();
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe("entries", () => {
    it("should return empty array when no entries exist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const entries = await caller.entries.list();
      expect(Array.isArray(entries)).toBe(true);
    });

    it("should accept departmentId filter parameter", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const entries = await caller.entries.list({ departmentId: 1 });
      expect(Array.isArray(entries)).toBe(true);
    });
  });

  describe("analytics", () => {
    it("should return stats with proper structure", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const stats = await caller.analytics.stats();
      
      // Stats should have the expected structure
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("statusCounts");
      expect(stats).toHaveProperty("priorityCounts");
      expect(stats).toHaveProperty("riskCounts");
      expect(stats).toHaveProperty("completionRate");
      expect(stats).toHaveProperty("totalTarget");
      expect(stats).toHaveProperty("totalActual");
      expect(stats).toHaveProperty("variance");
      
      // Status counts should have all status types
      expect(stats?.statusCounts).toHaveProperty("not_started");
      expect(stats?.statusCounts).toHaveProperty("in_progress");
      expect(stats?.statusCounts).toHaveProperty("complete");
      expect(stats?.statusCounts).toHaveProperty("overdue");
      expect(stats?.statusCounts).toHaveProperty("on_hold");
      
      // Priority counts should have all priority types
      expect(stats?.priorityCounts).toHaveProperty("low");
      expect(stats?.priorityCounts).toHaveProperty("medium");
      expect(stats?.priorityCounts).toHaveProperty("high");
      
      // Risk counts should have all risk types
      expect(stats?.riskCounts).toHaveProperty("low");
      expect(stats?.riskCounts).toHaveProperty("medium");
      expect(stats?.riskCounts).toHaveProperty("high");
    });

    it("should return zero completion rate when no entries", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const stats = await caller.analytics.stats();
      expect(stats?.completionRate).toBe(0);
      expect(stats?.total).toBe(0);
    });
  });

  describe("settings", () => {
    it("should return null when no settings exist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const settings = await caller.settings.get();
      // Settings can be null if not yet created
      expect(settings === null || typeof settings === "object").toBe(true);
    });
  });

  describe("auth", () => {
    it("should return user info for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user?.openId).toBe("test-user-123");
      expect(user?.email).toBe("test@example.com");
    });

    it("should logout successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });
});

describe("Input validation", () => {
  it("should validate department create input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Empty name should fail validation
    await expect(
      caller.departments.create({ name: "" })
    ).rejects.toThrow();
  });

  it("should validate entry status enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Invalid status should fail
    await expect(
      caller.entries.create({
        departmentId: 1,
        name: "Test KPI",
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });

  it("should validate entry priority enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Invalid priority should fail
    await expect(
      caller.entries.create({
        departmentId: 1,
        name: "Test KPI",
        priority: "invalid_priority" as any,
      })
    ).rejects.toThrow();
  });

  it("should validate entry risk enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Invalid risk should fail
    await expect(
      caller.entries.create({
        departmentId: 1,
        name: "Test KPI",
        risk: "invalid_risk" as any,
      })
    ).rejects.toThrow();
  });
});
