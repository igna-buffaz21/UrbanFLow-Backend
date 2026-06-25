import { Router } from "express";
import { DistrictController } from "../controllers/district.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/location",requireAuth, DistrictController.findDistrictByLocation);
router.get("/", requireAuth, DistrictController.getDistricts);
router.get("/me", requireAuth, DistrictController.getMyDistrict);
router.get("/:id", requireAuth, DistrictController.getDistrictById);
router.post("/", requireAuth, DistrictController.createDistrict);

export default router;