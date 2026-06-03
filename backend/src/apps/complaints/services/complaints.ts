import { eq, and, or, like, sql } from "drizzle-orm";
import { db } from "../../../db/db.js";
import { users, complaints, complaintEmbeddings } from "../../../db/schema/schema.js";
import { uploadImage } from "./supabase.js";
import { parseComplaintImage, parseComplaintPdf, generateEmbedding, ParsedDraft } from "./openai.js";
import { SaveComplaintInput } from "../dtos/complaints.js";

export async function parseImageService(
  userId: number,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ imageUrl: string; draft: ParsedDraft }> {
  console.log(`[complaintsService] [parseImageService] [ENTRY] userId: ${userId}, fileName: ${fileName}`);

  try {
    // 1. Check user upload limits
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new Error("User record not found");
    }

    if (user.uploadsUsed >= user.uploadLimit) {
      console.log(`[complaintsService] [parseImageService] [EXIT] User ${userId} reached upload limit: ${user.uploadsUsed}/${user.uploadLimit}`);
      const err: any = new Error("You have reached your lifetime limit of image uploads. Please contact an Admin to increase your limit.");
      err.status = 403;
      throw err;
    }

    // 2. Upload file to Supabase Storage
    const imageUrl = await uploadImage(fileBuffer, fileName, mimeType);

    // 3. Call OpenAI Responses API to parse image or PDF text
    let draft;
    if (mimeType === "application/pdf") {
      draft = await parseComplaintPdf(fileBuffer);
    } else {
      const base64Image = fileBuffer.toString("base64");
      draft = await parseComplaintImage(base64Image, mimeType);
    }

    // 5. Increment user's uploadsUsed limit on success only
    await db.update(users)
      .set({ uploadsUsed: user.uploadsUsed + 1 })
      .where(eq(users.id, userId));

    console.log(`[complaintsService] [parseImageService] [EXIT] Image parsed and uploadsUsed incremented for user: ${userId}`);
    return { imageUrl, draft };
  } catch (error) {
    console.error(`[complaintsService] [parseImageService] [ERROR] Exception caught:`, error);
    throw error;
  }
}

export async function saveComplaintService(
  userId: number,
  input: SaveComplaintInput
): Promise<any> {
  console.log(`[complaintsService] [saveComplaintService] [ENTRY] userId: ${userId}, title: ${input.title}`);

  try {
    // 1. Save complaint to database
    const [newComplaint] = await db.insert(complaints).values({
      userId,
      title: input.title,
      complainantName: input.complainantName,
      complainantContact: input.complainantContact,
      incidentDatetime: input.incidentDatetime,
      incidentPlace: input.incidentPlace,
      accusedDetails: input.accusedDetails,
      description: input.description,
      ipcSections: input.ipcSections,
      imageUrl: input.imageUrl,
    }).returning();

    console.log(`[complaintsService] [saveComplaintService] Saved complaint ID: ${newComplaint.id}`);

    // 2. Format text string for vector embedding creation
    const embeddingText = `Title: ${input.title} | Description: ${input.description} | IPC Sections: ${input.ipcSections.join(", ")}`;

    // 3. Call OpenAI embedding generation
    const vector = await generateEmbedding(embeddingText);

    // 4. Store in complaint_embeddings
    await db.insert(complaintEmbeddings).values({
      complaintId: newComplaint.id,
      embedding: vector,
    });

    console.log(`[complaintsService] [saveComplaintService] [EXIT] Complaint and embedding vectors successfully saved.`);
    return newComplaint;
  } catch (error) {
    console.error(`[complaintsService] [saveComplaintService] [ERROR] Exception caught:`, error);
    throw error;
  }
}

export async function getComplaintsService(
  userId: number,
  role: "USER" | "ADMIN"
): Promise<any[]> {
  console.log(`[complaintsService] [getComplaintsService] [ENTRY] userId: ${userId}, role: ${role}`);

  try {
    let results;
    if (role === "ADMIN") {
      results = await db.select().from(complaints).orderBy(sql`${complaints.createdAt} DESC`);
    } else {
      results = await db.select().from(complaints).where(eq(complaints.userId, userId)).orderBy(sql`${complaints.createdAt} DESC`);
    }

    console.log(`[complaintsService] [getComplaintsService] [EXIT] Found ${results.length} complaint record(s).`);
    return results;
  } catch (error) {
    console.error(`[complaintsService] [getComplaintsService] [ERROR] Exception caught:`, error);
    throw error;
  }
}

