import { Router } from "express";
import { SubDistrictController } from "../controllers/sub-districts.controller";

const router = Router();

router.post(
  "/municipality/:municipalityId/bulk",
  SubDistrictController.createBulk
);

router.get(
  "/municipality/:municipalityId",
  SubDistrictController.getByMunicipalityId
);

export default router;