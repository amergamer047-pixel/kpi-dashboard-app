import { getDb } from "./db";
import { departments, kpiCategories, kpiIndicators, monthlyKpiData, patientCases, quarterlyReports } from "../drizzle/schema";
import { eq, or, like, inArray } from "drizzle-orm";

async function deleteAllTestData() {
  console.log("🧹 Starting deletion of ALL test departments and data...\n");

  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Failed to connect to database");
      process.exit(1);
    }

    // Step 1: Get all departments
    const allDepts = await db.select().from(departments);
    console.log(`📊 Total departments found: ${allDepts.length}`);

    // Step 2: Identify test departments (those with "Test" in the name)
    const testDepts = allDepts.filter(dept => 
      dept.name.toLowerCase().includes('test') ||
      dept.name.includes('Test') ||
      dept.name.includes('Combined') ||
      dept.name.includes('List Cases') ||
      dept.name.includes('Monthly') ||
      dept.name.includes('Quarterly') ||
      dept.name.includes('Patient Case') ||
      dept.name.includes('Public') ||
      dept.name.includes('View Mode')
    );

    console.log(`\n🎯 Test departments to delete: ${testDepts.length}`);
    testDepts.forEach(dept => {
      console.log(`  - ${dept.name} (ID: ${dept.id})`);
    });

    if (testDepts.length === 0) {
      console.log("✅ No test departments found!");
      process.exit(0);
    }

    // Step 3: Get all test department IDs
    const testDeptIds = testDepts.map(d => d.id);

    // Step 4: Delete in reverse dependency order
    console.log("\n🗑️  Deleting data...");

    // Delete monthly KPI data
    const monthlyDeleted = await db.delete(monthlyKpiData)
      .where(inArray(monthlyKpiData.departmentId, testDeptIds));
    console.log(`  ✅ Deleted monthly KPI data`);

    // Delete patient cases
    const casesDeleted = await db.delete(patientCases)
      .where(inArray(patientCases.departmentId, testDeptIds));
    console.log(`  ✅ Deleted patient cases`);

    // Delete quarterly reports
    const reportsDeleted = await db.delete(quarterlyReports)
      .where(inArray(quarterlyReports.departmentId, testDeptIds));
    console.log(`  ✅ Deleted quarterly reports`);

    // Delete indicators in test departments
    const indicatorsDeleted = await db.delete(kpiIndicators)
      .where(inArray(kpiIndicators.departmentId, testDeptIds));
    console.log(`  ✅ Deleted indicators`);

    // Delete categories in test departments
    const categoriesDeleted = await db.delete(kpiCategories)
      .where(inArray(kpiCategories.departmentId, testDeptIds));
    console.log(`  ✅ Deleted categories`);

    // Delete the test departments themselves
    const deptsDeleted = await db.delete(departments)
      .where(inArray(departments.id, testDeptIds));
    console.log(`  ✅ Deleted ${testDepts.length} test departments`);

    // Step 5: Summary
    console.log("\n✅ Cleanup complete!");
    const finalDepts = await db.select().from(departments);
    const finalCats = await db.select().from(kpiCategories);
    const finalInds = await db.select().from(kpiIndicators);
    
    console.log("\n📊 Final database state:");
    console.log(`  - Departments: ${finalDepts.length}`);
    console.log(`  - Categories: ${finalCats.length}`);
    console.log(`  - Indicators: ${finalInds.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

deleteAllTestData();
