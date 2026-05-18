import { Router } from "express";
import { IncidentCommentController } from "../controllers/incident.comment.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/incidents/:id/comments", requireAuth, IncidentCommentController.getCommentsByIncidentId);
router.post("/incidents/:id/comments", requireAuth, IncidentCommentController.createComment);

export default router;