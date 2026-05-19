import { Router } from "express";
import { IncidentCommentController } from "../controllers/incident.comment.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/incidents/:id/comments", requireAuth, IncidentCommentController.getCommentsByIncidentId);
router.post("/incidents/:id/comments", requireAuth, IncidentCommentController.createComment);
router.put("/comments/:id", requireAuth, IncidentCommentController.updateComment);
router.patch("/comments/:id/status", requireAuth, IncidentCommentController.updateCommentStatus);

export default router;