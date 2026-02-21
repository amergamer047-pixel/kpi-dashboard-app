import { getDb } from "./db";
import { departments, kpiCategories, kpiIndicators, monthlyKpiData, patientCases, quarterlyReports } from "../drizzle/schema";
import { eq, like, or } from "drizzle-orm";

async function cleanupTestData() {
  console.log("🧹 Starting cleanup of test data...\n");

  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Failed to connect to database");
      process.exit(1);
    }

    // Find all test departments (those with "Test" in the name)
    const testDepts = await db.select().from(departments)
      .where(
        or(
          like(departments.name, "%Test%"),
          like(departments.name, "%test%"),
          like(departments.name, "%Combined Data%"),
          like(departments.name, "%List Cases%"),
          like(departments.name, "%Monthly Data%"),
          like(departments.name, "%Quarterly Data%"),
          like(departments.name, "%Patient Case%"),
          like(departments.name, "%Public Test%"),
          like(departments.name, "%View Mode%")
        )
      );

    console.log(`Found ${testDepts.length} test departments to delete:`);
    testDepts.forEach(dept => {
      console.log(`  - ${dept.name} (ID: ${dept.id})`);
    });

    if (testDepts.length === 0) {
      console.log("✅ No test departments found!");
      process.exit(0);
    }

    // Delete in order: monthly data, patient cases, quarterly reports, then departments
    let deletedCount = 0;

    for (const dept of testDepts) {
      // Delete monthly KPI data
      const monthlyDeleted = await db.delete(monthlyKpiData)
        .where(eq(monthlyKpiData.departmentId, dept.id));
      
      // Delete patient cases
      const casesDeleted = await db.delete(patientCases)
        .where(eq(patientCases.departmentId, dept.id));
      
      // Delete quarterly reports
      const reportsDeleted = await db.delete(quarterlyReports)
        .where(eq(quarterlyReports.departmentId, dept.id));
      
      // Delete the department
      await db.delete(departments).where(eq(departments.id, dept.id));
      deletedCount++;
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} test departments and all associated data!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupTestData();
