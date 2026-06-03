import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../../utils/authMiddleware.js";
import { searchUsersController, updateUserLimitsController } from "./controllers/admin.js";

console.log("[Admin Routes] Registering admin module routing...");

const router = Router();

// Apply auth and admin protections globally on the admin router
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/users", searchUsersController);
router.put("/users/:id/limits", updateUserLimitsController);

export default router;
