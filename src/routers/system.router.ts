import { Router } from "express";
import { SystemController } from "../controllers/system.controller";

const router = Router();

router.get("/current", SystemController.getCurrent);
router.get("/history", SystemController.getHistory);

export default router;
