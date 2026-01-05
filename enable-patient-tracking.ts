import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { kpiCategories } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function enablePatientTracking() {
  try {
    // Get all categories
    const cats = await db.select().from(kpiCategories);
    console.log("Current categories:");
    cats.forEach(c => console.log(`  ${c.name}: requiresPatientInfo = ${c.requiresPatientInfo}`));
    
    // Enable patient tracking for Mandatory and Respiratory
    const mandatoryCat = cats.find(c => c.name === "Mandatory");
    const respiratoryCat = cats.find(c => c.name === "Respiratory");
    
    if (mandatoryCat) {
      await db.update(kpiCategories)
        .set({ requiresPatientInfo: 1 })
        .where(eq(kpiCategories.id, mandatoryCat.id));
      console.log("✓ Enabled patient tracking for Mandatory");
    }
    
    if (respiratoryCat) {
      await db.update(kpiCategories)
        .set({ requiresPatientInfo: 1 })
        .where(eq(kpiCategories.id, respiratoryCat.id));
      console.log("✓ Enabled patient tracking for Respiratory");
    }
    
    // Verify
    const updatedCats = await db.select().from(kpiCategories);
    console.log("\nUpdated categories:");
    updatedCats.forEach(c => console.log(`  ${c.name}: requiresPatientInfo = ${c.requiresPatientInfo}`));
    
  } catch (error) {
    console.error("Failed:", error);
  }
}

enablePatientTracking();
