import { createClient } from "@supabase/supabase-js";
import { env } from "../../../config/env.js";

console.log("[Supabase Storage] [ENTRY] Initializing Supabase client...");
const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  }
});
console.log("[Supabase Storage] [EXIT] Supabase client initialized.");

/**
 * Uploads an image buffer to Supabase Storage and returns its public URL.
 * 
 * @param fileBuffer The file contents in memory
 * @param fileName Original file name
 * @param mimeType The file MIME type (e.g., 'image/png')
 */
export async function uploadImage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const uniqueName = `${Date.now()}_${fileName.replace(/\s+/g, "_")}`;
  const filePath = `complaints/${uniqueName}`;

  console.log(`[Supabase Storage] [ENTRY] Uploading file: ${filePath}, type: ${mimeType}`);

  try {
    const { data, error } = await supabaseClient.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("[Supabase Storage] [ERROR] File upload failed in Supabase SDK:", error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error("[Supabase Storage] [ERROR] Failed to retrieve public URL of uploaded file.");
      throw new Error("Could not retrieve file public URL.");
    }

    console.log(`[Supabase Storage] [EXIT] Upload successful. Public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error("[Supabase Storage] [ERROR] Exception caught during file upload:", error);
    throw error;
  }
}
