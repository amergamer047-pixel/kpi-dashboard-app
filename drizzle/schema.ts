import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Departments table - organize KPIs by department (e.g., Male Ward, Female Ward, ICU)
 */
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  isFrozen: int("isFrozen").default(0), // 0 = active, 1 = frozen (read-only)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

/**
 * KPI Categories - group KPIs by type (e.g., Mandatory, Respiratory, Renal)
 */
export const kpiCategories = mysqlTable("kpi_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  departmentId: int("departmentId").default(0),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0),
  requiresPatientInfo: int("requiresPatientInfo").default(0), // 1 for Mandatory & Respiratory
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KpiCategory = typeof kpiCategories.$inferSelect;
export type InsertKpiCategory = typeof kpiCategories.$inferInsert;

/**
 * KPI Indicators - the actual KPI metrics (e.g., Fall Incidents, NIV Cases, RDU Sessions)
 */
export const kpiIndicators = mysqlTable("kpi_indicators", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  categoryId: int("categoryId").notNull(),
  departmentId: int("departmentId").default(0),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 50 }).default("cases"),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }),
  sortOrder: int("sortOrder").default(0),
  requiresPatientInfo: int("requiresPatientInfo").default(0), // 1 if needs patient details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KpiIndicator = typeof kpiIndicators.$inferSelect;
export type InsertKpiIndicator = typeof kpiIndicators.$inferInsert;

/**
 * Monthly KPI Data - stores the aggregated case counts per month (for Renal-type KPIs)
 */
export const monthlyKpiData = mysqlTable("monthly_kpi_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  departmentId: int("departmentId").notNull(),
  indicatorId: int("indicatorId").notNull(),
  year: int("year").notNull(),
  month: int("month").notNull(), // 1-12
  value: decimal("value", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyKpiData = typeof monthlyKpiData.$inferSelect;
export type InsertMonthlyKpiData = typeof monthlyKpiData.$inferInsert;

/**
 * Patient Cases - individual patient records for Mandatory & Respiratory KPIs
 * Each case is linked to a specific indicator, department, and month
 */
export const patientCases = mysqlTable("patient_cases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  departmentId: int("departmentId").notNull(),
  indicatorId: int("indicatorId").notNull(),
  year: int("year").notNull(),
  month: int("month").notNull(), // 1-12
  hospitalId: varchar("hospitalId", { length: 100 }).notNull(), // Patient Hospital ID
  patientName: varchar("patientName", { length: 255 }).notNull(), // Patient Name
  caseDate: timestamp("caseDate"), // Date of incident/case
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientCase = typeof patientCases.$inferSelect;
export type InsertPatientCase = typeof patientCases.$inferInsert;

/**
 * Quarterly Reports - aggregated quarterly data for reporting
 */
export const quarterlyReports = mysqlTable("quarterly_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  departmentId: int("departmentId").notNull(),
  year: int("year").notNull(),
  quarter: int("quarter").notNull(), // 1-4
  status: mysqlEnum("status", ["draft", "submitted", "approved"]).default("draft"),
  submittedAt: timestamp("submittedAt"),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuarterlyReport = typeof quarterlyReports.$inferSelect;
export type InsertQuarterlyReport = typeof quarterlyReports.$inferInsert;

/**
 * Dashboard Shares - public sharing links for dashboards
 */
export const dashboardShares = mysqlTable("dashboard_shares", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(), // Unique share token
  title: varchar("title", { length: 255 }).default("Shared Dashboard"),
  description: text("description"),
  allowEditing: int("allowEditing").default(1), // 1 = can edit, 0 = read-only
  allowForecasting: int("allowForecasting").default(1), // 1 = can forecast, 0 = view only
  expiresAt: timestamp("expiresAt"), // Optional expiry date
  viewCount: int("viewCount").default(0), // Track views
  lastViewedAt: timestamp("lastViewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DashboardShare = typeof dashboardShares.$inferSelect;
export type InsertDashboardShare = typeof dashboardShares.$inferInsert;

/**
 * Share Collaborators - track who has access to shared dashboards
 */
export const shareCollaborators = mysqlTable("share_collaborators", {
  id: int("id").autoincrement().primaryKey(),
  shareId: int("shareId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "editor", "viewer"]).default("editor"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
});

export type ShareCollaborator = typeof shareCollaborators.$inferSelect;
export type InsertShareCollaborator = typeof shareCollaborators.$inferInsert;

/**
 * Share Activity Log - track changes made on shared dashboards
 */
export const shareActivityLog = mysqlTable("share_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  shareId: int("shareId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // create, update, delete, forecast
  entityType: varchar("entityType", { length: 50 }).notNull(), // department, indicator, monthlyData, forecast
  entityId: int("entityId"),
  changes: text("changes"), // JSON of what changed
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ShareActivityLog = typeof shareActivityLog.$inferSelect;
export type InsertShareActivityLog = typeof shareActivityLog.$inferInsert;
