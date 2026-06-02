import { OpenAI } from "openai";
import { env } from "../../../config/env.js";

console.log("[OpenAI] [ENTRY] Initializing OpenAI SDK client...");
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
console.log("[OpenAI] [EXIT] OpenAI client initialized.");

export interface ParsedDraft {
  complainantName: string | null;
  complainantContact: string | null;
  incidentDateTime: string | null;
  incidentPlace: string | null;
  accusedDetails: string | null;
  complaintDescription: string | null;
  ipcSections: string[];
  title: string;
}

/**
 * Parses a complaint letter image using the gpt-5.4-mini model via the OpenAI Responses API.
 * 
 * @param base64Image Base64-encoded image content
 * @param mimeType MIME type of the uploaded image
 */
export async function parseComplaintImage(
  base64Image: string,
  mimeType: string
): Promise<ParsedDraft> {
  console.log("[OpenAI] [ENTRY] parseComplaintImage called.");

  const systemPrompt = `You are an expert legal assistant. Analyze the provided image of a complaint letter.
Extract the details into the following JSON structure. If any field is missing or cannot be inferred, return null.

Fields:
1. complainantName: Full name of the complainant.
2. complainantContact: Phone, email, or address.
3. incidentDateTime: Date & time of the incident (extract raw text or convert to standard ISO format if possible, otherwise write the raw description).
4. incidentPlace: Specific place of incident (District/PS).
5. accusedDetails: Name or description of accused persons.
6. complaintDescription: A detailed summary of the events described.
7. ipcSections: Suggest list of Indian Penal Code section codes applicable, structured like ["IPC 379", "IPC 420"].
8. title: Generate an action-phrase summary of the crime strictly under 12 characters (e.g. "Theft", "Fraud Case", "Burglary").

You MUST return a raw, valid JSON object containing only these fields. Do not include markdown code block syntax (like \`\`\`json) in your response.`;

  try {
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log("[OpenAI] Calling gpt-5.4-mini via Responses API...");

    // Call using the specific Responses API structure required by the prompt rules
    const response: any = await (openai as any).responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: systemPrompt,
            },
            {
              type: "input_image",
              image_url: dataUrl,
            },
          ],
        },
      ],
    });

    // Read response.output_text as instructed in the prompt rules
    const outputText = response.output_text;
    console.log("[OpenAI] Received outputText from Responses API:", outputText);

    if (!outputText) {
      throw new Error("Empty response returned from OpenAI Responses API");
    }

    // Clean markdown code blocks if any got returned
    const cleanedText = outputText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed: ParsedDraft = JSON.parse(cleanedText);

    // Enforce title length rule (<= 12 chars)
    if (parsed.title && parsed.title.length > 12) {
      parsed.title = parsed.title.slice(0, 12);
    }
    if (!parsed.title) {
      parsed.title = "Complaint";
    }

    console.log("[OpenAI] [EXIT] Image successfully parsed.");
    return parsed;
  } catch (error) {
    console.error("[OpenAI] [ERROR] Exception caught in parseComplaintImage:", error);
    throw error;
  }
}

/**
 * Generates a 1536-dimensional embedding using the text-embedding-3-small model.
 * 
 * @param text The input text to embed
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`[OpenAI] [ENTRY] Generating embedding for text length: ${text.length}`);

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length !== 1536) {
      throw new Error(`Failed to generate 1536-dim embedding vector. Got: ${embedding?.length}`);
    }

    console.log("[OpenAI] [EXIT] Embedding vector successfully generated.");
    return embedding;
  } catch (error) {
    console.error("[OpenAI] [ERROR] Exception caught in generateEmbedding:", error);
    throw error;
  }
}
