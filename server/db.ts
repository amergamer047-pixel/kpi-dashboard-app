import { eq, and, asc, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  departments, InsertDepartment,
  kpiCategories, InsertKpiCategory,
  kpiIndicators, InsertKpiIndicator,
  monthlyKpiData, InsertMonthlyKpiData,
  patientCases, InsertPatientCase,
  quarterlyReports, InsertQuarterlyReport
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User operations
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Department operations
export async function getDepartments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departments).where(eq(departments.userId, userId)).orderBy(asc(departments.name));
}

export async function createDepartment(data: InsertDepartment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(departments).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateDepartment(id: number, userId: number, data: Partial<InsertDepartment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(departments).set(data).where(and(eq(departments.id, id), eq(departments.userId, userId)));
  return { id, ...data };
}

export async function deleteDepartment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related data first
  await db.delete(monthlyKpiData).where(and(eq(monthlyKpiData.departmentId, id), eq(monthlyKpiData.userId, userId)));
  await db.delete(patientCases).where(and(eq(patientCases.departmentId, id), eq(patientCases.userId, userId)));
  await db.delete(quarterlyReports).where(and(eq(quarterlyReports.departmentId, id), eq(quarterlyReports.userId, userId)));
  await db.delete(departments).where(and(eq(departments.id, id), eq(departments.userId, userId)));
  return { success: true };
}

// KPI Category operations
export async function getKpiCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kpiCategories)
    .where(sql`${kpiCategories.isSystemCategory} = 1 OR ${kpiCategories.userId} = ${userId}`)
    .orderBy(asc(kpiCategories.sortOrder), asc(kpiCategories.name));
}

export async function createKpiCategory(data: InsertKpiCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(kpiCategories).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateKpiCategory(id: number, userId: number, data: Partial<InsertKpiCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(kpiCategories).set(data).where(and(eq(kpiCategories.id, id), eq(kpiCategories.userId, userId)));
  return { id, ...data };
}

export async function deleteKpiCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(kpiCategories).where(and(eq(kpiCategories.id, id), eq(kpiCategories.userId, userId)));
  return { success: true };
}

// KPI Indicator operations
export async function getKpiIndicators(userId: number, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (categoryId) {
    return db.select().from(kpiIndicators)
      .where(and(
        sql`(${kpiIndicators.isSystemIndicator} = 1 OR ${kpiIndicators.userId} = ${userId})`,
        eq(kpiIndicators.categoryId, categoryId)
      ))
      .orderBy(asc(kpiIndicators.sortOrder), asc(kpiIndicators.name));
  }
  
  return db.select().from(kpiIndicators)
    .where(sql`${kpiIndicators.isSystemIndicator} = 1 OR ${kpiIndicators.userId} = ${userId}`)
    .orderBy(asc(kpiIndicators.categoryId), asc(kpiIndicators.sortOrder), asc(kpiIndicators.name));
}

export async function createKpiIndicator(data: InsertKpiIndicator) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(kpiIndicators).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateKpiIndicator(id: number, userId: number, data: Partial<InsertKpiIndicator>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(kpiIndicators).set(data).where(and(eq(kpiIndicators.id, id), eq(kpiIndicators.userId, userId)));
  return { id, ...data };
}

export async function deleteKpiIndicator(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(kpiIndicators).where(and(eq(kpiIndicators.id, id), eq(kpiIndicators.userId, userId)));
  return { success: true };
}

// Monthly KPI Data operations
export async function getMonthlyKpiData(userId: number, departmentId: number, year: number, quarter?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let monthStart = 1;
  let monthEnd = 12;
  
  if (quarter) {
    monthStart = (quarter - 1) * 3 + 1;
    monthEnd = quarter * 3;
  }
  
  return db.select().from(monthlyKpiData)
    .where(and(
      eq(monthlyKpiData.userId, userId),
      eq(monthlyKpiData.departmentId, departmentId),
      eq(monthlyKpiData.year, year),
      sql`${monthlyKpiData.month} >= ${monthStart} AND ${monthlyKpiData.month} <= ${monthEnd}`
    ))
    .orderBy(asc(monthlyKpiData.indicatorId), asc(monthlyKpiData.month));
}

