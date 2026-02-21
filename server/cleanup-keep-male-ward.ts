import { getDb } from "./db";
import { departments, kpiCategories, kpiIndicators, monthlyKpiData, patientCases, quarterlyReports } from "../drizzle/schema";
import { eq, ne, inArray } from "drizzle-orm";

async function cleanupKeepMaleWard() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    console.log("🔍 Finding Male ward department...");
    const maleWard = await db.select().from(departments)
      .where(eq(departments.name, "Male ward"))
      .limit(1);

    if (maleWard.length === 0) {
      console.error("❌ Male ward department not found");
      process.exit(1);
    }

    const maleWardId = maleWard[0].id;
    console.log(`✅ Found Male ward with ID: ${maleWardId}`);

    // Get all departments except Male ward
    console.log("🔍 Finding departments to delete...");
    const deptsToDelete = await db.select().from(departments)
      .where(ne(departments.id, maleWardId));

    console.log(`✅ Found ${deptsToDelete.length} departments to delete`);

    if (deptsToDelete.length === 0) {
      console.log("✅ No departments to delete. Only Male ward remains.");
      process.exit(0);
    }

    const deptIds = deptsToDelete.map(d => d.id);
    console.log(`Department IDs to delete: ${deptIds.join(", ")}`);

    // Delete all data associated with these departments
    console.log("\n🗑️  Deleting associated data...");

    console.log("  - Deleting monthly KPI data...");
    await db.delete(monthlyKpiData)
      .where(inArray(monthlyKpiData.departmentId, deptIds));

    console.log("  - Deleting patient cases...");
    await db.delete(patientCases)
      .where(inArray(patientCases.departmentId, deptIds));

    console.log("  - Deleting quarterly reports...");
    await db.delete(quarterlyReports)
      .where(inArray(quarterlyReports.departmentId, deptIds));

    console.log("  - Deleting indicators...");
    await db.delete(kpiIndicators)
      .where(inArray(kpiIndicators.departmentId, deptIds));

    console.log("  - Deleting categories...");
    await db.delete(kpiCategories)
      .where(inArray(kpiCategories.departmentId, deptIds));

    console.log("  - Deleting departments...");
    await db.delete(departments)
      .where(ne(departments.id, maleWardId));

    console.log("\n✅ Successfully deleted all departments except Male ward");
    console.log(`\n📊 Final state:`);
    console.log(`   - Departments: 1 (Male ward)`);

    const remainingCategories = await db.select().from(kpiCategories)
      .where(eq(kpiCategories.departmentId, maleWardId));
    console.log(`   - Categories for Male ward: ${remainingCategories.length}`);

    const remainingIndicators = await db.select().from(kpiIndicators)
      .where(eq(kpiIndicators.departmentId, maleWardId));
    console.log(`   - Indicators for Male ward: ${remainingIndicators.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanupKeepMaleWard();
