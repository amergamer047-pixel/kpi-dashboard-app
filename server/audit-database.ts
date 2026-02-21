import { getDb } from "./db";
import { users, departments, kpiCategories, kpiIndicators } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function auditDatabase() {
  console.log("🔍 Starting database audit...\n");

  try {
    const db = await getDb();
    if (!db) {
      console.error("❌ Failed to connect to database");
      process.exit(1);
    }

    // Step 1: Check users
    console.log("📋 USERS:");
    const allUsers = await db.select().from(users);
    console.log(`  Total users: ${allUsers.length}`);
    allUsers.forEach((user) => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });

    // Step 2: Check departments
    console.log("\n🏥 DEPARTMENTS:");
    const allDepts = await db.select().from(departments);
    console.log(`  Total departments: ${allDepts.length}`);
    allDepts.slice(0, 5).forEach((dept) => {
      console.log(`  - ID: ${dept.id}, Name: ${dept.name}, UserId: ${dept.userId}`);
    });
    if (allDepts.length > 5) {
      console.log(`  ... and ${allDepts.length - 5} more`);
    }

    // Step 3: Check categories
    console.log("\n📂 CATEGORIES:");
    const allCats = await db.select().from(kpiCategories);
    console.log(`  Total categories: ${allCats.length}`);
    allCats.slice(0, 10).forEach((cat) => {
      console.log(`  - ID: ${cat.id}, Name: ${cat.name}, UserId: ${cat.userId}, DeptId: ${cat.departmentId}`);
    });
    if (allCats.length > 10) {
      console.log(`  ... and ${allCats.length - 10} more`);
    }

    // Step 4: Check indicators
    console.log("\n📊 INDICATORS:");
    const allInds = await db.select().from(kpiIndicators);
    console.log(`  Total indicators: ${allInds.length}`);
    allInds.slice(0, 10).forEach((ind) => {
      console.log(`  - ID: ${ind.id}, Name: ${ind.name}, UserId: ${ind.userId}, CatId: ${ind.categoryId}, DeptId: ${ind.departmentId}`);
    });
    if (allInds.length > 10) {
      console.log(`  ... and ${allInds.length - 10} more`);
    }

    // Step 5: Check for each user
    console.log("\n👤 PER-USER BREAKDOWN:");
    for (const user of allUsers) {
      const userCats = await db.select().from(kpiCategories).where(eq(kpiCategories.userId, user.id));
      const userInds = await db.select().from(kpiIndicators).where(eq(kpiIndicators.userId, user.id));
      console.log(`  User ${user.id} (${user.name}):`);
      console.log(`    - Categories: ${userCats.length}`);
      console.log(`    - Indicators: ${userInds.length}`);
    }

    console.log("\n✅ Audit complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during audit:", error);
    process.exit(1);
  }
}

auditDatabase();
