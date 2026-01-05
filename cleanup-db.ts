import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { departments, kpiCategories, kpiIndicators } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function cleanup() {
  try {
    // Get all departments
    const allDepts = await db.select().from(departments);
    console.log(`Found ${allDepts.length} departments`);
    
    // Get all categories
    const allCats = await db.select().from(kpiCategories);
    console.log(`Found ${allCats.length} categories`);
    
    // Get all indicators
    const allInds = await db.select().from(kpiIndicators);
    console.log(`Found ${allInds.length} indicators`);
    
    // Delete test departments (keep only the first one or clean all)
    const testDepts = allDepts.filter(d => d.name.includes("Test") || d.name.includes("test"));
    console.log(`\nDeleting ${testDepts.length} test departments:`);
    for (const dept of testDepts) {
      console.log(`  - Deleting: ${dept.name}`);
      await db.delete(departments).where(eq(departments.id, dept.id));
    }
    
    // Delete test categories
    const testCats = allCats.filter(c => c.name.includes("Test") || c.name.includes("test") || c.name.includes("Custom"));
    console.log(`\nDeleting ${testCats.length} test categories:`);
    for (const cat of testCats) {
      console.log(`  - Deleting: ${cat.name}`);
      await db.delete(kpiCategories).where(eq(kpiCategories.id, cat.id));
    }
    
    // Delete test indicators
    const testInds = allInds.filter(i => i.name.includes("Test") || i.name.includes("test") || i.name.includes("List"));
    console.log(`\nDeleting ${testInds.length} test indicators:`);
    for (const ind of testInds) {
      console.log(`  - Deleting: ${ind.name}`);
      await db.delete(kpiIndicators).where(eq(kpiIndicators.id, ind.id));
    }
    
    // Show remaining data
    const finalDepts = await db.select().from(departments);
    const finalCats = await db.select().from(kpiCategories);
    const finalInds = await db.select().from(kpiIndicators);
    
    console.log(`\n✓ Cleanup complete!`);
    console.log(`Remaining: ${finalDepts.length} departments, ${finalCats.length} categories, ${finalInds.length} indicators`);
    
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

cleanup();
