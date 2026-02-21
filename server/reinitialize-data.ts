import { initializeSystemData } from "./db";

async function reinitializeData() {
  console.log("🔄 Reinitializing system data...");
  
  try {
    // Initialize for the default system user
    await initializeSystemData(630019);
    console.log("✅ System data reinitialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error reinitializing data:", error);
    process.exit(1);
  }
}

reinitializeData();
