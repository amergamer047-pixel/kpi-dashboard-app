import { getDb } from "./db";
import { departments, kpiCategories, kpiIndicators, monthlyKpiData, patientCases, quarterlyReports } from "../drizzle/schema";
import { eq, isNull, notInSubquery } from "drizzle-orm";

async function fullCleanup() {
  console.log("🧹 Starting full cleanup of orphaned data...\n");

  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Failed to connect to database");
      process.exit(1);
    }

    // Step 1: Get all departments
    const allDepts = await db.select().from(departments);
    console.log(`📊 Total departments: ${allDepts.length}`);
    allDepts.forEach(dept => {
      console.log(`  - ${dept.name} (ID: ${dept.id}, User: ${dept.userId})`);
    });

    // Step 2: Delete orphaned categories (those not linked to any department)
    console.log("\n🗑️  Deleting orphaned categories...");
    const orphanedCats = await db.select().from(kpiCategories)
      .where(isNull(kpiCategories.departmentId));
    
    if (orphanedCats.length > 0) {
      console.log(`  Found ${orphanedCats.length} orphaned categories`);
      
      // First delete indicators that reference these categories
      for (const cat of orphanedCats) {
        await db.delete(kpiIndicators).where(eq(kpiIndicators.categoryId, cat.id));
      }
      
      // Then delete the categories
      await db.delete(kpiCategories).where(isNull(kpiCategories.departmentId));
      console.log(`  ✅ Deleted ${orphanedCats.length} orphaned categories and their indicators`);
    } else {
      console.log("  ✅ No orphaned categories found");
    }

    // Step 3: Delete orphaned indicators (those not linked to any department)
    console.log("\n🗑️  Deleting orphaned indicators...");
    const orphanedInds = await db.select().from(kpiIndicators)
      .where(isNull(kpiIndicators.departmentId));
    
    if (orphanedInds.length > 0) {
      console.log(`  Found ${orphanedInds.length} orphaned indicators`);
      await db.delete(kpiIndicators).where(isNull(kpiIndicators.departmentId));
      console.log(`  ✅ Deleted ${orphanedInds.length} orphaned indicators`);
    } else {
      console.log("  ✅ No orphaned indicators found");
    }

    // Step 4: Delete all monthly data and patient cases (to start fresh)
    console.log("\n🗑️  Deleting all monthly data and patient cases...");
    const monthlyCount = await db.delete(monthlyKpiData);
    const casesCount = await db.delete(patientCases);
    const reportsCount = await db.delete(quarterlyReports);
    console.log(`  ✅ Deleted monthly data, patient cases, and quarterly reports`);

    // Step 5: Summary
    console.log("\n✅ Cleanup complete!");
    console.log("\n📊 Database is now clean and ready for your data:");
    const finalDepts = await db.select().from(departments);
    const finalCats = await db.select().from(kpiCategories);
    const finalInds = await db.select().from(kpiIndicators);
    
    console.log(`  - Departments: ${finalDepts.length}`);
    console.log(`  - Categories: ${finalCats.length}`);
    console.log(`  - Indicators: ${finalInds.length}`);
    console.log(`  - Monthly Data: 0`);
    console.log(`  - Patient Cases: 0`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

fullCleanup();
