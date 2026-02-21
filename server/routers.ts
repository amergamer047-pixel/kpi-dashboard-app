import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  freezeDepartment, bulkDeleteDepartments, bulkFreezeDepartments,
  getKpiCategories, createKpiCategory, updateKpiCategory, deleteKpiCategory,
  getKpiIndicators, createKpiIndicator, updateKpiIndicator, deleteKpiIndicator,
  getMonthlyKpiData, upsertMonthlyKpiData,
  getPatientCases, getPatientCasesByDepartment, getPatientCasesWithDetails, createPatientCase, updatePatientCase, deletePatientCase,
  getQuarterlySummary, initializeSystemData, getDb,
} from "./db";
import { monthlyKpiData, departments, kpiCategories, kpiIndicators } from "../drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";

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
    
    freeze: protectedProcedure
      .input(z.object({
        id: z.number(),
        isFrozen: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        return freezeDepartment(input.id, input.isFrozen);
      }),
    
    bulkDelete: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        return bulkDeleteDepartments(input.ids, ctx.user.id);
      }),
    
    bulkFreeze: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
        isFrozen: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        return bulkFreezeDepartments(input.ids, input.isFrozen);
      }),

    deleteAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        
        const userDepts = await db.select().from(departments)
          .where(eq(departments.userId, ctx.user.id));
        
        if (userDepts.length === 0) return { deleted: 0 };
        
        const deptIds = userDepts.map(d => d.id);
        const { monthlyKpiData: mData, patientCases: pCases, quarterlyReports: qReports } = await import("../drizzle/schema");
        
        await db.delete(mData).where(inArray(mData.departmentId, deptIds));
        await db.delete(pCases).where(inArray(pCases.departmentId, deptIds));
        await db.delete(qReports).where(inArray(qReports.departmentId, deptIds));
        await db.delete(kpiIndicators).where(inArray(kpiIndicators.departmentId, deptIds));
        await db.delete(kpiCategories).where(inArray(kpiCategories.departmentId, deptIds));
        await db.delete(departments).where(eq(departments.userId, ctx.user.id));
        
        return { deleted: userDepts.length };
      }),
  }),

  // KPI Category routes
  categories: router({
    list: protectedProcedure
      .input(z.object({ departmentId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        await initializeSystemData(ctx.user.id);
        return getKpiCategories(ctx.user.id, input?.departmentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        departmentId: z.number().optional(),
        sortOrder: z.number().optional(),
        requiresPatientInfo: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createKpiCategory({ 
          ...input, 
          userId: ctx.user.id, 
          requiresPatientInfo: input.requiresPatientInfo ? 1 : 0,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        requiresPatientInfo: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updateKpiCategory(id, ctx.user.id, {
          ...data,
          requiresPatientInfo: data.requiresPatientInfo ? 1 : 0,
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
      .input(z.object({ categoryId: z.number().optional(), departmentId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        await initializeSystemData(ctx.user.id);
        return getKpiIndicators(ctx.user.id, input?.categoryId, input?.departmentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        departmentId: z.number().optional(),
        unit: z.string().optional(),
        targetValue: z.string().optional(),
        sortOrder: z.number().optional(),
        requiresPatientInfo: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createKpiIndicator({ 
          ...input, 
          userId: ctx.user.id, 
          requiresPatientInfo: input.requiresPatientInfo ? 1 : 0,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        unit: z.string().optional(),
        targetValue: z.string().optional(),
        requiresPatientInfo: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return updateKpiIndicator(id, ctx.user.id, {
          ...data,
          requiresPatientInfo: data.requiresPatientInfo ? 1 : 0,
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
    
    delete: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        indicatorId: z.number(),
        year: z.number(),
        month: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { departmentId, indicatorId, year, month } = input;
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");
        // Delete the monthly KPI entry
        await db.delete(monthlyKpiData)
          .where(
            and(
              eq(monthlyKpiData.userId, ctx.user.id),
              eq(monthlyKpiData.departmentId, departmentId),
              eq(monthlyKpiData.indicatorId, indicatorId),
              eq(monthlyKpiData.year, year),
              eq(monthlyKpiData.month, month)
            )
          );
        return { success: true };
      }),
  }),

  // Patient Case routes
  patientCases: router({
    listAll: protectedProcedure.query(async ({ ctx }) => {
      // Get all patient cases for the user with their related data
      const cases = await getPatientCasesWithDetails(ctx.user.id);
      return cases;
    }),
    
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

  // Public routes for public dashboard (no authentication required)
  public: router({
    departments: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(departments);
    }),

    categories: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(kpiCategories);
    }),

    indicators: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(kpiIndicators);
    }),

    monthlyData: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(monthlyKpiData);
    }),
  }),
});

export type AppRouter = typeof appRouter;

    // This will be added as deleteAll endpoint
