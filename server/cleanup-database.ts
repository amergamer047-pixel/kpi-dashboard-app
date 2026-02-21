import { getDb } from "./db";
import { departments, kpiCategories, kpiIndicators, monthlyKpiData, patientCases, quarterlyReports } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function cleanupDatabase() {
  console.log("🔧 Starting database cleanup...");

  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Failed to connect to database");
      process.exit(1);
    }

    // Step 1: Get all departments and identify duplicates
    console.log("\n📊 Analyzing departments...");
    const allDepts = await db.select().from(departments);
    console.log(`Total departments: ${allDepts.length}`);

    // Group by name to find duplicates
    const deptsByName: Record<string, typeof allDepts> = {};
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
        await db.delete(monthlyKpiData).where(eq(monthlyKpiData.departmentId, removeDept.id));
        await db.delete(patientCases).where(eq(patientCases.departmentId, removeDept.id));
        await db.delete(quarterlyReports).where(eq(quarterlyReports.departmentId, removeDept.id));

        // Delete the department
        await db.delete(departments).where(eq(departments.id, removeDept.id));
        deletedCount++;
      }
    }
    console.log(`✅ Deleted ${deletedCount} duplicate departments`);

    // Step 3: Check categories and indicators
    console.log("\n📊 Analyzing categories and indicators...");
    const allCats = await db.select().from(kpiCategories);
    const allInds = await db.select().from(kpiIndicators);
    console.log(`Total categories: ${allCats.length}`);
    console.log(`Total indicators: ${allInds.length}`);

    // Step 4: Check for orphaned indicators (indicators without valid categories)
    console.log("\n🔍 Checking for orphaned indicators...");
    const categoryIds = new Set(allCats.map((c) => c.id));
    const orphanedInds = allInds.filter((ind) => !categoryIds.has(ind.categoryId));
    console.log(`Found ${orphanedInds.length} orphaned indicators`);

    if (orphanedInds.length > 0) {
      console.log("  Deleting orphaned indicators...");
      for (const ind of orphanedInds) {
        await db.delete(kpiIndicators).where(eq(kpiIndicators.id, ind.id));
        // Also delete related monthly data and patient cases
        await db.delete(monthlyKpiData).where(eq(monthlyKpiData.indicatorId, ind.id));
        await db.delete(patientCases).where(eq(patientCases.indicatorId, ind.id));
      }
      console.log(`✅ Deleted ${orphanedInds.length} orphaned indicators`);
    }

    // Step 5: Summary
    console.log("\n✨ Cleanup complete!");
    const finalDepts = await db.select().from(departments);
    const finalCats = await db.select().from(kpiCategories);
    const finalInds = await db.select().from(kpiIndicators);
    console.log(`Final counts:`);
    console.log(`  - Departments: ${finalDepts.length}`);
    console.log(`  - Categories: ${finalCats.length}`);
    console.log(`  - Indicators: ${finalInds.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupDatabase();
