import { Router } from "express";
import { IncidentCommentController } from "../controllers/incident.comment.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/me",
  requireAuth,
  IncidentCommentController.getMyComments
);
router.get("/:id/comments", requireAuth, IncidentCommentController.getCommentsByIncidentId);
router.post("/:id/comments", requireAuth, IncidentCommentController.createComment);
router.patch("/:id", requireAuth, IncidentCommentController.updateComment);
router.patch("/:id/status", requireAuth, IncidentCommentController.updateCommentStatus);

export default router;