export async function upsertMonthlyKpiData(data: InsertMonthlyKpiData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if record exists
  const existing = await db.select().from(monthlyKpiData)
    .where(and(
      eq(monthlyKpiData.userId, data.userId),
      eq(monthlyKpiData.departmentId, data.departmentId),
      eq(monthlyKpiData.indicatorId, data.indicatorId),
      eq(monthlyKpiData.year, data.year),
      eq(monthlyKpiData.month, data.month)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(monthlyKpiData)
      .set({ value: data.value, notes: data.notes })
      .where(eq(monthlyKpiData.id, existing[0].id));
    return { ...existing[0], value: data.value, notes: data.notes };
  } else {
    const result = await db.insert(monthlyKpiData).values(data);
    return { id: Number(result[0].insertId), ...data };
  }
}

// Patient Case operations
export async function getPatientCases(userId: number, departmentId: number, indicatorId: number, year: number, month?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (month) {
    return db.select().from(patientCases)
      .where(and(
        eq(patientCases.userId, userId),
        eq(patientCases.departmentId, departmentId),
        eq(patientCases.indicatorId, indicatorId),
        eq(patientCases.year, year),
        eq(patientCases.month, month)
      ))
      .orderBy(asc(patientCases.caseDate));
  }
  
  return db.select().from(patientCases)
    .where(and(
      eq(patientCases.userId, userId),
      eq(patientCases.departmentId, departmentId),
      eq(patientCases.indicatorId, indicatorId),
      eq(patientCases.year, year)
    ))
    .orderBy(asc(patientCases.month), asc(patientCases.caseDate));
}

export async function getPatientCasesByDepartment(userId: number, departmentId: number, year: number, quarter?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let monthStart = 1;
  let monthEnd = 12;
  
  if (quarter) {
    monthStart = (quarter - 1) * 3 + 1;
    monthEnd = quarter * 3;
  }
  
  return db.select().from(patientCases)
    .where(and(
      eq(patientCases.userId, userId),
      eq(patientCases.departmentId, departmentId),
      eq(patientCases.year, year),
      sql`${patientCases.month} >= ${monthStart} AND ${patientCases.month} <= ${monthEnd}`
    ))
    .orderBy(asc(patientCases.indicatorId), asc(patientCases.month), asc(patientCases.caseDate));
}

export async function createPatientCase(data: InsertPatientCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patientCases).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updatePatientCase(id: number, userId: number, data: Partial<InsertPatientCase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(patientCases).set(data).where(and(eq(patientCases.id, id), eq(patientCases.userId, userId)));
  return { id, ...data };
}

export async function deletePatientCase(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(patientCases).where(and(eq(patientCases.id, id), eq(patientCases.userId, userId)));
  return { success: true };
}

// Analytics - get quarterly summary
export async function getQuarterlySummary(userId: number, departmentId: number, year: number, quarter: number) {
  const db = await getDb();
  if (!db) return null;
  
  const monthStart = (quarter - 1) * 3 + 1;
  const monthEnd = quarter * 3;
  const months = [monthStart, monthStart + 1, monthStart + 2];
  
  // Get all indicators
  const indicators = await getKpiIndicators(userId);
  
  // Get monthly data
  const monthlyData = await db.select().from(monthlyKpiData)
    .where(and(
      eq(monthlyKpiData.userId, userId),
      eq(monthlyKpiData.departmentId, departmentId),
      eq(monthlyKpiData.year, year),
      sql`${monthlyKpiData.month} >= ${monthStart} AND ${monthlyKpiData.month} <= ${monthEnd}`
    ));
  
  // Get patient cases count by indicator and month
  const caseCounts = await db.select({
    indicatorId: patientCases.indicatorId,
    month: patientCases.month,
    count: sql<number>`COUNT(*)`.as('count')
  }).from(patientCases)
    .where(and(
      eq(patientCases.userId, userId),
      eq(patientCases.departmentId, departmentId),
      eq(patientCases.year, year),
      sql`${patientCases.month} >= ${monthStart} AND ${patientCases.month} <= ${monthEnd}`
    ))
    .groupBy(patientCases.indicatorId, patientCases.month);
  
  return {
    year,
    quarter,
    months,
    indicators,
    monthlyData,
    caseCounts
  };
}

// Initialize system categories and indicators
export async function initializeSystemData() {
  const db = await getDb();
  if (!db) return;
  
  // Check if already initialized
  const existingCategories = await db.select().from(kpiCategories).where(eq(kpiCategories.isSystemCategory, 1));
  if (existingCategories.length > 0) return;
  
  // Create system categories
  const categoryData: InsertKpiCategory[] = [
    { name: "Mandatory", description: "Mandatory safety indicators", sortOrder: 1, isSystemCategory: 1, requiresPatientInfo: 1 },
    { name: "Respiratory", description: "Respiratory care indicators", sortOrder: 2, isSystemCategory: 1, requiresPatientInfo: 1 },
    { name: "Renal", description: "Renal care indicators", sortOrder: 3, isSystemCategory: 1, requiresPatientInfo: 0 },
  ];
  
  for (const cat of categoryData) {
    await db.insert(kpiCategories).values(cat);
  }
  
  // Get inserted categories
  const categories = await db.select().from(kpiCategories).where(eq(kpiCategories.isSystemCategory, 1));
  const mandatoryId = categories.find(c => c.name === "Mandatory")?.id;
  const respiratoryId = categories.find(c => c.name === "Respiratory")?.id;
  const renalId = categories.find(c => c.name === "Renal")?.id;
  
  // Create system indicators
  const indicatorData: InsertKpiIndicator[] = [
    // Mandatory
    { categoryId: mandatoryId!, name: "Pressure Sore", description: "Number of pressure sore incidents", unit: "cases", sortOrder: 1, isSystemIndicator: 1, requiresPatientInfo: 1 },
    { categoryId: mandatoryId!, name: "Fall Incidents", description: "Number of patient fall incidents", unit: "cases", sortOrder: 2, isSystemIndicator: 1, requiresPatientInfo: 1 },
    // Respiratory
    { categoryId: respiratoryId!, name: "NIV Cases", description: "Non-invasive ventilation cases", unit: "cases", sortOrder: 1, isSystemIndicator: 1, requiresPatientInfo: 1 },
    { categoryId: respiratoryId!, name: "Intubated Cases", description: "Intubation cases", unit: "cases", sortOrder: 2, isSystemIndicator: 1, requiresPatientInfo: 1 },
    // Renal
    { categoryId: renalId!, name: "RDU Sessions", description: "Renal dialysis unit sessions", unit: "sessions", sortOrder: 1, isSystemIndicator: 1, requiresPatientInfo: 0 },
  ];
  
  for (const ind of indicatorData) {
    await db.insert(kpiIndicators).values(ind);
  }
}


// Get all patient cases with related data (for Patient Registry)
export async function getPatientCasesWithDetails(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const cases = await db.select({
    id: patientCases.id,
    hospitalId: patientCases.hospitalId,
    patientName: patientCases.patientName,
    indicatorId: patientCases.indicatorId,
    indicatorName: kpiIndicators.name,
    categoryId: kpiCategories.id,
    categoryName: kpiCategories.name,
    departmentId: patientCases.departmentId,
    departmentName: departments.name,
    month: patientCases.month,
    year: patientCases.year,
    notes: patientCases.notes,
    createdAt: patientCases.createdAt,
  })
  .from(patientCases)
  .innerJoin(kpiIndicators, eq(patientCases.indicatorId, kpiIndicators.id))
  .innerJoin(kpiCategories, eq(kpiIndicators.categoryId, kpiCategories.id))
  .innerJoin(departments, eq(patientCases.departmentId, departments.id))
  .where(eq(patientCases.userId, userId))
  .orderBy(desc(patientCases.createdAt));
  
  return cases;
}
