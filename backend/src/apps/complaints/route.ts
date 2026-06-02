import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../utils/authMiddleware.js";
import {
  parseComplaintController,
  saveComplaintController,
  getComplaintsController,
  getComplaintByIdController,
  deleteComplaintController,
  searchController
} from "./controllers/complaints.js";

console.log("[Complaints Routes] Registering complaints module routing...");

const router = Router();

// Multer in-memory storage config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Protect all complaints routes using authorization session middleware
router.use(authMiddleware);

router.post("/parse", upload.single("image"), parseComplaintController);
router.post("/", saveComplaintController);
router.get("/", getComplaintsController);
router.get("/search", searchController);
router.get("/:id", getComplaintByIdController);
router.delete("/:id", deleteComplaintController);

export default router;
