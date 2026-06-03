import { eq, or, like, sql } from "drizzle-orm";
import { db } from "../../../db/db.js";
import { users } from "../../../db/schema/schema.js";

export async function searchUsersService(q?: string) {
  console.log(`[adminService] [searchUsersService] [ENTRY] query: "${q || ""}"`);

  try {
    let query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      verified: users.verified,
      uploadLimit: users.uploadLimit,
      searchLimit: users.searchLimit,
      uploadsUsed: users.uploadsUsed,
      searchesUsed: users.searchesUsed,
      createdAt: users.createdAt,
    }).from(users);

    if (q && q.trim()) {
      const matchPattern = `%${q.trim()}%`;
      query = query.where(
        or(
          like(users.name, matchPattern),
          like(users.email, matchPattern)
        )
      ) as any;
    }

    const results = await query.orderBy(sql`${users.createdAt} DESC`);
    console.log(`[adminService] [searchUsersService] [EXIT] Found ${results.length} user(s).`);
    return results;
  } catch (error) {
    console.error(`[adminService] [searchUsersService] [ERROR]`, error);
    throw error;
  }
}

export async function updateUserLimitsService(
  targetUserId: number,
  uploadLimit: number,
  searchLimit: number
) {
  console.log(`[adminService] [updateUserLimitsService] [ENTRY] targetUserId: ${targetUserId}, uploadLimit: ${uploadLimit}, searchLimit: ${searchLimit}`);

  try {
    // 1. Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!user) {
      throw new Error(`User with ID ${targetUserId} not found.`);
    }

    // 2. Perform database update
    await db.update(users)
      .set({
        uploadLimit,
        searchLimit,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));

    // 3. Return updated user
    const [updatedUser] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      verified: users.verified,
      uploadLimit: users.uploadLimit,
      searchLimit: users.searchLimit,
      uploadsUsed: users.uploadsUsed,
      searchesUsed: users.searchesUsed,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

    console.log(`[adminService] [updateUserLimitsService] [EXIT] Limits successfully updated.`);
    return updatedUser;
  } catch (error) {
    console.error(`[adminService] [updateUserLimitsService] [ERROR]`, error);
    throw error;
  }
}
