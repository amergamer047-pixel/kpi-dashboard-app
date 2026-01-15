import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getKpiCategories, createKpiCategory, deleteKpiCategory,
  getKpiIndicators, createKpiIndicator, deleteKpiIndicator,
  getMonthlyKpiData, upsertMonthlyKpiData,
  getPatientCases, getPatientCasesByDepartment, createPatientCase, updatePatientCase, deletePatientCase,
  getQuarterlySummary, initializeSystemData
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

  // KPI Category routes
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await initializeSystemData();
      return getKpiCategories(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
        requiresPatientInfo: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createKpiCategory({ 
          ...input, 
          userId: ctx.user.id, 
          isSystemCategory: 0,
          requiresPatientInfo: input.requiresPatientInfo ? 1 : 0,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteKpiCategory(input.id, ctx.user.id);
      }),
  }),

  // KPI Indicator routes
  indicators: router({
    list: protectedProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        await initializeSystemData();
        return getKpiIndicators(ctx.user.id, input?.categoryId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        unit: z.string().optional(),
        targetValue: z.string().optional(),
        sortOrder: z.number().optional(),
        requiresPatientInfo: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createKpiIndicator({ 
          ...input, 
          userId: ctx.user.id, 
          isSystemIndicator: 0,
          requiresPatientInfo: input.requiresPatientInfo ? 1 : 0,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteKpiIndicator(input.id, ctx.user.id);
      }),
  }),

  // Monthly KPI Data routes
  monthlyData: router({
    get: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        year: z.number(),
        quarter: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getMonthlyKpiData(ctx.user.id, input.departmentId, input.year, input.quarter);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        indicatorId: z.number(),
        year: z.number(),
        month: z.number(),
        value: z.string(),
        notes: z.string().optional(),
        hospitalId: z.string().optional(),
        patientName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hospitalId, patientName, ...monthlyInput } = input;
        if (hospitalId && patientName) {
          await createPatientCase({
            userId: ctx.user.id,
            departmentId: input.departmentId,
            indicatorId: input.indicatorId,
            year: input.year,
            month: input.month,
            hospitalId,
            patientName,
          });
        }
        return upsertMonthlyKpiData({ ...monthlyInput, userId: ctx.user.id });
      }),
    
    bulkUpsert: protectedProcedure
      .input(z.array(z.object({
        departmentId: z.number(),
        indicatorId: z.number(),
        year: z.number(),
        month: z.number(),
        value: z.string(),
        notes: z.string().optional(),
      })))
      .mutation(async ({ ctx, input }) => {
        const results = [];
        for (const item of input) {
          const result = await upsertMonthlyKpiData({ ...item, userId: ctx.user.id });
          results.push(result);
        }
        return results;
      }),
  }),

  // Patient Case routes
  patientCases: router({
    list: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        indicatorId: z.number(),
        year: z.number(),
        month: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getPatientCases(ctx.user.id, input.departmentId, input.indicatorId, input.year, input.month);
      }),
    
    listByDepartment: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        year: z.number(),
        quarter: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return getPatientCasesByDepartment(ctx.user.id, input.departmentId, input.year, input.quarter);
      }),
    
    create: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        indicatorId: z.number(),
        year: z.number(),
        month: z.number(),
        hospitalId: z.string().min(1),
        patientName: z.string().min(1),
        caseDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createPatientCase({ ...input, userId: ctx.user.id });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        hospitalId: z.string().min(1).optional(),
        patientName: z.string().min(1).optional(),
        caseDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updatePatientCase(id, ctx.user.id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deletePatientCase(input.id, ctx.user.id);
      }),
  }),

  // Analytics routes
  analytics: router({
    quarterlySummary: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        year: z.number(),
        quarter: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return getQuarterlySummary(ctx.user.id, input.departmentId, input.year, input.quarter);
      }),
  }),
});

export type AppRouter = typeof appRouter;
