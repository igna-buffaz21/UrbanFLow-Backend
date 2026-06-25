import { Router } from "express";
import { SystemController } from "../controllers/system.controller";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth.middleware";

const router = Router();

router.get("/overview",requireAuth, requireSuperAdmin, SystemController.getOverview);
router.get("/current",requireAuth, requireSuperAdmin,SystemController.getCurrent);
router.get("/history",requireAuth, requireSuperAdmin, SystemController.getHistory);

export default router;
