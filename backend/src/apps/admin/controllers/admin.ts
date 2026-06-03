import { Request, Response, NextFunction } from "express";
import { SearchUsersQuerySchema, UpdateLimitsSchema } from "../dtos/admin.js";
import { searchUsersService, updateUserLimitsService } from "../services/admin.js";

function logAndSendError(res: Response, functionName: string, error: any, defaultMessage: string, statusCode = 400) {
  console.error(`[adminController] [${functionName}] [ERROR]`, error);
  const status = error.status || statusCode;
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.fail(message, error, status);
}

export async function searchUsersController(req: Request, res: Response, next: NextFunction) {
  console.log(`[adminController] [searchUsersController] [ENTRY] userId: ${req.user?.userId}`);

  try {
    const parsedQuery = SearchUsersQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      console.log("[adminController] [searchUsersController] [EXIT] Zod validation failed.");
      return res.fail("Invalid query parameters", parsedQuery.error.format(), 400);
    }

    const { q } = parsedQuery.data;
    const usersList = await searchUsersService(q);

    console.log(`[adminController] [searchUsersController] [EXIT] Returning user list.`);
    return res.success({ users: usersList });
  } catch (error) {
    return logAndSendError(res, "searchUsersController", error, "Failed to retrieve user listing");
  }
}

export async function updateUserLimitsController(req: Request, res: Response, next: NextFunction) {
  const targetUserId = parseInt(req.params.id as string, 10);
  console.log(`[adminController] [updateUserLimitsController] [ENTRY] userId: ${req.user?.userId}, targetUserId: ${targetUserId}`);

  try {
    if (isNaN(targetUserId)) {
      return res.fail("Invalid target user ID format", null, 400);
    }

    const parsedBody = UpdateLimitsSchema.safeParse(req.body);
    if (!parsedBody.success) {
      console.log("[adminController] [updateUserLimitsController] [EXIT] Zod validation failed.");
      return res.fail("Validation failed", parsedBody.error.format(), 400);
    }

    const { uploadLimit, searchLimit } = parsedBody.data;
    const updatedUser = await updateUserLimitsService(targetUserId, uploadLimit, searchLimit);

    console.log(`[adminController] [updateUserLimitsController] [EXIT] Limits successfully updated.`);
    return res.success(updatedUser, "User limits updated successfully.");
  } catch (error) {
    return logAndSendError(res, "updateUserLimitsController", error, "Failed to adjust user limits");
  }
}