export async function getComplaintByIdService(
  id: number,
  userId: number,
  role: "USER" | "ADMIN"
): Promise<any> {
  console.log(`[complaintsService] [getComplaintByIdService] [ENTRY] id: ${id}, userId: ${userId}`);

  try {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
    if (!complaint) {
      throw new Error("Complaint not found.");
    }

    // Role boundary checks
    if (role !== "ADMIN" && complaint.userId !== userId) {
      const err: any = new Error("Access denied: You do not own this complaint.");
      err.status = 403;
      throw err;
    }

    console.log(`[complaintsService] [getComplaintByIdService] [EXIT] Returned complaint: ${id}`);
    return complaint;
  } catch (error) {
    console.error(`[complaintsService] [getComplaintByIdService] [ERROR] Exception caught:`, error);
    throw error;
  }
}

export async function deleteComplaintService(
  id: number,
  userId: number,
  role: "USER" | "ADMIN"
): Promise<void> {
  console.log(`[complaintsService] [deleteComplaintService] [ENTRY] id: ${id}, userId: ${userId}`);

  try {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
    if (!complaint) {
      throw new Error("Complaint not found.");
    }

    // Boundaries check
    if (role !== "ADMIN" && complaint.userId !== userId) {
      const err: any = new Error("Access denied: You do not own this complaint.");
      err.status = 403;
      throw err;
    }

    // Cascading delete triggered via schema cascade references definition
    await db.delete(complaints).where(eq(complaints.id, id));

    console.log(`[complaintsService] [deleteComplaintService] [EXIT] Complaint ${id} successfully deleted.`);
  } catch (error) {
    console.error(`[complaintsService] [deleteComplaintService] [ERROR] Exception caught:`, error);
    throw error;
  }
}

export async function searchService(
  userId: number,
  role: "USER" | "ADMIN",
  q: string,
  ai: boolean
): Promise<any[]> {
  console.log(`[complaintsService] [searchService] [ENTRY] userId: ${userId}, role: ${role}, query: "${q}", aiSearch: ${ai}`);

  try {
    if (ai) {
      // 1. AI Search Limit check
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new Error("User record not found");
      }

      if (user.searchesUsed >= user.searchLimit) {
        console.log(`[complaintsService] [searchService] [EXIT] User reached searches limit: ${user.searchesUsed}/${user.searchLimit}`);
        const err: any = new Error("You have reached your lifetime limit of AI searches. Please contact an Admin to increase your limit.");
        err.status = 403;
        throw err;
      }

      // 2. Generate embedding for query
      const queryVector = await generateEmbedding(q || "incident details");

      // 3. Set search path to resolve pgvector ops
      await db.execute(sql`SET search_path TO public, extensions;`);

      // 4. Perform cosine similarity raw query joining complaints and embeddings
      // order by similarity DESC. format the vector array as string: '[0.1, 0.2, ...]'
      const vectorString = `[${queryVector.join(",")}]`;
      
      console.log("[complaintsService] Executing cosine similarity raw SQL query...");
      
      const rawResults = await db.execute(sql`
        SELECT 
          c.id, 
          c.user_id as "userId", 
          c.title, 
          c.complainant_name as "complainantName", 
          c.complainant_contact as "complainantContact", 
          c.incident_datetime as "incidentDatetime", 
          c.incident_place as "incidentPlace", 
          c.accused_details as "accusedDetails", 
          c.description, 
          c.ipc_sections as "ipcSections", 
          c.image_url as "imageUrl", 
          c.created_at as "createdAt",
          (1 - (ce.embedding <=> ${vectorString}::vector)) as similarity
        FROM complaints c
        JOIN complaint_embeddings ce ON c.id = ce.complaint_id
        WHERE ${role === "ADMIN" ? sql`true` : sql`c.user_id = ${userId}`}
        ORDER BY similarity DESC
        LIMIT 50;
      `);

      // 5. Increment AI searches count on success only
      await db.update(users)
        .set({ searchesUsed: user.searchesUsed + 1 })
        .where(eq(users.id, userId));

      console.log(`[complaintsService] [searchService] [EXIT] AI search successful. Returned ${rawResults.length} records. incremented searchesUsed.`);
      return rawResults as any[];
    } else {
      // Standard keyword match
      console.log("[complaintsService] Executing keyword ILIKE match query...");
      
      const likeQuery = `%${q}%`;
      const baseConditions = [
        or(
          like(complaints.title, likeQuery),
          like(complaints.description, likeQuery)
        )
      ];

      if (role !== "ADMIN") {
        baseConditions.push(eq(complaints.userId, userId));
      }

      const results = await db.select()
        .from(complaints)
        .where(and(...baseConditions))
        .orderBy(sql`${complaints.createdAt} DESC`);

      console.log(`[complaintsService] [searchService] [EXIT] Keyword search completed. Found ${results.length} records.`);
      return results;
    }
  } catch (error) {
    console.error(`[complaintsService] [searchService] [ERROR] Exception caught:`, error);
    throw error;
  }
}
