import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { departments, kpiCategories, kpiIndicators, monthlyKpiData, patientCases } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function fullCleanup() {
  try {
    console.log("=== FULL CLEANUP ===\n");
    
    // Get all data
    const allDepts = await db.select().from(departments);
    const allCats = await db.select().from(kpiCategories);
    const allInds = await db.select().from(kpiIndicators);
    const allMonthly = await db.select().from(monthlyKpiData);
    const allCases = await db.select().from(patientCases);
    
    console.log(`Before cleanup:`);
    console.log(`  Departments: ${allDepts.length}`);
    console.log(`  Categories: ${allCats.length}`);
    console.log(`  Indicators: ${allInds.length}`);
    console.log(`  Monthly data: ${allMonthly.length}`);
    console.log(`  Patient cases: ${allCases.length}\n`);
    
    // Keep only Male Ward
    const maleWard = allDepts.find(d => d.name.toLowerCase() === "male ward");
    const deptIdsToKeep = maleWard ? [maleWard.id] : [];
    
    // Delete other departments and their data
    const deptsToDelete = allDepts.filter(d => !deptIdsToKeep.includes(d.id));
    console.log(`Deleting ${deptsToDelete.length} departments:`);
    for (const dept of deptsToDelete) {
      console.log(`  - ${dept.name}`);
      // Delete related data first
      await db.delete(monthlyKpiData).where(eq(monthlyKpiData.departmentId, dept.id));
      await db.delete(patientCases).where(eq(patientCases.departmentId, dept.id));
      await db.delete(departments).where(eq(departments.id, dept.id));
    }
    
    // Keep only core categories: Mandatory, Respiratory, Renal
    const coreCategories = ["Mandatory", "Respiratory", "Renal"];
    const catsToDelete = allCats.filter(c => !coreCategories.includes(c.name));
    console.log(`\nDeleting ${catsToDelete.length} non-core categories:`);
    for (const cat of catsToDelete) {
      console.log(`  - ${cat.name}`);
      // Delete indicators in this category
      const indsInCat = allInds.filter(i => i.categoryId === cat.id);
      for (const ind of indsInCat) {
        await db.delete(monthlyKpiData).where(eq(monthlyKpiData.indicatorId, ind.id));
        await db.delete(patientCases).where(eq(patientCases.indicatorId, ind.id));
        await db.delete(kpiIndicators).where(eq(kpiIndicators.id, ind.id));
      }
      await db.delete(kpiCategories).where(eq(kpiCategories.id, cat.id));
    }
    
    // Keep only core indicators
    const coreIndicators = ["Pressure Sore", "Fall Incidents", "NIV Cases", "Intubated Cases", "RDU Sessions"];
    const indsToDelete = allInds.filter(i => !coreIndicators.includes(i.name));
    console.log(`\nDeleting ${indsToDelete.length} non-core indicators:`);
    for (const ind of indsToDelete) {
      console.log(`  - ${ind.name}`);
      await db.delete(monthlyKpiData).where(eq(monthlyKpiData.indicatorId, ind.id));
      await db.delete(patientCases).where(eq(patientCases.indicatorId, ind.id));
      await db.delete(kpiIndicators).where(eq(kpiIndicators.id, ind.id));
    }
    
    // Verify final state
    const finalDepts = await db.select().from(departments);
    const finalCats = await db.select().from(kpiCategories);
    const finalInds = await db.select().from(kpiIndicators);
    const finalMonthly = await db.select().from(monthlyKpiData);
    const finalCases = await db.select().from(patientCases);
    
    console.log(`\n✓ Cleanup complete!`);
    console.log(`\nAfter cleanup:`);
    console.log(`  Departments: ${finalDepts.length}`);
    console.log(`  Categories: ${finalCats.length}`);
    console.log(`  Indicators: ${finalInds.length}`);
    console.log(`  Monthly data: ${finalMonthly.length}`);
    console.log(`  Patient cases: ${finalCases.length}`);
    
    console.log(`\nRemaining departments:`);
    finalDepts.forEach(d => console.log(`  - ${d.name}`));
    
    console.log(`\nRemaining categories:`);
    finalCats.forEach(c => console.log(`  - ${c.name}`));
    
    console.log(`\nRemaining indicators:`);
    finalInds.forEach(i => console.log(`  - ${i.name}`));
    
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

fullCleanup();
