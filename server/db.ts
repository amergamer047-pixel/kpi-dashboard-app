import { eq, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  departments, InsertDepartment, Department,
  kpiTemplates, InsertKpiTemplate, KpiTemplate,
  kpiEntries, InsertKpiEntry, KpiEntry,
  dashboardSettings, InsertDashboardSettings, DashboardSettings
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
  await db.delete(kpiEntries).where(and(eq(kpiEntries.departmentId, id), eq(kpiEntries.userId, userId)));
  await db.delete(departments).where(and(eq(departments.id, id), eq(departments.userId, userId)));
  return { success: true };
}

// KPI Template operations
export async function getKpiTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kpiTemplates)
    .where(sql`${kpiTemplates.isSystemTemplate} = 1 OR ${kpiTemplates.userId} = ${userId}`)
    .orderBy(asc(kpiTemplates.category), asc(kpiTemplates.name));
}

export async function createKpiTemplate(data: InsertKpiTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(kpiTemplates).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateKpiTemplate(id: number, userId: number, data: Partial<InsertKpiTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(kpiTemplates).set(data).where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.userId, userId)));
  return { id, ...data };
}

export async function deleteKpiTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(kpiTemplates).where(and(eq(kpiTemplates.id, id), eq(kpiTemplates.userId, userId)));
  return { success: true };
}

// KPI Entry operations
export async function getKpiEntries(userId: number, departmentId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (departmentId) {
    return db.select().from(kpiEntries)
      .where(and(eq(kpiEntries.userId, userId), eq(kpiEntries.departmentId, departmentId)))
      .orderBy(asc(kpiEntries.sortOrder), asc(kpiEntries.createdAt));
  }
  
  return db.select().from(kpiEntries)
    .where(eq(kpiEntries.userId, userId))
    .orderBy(asc(kpiEntries.departmentId), asc(kpiEntries.sortOrder), asc(kpiEntries.createdAt));
}

export async function createKpiEntry(data: InsertKpiEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(kpiEntries).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateKpiEntry(id: number, userId: number, data: Partial<InsertKpiEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(kpiEntries).set(data).where(and(eq(kpiEntries.id, id), eq(kpiEntries.userId, userId)));
  return { id, ...data };
}

export async function deleteKpiEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(kpiEntries).where(and(eq(kpiEntries.id, id), eq(kpiEntries.userId, userId)));
  return { success: true };
}

export async function bulkUpdateKpiEntries(userId: number, entries: Array<{ id: number; data: Partial<InsertKpiEntry> }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (const entry of entries) {
    await db.update(kpiEntries)
      .set(entry.data)
      .where(and(eq(kpiEntries.id, entry.id), eq(kpiEntries.userId, userId)));
  }
  return { success: true };
}

// Dashboard Settings operations
export async function getDashboardSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dashboardSettings).where(eq(dashboardSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertDashboardSettings(userId: number, data: Partial<InsertDashboardSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getDashboardSettings(userId);
  if (existing) {
    await db.update(dashboardSettings).set(data).where(eq(dashboardSettings.userId, userId));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(dashboardSettings).values({ userId, ...data });
    return { id: Number(result[0].insertId), userId, ...data };
  }
}

// Analytics operations
export async function getKpiStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const entries = await db.select().from(kpiEntries).where(eq(kpiEntries.userId, userId));
  
  const statusCounts = {
    not_started: 0,
    in_progress: 0,
    complete: 0,
    overdue: 0,
    on_hold: 0
  };
  
  const priorityCounts = {
    low: 0,
    medium: 0,
    high: 0
  };
  
  const riskCounts = {
    low: 0,
    medium: 0,
    high: 0
  };
  
  let totalTarget = 0;
  let totalActual = 0;
  
  entries.forEach(entry => {
    statusCounts[entry.status]++;
    priorityCounts[entry.priority]++;
    riskCounts[entry.risk]++;
    
    if (entry.targetValue) totalTarget += Number(entry.targetValue);
    if (entry.actualValue) totalActual += Number(entry.actualValue);
  });
  
  const total = entries.length;
  const completionRate = total > 0 ? (statusCounts.complete / total) * 100 : 0;
  const variance = totalTarget > 0 ? ((totalActual - totalTarget) / totalTarget) * 100 : 0;
  
  return {
    total,
    statusCounts,
    priorityCounts,
    riskCounts,
    completionRate,
    totalTarget,
    totalActual,
    variance
  };
}

// Initialize system templates
export async function initializeSystemTemplates() {
  const db = await getDb();
  if (!db) return;
  
  const existingTemplates = await db.select().from(kpiTemplates).where(eq(kpiTemplates.isSystemTemplate, 1));
  if (existingTemplates.length > 0) return;
  
  const healthcareTemplates: InsertKpiTemplate[] = [
    { name: "Fall Incidents", description: "Number of patient fall incidents", category: "Patient Safety", unit: "incidents", targetValue: "0", isSystemTemplate: 1 },
    { name: "Needle Stick Injuries", description: "Number of needle stick injuries among staff", category: "Staff Safety", unit: "incidents", targetValue: "0", isSystemTemplate: 1 },
    { name: "Defaulters", description: "Number of patients who defaulted on treatment", category: "Patient Compliance", unit: "patients", targetValue: "0", isSystemTemplate: 1 },
    { name: "Medication Errors", description: "Number of medication administration errors", category: "Patient Safety", unit: "errors", targetValue: "0", isSystemTemplate: 1 },
    { name: "Hospital Acquired Infections", description: "Rate of hospital acquired infections", category: "Infection Control", unit: "per 1000 patient days", targetValue: "0", isSystemTemplate: 1 },
    { name: "Patient Satisfaction Score", description: "Average patient satisfaction rating", category: "Quality", unit: "score (1-10)", targetValue: "9", isSystemTemplate: 1 },
    { name: "Average Length of Stay", description: "Average patient length of stay", category: "Efficiency", unit: "days", targetValue: "5", isSystemTemplate: 1 },
    { name: "Bed Occupancy Rate", description: "Percentage of beds occupied", category: "Efficiency", unit: "%", targetValue: "85", isSystemTemplate: 1 },
    { name: "Readmission Rate", description: "30-day readmission rate", category: "Quality", unit: "%", targetValue: "5", isSystemTemplate: 1 },
    { name: "Staff Turnover Rate", description: "Annual staff turnover percentage", category: "HR", unit: "%", targetValue: "10", isSystemTemplate: 1 },
    { name: "Training Completion Rate", description: "Staff training completion percentage", category: "HR", unit: "%", targetValue: "100", isSystemTemplate: 1 },
    { name: "Hand Hygiene Compliance", description: "Hand hygiene compliance rate", category: "Infection Control", unit: "%", targetValue: "95", isSystemTemplate: 1 },
  ];
  
  for (const template of healthcareTemplates) {
    await db.insert(kpiTemplates).values(template);
  }
}
