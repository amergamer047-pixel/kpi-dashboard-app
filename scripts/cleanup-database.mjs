import { drizzle } from "drizzle-orm/mysql2/promise";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

async function cleanupDatabase() {
  console.log("🔧 Starting database cleanup...");

  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection, { schema });

    // Step 1: Get all departments and identify duplicates
    console.log("\n📊 Analyzing departments...");
    const allDepts = await db.select().from(schema.departments);
    console.log(`Total departments: ${allDepts.length}`);

    // Group by name to find duplicates
    const deptsByName = {};
    allDepts.forEach((dept) => {
      if (!deptsByName[dept.name]) {
        deptsByName[dept.name] = [];
      }
      deptsByName[dept.name].push(dept);
    });

    // Find duplicates
    const duplicates = Object.entries(deptsByName).filter(([_, depts]) => depts.length > 1);
    console.log(`Found ${duplicates.length} departments with duplicate names`);

    // Step 2: For each duplicate set, keep the first one and delete others
    console.log("\n🗑️  Removing duplicate departments...");
    let deletedCount = 0;
    for (const [name, depts] of duplicates) {
      const [keepDept, ...removeDepts] = depts;
      console.log(`  Department "${name}": keeping ID ${keepDept.id}, removing ${removeDepts.map((d) => d.id).join(", ")}`);

      for (const removeDept of removeDepts) {
        // Delete related data first
        await db.delete(schema.monthlyKpiData).where(eq(schema.monthlyKpiData.departmentId, removeDept.id));
        await db.delete(schema.patientCases).where(eq(schema.patientCases.departmentId, removeDept.id));
        await db.delete(schema.quarterlyReports).where(eq(schema.quarterlyReports.departmentId, removeDept.id));

        // Delete the department
        await db.delete(schema.departments).where(eq(schema.departments.id, removeDept.id));
        deletedCount++;
      }
    }
    console.log(`✅ Deleted ${deletedCount} duplicate departments`);

    // Step 3: Check categories and indicators
    console.log("\n📊 Analyzing categories and indicators...");
    const allCats = await db.select().from(schema.kpiCategories);
    const allInds = await db.select().from(schema.kpiIndicators);
    console.log(`Total categories: ${allCats.length}`);
    console.log(`Total indicators: ${allInds.length}`);

    // Step 4: Ensure system categories exist and are properly set
    console.log("\n🔧 Ensuring system categories exist...");
    const systemCategoryNames = ["Mandatory", "Respiratory", "Renal"];
    const existingSystemCats = allCats.filter((c) => systemCategoryNames.includes(c.name) && c.departmentId === 0);
    console.log(`Found ${existingSystemCats.length} system categories`);

    // Step 5: Check for orphaned indicators (indicators without valid categories)
    console.log("\n🔍 Checking for orphaned indicators...");
    const categoryIds = new Set(allCats.map((c) => c.id));
    const orphanedInds = allInds.filter((ind) => !categoryIds.has(ind.categoryId));
    console.log(`Found ${orphanedInds.length} orphaned indicators`);

    if (orphanedInds.length > 0) {
      console.log("  Deleting orphaned indicators...");
      for (const ind of orphanedInds) {
        await db.delete(schema.kpiIndicators).where(eq(schema.kpiIndicators.id, ind.id));
        // Also delete related monthly data and patient cases
        await db.delete(schema.monthlyKpiData).where(eq(schema.monthlyKpiData.indicatorId, ind.id));
        await db.delete(schema.patientCases).where(eq(schema.patientCases.indicatorId, ind.id));
      }
      console.log(`✅ Deleted ${orphanedInds.length} orphaned indicators`);
    }

    // Step 6: Summary
    console.log("\n✨ Cleanup complete!");
    const finalDepts = await db.select().from(schema.departments);
    const finalCats = await db.select().from(schema.kpiCategories);
    const finalInds = await db.select().from(schema.kpiIndicators);
    console.log(`Final counts:`);
    console.log(`  - Departments: ${finalDepts.length}`);
    console.log(`  - Categories: ${finalCats.length}`);
    console.log(`  - Indicators: ${finalInds.length}`);

    await connection.end();
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupDatabase();
