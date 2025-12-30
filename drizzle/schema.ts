import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

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
 * Departments table - organize KPIs by department
 */
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

/**
 * KPI Templates - predefined KPI types that can be used across departments
 */
export const kpiTemplates = mysqlTable("kpi_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }),
  isSystemTemplate: int("isSystemTemplate").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KpiTemplate = typeof kpiTemplates.$inferSelect;
export type InsertKpiTemplate = typeof kpiTemplates.$inferInsert;

/**
 * KPI Entries - actual KPI data entries with status and values
 */
export const kpiEntries = mysqlTable("kpi_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  departmentId: int("departmentId").notNull(),
  templateId: int("templateId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  assignedTo: varchar("assignedTo", { length: 255 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }),
  actualValue: decimal("actualValue", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  status: mysqlEnum("status", ["not_started", "in_progress", "complete", "overdue", "on_hold"]).default("not_started").notNull(),
  risk: mysqlEnum("risk", ["low", "medium", "high"]).default("low").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  comments: text("comments"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KpiEntry = typeof kpiEntries.$inferSelect;
export type InsertKpiEntry = typeof kpiEntries.$inferInsert;

/**
 * Dashboard Settings - user preferences for dashboard display
 */
export const dashboardSettings = mysqlTable("dashboard_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  projectName: varchar("projectName", { length: 255 }).default("Healthcare KPI Dashboard"),
  projectStatus: mysqlEnum("projectStatus", ["on_track", "at_risk", "off_track"]).default("on_track"),
  plannedBudget: decimal("plannedBudget", { precision: 12, scale: 2 }),
  actualBudget: decimal("actualBudget", { precision: 12, scale: 2 }),
  pendingDecisions: int("pendingDecisions").default(0),
  pendingActions: int("pendingActions").default(0),
  pendingChangeRequests: int("pendingChangeRequests").default(0),
  chartPreferences: json("chartPreferences"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DashboardSettings = typeof dashboardSettings.$inferSelect;
export type InsertDashboardSettings = typeof dashboardSettings.$inferInsert;
