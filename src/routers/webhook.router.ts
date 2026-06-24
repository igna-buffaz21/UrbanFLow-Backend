import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";

const router = Router();

// Sin requireAuth — Clerk firma el request con svix
router.post("/clerk", WebhookController.handleClerkEvent);

export default router;