import { getDb } from "./db";
import { departments, kpiCategories, kpiIndicators, monthlyKpiData, patientCases } from "../drizzle/schema";
import { eq, ne } from "drizzle-orm";

async function deleteAllExceptMaleWard() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  try {
    // Get the Male ward department ID
    const maleWard = await db.select().from(departments)
      .where(eq(departments.name, "Male ward"))
      .limit(1);

    if (maleWard.length === 0) {
      console.error("Male ward not found");
      return;
    }

    const maleWardId = maleWard[0].id;
    console.log(`Found Male ward with ID: ${maleWardId}`);

    // Get all departments except Male ward
    const deptsToDelete = await db.select().from(departments)
      .where(ne(departments.id, maleWardId));

    console.log(`Found ${deptsToDelete.length} departments to delete`);

    const deptIds = deptsToDelete.map(d => d.id);

    // Delete all data associated with these departments
    console.log("Deleting monthly KPI data...");
    const deletedMonthly = await db.delete(monthlyKpiData)
      .where(monthlyKpiData.departmentId.inArray(deptIds));
    console.log(`Deleted monthly data`);

    console.log("Deleting patient cases...");
    const deletedCases = await db.delete(patientCases)
      .where(patientCases.departmentId.inArray(deptIds));
    console.log(`Deleted patient cases`);

    console.log("Deleting indicators...");
    const deletedIndicators = await db.delete(kpiIndicators)
      .where(kpiIndicators.departmentId.inArray(deptIds));
    console.log(`Deleted indicators`);

    console.log("Deleting categories...");
    const deletedCategories = await db.delete(kpiCategories)
      .where(kpiCategories.departmentId.inArray(deptIds));
    console.log(`Deleted categories`);

    console.log("Deleting departments...");
    const deletedDepts = await db.delete(departments)
      .where(ne(departments.id, maleWardId));
    console.log(`Deleted ${deptsToDelete.length} departments`);

    console.log("✅ Successfully deleted all departments except Male ward");
  } catch (error) {
    console.error("Error:", error);
  }
}

deleteAllExceptMaleWard();
