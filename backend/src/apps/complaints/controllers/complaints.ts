import { Request, Response, NextFunction } from "express";
import { SaveComplaintSchema, SearchQuerySchema } from "../dtos/complaints.js";
import { 
  parseImageService, 
  saveComplaintService, 
  getComplaintsService, 
  getComplaintByIdService, 
  deleteComplaintService, 
  searchService 
} from "../services/complaints.js";

// Helper to log and return error
function logAndSendError(res: Response, functionName: string, error: any, defaultMessage: string, statusCode = 400) {
  console.error(`[complaintsController] [${functionName}] [ERROR]`, error);
  const status = error.status || statusCode;
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.fail(message, error, status);
}

export async function parseComplaintController(req: Request, res: Response, next: NextFunction) {
  console.log(`[complaintsController] [parseComplaintController] [ENTRY] userId: ${req.user?.userId}`);

  try {
    const file = req.file;
    if (!file) {
      console.log("[complaintsController] [parseComplaintController] [EXIT] No file uploaded in request.");
      return res.fail("No image file uploaded. Please upload a complaint image.", null, 400);
    }

    if (!req.user) {
      return res.fail("Unauthorized session", null, 401);
    }

    const result = await parseImageService(
      req.user.userId,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    console.log(`[complaintsController] [parseComplaintController] [EXIT] Image parsed. Returning draft layout.`);
    return res.success(result, "Complaint image parsed successfully!");
  } catch (error) {
    return logAndSendError(res, "parseComplaintController", error, "Failed to parse complaint image");
  }
}

export async function saveComplaintController(req: Request, res: Response, next: NextFunction) {
  console.log(`[complaintsController] [saveComplaintController] [ENTRY] userId: ${req.user?.userId}`);

  try {
    const parsedInput = SaveComplaintSchema.safeParse(req.body);
    if (!parsedInput.success) {
      console.log("[complaintsController] [saveComplaintController] [EXIT] Zod validation failed:", JSON.stringify(parsedInput.error.format(), null, 2));
      return res.fail("Validation failed", parsedInput.error.format(), 400);
    }

    if (!req.user) {
      return res.fail("Unauthorized session", null, 401);
    }

    const newComplaint = await saveComplaintService(req.user.userId, parsedInput.data);

    console.log(`[complaintsController] [saveComplaintController] [EXIT] Complaint saved successfully: ${newComplaint.id}`);
    return res.success(newComplaint, "Complaint filed successfully and added to database records.");
  } catch (error) {
    return logAndSendError(res, "saveComplaintController", error, "Failed to save complaint");
  }
}

export async function getComplaintsController(req: Request, res: Response, next: NextFunction) {
  console.log(`[complaintsController] [getComplaintsController] [ENTRY] userId: ${req.user?.userId}, role: ${req.user?.role}`);

  try {
    if (!req.user) {
      return res.fail("Unauthorized session", null, 401);
    }

    const complaintsList = await getComplaintsService(req.user.userId, req.user.role);

    console.log(`[complaintsController] [getComplaintsController] [EXIT] Returning complaints array.`);
    return res.success({ complaints: complaintsList });
  } catch (error) {
    return logAndSendError(res, "getComplaintsController", error, "Failed to retrieve complaints", 500);
  }
}

export async function getComplaintByIdController(req: Request, res: Response, next: NextFunction) {
  const complaintId = parseInt(req.params.id as string, 10);
  console.log(`[complaintsController] [getComplaintByIdController] [ENTRY] id: ${complaintId}, userId: ${req.user?.userId}`);

  try {
    if (isNaN(complaintId)) {
      return res.fail("Invalid complaint ID format", null, 400);
    }

    if (!req.user) {
      return res.fail("Unauthorized session", null, 401);
    }

    const complaint = await getComplaintByIdService(complaintId, req.user.userId, req.user.role);

    console.log(`[complaintsController] [getComplaintByIdController] [EXIT] Found complaint ID: ${complaintId}`);
    return res.success({ complaint });
  } catch (error) {
    return logAndSendError(res, "getComplaintByIdController", error, "Failed to retrieve complaint details");
  }
}

export async function deleteComplaintController(req: Request, res: Response, next: NextFunction) {
  const complaintId = parseInt(req.params.id as string, 10);
  console.log(`[complaintsController] [deleteComplaintController] [ENTRY] id: ${complaintId}, userId: ${req.user?.userId}`);

  try {
    if (isNaN(complaintId)) {
      return res.fail("Invalid complaint ID format", null, 400);
    }

    if (!req.user) {
      return res.fail("Unauthorized session", null, 401);
    }

    await deleteComplaintService(complaintId, req.user.userId, req.user.role);

    console.log(`[complaintsController] [deleteComplaintController] [EXIT] Complaint ${complaintId} deleted.`);
    return res.success(null, "Complaint deleted successfully.");
  } catch (error) {
    return logAndSendError(res, "deleteComplaintController", error, "Failed to delete complaint");
  }
}

export async function searchController(req: Request, res: Response, next: NextFunction) {
  console.log(`[complaintsController] [searchController] [ENTRY] userId: ${req.user?.userId}, query:`, req.query);

  try {
    const parsedQuery = SearchQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      console.log("[complaintsController] [searchController] [EXIT] Zod validation failed.");
      return res.fail("Invalid search query parameters", parsedQuery.error.format(), 400);
    }

    if (!req.user) {
      return res.fail("Unauthorized session", null, 401);
    }

    const { q, ai } = parsedQuery.data;
    const results = await searchService(req.user.userId, req.user.role, q, ai);

    console.log(`[complaintsController] [searchController] [EXIT] Search query executed successfully.`);
    return res.success({ results }, "Search completed successfully!");
  } catch (error) {
    return logAndSendError(res, "searchController", error, "Failed to perform database search");
  }
}
