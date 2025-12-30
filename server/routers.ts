import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getKpiTemplates, createKpiTemplate, updateKpiTemplate, deleteKpiTemplate,
  getKpiEntries, createKpiEntry, updateKpiEntry, deleteKpiEntry, bulkUpdateKpiEntries,
  getDashboardSettings, upsertDashboardSettings,
  getKpiStats, initializeSystemTemplates
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Department routes
  departments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getDepartments(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createDepartment({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updateDepartment(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteDepartment(input.id, ctx.user.id);
      }),
  }),

  // KPI Template routes
  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await initializeSystemTemplates();
      return getKpiTemplates(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().optional(),
        targetValue: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createKpiTemplate({ ...input, userId: ctx.user.id, isSystemTemplate: 0 });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().optional(),
        targetValue: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updateKpiTemplate(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteKpiTemplate(input.id, ctx.user.id);
      }),
  }),

  // KPI Entry routes
  entries: router({
    list: protectedProcedure
      .input(z.object({ departmentId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getKpiEntries(ctx.user.id, input?.departmentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        templateId: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        targetValue: z.string().optional(),
        actualValue: z.string().optional(),
        unit: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "complete", "overdue", "on_hold"]).optional(),
        risk: z.enum(["low", "medium", "high"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        comments: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createKpiEntry({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        departmentId: z.number().optional(),
        templateId: z.number().optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        startDate: z.date().nullable().optional(),
        endDate: z.date().nullable().optional(),
        targetValue: z.string().optional(),
        actualValue: z.string().optional(),
        unit: z.string().optional(),
        status: z.enum(["not_started", "in_progress", "complete", "overdue", "on_hold"]).optional(),
        risk: z.enum(["low", "medium", "high"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        comments: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updateKpiEntry(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteKpiEntry(input.id, ctx.user.id);
      }),
    
    bulkUpdate: protectedProcedure
      .input(z.array(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          assignedTo: z.string().optional(),
          startDate: z.date().nullable().optional(),
          endDate: z.date().nullable().optional(),
          targetValue: z.string().optional(),
          actualValue: z.string().optional(),
          status: z.enum(["not_started", "in_progress", "complete", "overdue", "on_hold"]).optional(),
          risk: z.enum(["low", "medium", "high"]).optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          comments: z.string().optional(),
          sortOrder: z.number().optional(),
        }),
      })))
      .mutation(async ({ ctx, input }) => {
        return bulkUpdateKpiEntries(ctx.user.id, input);
      }),
  }),

  // Dashboard settings routes
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getDashboardSettings(ctx.user.id);
    }),
    
    update: protectedProcedure
      .input(z.object({
        projectName: z.string().optional(),
        projectStatus: z.enum(["on_track", "at_risk", "off_track"]).optional(),
        plannedBudget: z.string().optional(),
        actualBudget: z.string().optional(),
        pendingDecisions: z.number().optional(),
        pendingActions: z.number().optional(),
        pendingChangeRequests: z.number().optional(),
        chartPreferences: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return upsertDashboardSettings(ctx.user.id, input);
      }),
  }),

  // Analytics routes
  analytics: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getKpiStats(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
